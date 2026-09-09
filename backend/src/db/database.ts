import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

let pool: Pool;

export function getPool(): Pool {
  if (!pool) {
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables.');
    }
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 30000,
      keepAlive: true,
    });

    pool.on('error', (err) => {
      // Idle client disconnected by Neon serverless compute suspend - ignore safely
      console.warn('Neon PostgreSQL idle client warning:', err.message);
    });
  }
  return pool;
}

/**
 * Resilient query helper that automatically retries once if a serverless connection was suspended
 */
export async function dbQuery(text: string, params?: any[]) {
  const p = getPool();
  try {
    return await p.query(text, params);
  } catch (err: any) {
    if (err && err.message && (err.message.includes('Connection terminated') || err.message.includes('closed') || err.message.includes('timeout'))) {
      console.warn('Re-executing query after Neon compute resume...');
      return await p.query(text, params);
    }
    throw err;
  }
}


// ─── Password Hashing & Verification (PBKDF2 with salt) ────────────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, combinedHash: string): boolean {
  if (!combinedHash || !combinedHash.includes(':')) return false;
  const [salt, originalHash] = combinedHash.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

export async function initDb(): Promise<void> {
  const p = getPool();
  await initializeSchema(p);
  await seedData(p);
  await seedUsers(p);
  try {
    await p.query(`UPDATE bookings SET "qrCodeData" = CONCAT('PNR:', "pnr") WHERE "qrCodeData" LIKE '%dewminasuperline.lk%'`);
    await p.query(`
      UPDATE seats s
      SET "price" = r."priceStarting"
      FROM routes r
      WHERE s."routeId" = r."id" AND (s."price" = 3430 OR s."price" = 1800 OR s."price" > r."priceStarting" * 1.5);
    `);
    await p.query(`
      UPDATE bookings b
      SET "baseFare" = r."priceStarting",
          "taxAmount" = ROUND(r."priceStarting" * 0.10, 2),
          "totalFare" = ROUND(r."priceStarting" * 1.10, 2)
      FROM routes r
      WHERE b."routeId" = r."id" AND b."baseFare" > (r."priceStarting" * 1.5);
    `);
  } catch (_) {}
}

