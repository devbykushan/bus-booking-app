import dotenv from 'dotenv';
dotenv.config();
import readline from 'readline';
import { v4 as uuidv4 } from 'uuid';
import { getPool, hashPassword } from '../db/database';

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

function prompt(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

// Simple CLI arg parser (e.g. --email=abc@test.com)
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

async function run() {
  console.log('===========================================================');
  console.log('🛡️  Dewmina Super Line — Super Admin Account Creator');
  console.log('===========================================================');
  console.log('This utility securely initializes a Super Administrator with');
  console.log('full master permissions directly in the database (hashed).\n');

  let name = getArg('name');
  let email = getArg('email');
  let password = getArg('password');
  let phone = getArg('phone');

  if (!name) {
    name = (await prompt('👤 Enter Super Admin Full Name (default: Super Admin): ')) || 'Super Admin';
  }

  while (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    email = await prompt('📧 Enter Super Admin Email Address: ');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('❌ Invalid email format. Please enter a valid email address.');
      email = '';
    }
  }

  while (!password || password.length < 6) {
    password = await prompt('🔑 Enter Super Admin Password (min 6 characters): ');
    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters long.');
      password = '';
    }
  }

  if (!phone) {
    phone = (await prompt('📱 Enter Contact Mobile Number (optional): ')) || '+94770000000';
  }

  const pool = getPool();
  try {
    const cleanEmail = email.trim().toLowerCase();
    const hashedPassword = hashPassword(password);
    const permissionsJson = JSON.stringify(ALL_PERMISSIONS);
    const now = new Date().toISOString();

    // Check if user already exists
    const existing = await pool.query('SELECT "id", "role" FROM users WHERE LOWER("email") = $1', [cleanEmail]);

    if (existing.rows.length > 0) {
      const existingId = existing.rows[0].id;
      console.log(`\n⚠️  User with email "${cleanEmail}" already exists (current role: ${existing.rows[0].role}).`);
      const confirm = await prompt('Do you want to promote/update this account to Super Admin with the new password? (yes/no): ');
      if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
        console.log('Cancelled. No changes made.');
        process.exit(0);
      }

      await pool.query(
        `UPDATE users
         SET "name" = $1, "password" = $2, "role" = 'super_admin', "phone" = $3, "permissions" = $4
         WHERE "id" = $5`,
        [name.trim(), hashedPassword, phone.trim(), permissionsJson, existingId]
      );
      console.log(`\n✅ Successfully updated "${cleanEmail}" to Super Admin with full master permissions!`);
    } else {
      const userId = `usr-super-${Date.now()}-${uuidv4().substring(0, 6)}`;
      await pool.query(
        `INSERT INTO users ("id", "name", "email", "password", "role", "phone", "permissions", "createdAt")
         VALUES ($1, $2, $3, $4, 'super_admin', $5, $6, $7)`,
        [userId, name.trim(), cleanEmail, hashedPassword, phone.trim(), permissionsJson, now]
      );
      console.log(`\n✅ Successfully created Super Admin account for "${cleanEmail}" with full master permissions!`);
    }

    console.log('\n-----------------------------------------------------------');
    console.log(`Email:       ${cleanEmail}`);
    console.log(`Role:        super_admin (Master Privileges)`);
    console.log(`Permissions: All modules granted`);
    console.log('-----------------------------------------------------------');
    console.log('You can now log in using the Admin Portal!\n');
  } catch (err: any) {
    console.error('\n❌ Error creating Super Admin:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
