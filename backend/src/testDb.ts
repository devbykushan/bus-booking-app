import { getPool } from './db/database';
async function run() {
  const p = getPool();
  try {
    const res = await p.query('SELECT "id", "name", "email", "role", "phone", "createdAt" FROM users ORDER BY "createdAt" DESC');
    console.log("Users in DB count:", res.rows.length);
    for (const u of res.rows) {
      console.log(`- ${u.id}: ${u.name} | ${u.email} | ${u.role} | ${u.phone}`);
    }
  } catch(e) {
    console.error(e);
  } finally {
    p.end();
  }
}
run();
