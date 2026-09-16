// Zátěžový a funkční test: N skutečných socket klientů se připojí, rozdělí tokeny a odešlou tip.
// Použití: ADMIN_KEY=test node server.js  a v druhém terminálu  ADMIN_KEY=test node test/load-test.js [N] [url]
const { io } = require('socket.io-client');
const config = require('../config');
const { evaluate } = require('../lib/scoring');

const N = +process.argv[2] || 200;
const URL = process.argv[3] || 'http://localhost:3000';
const KEY = process.env.ADMIN_KEY || 'test';
const { TOKENS, MAX_TRENDS, trends } = config;
const emit = (s, ev, data) => new Promise((res, rej) => s.timeout(10000).emit(ev, data, (e, r) => e ? rej(e) : res(r)));
const sleep = ms => new Promise(r => setTimeout(r, ms));

function randAlloc() {
  const k = 1 + Math.floor(Math.random() * MAX_TRENDS);
  const ids = [...trends].sort(() => Math.random() - .5).slice(0, k).map(t => t.id);
  const a = Object.fromEntries(ids.map(id => [id, 1]));
  for (let i = k; i < TOKENS; i++) a[ids[Math.floor(Math.random() * k)]]++;
  return a;
}

(async () => {
  const admin = io(URL, { transports: ['websocket'] });
  await new Promise(r => admin.on('connect', r));
  const a = await emit(admin, 'admin:hello', { key: KEY });
  if (!a.ok) throw new Error('admin login failed');
  await emit(admin, 'admin:reset', { confirm: 'RESET' });
  await emit(admin, 'admin:phase', { phase: 'lobby' });

  const t0 = Date.now();
  const clients = await Promise.all(Array.from({ length: N }, async (_, i) => {
    const s = io(URL, { transports: ['websocket'], forceNew: true });
    await new Promise(r => s.on('connect', r));
    const deviceId = 'test-device-' + i + '-' + Math.random().toString(36).slice(2);
    s.emit('player:hello', { deviceId });
    await sleep(20);
    const j = await emit(s, 'player:join', { deviceId, nick: 'Hráč ' + i });
    if (!j.ok) throw new Error('join failed ' + JSON.stringify(j));
    return { s, deviceId, nick: 'Hráč ' + i };
  }));
  console.log(`${N} klientů připojeno za ${Date.now() - t0} ms`);

  // negativní testy
  const c0 = clients[0];
  let r = await emit(c0.s, 'player:submit', { deviceId: c0.deviceId, allocation: randAlloc() });
  console.assert(r.error, 'submit v lobby musí selhat'); console.log('lobby submit odmítnut:', r.error);
  r = await emit(clients[1].s, 'player:join', { deviceId: 'x-new-device-123', nick: 'hrac 0' });
  console.log('cizí deviceId:', r.error);

  await emit(admin, 'admin:phase', { phase: 'voting', minutes: 5 });

  const bad = [
    [{ [trends[0].id]: TOKENS - 1 }, 'málo tokenů'],
    [{ [trends[0].id]: TOKENS + 1 }, 'moc tokenů'],
    [Object.fromEntries(trends.slice(0, MAX_TRENDS + 1).map((t, i) => [t.id, i === 0 ? TOKENS - MAX_TRENDS : 1])), 'moc trendů'],
    [{ [trends[0].id]: 10.5, [trends[1].id]: 9.5 }, 'desetinná čísla'],
    [{ hack: TOKENS }, 'neznámý trend'],
  ];
  for (const [alloc, label] of bad) {
    r = await emit(c0.s, 'player:submit', { deviceId: c0.deviceId, allocation: alloc });
    console.log(`  ${label.padEnd(16)} -> ${r.error ? 'odmítnuto: ' + r.error : 'CHYBA: přijato!'}`);
    if (!r.error) process.exitCode = 1;
  }

  const expected = [];
  const t1 = Date.now();
  await Promise.all(clients.map(async (c, i) => {
    await sleep(Math.random() * 1500);
    const allocation = randAlloc();
    const res = await emit(c.s, 'player:submit', { deviceId: c.deviceId, allocation });
    if (!res.ok) throw new Error('submit failed ' + JSON.stringify(res));
    expected.push({ deviceId: c.deviceId, nick: c.nick, allocation, submittedAt: Date.now() });
  }));
  console.log(`${N} tipů odesláno za ${Date.now() - t1} ms`);

  r = await emit(c0.s, 'player:submit', { deviceId: c0.deviceId, allocation: randAlloc() });
  console.log('dvojí odeslání:', r.error);

  // zmrazení a porovnání s nezávislým výpočtem
  await emit(admin, 'admin:phase', { phase: 'closed' });
  await emit(admin, 'admin:phase', { phase: 'winners' });
  const state = await new Promise(res => admin.once('admin:state', res));

  const mine = evaluate(expected, trends, TOKENS);
  // nezávislý brute-force výpočet shody pro kontrolu vzorce
  const grand = expected.length * TOKENS;
  const tot = {}; trends.forEach(t => tot[t.id] = expected.reduce((a, p) => a + (p.allocation[t.id] || 0), 0));
  let maxErr = 0;
  for (const p of expected) {
    let ov = 0;
    for (const t of trends) {
      const my = (p.allocation[t.id] || 0) / TOKENS * 100;
      const others = (tot[t.id] - (p.allocation[t.id] || 0)) / (grand - TOKENS) * 100;
      ov += Math.min(my, others);
    }
    const srv = state.players.find(x => x.deviceId === p.deviceId);
    maxErr = Math.max(maxErr, Math.abs(srv.score - ov));
  }
  const sumTotals = Object.values(state.totals).reduce((a, b) => a + b, 0);
  console.log(`hráčů v administraci: ${state.players.length}, součet tokenů: ${sumTotals} (očekáváno ${N * TOKENS})`);
  console.log(`max. rozdíl skóre server vs. nezávislý výpočet: ${maxErr.toFixed(4)} (zaokrouhlení na 0,01)`);
  const top = state.players.filter(p => p.rank).sort((a, b) => a.rank - b.rank).slice(0, 5);
  console.log('top 5:', top.map(p => `${p.rank}. ${p.nick} ${p.score}`).join(' | '));
  const scores = state.players.map(p => p.score).filter(x => x != null);
  const ties = scores.filter(s => s === Math.max(...scores)).length;
  console.log(`hráčů s nejvyšší shodou: ${ties} (rovnost řeší L2 a čas)`);

  // hráč dostane osobní výsledek
  const personal = await new Promise(res => { c0.s.once('player:state', res); c0.s.emit('player:hello', { deviceId: c0.deviceId }); });
  console.log('osobní výsledek hráče 0:', JSON.stringify(personal.result));

  if (sumTotals !== N * TOKENS || maxErr > 0.011) { console.log('TEST SELHAL'); process.exitCode = 1; } else console.log('TEST OK');
  clients.forEach(c => c.s.close()); admin.close();
})().catch(e => { console.error(e); process.exit(1); });
