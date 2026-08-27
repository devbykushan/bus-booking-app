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

    CREATE TABLE IF NOT EXISTS routes (
      "id" TEXT PRIMARY KEY,
      "operatorId" TEXT NOT NULL,
      "operatorName" TEXT NOT NULL,
      "operatorRating" DOUBLE PRECISION NOT NULL DEFAULT 4.8,
      "busNumber" TEXT NOT NULL,
      "busType" TEXT NOT NULL,
      "origin" TEXT NOT NULL,
      "destination" TEXT NOT NULL,
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

  if (busType.includes('58 Seats 3*2') || busType.includes('Normal Service') || busType.includes('54 Seats 3*2') || busType.includes('Ashok Leyland (54 Seats 3*2')) {
    for (let r = 1; r <= 11; r++) {
      for (const c of [1, 2, 3, 5, 6]) {
        const seatNum = `${r}${String.fromCharCode(64 + (c > 4 ? c - 1 : c))}`;
        seats.push({ id: `${routeId}-${seatNum}`, routeId, number: seatNum, deck: 'lower', row: r, col: c, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: (r === 2 || r === 3) && c <= 3 ? 1 : 0 });
      }
    }
    for (const c of [1, 2, 3]) {
      const seatNum = `12${String.fromCharCode(64 + (c > 4 ? c - 1 : c))}`;
      seats.push({ id: `${routeId}-${seatNum}`, routeId, number: seatNum, deck: 'lower', row: 12, col: c, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: 0 });
    }
    return seats;
  }

  if (busType.includes('Ashok Leyland (54 Seats')) {
    for (let r = 1; r <= 13; r++) {
      for (const c of [1, 2, 4, 5]) {
        const seatNum = `${r}${String.fromCharCode(64 + (c > 3 ? c - 1 : c))}`;
        seats.push({ id: `${routeId}-${seatNum}`, routeId, number: seatNum, deck: 'lower', row: r, col: c, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: (r === 2 || r === 3) && c <= 2 ? 1 : 0 });
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
        seats.push({ id: `${routeId}-${seatNum}`, routeId, number: seatNum, deck: 'lower', row: r, col: c, price: basePrice, status: 'available', isSleeper: 0, isFemaleOnly: (r === 2 || r === 3) && c <= 2 ? 1 : 0 });
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
        const isFemaleOnly = (r === 2 || r === 3) && (c === 1 || c === 2 || c === 3) ? 1 : 0;
        const seatLetter = String.fromCharCode(64 + (c > 4 ? c - 1 : c));
        const seatNum = `${r}${seatLetter}`;
        const isBooked = (r === 1 && c === 1) || (r === 3 && c === 5) || (r === 6 && c === 2) ? 'booked' : 'available';

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
        const isFemaleOnly = (r === 2 || r === 3) && (c === 1 || c === 2) ? 1 : 0;
        const seatLetter = String.fromCharCode(64 + (c > 3 ? c - 1 : c));
        const seatNum = `${r}${seatLetter}`;
        const isBooked = (r === 1 && c === 1) || (r === 4 && c === 4) ? 'booked' : 'available';

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
        const isFemaleOnly = isLower && (r === 2 || r === 3) && (c === 1 || c === 2) ? 1 : 0;
        const prefix = deck === 'lower' ? 'L' : 'U';
        const seatNum = `${prefix}${r}${String.fromCharCode(64 + c)}`;
        const isBooked =
          (deck === 'lower' && r === 1 && c === 1) ||
          (deck === 'lower' && r === 4 && c === 2) ||
          (deck === 'upper' && r === 2 && c === 4)
            ? 'booked'
            : 'available';

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
  const countRes = await p.query('SELECT COUNT(*) as c FROM routes');
  const count = parseInt(countRes.rows[0].c, 10);
  if (count > 0) return;

  console.log('🌱 Seeding Dewmina Super Line routes into Neon PostgreSQL database...');

  const routes = [
    {
      id: 'route-100',
      operatorId: 'op-dewmina',
      operatorName: 'Dewmina Super Line',
      operatorRating: 4.9,
      busNumber: 'ND-3223 (Normal Service - Route 98)',
      busType: 'Normal Service',
      origin: 'Monaragala',
      destination: 'Colombo',
      departureTime: '05:00 AM',
      arrivalTime: '11:30 AM',
      duration: '6h 30m',
      priceStarting: 950,
      hasUpperDeck: 0,
      amenities: JSON.stringify(['Normal Service A4 Highway', 'Reclining Seats', 'Live GPS Tracking', 'Direct Route 98 Pass']),
      gpsLat: 6.6828,
      gpsLng: 80.3992,
      gpsSpeedKmH: 55,
      gpsCurrentStop: 'Ratnapura Clock Tower',
      gpsNextStop: 'Avissawella Bus Terminal',
      gpsEtaMinutes: 180,
    },
    {
      id: 'route-101',
      operatorId: 'op-dewmina',
      operatorName: 'Dewmina Super Line',
      operatorRating: 4.9,
      busNumber: 'ND-7788 (Dewmina Express)',
      busType: 'Super Luxury',
      origin: 'Monaragala',
      destination: 'Colombo',
      departureTime: '06:30 AM',
      arrivalTime: '12:00 PM',
      duration: '5h 30m',
      priceStarting: 2800,
      hasUpperDeck: 0,
      amenities: JSON.stringify(['Super Luxury AC', 'High-Speed Wi-Fi', 'Reclining Push-Back Seats', 'USB Fast Charging', 'Live GPS Tracking', 'Bottled Water', 'Expressway Direct Pass']),
      gpsLat: 6.8722,
      gpsLng: 81.3507,
      gpsSpeedKmH: 78,
      gpsCurrentStop: 'Monaragala Main Terminal',
      gpsNextStop: 'Wellawaya Clock Tower',
      gpsEtaMinutes: 330,
    },
    {
      id: 'route-102',
      operatorId: 'op-dewmina',
      operatorName: 'Dewmina Super Line',
      operatorRating: 4.9,
      busNumber: 'ND-7789 (Dewmina Night Super)',
      busType: 'Super Luxury',
      origin: 'Colombo',
      destination: 'Monaragala',
      departureTime: '09:30 PM',
      arrivalTime: '03:00 AM',
      duration: '5h 30m',
      priceStarting: 3000,
      hasUpperDeck: 1,
      amenities: JSON.stringify(['Super Luxury AC Sleeper', 'High-Speed Wi-Fi', 'Blanket & Pillow', 'USB Charging', 'Live GPS Tracking', 'Night Reading Lamp']),
      gpsLat: 6.9271,
      gpsLng: 79.8612,
      gpsSpeedKmH: 80,
      gpsCurrentStop: 'Colombo Fort Bus Terminal',
      gpsNextStop: 'Makumbura Interchange',
      gpsEtaMinutes: 330,
    },
  ];

  const client = await p.connect();
  try {
    await client.query('BEGIN');

    for (const route of routes) {
      await client.query(`
        INSERT INTO routes (
          "id", "operatorId", "operatorName", "operatorRating", "busNumber", "busType",
          "origin", "destination", "departureTime", "arrivalTime", "duration", "priceStarting",
          "hasUpperDeck", "amenities", "gpsLat", "gpsLng", "gpsSpeedKmH", "gpsCurrentStop", "gpsNextStop", "gpsEtaMinutes"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT ("id") DO UPDATE SET
          "busType" = EXCLUDED."busType",
          "priceStarting" = EXCLUDED."priceStarting",
          "amenities" = EXCLUDED."amenities",
          "duration" = EXCLUDED."duration"
      `, [
        route.id, route.operatorId, route.operatorName, route.operatorRating, route.busNumber, route.busType,
        route.origin, route.destination, route.departureTime, route.arrivalTime, route.duration, route.priceStarting,
        route.hasUpperDeck, route.amenities, route.gpsLat, route.gpsLng, route.gpsSpeedKmH, route.gpsCurrentStop,
        route.gpsNextStop, route.gpsEtaMinutes,
      ]);
    }

    const allSeats: any[] = [];
    for (const route of routes) {
      allSeats.push(...buildSeats(route.id, route.busType, route.hasUpperDeck === 1, route.priceStarting));
    }

    if (allSeats.length > 0) {
      const seatValues: any[] = [];
      const valueStrings: string[] = [];
      let paramIdx = 1;
      for (const s of allSeats) {
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

    const boardingPoints = [
      { id: 'bp-100-1', routeId: 'route-100', type: 'boarding', name: 'Monaragala Main Bus Station', time: '05:00 AM', landmark: 'Platform 3', lat: 6.8722, lng: 81.3507 },
      { id: 'bp-100-2', routeId: 'route-100', type: 'boarding', name: 'Wellawaya Clock Tower', time: '05:40 AM', landmark: 'A4 Highway Junction', lat: 6.7410, lng: 81.1020 },
      { id: 'bp-100-3', routeId: 'route-100', type: 'boarding', name: 'Balangoda Bus Stand', time: '07:15 AM', landmark: 'Town Terminal', lat: 6.6580, lng: 80.7020 },
      { id: 'bp-100-4', routeId: 'route-100', type: 'boarding', name: 'Ratnapura Clock Tower', time: '08:30 AM', landmark: 'City Bus Stand', lat: 6.6828, lng: 80.3992 },
      { id: 'dp-100-1', routeId: 'route-100', type: 'drop', name: 'Avissawella Bus Terminal', time: '09:45 AM', landmark: 'A4 Main Stop', lat: 6.9530, lng: 80.2070 },
      { id: 'dp-100-2', routeId: 'route-100', type: 'drop', name: 'Colombo Fort Central Bus Stand', time: '11:30 AM', landmark: 'Bastian Mawatha Gate 3', lat: 6.9344, lng: 79.8530 },

      { id: 'bp-101-1', routeId: 'route-101', type: 'boarding', name: 'Monaragala Main Bus Station', time: '06:30 AM', landmark: 'Platform 1', lat: 6.8722, lng: 81.3507 },
      { id: 'bp-101-2', routeId: 'route-101', type: 'boarding', name: 'Wellawaya Clock Tower', time: '07:05 AM', landmark: 'A4 Main Junction', lat: 6.7410, lng: 81.1020 },
      { id: 'bp-101-3', routeId: 'route-101', type: 'boarding', name: 'Thanamalwila Junction', time: '07:45 AM', landmark: 'Express Stop', lat: 6.4380, lng: 81.1328 },
      { id: 'bp-101-4', routeId: 'route-101', type: 'boarding', name: 'Mattala E01 Highway Entry', time: '08:15 AM', landmark: 'Expressway Interchange', lat: 6.3025, lng: 81.1189 },
      { id: 'dp-101-1', routeId: 'route-101', type: 'drop', name: 'Makumbura (Kottawa) Multimodal Center', time: '11:45 AM', landmark: 'Expressway Exit Hub', lat: 6.8416, lng: 79.9974 },
      { id: 'dp-101-2', routeId: 'route-101', type: 'drop', name: 'Colombo Fort Central Bus Stand', time: '12:00 PM', landmark: 'Bastian Mawatha Gate 1', lat: 6.9344, lng: 79.8530 },

      { id: 'bp-102-1', routeId: 'route-102', type: 'boarding', name: 'Colombo Fort Bus Terminal', time: '09:30 PM', landmark: 'Bastian Mawatha Gate', lat: 6.9344, lng: 79.8530 },
      { id: 'bp-102-2', routeId: 'route-102', type: 'boarding', name: 'Makumbura (Kottawa) Interchange', time: '10:00 PM', landmark: 'Southern Expressway Entrance', lat: 6.8416, lng: 79.9974 },
      { id: 'dp-102-1', routeId: 'route-102', type: 'drop', name: 'Monaragala Main Bus Station', time: '03:00 AM', landmark: 'Platform 1', lat: 6.8722, lng: 81.3507 },
    ];

    if (boardingPoints.length > 0) {
      const bpValues: any[] = [];
      const bpStrings: string[] = [];
      let bpIdx = 1;
      for (const bp of boardingPoints) {
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

    // Seed one demo booking
    const demoBooking = {
      id: 'BK-89021',
      pnr: 'DSL-89021',
      routeId: 'route-101',
      operatorName: 'Dewmina Super Line',
      busNumber: 'ND-7788 (Dewmina Express)',
      busType: 'Luxury Volvo Multi-Axle',
      origin: 'Monaragala',
      destination: 'Colombo',
      departureDate: '2026-08-20',
      departureTime: '06:30 AM',
      boardingPointId: 'bp-101-1',
      dropPointId: 'dp-101-3',
      seatIds: JSON.stringify(['route-101-L2A']),
      passengerName: 'Kushan Perera',
      passengerEmail: 'kushan@example.com',
      passengerPhone: '0711433520',
      passengerGender: 'male',
      passengerAge: 28,
      baseFare: 2800.00,
      taxAmount: 280.00,
      insuranceAmount: 150.00,
      discountAmount: 420.00,
      totalFare: 2810.00,
      promoCodeApplied: 'BUS2026',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      bookingStatus: 'confirmed',
      qrCodeData: 'DSL-89021|Kushan Perera|route-101-L2A|Monaragala->Colombo',
      createdAt: new Date().toISOString(),
    };

    await client.query(`
      INSERT INTO bookings (
        "id", "pnr", "routeId", "operatorName", "busNumber", "busType", "origin", "destination",
        "departureDate", "departureTime", "boardingPointId", "dropPointId", "seatIds", "passengerName",
        "passengerEmail", "passengerPhone", "passengerGender", "passengerAge", "baseFare", "taxAmount",
        "insuranceAmount", "discountAmount", "totalFare", "promoCodeApplied", "paymentMethod", "paymentStatus",
        "bookingStatus", "qrCodeData", "createdAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      ON CONFLICT ("id") DO NOTHING
    `, [
      demoBooking.id, demoBooking.pnr, demoBooking.routeId, demoBooking.operatorName, demoBooking.busNumber, demoBooking.busType,
      demoBooking.origin, demoBooking.destination, demoBooking.departureDate, demoBooking.departureTime, demoBooking.boardingPointId,
      demoBooking.dropPointId, demoBooking.seatIds, demoBooking.passengerName, demoBooking.passengerEmail, demoBooking.passengerPhone,
      demoBooking.passengerGender, demoBooking.passengerAge, demoBooking.baseFare, demoBooking.taxAmount, demoBooking.insuranceAmount,
      demoBooking.discountAmount, demoBooking.totalFare, demoBooking.promoCodeApplied, demoBooking.paymentMethod, demoBooking.paymentStatus,
      demoBooking.bookingStatus, demoBooking.qrCodeData, demoBooking.createdAt,
    ]);

    await client.query("UPDATE seats SET \"status\" = 'booked' WHERE \"id\" = 'route-101-L2A'");

    await client.query('COMMIT');
    console.log('✅ Dewmina Super Line Neon PostgreSQL database seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to seed PostgreSQL database:', err);
    throw err;
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

