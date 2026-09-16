const path = require('path');
const os = require('os');
const crypto = require('crypto');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const QRCode = require('qrcode');

const config = require('./config');
const { evaluate, validateAllocation } = require('./lib/scoring');
const { createStorage } = require('./lib/storage');

const PORT = parseInt(process.env.PORT || '3000', 10);
// RENDER_EXTERNAL_URL nastavuje Render automaticky (https://<služba>.onrender.com)
const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
const ADMIN_KEY = process.env.ADMIN_KEY || crypto.randomBytes(6).toString('hex');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const storage = createStorage({ dataDir: DATA_DIR, databaseUrl: process.env.DATABASE_URL });

const { TOKENS, MAX_TRENDS, trends } = config;
const PHASES = ['lobby', 'voting', 'closed', 'results', 'winners'];

// ---------------------------------------------------------------- state

function freshState() {
  return {
    phase: 'lobby',
    liveResults: false,   // true = sloupce jsou vidět už během hlasování (umožňuje opisování!)
    endsAt: null,         // ms timestamp konce hlasování, nebo null
    players: {},          // deviceId -> player
    recent: [],           // posledních N událostí pro ticker
    frozen: null,         // vyhodnocení zmrazené při uzavření hlasování
    configHash: configHash(),
  };
}

function configHash() {
  return crypto.createHash('sha1')
    .update(JSON.stringify({ TOKENS, MAX_TRENDS, ids: trends.map(t => t.id) }))
    .digest('hex').slice(0, 10);
}

let state = freshState();

async function loadState() {
  await storage.init();
  const raw = await storage.load();
  if (!raw) { console.log(`Úložiště: ${storage.kind}, zatím prázdné`); return; }
  let loaded;
  try { loaded = JSON.parse(raw); } catch (e) {
    console.error('Uložený stav je poškozený, odkládám ho stranou a začínám načisto.');
    await storage.backup(raw); return;
  }
  if (loaded.configHash === configHash()) {
    state = { ...freshState(), ...loaded };
    console.log(`Úložiště: ${storage.kind}, načteno ${Object.keys(state.players).length} hráčů, fáze ${state.phase}`);
  } else {
    await storage.backup(raw);
    console.log(`Úložiště: ${storage.kind}. Konfigurace hry se změnila, starý stav je odložen jako záloha.`);
  }
}

let saveTimer = null;
let stateLoaded = false; // dokud se stav nenačetl, nikdy neukládat (přepsali bychom uložené hlasy prázdnou hrou)
function persist() {
  if (!stateLoaded) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => storage.save(JSON.stringify(state)), 400);
}

// Render i jiné hostingy před restartem posílají SIGTERM: stihneme uložit poslední stav.
let shuttingDown = false;
async function shutdown(sig) {
  if (shuttingDown) return; shuttingDown = true;
  console.log(`${sig}: ${stateLoaded ? 'ukládám stav a končím' : 'stav nebyl načten, nic neukládám a končím'}`);
  clearTimeout(saveTimer);
  if (stateLoaded) {
    try { await storage.save(JSON.stringify(state)); } catch (e) { console.error(e.message); }
  }
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ---------------------------------------------------------------- helpers

const nickKey = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, '');

function cleanNick(raw) {
  if (typeof raw !== 'string') return null;
  const s = raw.replace(/[\u0000-\u001F\u007F<>]/g, '').replace(/\s+/g, ' ').trim();
  if (s.length < 2 || s.length > config.NICK_MAX) return null;
  return s;
}

function playerList() { return Object.values(state.players); }

function counts() {
  const list = playerList();
  return { joined: list.length, voted: list.filter(p => p.submittedAt).length };
}

function pushRecent(type, nick) {
  state.recent.push({ type, nick, t: Date.now() });
  if (state.recent.length > 30) state.recent.splice(0, state.recent.length - 30);
}

function currentEval() {
  return state.frozen || evaluate(playerList(), trends, TOKENS);
}

