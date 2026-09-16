import dotenv from 'dotenv';
dotenv.config();
import { getPool, hashPassword } from '../db/database';

function getArg(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  if (arg) return arg.substring(prefix.length).trim();
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1] && !process.argv[idx + 1].startsWith('--')) {
    return process.argv[idx + 1].trim();
  }
  return null;
}

async function main() {
  const email = getArg('email') || process.argv[2];
  const newPassword = getArg('password') || process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: npm run change-password -- --email=<email> --password=<newPassword>');
    process.exit(1);
  }

  const pool = getPool();
  try {
    const cleanEmail = email.trim().toLowerCase();
    const hashedPassword = hashPassword(newPassword);

    const userCheck = await pool.query('SELECT "id", "name", "email", "role" FROM users WHERE LOWER("email") = $1', [cleanEmail]);
    if (userCheck.rows.length === 0) {
      console.error(`❌ User not found with email: ${cleanEmail}`);
      process.exit(1);
    }

    const user = userCheck.rows[0];

    // Ensure permissions and role are set appropriately
    const ALL_PERMISSIONS = [
      'counter_booking',
      'slips_approval',
      'qr_scanner',
      'manifest_view',
      'fleet_management',
      'timetable_management',
      'analytics',
      'whatsapp',
      'staff_management',
    ];

    await pool.query(
      `UPDATE users
       SET "password" = $1, "role" = 'super_admin', "permissions" = $2
       WHERE "id" = $3`,
      [hashedPassword, JSON.stringify(ALL_PERMISSIONS), user.id]
    );

    console.log(`✅ Password successfully updated for ${cleanEmail}!`);
    console.log(`Role updated to 'super_admin' with all permissions.`);
  } catch (err: any) {
    console.error('❌ Error updating password:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
