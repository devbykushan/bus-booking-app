import { initDb, getPool } from './db/database';

async function run() {
  const p = getPool();
  try {
    const res = await p.query('SELECT COUNT(*) as c FROM routes');
    console.log("Current routes count:", res.rows[0].c);
    const ids = await p.query('SELECT id FROM routes LIMIT 5');
    console.log("Some routes:", ids.rows.map((r: any) => r.id));
  } catch (e) {
    console.error(e);
  } finally {
    p.end();
  }
}
run();
