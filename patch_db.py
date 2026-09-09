import re

with open('backend/src/db/database.ts', 'r') as f:
    content = f.read()

# 1. Update schema
content = content.replace(
    '"destination" TEXT NOT NULL,',
    '"destination" TEXT NOT NULL,\n      "departureDate" TEXT NOT NULL,'
)

# 2. Replace seedData function
new_seed = """export async function seedData(p: Pool): Promise<void> {
  const countRes = await p.query('SELECT COUNT(*) as c FROM routes');
  const count = parseInt(countRes.rows[0].c, 10);
  
  // We force a delete to reseed the calendar if old dummy data exists (route-100)
  if (count > 0) {
    const checkRes = await p.query('SELECT id FROM routes WHERE id = $1', ['route-100']);
    if (checkRes.rows.length > 0) {
       console.log('🔄 Cleaning up old dummy routes to seed 21-day calendar...');
       await p.query('DELETE FROM bookings');
       await p.query('DELETE FROM seats');
       await p.query('DELETE FROM boarding_points');
       await p.query('DELETE FROM routes');
    } else {
       return; // Already seeded the calendar
    }
  }

  console.log('📅 Seeding 21-Day Calendar Rotation into Neon PostgreSQL database...');

  const routes: any[] = [];
  const allSeats: any[] = [];
  const boardingPoints: any[] = [];
  
  const TICKET_PRICE = 1157.00;
  const BUS_TYPE = 'Normal Service (58 Seats 3*2)';
  
  // The exact 21-day rotation schedule (1-indexed for the array)
  // Day 1 to 21
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

  const BUSES = [
    { number: 'ND-2903', operatorId: 'op-dewmina', operatorName: 'Dewmina Super Line', anchorDate: new Date('2026-09-06T00:00:00Z') },
    { number: 'ND-3223', operatorId: 'op-dewmina', operatorName: 'Dewmina Super Line', anchorDate: new Date('2026-09-09T00:00:00Z') }
  ];

  // Let's generate from a slightly past date (so we have current/past data in demo) to 90 days ahead.
  // Actually, let's start from 2026-09-01
  const simStartDate = new Date('2026-09-01T00:00:00Z');
  
  for (let i = 0; i < 90; i++) {
    const currentDate = new Date(simStartDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = currentDate.toISOString().split('T')[0];

    for (const bus of BUSES) {
      // Calculate diff in days from anchor
      const diffTime = currentDate.getTime() - bus.anchorDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // % 21 but handle negative numbers properly
      const turnIndex = ((diffDays % 21) + 21) % 21;
      const turn = ROTATION[turnIndex];

      // Add Monaragala -> Colombo
      if (turn.out) {
        const routeId = `route-${bus.number}-OUT-${dateStr}`;
        routes.push({
          id: routeId,
          operatorId: bus.operatorId,
          operatorName: bus.operatorName,
          operatorRating: 4.8,
          busNumber: bus.number,
          busType: BUS_TYPE,
          origin: 'Monaragala',
          destination: 'Colombo',
          departureDate: dateStr,
          departureTime: turn.out,
          arrivalTime: 'N/A', // We can estimate later if needed
          duration: '6h 30m',
          priceStarting: TICKET_PRICE,
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
        const routeId = `route-${bus.number}-IN-${dateStr}`;
        routes.push({
          id: routeId,
          operatorId: bus.operatorId,
          operatorName: bus.operatorName,
          operatorRating: 4.8,
          busNumber: bus.number,
          busType: BUS_TYPE,
          origin: 'Colombo',
          destination: 'Monaragala',
          departureDate: dateStr,
          departureTime: turn.in,
          arrivalTime: 'N/A',
          duration: '6h 30m',
          priceStarting: TICKET_PRICE,
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
"""

start_idx = content.find('export async function seedData')
end_idx = content.find('export async function seedUsers')

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + new_seed + "\n" + content[end_idx:]
    with open('backend/src/db/database.ts', 'w') as f:
        f.write(content)
    print("Successfully patched database.ts")
else:
    print("Could not find seedData boundaries")