export async function initializeSchema(p: Pool): Promise<void> {
  await p.query(`
    CREATE TABLE IF NOT EXISTS users (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT UNIQUE NOT NULL,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'passenger',
      "phone" TEXT,
      "createdAt" TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER("email"));

    CREATE TABLE IF NOT EXISTS otps (
      "email" TEXT PRIMARY KEY,
      "otp" TEXT NOT NULL,
      "expiresAt" BIGINT NOT NULL
    );

        CREATE TABLE IF NOT EXISTS timetables (
      "id" TEXT PRIMARY KEY,
      "busNumber" TEXT NOT NULL,
      "operatorId" TEXT NOT NULL,
      "operatorName" TEXT NOT NULL,
      "busType" TEXT NOT NULL,
      "price" DOUBLE PRECISION NOT NULL,
      "anchorDate" TEXT NOT NULL,
      "pattern" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS routes (
      "id" TEXT PRIMARY KEY,
      "operatorId" TEXT NOT NULL,
      "operatorName" TEXT NOT NULL,
      "operatorRating" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
      "busNumber" TEXT NOT NULL,
      "busType" TEXT NOT NULL,
      "origin" TEXT NOT NULL,
      "destination" TEXT NOT NULL,
      "departureDate" TEXT NOT NULL,
      "departureTime" TEXT NOT NULL,
      "arrivalTime" TEXT NOT NULL,
      "duration" TEXT NOT NULL,
      "priceStarting" DOUBLE PRECISION NOT NULL,
      "hasUpperDeck" INTEGER NOT NULL DEFAULT 0,
      "amenities" TEXT NOT NULL DEFAULT '[]',
      "gpsLat" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "gpsLng" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "gpsSpeedKmH" INTEGER NOT NULL DEFAULT 0,
      "gpsCurrentStop" TEXT NOT NULL DEFAULT '',
      "gpsNextStop" TEXT NOT NULL DEFAULT '',
      "gpsEtaMinutes" INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS seats (
      "id" TEXT PRIMARY KEY,
      "routeId" TEXT NOT NULL,
      "number" TEXT NOT NULL,
      "deck" TEXT NOT NULL DEFAULT 'lower',
      "row" INTEGER NOT NULL,
      "col" INTEGER NOT NULL,
      "price" DOUBLE PRECISION NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'available',
      "isSleeper" INTEGER NOT NULL DEFAULT 0,
      "isFemaleOnly" INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY ("routeId") REFERENCES routes("id") ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS boarding_points (
      "id" TEXT PRIMARY KEY,
      "routeId" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'boarding',
      "name" TEXT NOT NULL,
      "time" TEXT NOT NULL,
      "landmark" TEXT NOT NULL DEFAULT '',
      "lat" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "lng" DOUBLE PRECISION NOT NULL DEFAULT 0,
      FOREIGN KEY ("routeId") REFERENCES routes("id") ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      "id" TEXT PRIMARY KEY,
      "pnr" TEXT UNIQUE NOT NULL,
      "routeId" TEXT NOT NULL,
      "operatorName" TEXT NOT NULL,
      "busNumber" TEXT NOT NULL,
      "busType" TEXT NOT NULL,
      "origin" TEXT NOT NULL,
      "destination" TEXT NOT NULL,
      "departureDate" TEXT NOT NULL,
      "departureTime" TEXT NOT NULL,
      "boardingPointId" TEXT NOT NULL,
      "dropPointId" TEXT NOT NULL,
      "seatIds" TEXT NOT NULL DEFAULT '[]',
      "passengerName" TEXT NOT NULL,
      "passengerEmail" TEXT NOT NULL,
      "passengerPhone" TEXT NOT NULL,
      "passengerGender" TEXT NOT NULL DEFAULT 'other',
      "passengerAge" INTEGER NOT NULL DEFAULT 0,
      "baseFare" DOUBLE PRECISION NOT NULL,
      "taxAmount" DOUBLE PRECISION NOT NULL,
      "insuranceAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "totalFare" DOUBLE PRECISION NOT NULL,
      "promoCodeApplied" TEXT,
      "paymentMethod" TEXT NOT NULL DEFAULT 'card',
      "paymentStatus" TEXT NOT NULL DEFAULT 'paid',
      "bookingStatus" TEXT NOT NULL DEFAULT 'confirmed',
      "qrCodeData" TEXT NOT NULL,
      "createdAt" TEXT NOT NULL,
      FOREIGN KEY ("routeId") REFERENCES routes("id")
    );

    UPDATE routes 
    SET "busType" = 'Normal Service' 
    WHERE "busType" LIKE '%Normal Service%' OR "busType" LIKE '%58 Seats%' OR "busType" LIKE '%54 Seats%';

    UPDATE routes 
    SET "busType" = 'Super Luxury' 
    WHERE "busType" LIKE '%Super Luxury%';
  `);
}

// ─── Seat generator helper ────────────────────────────────────────────────────

