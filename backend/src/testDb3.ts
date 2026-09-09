import { getPool } from './db/database';
async function run() {
  const p = getPool();
  try {
    const res = await p.query("SELECT * FROM routes");
    console.log("Total routes in DB:", res.rows.length);
    console.log("Sample:", res.rows.slice(0, 3).map(r => r.id));
  } catch(e) {
    console.error(e);
  } finally {
    p.end();
  }
}
run();
