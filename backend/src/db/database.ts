import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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
      operatorRating REAL NOT NULL DEFAULT 4.5,
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
  const totalRows = busType.includes('Sleeper') ? 6 : 10;
  const basePrice = busType.includes('Sleeper') ? 45 : 30;

  for (const deck of hasUpperDeck ? ['lower', 'upper'] : ['lower']) {
    for (let r = 1; r <= totalRows; r++) {
      const cols = busType.includes('Sleeper') ? [1, 2, 4] : [1, 2, 4, 5];
      for (const c of cols) {
        const isLower = deck === 'lower';
        const isFemaleOnly = isLower && (r === 2 || r === 3) && (c === 1 || c === 2) ? 1 : 0;
        const prefix = deck === 'lower' ? 'L' : 'U';
        const seatNum = `${prefix}${r}${String.fromCharCode(64 + c)}`;
        // Pre-book a couple of seats for realism
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
          price: deck === 'upper' ? basePrice + 5 : basePrice,
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

  console.log('🌱 Seeding database with initial data...');

  const routes = [
    {
      id: 'route-101',
      operatorId: 'op-express',
      operatorName: 'OmniExpress Lines',
      operatorRating: 4.8,
      busNumber: 'OMNI-9082',
      busType: 'AC Sleeper',
      origin: 'New York, NY',
      destination: 'Boston, MA',
      departureTime: '08:30 AM',
      arrivalTime: '01:15 PM',
      duration: '4h 45m',
      priceStarting: 45,
      hasUpperDeck: 1,
      amenities: JSON.stringify(['Wi-Fi', 'Power Outlet', 'Reclining Sleeper', 'Water Bottle', 'Live GPS', 'Blanket']),
      gpsLat: 41.3083,
      gpsLng: -72.9279,
      gpsSpeedKmH: 85,
      gpsCurrentStop: 'New Haven Transit Stop',
      gpsNextStop: 'Hartford Union Station',
      gpsEtaMinutes: 125,
    },
    {
      id: 'route-102',
      operatorId: 'op-royal',
      operatorName: 'Royal Cruiser Travels',
      operatorRating: 4.6,
      busNumber: 'RC-4011',
      busType: 'Luxury Volvo Multi-Axle',
      origin: 'Los Angeles, CA',
      destination: 'San Francisco, CA',
      departureTime: '09:00 PM',
      arrivalTime: '05:30 AM',
      duration: '8h 30m',
      priceStarting: 38,
      hasUpperDeck: 0,
      amenities: JSON.stringify(['Wi-Fi', 'Charging Port', 'Leg Rest', 'Restroom', 'Live Tracking']),
      gpsLat: 35.3733,
      gpsLng: -119.0187,
      gpsSpeedKmH: 100,
      gpsCurrentStop: 'Bakersfield Rest Area',
      gpsNextStop: 'Fresno Transit Hub',
      gpsEtaMinutes: 240,
    },
    {
      id: 'route-103',
      operatorId: 'op-city',
      operatorName: 'City Connect Air Bus',
      operatorRating: 4.9,
      busNumber: 'CC-7721',
      busType: 'Double Decker Sleeper',
      origin: 'Chicago, IL',
      destination: 'Detroit, MI',
      departureTime: '02:00 PM',
      arrivalTime: '07:15 PM',
      duration: '5h 15m',
      priceStarting: 42,
      hasUpperDeck: 1,
      amenities: JSON.stringify(['Wi-Fi', 'Individual Screens', 'Coffee Dispenser', 'Reclining Sleeper', 'Live GPS']),
      gpsLat: 41.6820,
      gpsLng: -86.2520,
      gpsSpeedKmH: 92,
      gpsCurrentStop: 'South Bend Hub',
      gpsNextStop: 'Kalamazoo Terminal',
      gpsEtaMinutes: 110,
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

    // Boarding & drop points
    const boardingPoints = [
      { id: 'bp-101-1', routeId: 'route-101', type: 'boarding', name: 'Port Authority Bus Terminal', time: '08:15 AM', landmark: 'Gate 22, 8th Ave', lat: 40.7570, lng: -73.9902 },
      { id: 'bp-101-2', routeId: 'route-101', type: 'boarding', name: 'Queens Plaza Station', time: '08:30 AM', landmark: 'Subway Exit 3', lat: 40.7505, lng: -73.9401 },
      { id: 'dp-101-1', routeId: 'route-101', type: 'drop', name: 'South Station Terminal', time: '01:00 PM', landmark: 'Platform 4', lat: 42.3523, lng: -71.0552 },
      { id: 'dp-101-2', routeId: 'route-101', type: 'drop', name: 'Back Bay Station', time: '01:15 PM', landmark: 'Dartmouth St Entrance', lat: 42.3474, lng: -71.0754 },

      { id: 'bp-102-1', routeId: 'route-102', type: 'boarding', name: 'Union Station Amtrak/Bus Plaza', time: '08:45 PM', landmark: 'Bay 6', lat: 34.0562, lng: -118.2365 },
      { id: 'bp-102-2', routeId: 'route-102', type: 'boarding', name: 'North Hollywood Station', time: '09:15 PM', landmark: 'Lankershim Blvd', lat: 34.1685, lng: -118.3768 },
      { id: 'dp-102-1', routeId: 'route-102', type: 'drop', name: 'Salesforce Transit Center', time: '05:15 AM', landmark: 'Level 3 Bus Deck', lat: 37.7897, lng: -122.3972 },

      { id: 'bp-103-1', routeId: 'route-103', type: 'boarding', name: 'Union Station Canal St', time: '01:45 PM', landmark: 'Jackson Blvd Gate', lat: 41.8786, lng: -87.6403 },
      { id: 'dp-103-1', routeId: 'route-103', type: 'drop', name: 'Detroit Rosa Parks Transit Center', time: '07:15 PM', landmark: 'Bay 12', lat: 42.3314, lng: -83.0458 },
    ];

    for (const bp of boardingPoints) {
      insertBoardingPoint.run(bp);
    }

    // Seed one demo booking
    const demoBooking = {
      id: 'BK-89021',
      pnr: 'OMNI-89021',
      routeId: 'route-101',
      operatorName: 'OmniExpress Lines',
      busNumber: 'OMNI-9082',
      busType: 'AC Sleeper',
      origin: 'New York, NY',
      destination: 'Boston, MA',
      departureDate: '2026-08-20',
      departureTime: '08:30 AM',
      boardingPointId: 'bp-101-1',
      dropPointId: 'dp-101-1',
      seatIds: JSON.stringify(['route-101-L2A']),
      passengerName: 'Sarah Jenkins',
      passengerEmail: 'sarah.j@example.com',
      passengerPhone: '+1 (555) 234-5678',
      passengerGender: 'female',
      passengerAge: 28,
      baseFare: 45.00,
      taxAmount: 4.50,
      insuranceAmount: 1.50,
      discountAmount: 5.00,
      totalFare: 46.00,
      promoCodeApplied: 'BUS2026',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      bookingStatus: 'confirmed',
      qrCodeData: 'OMNI-89021|Sarah Jenkins|route-101-L2A|New York->Boston',
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
  console.log('✅ Database seeded successfully.');
}
