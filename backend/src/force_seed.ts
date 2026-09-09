import { initDb, getPool } from './db/database';

async function run() {
  const p = getPool();
  try {
    console.log("Forcing database reset (dropping tables)...");
    await p.query('DROP TABLE IF EXISTS bookings CASCADE');
    await p.query('DROP TABLE IF EXISTS seats CASCADE');
    await p.query('DROP TABLE IF EXISTS boarding_points CASCADE');
    await p.query('DROP TABLE IF EXISTS routes CASCADE');
    console.log("Deleted old data. Running seed...");
    await initDb();
    console.log("Seed complete.");
  } catch (e) {
    console.error(e);
  } finally {
    p.end();
  }
}
run();
