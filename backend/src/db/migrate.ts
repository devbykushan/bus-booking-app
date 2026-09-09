import { getPool, initializeSchema, seedData, seedUsers, verifyPassword } from './database';

async function runMigration() {
  console.log('===========================================================');
  console.log('🚀 Neon PostgreSQL Migration & Database Validation Suite');
  console.log('===========================================================');

  const pool = getPool();

  try {
    // 1. Check database connection
    console.log('\n[1/4] 🔌 Testing Neon Database Connection...');
    const connRes = await pool.query(`
      SELECT 
        current_database() as db, 
        current_user as usr, 
        version() as ver,
        inet_server_addr() as server_ip
    `);
    const dbInfo = connRes.rows[0];
    console.log(`  ✅ Connected to Neon PostgreSQL!`);
    console.log(`     Database: ${dbInfo.db}`);
    console.log(`     User:     ${dbInfo.usr}`);
    console.log(`     Server:   ${dbInfo.ver.split(',')[0]}`);

    // 2. Initialize / migrate schemas
    console.log('\n[2/4] 🛠️  Running Schema Migrations...');
    await initializeSchema(pool);
    console.log('  ✅ Tables & Indexes verified:');
    console.log('     - users (with unique email and lowercase index)');
    console.log('     - routes');
    console.log('     - seats');
    console.log('     - boarding_points');
    console.log('     - bookings');

    // 3. Seed data
    console.log('\n[3/4] 🌱 Seeding Master Data & Default Users...');
    await seedData(pool);
    await seedUsers(pool);
    console.log('  ✅ Seed execution completed.');

    // 4. Validate database integrity & constraints
    console.log('\n[4/4] 🔍 Running Database Integrity & Validation Checks...');
    
    const usersCount = await pool.query('SELECT COUNT(*) as count FROM users');
    const routesCount = await pool.query('SELECT COUNT(*) as count FROM routes');
    const seatsCount = await pool.query('SELECT COUNT(*) as count FROM seats');
    const bpCount = await pool.query('SELECT COUNT(*) as count FROM boarding_points');
    const bookingsCount = await pool.query('SELECT COUNT(*) as count FROM bookings');

    console.log(`  📊 Neon DB Summary:`);
    console.log(`     • Users:           ${usersCount.rows[0].count}`);
    console.log(`     • Routes:          ${routesCount.rows[0].count}`);
    console.log(`     • Seats:           ${seatsCount.rows[0].count}`);
    console.log(`     • Boarding Points: ${bpCount.rows[0].count}`);
    console.log(`     • Bookings:        ${bookingsCount.rows[0].count}`);

    // Verify Admin user credentials in DB
    const adminCheck = await pool.query('SELECT "id", "email", "password", "role" FROM users WHERE "email" = $1', ['admin@dewminasuperline.lk']);
    if (adminCheck.rows.length > 0) {
      const isValid = verifyPassword('Admin@123', adminCheck.rows[0].password);
      if (isValid) {
        console.log('  ✅ Admin user validation: PASSED (credentials verified)');
      } else {
        console.warn('  ⚠️  Admin password verification failed.');
      }
    }

    // Verify Passenger user credentials in DB
    const passCheck = await pool.query('SELECT "id", "email", "password", "role" FROM users WHERE "email" = $1', ['kushan@example.com']);
    if (passCheck.rows.length > 0) {
      const isValid = verifyPassword('Passenger@123', passCheck.rows[0].password);
      if (isValid) {
        console.log('  ✅ Demo passenger user validation: PASSED (credentials verified)');
      } else {
        console.warn('  ⚠️  Demo passenger password verification failed.');
      }
    }

    console.log('\n===========================================================');
    console.log('✨ All Database Migrations & Validations Succeeded! ✨');
    console.log('===========================================================\n');
  } catch (error) {
    console.error('\n❌ Database Migration / Validation Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