function lanAddress() {
  for (const ifs of Object.values(os.networkInterfaces())) {
    for (const i of ifs || []) if (i.family === 'IPv4' && !i.internal) return i.address;
  }
  return 'localhost';
}

function joinUrlFor(req) {
  if (PUBLIC_URL) return PUBLIC_URL;
  let host = String(req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`).split(',')[0].trim();
  if (/^(localhost|127\.)/.test(host)) host = host.replace(/^(localhost|127\.[\d.]+)/, lanAddress());
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  return `${proto}://${host}`;
}

// ---------------------------------------------------------------- payloads

const publicConfig = {
  title: config.title, subtitle: config.subtitle,
  TOKENS, MAX_TRENDS, NICK_MAX: config.NICK_MAX, trends,
};

function screenPayload() {
  const c = counts();
  const reveal = state.phase === 'results' || state.phase === 'winners';
  const showBars = reveal || (state.liveResults && (state.phase === 'voting' || state.phase === 'closed'));
  const ev = showBars ? currentEval() : null;
  return {
    phase: state.phase,
    liveResults: state.liveResults,
    endsAt: state.endsAt,
    serverNow: Date.now(),
    ...c,
    recent: state.recent.slice(-12),
    totals: ev ? ev.totals : null,
    crowdPct: ev ? ev.crowdPct : null,
    tokensInPlay: c.voted * TOKENS,
    winners: state.phase === 'winners' && ev
      ? ev.ranking.slice(0, 10).map(r => ({ nick: r.nick, score: r.score, rank: r.rank }))
      : null,
    avgScore: state.phase === 'winners' && ev && ev.ranking.length
      ? Math.round(ev.ranking.reduce((a, r) => a + r.score, 0) / ev.ranking.length * 10) / 10
      : null,
  };
}

function playerPayload(deviceId) {
  const p = state.players[deviceId];
  let result = null;
  if (p && p.submittedAt && state.phase === 'winners') {
    const ev = currentEval();
    const row = ev.ranking.find(r => r.deviceId === deviceId);
    if (row) result = { score: row.score, rank: row.rank, of: ev.ranking.length };
  }
  return {
    phase: state.phase,
    endsAt: state.endsAt,
    serverNow: Date.now(),
    me: p ? { nick: p.nick, allocation: p.allocation, submittedAt: p.submittedAt } : null,
    result,
  };
}

function adminPayload() {
  const ev = currentEval();
  const rankBy = Object.fromEntries(ev.ranking.map(r => [r.deviceId, r]));
  return {
    ...screenPayload(),
    frozen: !!state.frozen,
    totals: ev.totals,
    crowdPct: ev.crowdPct,
    players: playerList()
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map(p => ({
        deviceId: p.deviceId, nick: p.nick, bot: !!p.bot, joinedAt: p.joinedAt,
        submittedAt: p.submittedAt, allocation: p.allocation,
        score: rankBy[p.deviceId]?.score ?? null, rank: rankBy[p.deviceId]?.rank ?? null,
      })),
  };
}

// ---------------------------------------------------------------- app

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: false } });

app.disable('x-powered-by');
app.use('/fonts', express.static(path.join(__dirname, 'node_modules/@fontsource-variable/archivo'), { maxAge: '7d' }));
app.use('/assets', express.static(path.join(__dirname, 'public/assets'), { maxAge: '1h' }));

const page = f => (req, res) => res.sendFile(path.join(__dirname, 'public', f));
app.get('/', page('play.html'));
app.get('/screen', page('screen.html'));
app.get('/admin', page('admin.html'));

app.get('/api/config', (req, res) => res.json({ ...publicConfig, joinUrl: joinUrlFor(req) }));

app.get('/qr.svg', async (req, res) => {
  try {
    const svg = await QRCode.toString(joinUrlFor(req), {
      type: 'svg', margin: 1, errorCorrectionLevel: 'M',
      color: { dark: '#07142B', light: '#F3F5EC' },
    });
    res.type('image/svg+xml').set('Cache-Control', 'no-store').send(svg);
  } catch (e) { res.status(500).send('QR error'); }
});

