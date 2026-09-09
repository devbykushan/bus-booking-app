import { getPool } from './db/database';
async function run() {
  const p = getPool();
  try {
    const res = await p.query("SELECT * FROM routes ORDER BY \"departureDate\" LIMIT 20");
    for (const r of res.rows) {
      console.log(`${r.departureDate} - ${r.busNumber} - ${r.origin}->${r.destination} - Out: ${r.departureTime}`);
    }
  } catch(e) {
    console.error(e);
  } finally {
    p.end();
  }
}
run();
