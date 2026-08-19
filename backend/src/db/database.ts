import Database from 'better-sqlite3';
import path from 'path';

// Store database file in backend root
const DB_PATH = path.join(__dirname, '../../omnibus.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
    seedData();
  }
  return db;
}

function initializeSchema(): void {
  const database = db;

  database.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      operatorId TEXT NOT NULL,
      operatorName TEXT NOT NULL,
      operatorRating REAL NOT NULL DEFAULT 4.8,
      busNumber TEXT NOT NULL,
      busType TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departureTime TEXT NOT NULL,
      arrivalTime TEXT NOT NULL,
      duration TEXT NOT NULL,
      priceStarting REAL NOT NULL,
      hasUpperDeck INTEGER NOT NULL DEFAULT 0,
      amenities TEXT NOT NULL DEFAULT '[]',
      gpsLat REAL NOT NULL DEFAULT 0,
      gpsLng REAL NOT NULL DEFAULT 0,
      gpsSpeedKmH INTEGER NOT NULL DEFAULT 0,
      gpsCurrentStop TEXT NOT NULL DEFAULT '',
      gpsNextStop TEXT NOT NULL DEFAULT '',
      gpsEtaMinutes INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS seats (
      id TEXT PRIMARY KEY,
      routeId TEXT NOT NULL,
      number TEXT NOT NULL,
      deck TEXT NOT NULL DEFAULT 'lower',
      row INTEGER NOT NULL,
      col INTEGER NOT NULL,
      price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      isSleeper INTEGER NOT NULL DEFAULT 0,
      isFemaleOnly INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS boarding_points (
      id TEXT PRIMARY KEY,
      routeId TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'boarding',
      name TEXT NOT NULL,
      time TEXT NOT NULL,
      landmark TEXT NOT NULL DEFAULT '',
      lat REAL NOT NULL DEFAULT 0,
      lng REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      pnr TEXT UNIQUE NOT NULL,
      routeId TEXT NOT NULL,
      operatorName TEXT NOT NULL,
      busNumber TEXT NOT NULL,
      busType TEXT NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departureDate TEXT NOT NULL,
      departureTime TEXT NOT NULL,
      boardingPointId TEXT NOT NULL,
      dropPointId TEXT NOT NULL,
      seatIds TEXT NOT NULL DEFAULT '[]',
      passengerName TEXT NOT NULL,
      passengerEmail TEXT NOT NULL,
      passengerPhone TEXT NOT NULL,
      passengerGender TEXT NOT NULL DEFAULT 'other',
      passengerAge INTEGER NOT NULL DEFAULT 0,
      baseFare REAL NOT NULL,
      taxAmount REAL NOT NULL,
      insuranceAmount REAL NOT NULL DEFAULT 0,
      discountAmount REAL NOT NULL DEFAULT 0,
      totalFare REAL NOT NULL,
      promoCodeApplied TEXT,
      paymentMethod TEXT NOT NULL DEFAULT 'card',
      paymentStatus TEXT NOT NULL DEFAULT 'paid',
      bookingStatus TEXT NOT NULL DEFAULT 'confirmed',
      qrCodeData TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (routeId) REFERENCES routes(id)
    );
  `);
}

// ─── Seat generator helper ────────────────────────────────────────────────────

function buildSeats(
  routeId: string,
  busType: string,
  hasUpperDeck: boolean
): { id: string; routeId: string; number: string; deck: string; row: number; col: number; price: number; status: string; isSleeper: number; isFemaleOnly: number }[] {
  const seats: ReturnType<typeof buildSeats> = [];
  const basePrice = busType.includes('Sleeper') ? 2800 : 1800;

  // 1. Lanka Ashok Leyland 57-Seat 3*2 Model (Classic Sri Lanka Leyland Intercity)
  if (busType.includes('3*2') || busType.includes('Leyland')) {
    const totalRows = 11;
    // Rows 1..11: 3 seats on Left (cols 1,2,3), Aisle (col 4), 2 seats on Right (cols 5,6) -> 5 seats * 11 = 55 seats
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
    // Row 12 (Back Row): 2 additional seats to reach 57 seats total
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
    // Rows 1..14: 2 seats Left (cols 1,2), Aisle (col 3), 2 seats Right (cols 4,5) -> 4 * 14 = 56 seats
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
    // Row 15: 1 seat to complete 57 seats
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

function seedData(): void {
  const database = db;

  // Only seed if routes table is empty
  const count = (database.prepare('SELECT COUNT(*) as c FROM routes').get() as { c: number }).c;
  if (count > 0) return;

  console.log('🌱 Seeding Dewmina Super Line routes into database...');

  const routes = [
    {
      id: 'route-101',
      operatorId: 'op-dewmina',
      operatorName: 'Dewmina Super Line',
      operatorRating: 4.9,
      busNumber: 'ND-7788 (Dewmina Express)',
      busType: 'Luxury Volvo Multi-Axle',
      origin: 'Monaragala',
      destination: 'Colombo',
      departureTime: '06:30 AM',
      arrivalTime: '12:30 PM',
      duration: '6h 00m',
      priceStarting: 2800,
      hasUpperDeck: 0,
      amenities: JSON.stringify(['AC', 'Reclining Seats', 'Charging Ports', 'Live GPS Tracking', 'Water Bottle', 'Music']),
      gpsLat: 6.8722,
      gpsLng: 81.3507,
      gpsSpeedKmH: 72,
      gpsCurrentStop: 'Monaragala Main Terminal',
      gpsNextStop: 'Wellawaya Clock Tower',
      gpsEtaMinutes: 360,
    },
    {
      id: 'route-102',
      operatorId: 'op-dewmina',
      operatorName: 'Dewmina Super Line',
      operatorRating: 4.9,
      busNumber: 'ND-7789 (Dewmina Night Super)',
      busType: 'AC Sleeper',
      origin: 'Colombo',
      destination: 'Monaragala',
      departureTime: '09:30 PM',
      arrivalTime: '03:30 AM',
      duration: '6h 00m',
      priceStarting: 3000,
      hasUpperDeck: 1,
      amenities: JSON.stringify(['AC Sleeper', 'Blanket', 'Charging Ports', 'Live GPS Tracking', 'Night Reading Lamp']),
      gpsLat: 6.9271,
      gpsLng: 79.8612,
      gpsSpeedKmH: 80,
      gpsCurrentStop: 'Colombo Fort Bus Terminal',
      gpsNextStop: 'Kottawa Interchange',
      gpsEtaMinutes: 360,
    },
    {
      id: 'route-103',
      operatorId: 'op-dewmina',
      operatorName: 'Dewmina Super Line',
      operatorRating: 4.8,
      busNumber: 'ND-4455 (Dewmina Air Bus)',
      busType: 'Double Decker Sleeper',
      origin: 'Monaragala',
      destination: 'Colombo',
      departureTime: '01:30 PM',
      arrivalTime: '07:30 PM',
      duration: '6h 00m',
      priceStarting: 3200,
      hasUpperDeck: 1,
      amenities: JSON.stringify(['AC', 'Panoramic Roof', 'Live GPS Tracking', 'Wi-Fi', 'Reclining Sleeper']),
      gpsLat: 6.7410,
      gpsLng: 81.1020,
      gpsSpeedKmH: 68,
      gpsCurrentStop: 'Wellawaya Junction',
      gpsNextStop: 'Pelmadulla Station',
      gpsEtaMinutes: 240,
    },
  ];

  const insertRoute = database.prepare(`
    INSERT INTO routes (id, operatorId, operatorName, operatorRating, busNumber, busType,
      origin, destination, departureTime, arrivalTime, duration, priceStarting,
      hasUpperDeck, amenities, gpsLat, gpsLng, gpsSpeedKmH, gpsCurrentStop, gpsNextStop, gpsEtaMinutes)
    VALUES (@id, @operatorId, @operatorName, @operatorRating, @busNumber, @busType,
      @origin, @destination, @departureTime, @arrivalTime, @duration, @priceStarting,
      @hasUpperDeck, @amenities, @gpsLat, @gpsLng, @gpsSpeedKmH, @gpsCurrentStop, @gpsNextStop, @gpsEtaMinutes)
  `);

  const insertSeat = database.prepare(`
    INSERT INTO seats (id, routeId, number, deck, row, col, price, status, isSleeper, isFemaleOnly)
    VALUES (@id, @routeId, @number, @deck, @row, @col, @price, @status, @isSleeper, @isFemaleOnly)
  `);

  const insertBoardingPoint = database.prepare(`
    INSERT INTO boarding_points (id, routeId, type, name, time, landmark, lat, lng)
    VALUES (@id, @routeId, @type, @name, @time, @landmark, @lat, @lng)
  `);

  const seedAll = database.transaction(() => {
    for (const route of routes) {
      insertRoute.run(route);

      // Insert seats
      const seats = buildSeats(route.id, route.busType, route.hasUpperDeck === 1);
      for (const seat of seats) {
        insertSeat.run(seat);
      }
    }

    // Boarding & drop points for Monaragala <-> Colombo
    const boardingPoints = [
      { id: 'bp-101-1', routeId: 'route-101', type: 'boarding', name: 'Monaragala Main Bus Station', time: '06:30 AM', landmark: 'Platform 1', lat: 6.8722, lng: 81.3507 },
      { id: 'bp-101-2', routeId: 'route-101', type: 'boarding', name: 'Wellawaya Town Clock Tower', time: '07:15 AM', landmark: 'Main Junction', lat: 6.7410, lng: 81.1020 },
      { id: 'bp-101-3', routeId: 'route-101', type: 'boarding', name: 'Ratnapura Central Bus Stand', time: '10:15 AM', landmark: 'Main Stand Gate 2', lat: 6.6828, lng: 80.3992 },
      { id: 'dp-101-1', routeId: 'route-101', type: 'drop', name: 'Kottawa Highway Interchange', time: '12:00 PM', landmark: 'Exit Gate', lat: 6.8415, lng: 79.9654 },
      { id: 'dp-101-2', routeId: 'route-101', type: 'drop', name: 'Maharagama Bus Station', time: '12:15 PM', landmark: 'High Level Road', lat: 6.8480, lng: 79.9265 },
      { id: 'dp-101-3', routeId: 'route-101', type: 'drop', name: 'Colombo Fort Central Bus Stand', time: '12:30 PM', landmark: 'Main Entrance', lat: 6.9344, lng: 79.8530 },

      { id: 'bp-102-1', routeId: 'route-102', type: 'boarding', name: 'Colombo Fort Bus Terminal', time: '09:30 PM', landmark: 'Bastian Mawatha Gate', lat: 6.9344, lng: 79.8530 },
      { id: 'bp-102-2', routeId: 'route-102', type: 'boarding', name: 'Kottawa Interchange', time: '10:15 PM', landmark: 'Expressway Entrance', lat: 6.8415, lng: 79.9654 },
      { id: 'dp-102-1', routeId: 'route-102', type: 'drop', name: 'Monaragala Main Bus Station', time: '03:30 AM', landmark: 'Platform 1', lat: 6.8722, lng: 81.3507 },

      { id: 'bp-103-1', routeId: 'route-103', type: 'boarding', name: 'Monaragala Main Bus Station', time: '01:30 PM', landmark: 'Platform 1', lat: 6.8722, lng: 81.3507 },
      { id: 'dp-103-1', routeId: 'route-103', type: 'drop', name: 'Colombo Fort Central Bus Stand', time: '07:30 PM', landmark: 'Main Entrance', lat: 6.9344, lng: 79.8530 },
    ];

    for (const bp of boardingPoints) {
      insertBoardingPoint.run(bp);
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

    database.prepare(`
      INSERT INTO bookings (id, pnr, routeId, operatorName, busNumber, busType, origin, destination,
        departureDate, departureTime, boardingPointId, dropPointId, seatIds, passengerName,
        passengerEmail, passengerPhone, passengerGender, passengerAge, baseFare, taxAmount,
        insuranceAmount, discountAmount, totalFare, promoCodeApplied, paymentMethod, paymentStatus,
        bookingStatus, qrCodeData, createdAt)
      VALUES (@id, @pnr, @routeId, @operatorName, @busNumber, @busType, @origin, @destination,
        @departureDate, @departureTime, @boardingPointId, @dropPointId, @seatIds, @passengerName,
        @passengerEmail, @passengerPhone, @passengerGender, @passengerAge, @baseFare, @taxAmount,
        @insuranceAmount, @discountAmount, @totalFare, @promoCodeApplied, @paymentMethod, @paymentStatus,
        @bookingStatus, @qrCodeData, @createdAt)
    `).run(demoBooking);

    // Mark L2A as booked in seats table
    database.prepare("UPDATE seats SET status = 'booked' WHERE id = 'route-101-L2A'").run();
  });

  seedAll();
  console.log('✅ Dewmina Super Line database seeded successfully.');
}