app.get('/admin/export.csv', (req, res) => {
  if (req.query.key !== ADMIN_KEY) return res.status(403).send('Neplatný klíč');
  const ev = evaluate(playerList(), trends, TOKENS);
  const rankBy = Object.fromEntries(ev.ranking.map(r => [r.deviceId, r]));
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['poradi', 'prezdivka', 'test_bot', 'odeslano', ...trends.map(t => t.name), 'shoda_pct', 'odchylka_L2'];
  const lines = [head.map(esc).join(';')];
  const list = playerList().sort((a, b) => (rankBy[a.deviceId]?.rank ?? 1e9) - (rankBy[b.deviceId]?.rank ?? 1e9));
  for (const p of list) {
    const r = rankBy[p.deviceId];
    lines.push([
      r?.rank ?? '', p.nick, p.bot ? 1 : 0,
      p.submittedAt ? new Date(p.submittedAt).toISOString() : '',
      ...trends.map(t => p.allocation?.[t.id] ?? 0),
      r ? String(r.score).replace('.', ',') : '', r ? String(r.l2).replace('.', ',') : '',
    ].map(esc).join(';'));
  }
  res.type('text/csv; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="trendy-vysledky-${Date.now()}.csv"`)
    .send('\uFEFF' + lines.join('\r\n'));
});

// ---------------------------------------------------------------- broadcasting (throttled)

let dirty = false;
function markDirty() { dirty = true; persist(); }

setInterval(() => {
  // automatické uzavření hlasování po uplynutí času
  if (state.phase === 'voting' && state.endsAt && Date.now() >= state.endsAt) {
    setPhase('closed');
  }
  // testovací boti hlasují postupně
  if (state.phase === 'voting') tickBots();

  if (!dirty) return;
  dirty = false;
  io.to('screen').emit('screen:state', screenPayload());
  io.to('admin').emit('admin:state', adminPayload());
}, 300);

function broadcastPlayers() {
  for (const [id, sock] of io.of('/').sockets) {
    if (sock.data.deviceId) sock.emit('player:state', playerPayload(sock.data.deviceId));
  }
}

function setPhase(phase) {
  if (!PHASES.includes(phase)) return;
  state.phase = phase;
  if (phase === 'lobby' || phase === 'voting') {
    state.frozen = null;
    state.endsAt = null;
  } else {
    // uzavřeno / výsledky / vítězové: hlasy se zmrazí, aby se pořadí už neměnilo
    state.endsAt = null;
    if (!state.frozen) state.frozen = evaluate(playerList(), trends, TOKENS);
  }
  markDirty();
  broadcastPlayers();
}

// ---------------------------------------------------------------- test bots

const botNames = ['Kvant', 'Ledger', 'Satoshi', 'Merkle', 'Hash', 'Delta', 'Gamma', 'Vega', 'Orbit', 'Nano',
  'Pixel', 'Atlas', 'Nova', 'Bit', 'Byte', 'Echo', 'Flux', 'Iris', 'Luna', 'Onyx'];
const botBias = [2.2, 1.4, 1.3, 0.7, 1.0, 0.9, 1.0, 0.6, 0.9, 0.7];

function randomAllocation() {
  const k = 1 + Math.floor(Math.random() * MAX_TRENDS);
  const w = trends.map((t, i) => (botBias[i] || 1) * -Math.log(Math.random() || 1e-9));
  const top = w.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).slice(0, k);
  const sum = top.reduce((a, [v]) => a + v, 0);
  const raw = top.map(([v, i]) => [i, (v / sum) * TOKENS]);
  const alloc = raw.map(([i, x]) => [i, Math.floor(x), x - Math.floor(x)]);
  let rest = TOKENS - alloc.reduce((a, r) => a + r[1], 0);
  alloc.sort((a, b) => b[2] - a[2]).forEach(r => { if (rest > 0) { r[1]++; rest--; } });
  const out = {};
  for (const [i, n] of alloc) if (n > 0) out[trends[i].id] = n;
  return out;
}

