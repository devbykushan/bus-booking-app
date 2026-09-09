const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, 'backend/.env') });

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const res = await pool.query("SELECT * FROM routes WHERE \"departureDate\" = '2026-09-09'");
  console.log("Routes for 2026-09-09:", res.rows.map(r => ({ id: r.id, bus: r.busNumber, time: r.departureTime })));
  pool.end();
}
run();
