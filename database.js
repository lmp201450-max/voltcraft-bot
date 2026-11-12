
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Add your PostgreSQL connection string.');
}

const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS groups_list (
      id BIGSERIAL PRIMARY KEY,
      chat_id BIGINT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS posts (
      id BIGSERIAL PRIMARY KEY,
      body TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS auto_replies (
      id BIGSERIAL PRIMARY KEY,
      keyword TEXT NOT NULL,
      response TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  await pool.query(
    `INSERT INTO settings (key, value) VALUES
      ('publish_enabled', 'true'),
      ('replies_enabled', 'true')
     ON CONFLICT (key) DO NOTHING`
  );

  const defaultReply = 'أهلاً بيك ❤️\nانضم لجروب لايف ستيل من هنا:\nhttps://t.me/Lifestyle1589';
  await pool.query(
    `INSERT INTO auto_replies (keyword, response, enabled)
     SELECT $1, $2, TRUE
     WHERE NOT EXISTS (
       SELECT 1 FROM auto_replies WHERE LOWER(keyword) = LOWER($1)
     )`,
    ['الجروب', defaultReply]
  );

  console.log('Database tables are ready.');
}

async function getSetting(key, fallback = null) {
  const result = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
  return result.rows[0]?.value ?? fallback;
}

async function setSetting(key, value) {
  await pool.query(
    `INSERT INTO settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [key, String(value)]
  );
}

module.exports = { pool, initDatabase, getSetting, setSetting };
