// Úložiště stavu hry: soubor na disku (výchozí) nebo PostgreSQL (když je nastaven DATABASE_URL).
// Postgres je nutný na hostingu s pomíjivým diskem (např. Render Free), kde by restart smazal hlasy.
const fs = require('fs');
const path = require('path');

// Zápisy jdou postupně za sebou; když přijde nový stav během zápisu, zapíše se jen ten nejnovější.
function serialWriter(write) {
  let writing = null, pending = null;
  async function flush() {
    while (pending !== null) {
      const data = pending; pending = null;
      try { await write(data); } catch (e) { console.error('Uložení stavu selhalo:', e.message); }
    }
  }
  return async function save(data) {
    pending = data;
    if (!writing) writing = flush().finally(() => { writing = null; });
    return writing;
  };
}

function fileStorage(dir) {
  const file = path.join(dir, 'state.json');
  return {
    kind: `soubor ${file}`,
    async init() { fs.mkdirSync(dir, { recursive: true }); },
    async load() { return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null; },
    async backup(json) { fs.writeFileSync(file.replace('.json', `.old-${Date.now()}.json`), json); },
    save: serialWriter(async json => {
      const tmp = file + '.tmp';
      await fs.promises.writeFile(tmp, json);
      await fs.promises.rename(tmp, file);
    }),
  };
}

function pgStorage(url) {
  const { Pool } = require('pg');
  const host = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
  // Odhad: interní URL na Renderu nemá v hostname tečku a SSL nepotřebuje, externí ano.
  // Pokud se odhad netrefí, init() to pozná z chybové hlášky a přepne se.
  let ssl = process.env.PGSSL === '1' || (host.includes('.') && !/^(localhost|127\.)/.test(host));
  let pool;
  const makePool = () => {
    pool = new Pool({ connectionString: url, ssl: ssl ? { rejectUnauthorized: false } : false, max: 2 });
    pool.on('error', e => console.error('Postgres:', e.message));
  };
  makePool();
  const upsert = (id, json) => pool.query(
    `INSERT INTO trend_game_state (id, data, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`, [id, json]);
  const createTable = () => pool.query(`CREATE TABLE IF NOT EXISTS trend_game_state (
    id integer PRIMARY KEY, data text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())`);
  return {
    get kind() { return `PostgreSQL (${host}${ssl ? ', SSL' : ''})`; },
    async init() {
      try { await createTable(); } catch (e) {
        const wrongSsl = ssl ? /does not support SSL/i.test(e.message) : /SSL|encryption/i.test(e.message);
        if (!wrongSsl) throw e;
        ssl = !ssl; await pool.end().catch(() => {}); makePool();
        await createTable();
      }
    },
    async load() {
      const r = await pool.query('SELECT data FROM trend_game_state WHERE id = 1');
      return r.rows[0]?.data ?? null;
    },
    async backup(json) { await upsert(2, json); },
    save: serialWriter(json => upsert(1, json)),
  };
}

function createStorage({ dataDir, databaseUrl }) {
  return databaseUrl ? pgStorage(databaseUrl) : fileStorage(dataDir);
}

module.exports = { createStorage };
