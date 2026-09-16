// Realistický scénář: obrazovka + admin, 200 hráčů se připojuje 30 s, hlasuje 60 s.
const { io } = require('socket.io-client');
const config = require('../config');
const URL = process.argv[2] || 'http://localhost:3000';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const emit = (s, ev, d) => new Promise(r => s.emit(ev, d, r));
(async () => {
  const admin = io(URL, { transports: ['websocket'] }); await new Promise(r => admin.on('connect', r));
  await emit(admin, 'admin:hello', { key: 'test' }); await emit(admin, 'admin:reset', { confirm: 'RESET' });
  const screen = io(URL, { transports: ['websocket'] }); screen.on('connect', () => screen.emit('screen:hello'));
  const players = [];
  const t0 = Date.now();
  await Promise.all(Array.from({ length: 200 }, async (_, i) => {
    await sleep(Math.random() * 30000);
    const s = io(URL, { transports: ['websocket'], forceNew: true }); await new Promise(r => s.on('connect', r));
    const deviceId = 'cpu-' + i + '-' + Math.random().toString(36).slice(2);
    s.emit('player:hello', { deviceId }); await sleep(50);
    await emit(s, 'player:join', { deviceId, nick: 'P' + i });
    players.push({ s, deviceId });
  }));
  console.log('join phase done', Date.now() - t0);
  await emit(admin, 'admin:phase', { phase: 'voting', minutes: 5 });
  await Promise.all(players.map(async p => {
    await sleep(Math.random() * 60000);
    const ids = config.trends.map(t => t.id).sort(() => Math.random() - .5).slice(0, 4);
    await emit(p.s, 'player:submit', { deviceId: p.deviceId, allocation: { [ids[0]]: 8, [ids[1]]: 6, [ids[2]]: 4, [ids[3]]: 2 } });
  }));
  console.log('vote phase done', Date.now() - t0);
  await emit(admin, 'admin:phase', { phase: 'closed' });
  await emit(admin, 'admin:phase', { phase: 'results' });
  await emit(admin, 'admin:phase', { phase: 'winners' });
  await sleep(2000);
  console.log('end', Date.now() - t0);
  process.exit(0);
})();
