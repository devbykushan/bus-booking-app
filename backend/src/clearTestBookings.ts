import { getPool } from './db/database';

async function clearBookings() {
  const pool = getPool();
  try {
    console.log('🗑️ Clearing all test bookings...');
    await pool.query('DELETE FROM bookings');
    
    console.log('💺 Resetting all seats to available...');
    await pool.query("UPDATE seats SET status = 'available'");
    
    console.log('✅ Database is now clean and ready for real users!');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearBookings();
