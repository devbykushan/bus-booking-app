import { getPool } from './db/database';
async function run() {
  const p = getPool();
  try {
    const res = await p.query("SELECT * FROM routes");
    const grouped: Record<string, string[]> = {};
    for (const r of res.rows) {
      const key = `${r.departureDate} ${r.departureTime}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r.busNumber);
    }
    let found = false;
    for (const key in grouped) {
      if (grouped[key].length > 1) {
        console.log(`Duplicate time found: ${key} -> ${grouped[key].join(', ')}`);
        found = true;
      }
    }
    if (!found) console.log("No duplicate times found!");
  } catch(e) {
    console.error(e);
  } finally {
    p.end();
  }
}
run();