export function buildSeats(
  routeId: string,
  busType: string,
  hasUpperDeck: boolean,
  routePrice?: number
): { id: string; routeId: string; number: string; deck: string; row: number; col: number; price: number; status: string; isSleeper: number; isFemaleOnly: number }[] {
  const seats: ReturnType<typeof buildSeats> = [];
  const basePrice = routePrice || (busType.includes('Normal Service') ? 950 : busType.includes('Sleeper') ? 3000 : busType.includes('Super Luxury') ? 2800 : 1500);

  if (busType.includes('49 Seats') || busType.includes('Super Luxury')) {
    const femaleSeats = ['15', '19', '20', '23'];
    for (let r = 1; r <= 11; r++) {
      const leftWindowNum = ((r - 1) * 4 + 3).toString();
      const leftAisleNum = ((r - 1) * 4 + 4).toString();
      const rightAisleNum = ((r - 1) * 4 + 2).toString();
      const rightWindowNum = ((r - 1) * 4 + 1).toString();

      seats.push(
        { id: `${routeId}-${leftWindowNum}`, routeId, number: leftWindowNum, deck: 'lower', row: r, col: 1, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: femaleSeats.includes(leftWindowNum) ? 1 : 0 },
        { id: `${routeId}-${leftAisleNum}`, routeId, number: leftAisleNum, deck: 'lower', row: r, col: 2, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: femaleSeats.includes(leftAisleNum) ? 1 : 0 },
        { id: `${routeId}-${rightAisleNum}`, routeId, number: rightAisleNum, deck: 'lower', row: r, col: 4, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: femaleSeats.includes(rightAisleNum) ? 1 : 0 },
        { id: `${routeId}-${rightWindowNum}`, routeId, number: rightWindowNum, deck: 'lower', row: r, col: 5, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: femaleSeats.includes(rightWindowNum) ? 1 : 0 }
      );
    }
    const backSeats = [
      { num: '47', col: 1 },
      { num: '48', col: 2 },
      { num: '49', col: 3 },
      { num: '46', col: 4 },
      { num: '45', col: 5 },
    ];
    backSeats.forEach(s => {
      seats.push({ id: `${routeId}-${s.num}`, routeId, number: s.num, deck: 'lower', row: 12, col: s.col, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: 0 });
    });
    return seats;
  }

  if (busType.includes('58 Seats') || busType.includes('Normal Service') || busType.includes('54 Seats 3*2') || busType.includes('Ashok Leyland') || busType.includes('3*2')) {
    const femaleSeats = ['2', '3', '7', '8'];

    // Row 0: Top Left Seat #1
    seats.push({
      id: `${routeId}-1`, routeId, number: '1', deck: 'lower', row: 0, col: 1, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: 0
    });

    // Rows 1 to 9: 2 left (cols 1,2) and 3 right (cols 4,5,6)
    let currentNum = 2;
    for (let r = 1; r <= 9; r++) {
      [1, 2, 4, 5, 6].forEach((c) => {
        const numStr = currentNum.toString();
        seats.push({
          id: `${routeId}-${numStr}`,
          routeId,
          number: numStr,
          deck: 'lower',
          row: r,
          col: c,
          price: basePrice,
          status: 'available',
          isSleeper: 0,
          isFemaleOnly: 0,
        });
        currentNum++;
      });
    }

    // Rows 10 & 11: 3 right seats only (cols 4,5,6)
    for (let r = 10; r <= 11; r++) {
      [4, 5, 6].forEach((c) => {
        const numStr = currentNum.toString();
        seats.push({
          id: `${routeId}-${numStr}`,
          routeId,
          number: numStr,
          deck: 'lower',
          row: r,
          col: c,
          price: basePrice,
          status: 'available',
          isSleeper: 0,
          isFemaleOnly: 0,
        });
        currentNum++;
      });
    }

    // Row 12: 6 rear seats (cols 1,2,3,4,5,6)
    [1, 2, 3, 4, 5, 6].forEach((c) => {
      const numStr = currentNum.toString();
      seats.push({
        id: `${routeId}-${numStr}`,
        routeId,
        number: numStr,
        deck: 'lower',
        row: 12,
        col: c,
        price: basePrice,
        status: 'available',
        isSleeper: 0,
        isFemaleOnly: 0,
      });
      currentNum++;
    });

    return seats;
  }

  if (busType.includes('Ashok Leyland (54 Seats')) {
    for (let r = 1; r <= 13; r++) {
      for (const c of [1, 2, 4, 5]) {
        const seatNum = `${r}${String.fromCharCode(64 + (c > 3 ? c - 1 : c))}`;
        seats.push({ id: `${routeId}-${seatNum}`, routeId, number: seatNum, deck: 'lower', row: r, col: c, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: 0 });
      }
    }
    for (const c of [1, 2]) {
      const seatNum = `14${String.fromCharCode(64 + c)}`;
      seats.push({ id: `${routeId}-${seatNum}`, routeId, number: seatNum, deck: 'lower', row: 14, col: c, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: 0 });
    }
    return seats;
  }

  if (busType.includes('Yutong')) {
    for (let r = 1; r <= 12; r++) {
      for (const c of [1, 2, 4, 5]) {
        const seatNum = `Y${r}${String.fromCharCode(64 + (c > 3 ? c - 1 : c))}`;
        seats.push({ id: `${routeId}-${seatNum}`, routeId, number: seatNum, deck: 'lower', row: r, col: c, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: 0 });
      }
    }
    if (busType.includes('51 Seats')) {
      for (const c of [1, 2, 3]) {
        const seatNum = `Y13${String.fromCharCode(64 + c)}`;
        seats.push({ id: `${routeId}-${seatNum}`, routeId, number: seatNum, deck: 'lower', row: 13, col: c, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: 0 });
      }
    }
    return seats;
  }

  // 1. Lanka Ashok Leyland 57-Seat 3*2 Model (Classic Sri Lanka Leyland Intercity)
  if (busType.includes('3*2') || busType.includes('Leyland')) {
    const totalRows = 11;
    for (let r = 1; r <= totalRows; r++) {
      const cols = [1, 2, 3, 5, 6];
      for (const c of cols) {
        const isFemaleOnly = 0;
        const seatLetter = String.fromCharCode(64 + (c > 4 ? c - 1 : c));
        const seatNum = `${r}${seatLetter}`;
        const isBooked = 'available';

        seats.push({
          id: `${routeId}-${seatNum}`,
          routeId,
          number: seatNum,
          deck: 'lower',
          row: r,
          col: c,
          price: basePrice,
          status: isBooked,
          isSleeper: 0,
          isFemaleOnly,
        });
      }
    }
    for (const c of [1, 2]) {
      const seatNum = `12${String.fromCharCode(64 + c)}`;
      seats.push({
        id: `${routeId}-${seatNum}`,
        routeId,
        number: seatNum,
        deck: 'lower',
        row: 12,
        col: c,
        price: basePrice,
        status: 'available',
        isSleeper: 0,
        isFemaleOnly: 0,
      });
    }
    return seats;
  }

  // 2. Lanka Ashok Leyland 57-Seat 2*2 Model
  if (busType.includes('2*2')) {
    const totalRows = 14;
    for (let r = 1; r <= totalRows; r++) {
      for (const c of [1, 2, 4, 5]) {
        const isFemaleOnly = 0;
        const seatLetter = String.fromCharCode(64 + (c > 3 ? c - 1 : c));
        const seatNum = `${r}${seatLetter}`;
        const isBooked = 'available';

        seats.push({
          id: `${routeId}-${seatNum}`,
          routeId,
          number: seatNum,
          deck: 'lower',
          row: r,
          col: c,
          price: basePrice,
          status: isBooked,
          isSleeper: 0,
          isFemaleOnly,
        });
      }
    }
    seats.push({
      id: `${routeId}-15A`,
      routeId,
      number: '15A',
      deck: 'lower',
      row: 15,
      col: 1,
      price: basePrice,
      status: 'available',
      isSleeper: 0,
      isFemaleOnly: 0,
    });
    return seats;
  }

  // 3. Default Sleeper or Volvo Multi-Axle layouts
  const totalRows = busType.includes('Sleeper') ? 6 : 10;

  for (const deck of hasUpperDeck ? ['lower', 'upper'] : ['lower']) {
    for (let r = 1; r <= totalRows; r++) {
      const cols = busType.includes('Sleeper') ? [1, 2, 4] : [1, 2, 4, 5];
      for (const c of cols) {
        const isLower = deck === 'lower';
        const isFemaleOnly = 0;
        const prefix = deck === 'lower' ? 'L' : 'U';
        const seatNum = `${prefix}${r}${String.fromCharCode(64 + c)}`;
        const isBooked = 'available';

        seats.push({
          id: `${routeId}-${seatNum}`,
          routeId,
          number: seatNum,
          deck,
          row: r,
          col: c,
          price: deck === 'upper' ? basePrice + 400 : basePrice,
          status: isBooked,
          isSleeper: busType.includes('Sleeper') ? 1 : 0,
          isFemaleOnly,
        });
      }
    }
  }

  return seats;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

export async function seedData(p: Pool): Promise<void> {
  const tCountRes = await p.query('SELECT COUNT(*) as c FROM timetables');
  const tCount = parseInt(tCountRes.rows[0].c, 10);

  if (tCount === 0) {
    console.log('📅 Seeding timetables table with initial rotation data...');
    const ROTATION = [
      { out: '10.55 PM', in: null },        // Day 1
      { out: '11.35 PM', in: '12.40 PM' },  // Day 2
      { out: '12.00 AM', in: '01.40 PM' },  // Day 3
      { out: null,       in: '02.20 PM' },  // Day 4
      { out: null,       in: null },        // Day 5 (OFF)
      { out: '05.00 AM', in: '04.10 PM' },  // Day 6
      { out: null,       in: null },        // Day 7 (OFF)
      { out: '06.00 AM', in: '05.10 PM' },  // Day 8
      { out: '07.10 AM', in: '06.00 PM' },  // Day 9
      { out: '08.10 AM', in: '06.50 PM' },  // Day 10
      { out: null,       in: null },        // Day 11 (OFF)
      { out: '09.20 AM', in: '07.50 PM' },  // Day 12
      { out: '10.20 AM', in: '09.30 PM' },  // Day 13
      { out: '11.40 AM', in: '10.30 PM' },  // Day 14
      { out: '12.20 PM', in: '11.30 PM' },  // Day 15
      { out: '01.15 PM', in: null },        // Day 16
      { out: '02.20 PM', in: '12.40 AM' },  // Day 17
      { out: null,       in: '01.40 PM' },  // Day 18
      { out: null,       in: null },        // Day 19 (OFF)
      { out: null,       in: null },        // Day 20 (OFF)
      { out: null,       in: null },        // Day 21 (OFF)
    ];

    await p.query(`
      INSERT INTO timetables ("id", "busNumber", "operatorId", "operatorName", "busType", "price", "anchorDate", "pattern")
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8),
      ($9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      'tt-nd2903', 'ND-2903', 'op-dewmina', 'Dewmina Super Line', 'Normal Service (58 Seats 3*2)', 1157.00, '2026-09-06T00:00:00Z', JSON.stringify(ROTATION),
      'tt-nd3223', 'ND-3223', 'op-dewmina', 'Dewmina Super Line', 'Normal Service (58 Seats 3*2)', 1157.00, '2026-09-09T00:00:00Z', JSON.stringify(ROTATION)
    ]);
  }

  const countRes = await p.query('SELECT COUNT(*) as c FROM routes');
  const count = parseInt(countRes.rows[0].c, 10);
  
  if (count > 0) {
    const checkRes = await p.query('SELECT id FROM routes WHERE id = $1', ['route-100']);
    if (checkRes.rows.length > 0) {
       console.log('🔄 Cleaning up old dummy routes to seed timetable calendar...');
       await p.query('DELETE FROM bookings');
       await p.query('DELETE FROM seats');
       await p.query('DELETE FROM boarding_points');
       await p.query('DELETE FROM routes');
    } else {
       // Since the admin will manually click "generate trips", we don't return here if we want to run generate trips.
       // However, we only run it here during DB init if there are no routes.
       return; 
    }
  }

  console.log('📅 Generating trips from timetables...');
  await generateTripsFromTimetables(p);
}

export async function generateTripsFromTimetables(p: Pool): Promise<void> {
  const timetablesRes = await p.query('SELECT * FROM timetables');
  const timetables = timetablesRes.rows;

  const routes: any[] = [];
  const allSeats: any[] = [];
  const boardingPoints: any[] = [];
  
  const simStartDate = new Date('2026-09-01T00:00:00Z');
  
  for (let i = 0; i < 90; i++) {
    const currentDate = new Date(simStartDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = currentDate.toISOString().split('T')[0];

    for (const tt of timetables) {
      const anchorDate = new Date(tt.anchorDate);
      const diffTime = currentDate.getTime() - anchorDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const pattern = JSON.parse(tt.pattern);
      const len = pattern.length;
      if (len === 0) continue;

      const turnIndex = ((diffDays % len) + len) % len;
      const turn = pattern[turnIndex];

      // Add Monaragala -> Colombo
      if (turn.out) {
        const routeId = `route-${tt.busNumber}-OUT-${dateStr}`;
        routes.push({
          id: routeId,
          operatorId: tt.operatorId,
          operatorName: tt.operatorName,
          operatorRating: 4.8,
          busNumber: tt.busNumber,
          busType: tt.busType,
          origin: 'Monaragala',
          destination: 'Colombo',
          departureDate: dateStr,
          departureTime: turn.out,
          arrivalTime: 'N/A', // We can estimate later if needed
          duration: '6h 30m',
          priceStarting: tt.price,
          hasUpperDeck: 0,
          amenities: JSON.stringify(['Normal Service', 'Live GPS Tracking']),
          gpsLat: 6.8722, gpsLng: 81.3507, gpsSpeedKmH: 0, gpsCurrentStop: 'Monaragala', gpsNextStop: '', gpsEtaMinutes: 0
        });
        
        boardingPoints.push(
          { id: `bp-${routeId}-1`, routeId, type: 'boarding', name: 'Monaragala Main Bus Station', time: turn.out, landmark: '', lat: 6.8722, lng: 81.3507 },
          { id: `dp-${routeId}-1`, routeId, type: 'drop', name: 'Colombo Fort Central Bus Stand', time: 'N/A', landmark: '', lat: 6.9344, lng: 79.8530 }
        );
      }

      // Add Colombo -> Monaragala
      if (turn.in) {
        const routeId = `route-${tt.busNumber}-IN-${dateStr}`;
        routes.push({
          id: routeId,
          operatorId: tt.operatorId,
          operatorName: tt.operatorName,
          operatorRating: 4.8,
          busNumber: tt.busNumber,
          busType: tt.busType,
          origin: 'Colombo',
          destination: 'Monaragala',
          departureDate: dateStr,
          departureTime: turn.in,
          arrivalTime: 'N/A',
          duration: '6h 30m',
          priceStarting: tt.price,
          hasUpperDeck: 0,
          amenities: JSON.stringify(['Normal Service', 'Live GPS Tracking']),
          gpsLat: 6.9344, gpsLng: 79.8530, gpsSpeedKmH: 0, gpsCurrentStop: 'Colombo', gpsNextStop: '', gpsEtaMinutes: 0
        });
        
        boardingPoints.push(
          { id: `bp-${routeId}-1`, routeId, type: 'boarding', name: 'Colombo Fort Central Bus Stand', time: turn.in, landmark: '', lat: 6.9344, lng: 79.8530 },
          { id: `dp-${routeId}-1`, routeId, type: 'drop', name: 'Monaragala Main Bus Station', time: 'N/A', landmark: '', lat: 6.8722, lng: 81.3507 }
        );
      }
    }
  }

  const client = await p.connect();
  try {
    await client.query('BEGIN');
    
    // Insert Routes
    for (const route of routes) {
      await client.query(`
        INSERT INTO routes (
          "id", "operatorId", "operatorName", "operatorRating", "busNumber", "busType",
          "origin", "destination", "departureDate", "departureTime", "arrivalTime", "duration", "priceStarting",
          "hasUpperDeck", "amenities", "gpsLat", "gpsLng", "gpsSpeedKmH", "gpsCurrentStop", "gpsNextStop", "gpsEtaMinutes"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT ("id") DO NOTHING
      `, [
        route.id, route.operatorId, route.operatorName, route.operatorRating, route.busNumber, route.busType,
        route.origin, route.destination, route.departureDate, route.departureTime, route.arrivalTime, route.duration, route.priceStarting,
        route.hasUpperDeck, route.amenities, route.gpsLat, route.gpsLng, route.gpsSpeedKmH, route.gpsCurrentStop,
        route.gpsNextStop, route.gpsEtaMinutes,
      ]);
    }

    // Build and Insert Seats
    for (const route of routes) {
      allSeats.push(...buildSeats(route.id, route.busType, route.hasUpperDeck === 1, route.priceStarting));
    }

    // Insert seats in batches of 500
    const chunkSize = 500;
    for (let i = 0; i < allSeats.length; i += chunkSize) {
      const chunk = allSeats.slice(i, i + chunkSize);
      const seatValues: any[] = [];
      const valueStrings: string[] = [];
      let paramIdx = 1;
      for (const s of chunk) {
        valueStrings.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6}, $${paramIdx+7}, $${paramIdx+8}, $${paramIdx+9})`);
        seatValues.push(s.id, s.routeId, s.number, s.deck, s.row, s.col, s.price, s.status, s.isSleeper, s.isFemaleOnly);
        paramIdx += 10;
      }
      await client.query(`
        INSERT INTO seats (
          "id", "routeId", "number", "deck", "row", "col", "price", "status", "isSleeper", "isFemaleOnly"
        ) VALUES ${valueStrings.join(', ')}
        ON CONFLICT ("id") DO NOTHING
      `, seatValues);
    }

    // Insert Boarding Points
    const bpChunkSize = 500;
    for (let i = 0; i < boardingPoints.length; i += bpChunkSize) {
      const chunk = boardingPoints.slice(i, i + bpChunkSize);
      const bpValues: any[] = [];
      const bpStrings: string[] = [];
      let bpIdx = 1;
      for (const bp of chunk) {
        bpStrings.push(`($${bpIdx}, $${bpIdx+1}, $${bpIdx+2}, $${bpIdx+3}, $${bpIdx+4}, $${bpIdx+5}, $${bpIdx+6}, $${bpIdx+7})`);
        bpValues.push(bp.id, bp.routeId, bp.type, bp.name, bp.time, bp.landmark, bp.lat, bp.lng);
        bpIdx += 8;
      }
      await client.query(`
        INSERT INTO boarding_points (
          "id", "routeId", "type", "name", "time", "landmark", "lat", "lng"
        ) VALUES ${bpStrings.join(', ')}
        ON CONFLICT ("id") DO NOTHING
      `, bpValues);
    }

    await client.query('COMMIT');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Seeding error:', err);
  } finally {
    client.release();
  }
}

export async function seedUsers(p: Pool): Promise<void> {
  const countRes = await p.query('SELECT COUNT(*) as c FROM users');
  const count = parseInt(countRes.rows[0].c, 10);
  if (count > 0) return;

  console.log('🌱 Seeding initial admin and demo passenger accounts...');

  const initialUsers = [
    {
      id: 'usr-admin-1',
      name: 'Super Admin & Fleet Manager',
      email: 'admin@dewminasuperline.lk',
      password: hashPassword('Admin@123'),
      role: 'admin',
      phone: '+94771234567',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-passenger-1',
      name: 'Kushan Perera',
      email: 'kushan@example.com',
      password: hashPassword('Passenger@123'),
      role: 'passenger',
      phone: '+94711433520',
      createdAt: new Date().toISOString(),
    },
  ];

  for (const u of initialUsers) {
    await p.query(`
      INSERT INTO users ("id", "name", "email", "password", "role", "phone", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT ("email") DO NOTHING
    `, [u.id, u.name, u.email.toLowerCase(), u.password, u.role, u.phone, u.createdAt]);
  }
  console.log('✅ Initial users seeded successfully.');
}

