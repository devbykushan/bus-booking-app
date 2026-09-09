import { getPool } from './db/database';
async function run() {
  const p = getPool();
  try {
    const res = await p.query("SELECT * FROM routes WHERE \"departureDate\" = '2026-09-09'");
    console.log("Routes for 2026-09-09:");
    for (const r of res.rows) {
      console.log(`- ${r.id}: Bus ${r.busNumber}, Departs: ${r.departureTime}, Price: ${r.priceStarting}`);
    }
  } catch(e) {
    console.error(e);
  } finally {
    p.end();
  }
}
run();