function addBots(n) {
  for (let i = 0; i < n; i++) {
    const id = 'bot-' + crypto.randomBytes(5).toString('hex');
    let nick;
    do { nick = `${botNames[Math.floor(Math.random() * botNames.length)]}${Math.floor(Math.random() * 900 + 100)}`; }
    while (playerList().some(p => p.nickKey === nickKey(nick)));
    state.players[id] = { deviceId: id, nick, nickKey: nickKey(nick), joinedAt: Date.now(), allocation: null, submittedAt: null, bot: true };
    pushRecent('join', nick);
  }
  markDirty();
}

function tickBots() {
  const pending = playerList().filter(p => p.bot && !p.submittedAt);
  if (!pending.length) return;
  // přibližně 6 % čekajících botů za tick => realistická vlna
  for (const p of pending) {
    if (Math.random() < 0.06) {
      p.allocation = randomAllocation();
      p.submittedAt = Date.now();
      pushRecent('vote', p.nick);
      markDirty();
    }
  }
}

// ---------------------------------------------------------------- sockets

io.on('connection', socket => {
  // ----- LED obrazovka
  socket.on('screen:hello', () => {
    socket.join('screen');
    socket.emit('screen:state', screenPayload());
  });

  // ----- hráč
  socket.on('player:hello', ({ deviceId } = {}) => {
    if (typeof deviceId !== 'string' || deviceId.length < 8 || deviceId.length > 64) return;
    socket.data.deviceId = deviceId;
    socket.emit('player:state', playerPayload(deviceId));
  });

  socket.on('player:join', ({ deviceId, nick } = {}, ack = () => {}) => {
    if (socket.data.deviceId !== deviceId) return ack({ error: 'Obnov stránku a zkus to znovu.' });
    if (state.players[deviceId]) return ack({ ok: true });
    if (!['lobby', 'voting'].includes(state.phase)) return ack({ error: 'Hlasování už skončilo.' });
    const clean = cleanNick(nick);
    if (!clean) return ack({ error: `Přezdívka musí mít 2 až ${config.NICK_MAX} znaků.` });
    const key = nickKey(clean);
    if (playerList().some(p => p.nickKey === key)) return ack({ error: 'Tuhle přezdívku už někdo má. Zkus jinou.' });
    state.players[deviceId] = { deviceId, nick: clean, nickKey: key, joinedAt: Date.now(), allocation: null, submittedAt: null };
    pushRecent('join', clean);
    markDirty();
    ack({ ok: true });
    socket.emit('player:state', playerPayload(deviceId));
  });

  socket.on('player:submit', ({ deviceId, allocation } = {}, ack = () => {}) => {
    const p = state.players[deviceId];
    if (!p || socket.data.deviceId !== deviceId) return ack({ error: 'Nejdřív si zvol přezdívku.' });
    if (p.submittedAt) return ack({ error: 'Tvůj tip už je odeslaný.' });
    if (state.phase !== 'voting') return ack({ error: state.phase === 'lobby' ? 'Hlasování ještě nezačalo.' : 'Hlasování už skončilo.' });
    const v = validateAllocation(allocation, trends, TOKENS, MAX_TRENDS);
    if (v.error) return ack({ error: v.error });
    p.allocation = v.allocation;
    p.submittedAt = Date.now();
    pushRecent('vote', p.nick);
    markDirty();
    ack({ ok: true });
    socket.emit('player:state', playerPayload(deviceId));
  });

  // ----- admin
  socket.on('admin:hello', ({ key } = {}, ack = () => {}) => {
    if (key !== ADMIN_KEY) return ack({ error: 'Neplatný klíč.' });
    socket.data.admin = true;
    socket.join('admin');
    ack({ ok: true });
    socket.emit('admin:state', adminPayload());
  });

  const admin = (event, fn) => socket.on(event, (data = {}, ack = () => {}) => {
    if (!socket.data.admin) return ack({ error: 'Nepřihlášen.' });
    try { fn(data, ack); } catch (e) { ack({ error: e.message }); }
  });

  admin('admin:phase', ({ phase, minutes }, ack) => {
    setPhase(phase);
    if (phase === 'voting' && minutes > 0) state.endsAt = Date.now() + minutes * 60000;
    markDirty(); broadcastPlayers(); ack({ ok: true });
  });
  admin('admin:timer', ({ minutes }, ack) => {
    state.endsAt = minutes > 0 ? Date.now() + minutes * 60000 : null;
    markDirty(); broadcastPlayers(); ack({ ok: true });
  });
  admin('admin:live', ({ on }, ack) => { state.liveResults = !!on; markDirty(); ack({ ok: true }); });
  admin('admin:bots', ({ n }, ack) => { addBots(Math.min(500, Math.max(1, n | 0))); ack({ ok: true }); });
  admin('admin:removeBots', (d, ack) => {
    for (const p of playerList()) if (p.bot) delete state.players[p.deviceId];
    state.recent = state.recent.filter(r => playerList().some(p => p.nick === r.nick));
    if (state.frozen) state.frozen = evaluate(playerList(), trends, TOKENS);
    markDirty(); ack({ ok: true });
  });
  admin('admin:rename', ({ deviceId, nick }, ack) => {
    const p = state.players[deviceId];
    const clean = cleanNick(nick);
    if (!p || !clean) return ack({ error: 'Neplatná přezdívka.' });
    const old = p.nick;
    p.nick = clean; p.nickKey = nickKey(clean);
    state.recent.forEach(r => { if (r.nick === old) r.nick = clean; });
    if (state.frozen) state.frozen = evaluate(playerList(), trends, TOKENS);
    markDirty(); broadcastPlayers(); ack({ ok: true });
  });
  admin('admin:remove', ({ deviceId }, ack) => {
    const p = state.players[deviceId];
    if (!p) return ack({ error: 'Hráč neexistuje.' });
    delete state.players[deviceId];
    state.recent = state.recent.filter(r => r.nick !== p.nick);
    if (state.frozen) state.frozen = evaluate(playerList(), trends, TOKENS);
    markDirty(); broadcastPlayers(); ack({ ok: true });
  });
  admin('admin:reset', ({ confirm }, ack) => {
    if (confirm !== 'RESET') return ack({ error: 'Pro reset napiš RESET.' });
    state = freshState();
    markDirty(); broadcastPlayers(); ack({ ok: true });
  });
});

app.get('/healthz', (req, res) => res.type('text').send('ok'));

(async function start() {
  // Když databáze není dostupná, nezačínáme s prázdným stavem (přepsali bychom uložené hlasy).
  for (let attempt = 1; ; attempt++) {
    try { await loadState(); stateLoaded = true; break; } catch (e) {
      console.error(`Načtení stavu selhalo (pokus ${attempt}): ${e.message}`);
      if (attempt >= 12) { console.error('Úložiště je nedostupné, končím.'); process.exit(1); }
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  server.listen(PORT, () => {
    const base = PUBLIC_URL || `http://${lanAddress()}:${PORT}`;
    console.log('\n  Trendová hra běží');
    console.log(`  Hráči:         ${base}/`);
    console.log(`  LED obrazovka: ${base}/screen`);
    console.log(`  Administrace:  ${base}/admin#${process.env.ADMIN_KEY ? '<ADMIN_KEY>' : ADMIN_KEY}`);
    if (!process.env.ADMIN_KEY) console.log('  (ADMIN_KEY není nastaven, klíč je náhodný a po restartu se změní)');
    console.log('');
  });
})();
