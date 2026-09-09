import { Router } from 'express';
import { getPool, generateTripsFromTimetables } from '../db/database';

const router = Router();

// GET all timetables
router.get('/', async (req, res) => {
  try {
    const p = getPool();
    const result = await p.query('SELECT * FROM timetables ORDER BY "busNumber"');
    const parsedRows = result.rows.map(row => ({
      ...row,
      pattern: typeof row.pattern === 'string' ? JSON.parse(row.pattern) : row.pattern
    }));
    res.json(parsedRows);
  } catch (error: any) {
    console.error('Error fetching timetables:', error);
    res.status(500).json({ error: 'Failed to fetch timetables.' });
  }
});

// POST new timetable
router.post('/', async (req, res) => {
  const { busNumber, operatorId, operatorName, busType, price, anchorDate, pattern } = req.body;
  if (!busNumber || !pattern) {
    return res.status(400).json({ error: 'busNumber and pattern are required.' });
  }

  try {
    const p = getPool();
    const id = `tt-${Date.now()}`;
    await p.query(`
      INSERT INTO timetables ("id", "busNumber", "operatorId", "operatorName", "busType", "price", "anchorDate", "pattern")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, busNumber, operatorId || 'op-default', operatorName || 'Default Operator', busType || 'Normal Service (58 Seats 3*2)', Number(price) || 1157, anchorDate || new Date().toISOString(), JSON.stringify(pattern)]);
    
    const result = await p.query('SELECT * FROM timetables WHERE id = $1', [id]);
    const saved = result.rows[0];
    saved.pattern = typeof saved.pattern === 'string' ? JSON.parse(saved.pattern) : saved.pattern;
    res.status(201).json(saved);
  } catch (error: any) {
    console.error('Error creating timetable:', error);
    res.status(500).json({ error: 'Failed to create timetable.' });
  }
});

// PUT update timetable
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { busNumber, operatorId, operatorName, busType, price, anchorDate, pattern } = req.body;
  
  try {
    const p = getPool();
    await p.query(`
      UPDATE timetables 
      SET "busNumber" = $1, "operatorId" = $2, "operatorName" = $3, "busType" = $4, "price" = $5, "anchorDate" = $6, "pattern" = $7
      WHERE id = $8
    `, [busNumber, operatorId, operatorName, busType, Number(price), anchorDate, JSON.stringify(pattern), id]);
    
    const result = await p.query('SELECT * FROM timetables WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Timetable not found.' });
    }
    const updated = result.rows[0];
    updated.pattern = typeof updated.pattern === 'string' ? JSON.parse(updated.pattern) : updated.pattern;
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating timetable:', error);
    res.status(500).json({ error: 'Failed to update timetable.' });
  }
});

// DELETE timetable
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const p = getPool();
    await p.query('DELETE FROM timetables WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting timetable:', error);
    res.status(500).json({ error: 'Failed to delete timetable.' });
  }
});

// POST generate trips
router.post('/generate', async (req, res) => {
  try {
    const p = getPool();
    
    // Check for booked routes in the future to avoid deleting them if necessary.
    // For simplicity, this cleans up unbooked routes in the future and regenerates.
    
    console.log('🔄 Cleaning up unbooked future routes to regenerate timetable calendar...');
    await p.query(`
      DELETE FROM seats 
      WHERE "routeId" IN (
        SELECT "id" FROM routes 
        WHERE "departureDate" >= CURRENT_DATE 
        AND "id" NOT IN (SELECT "routeId" FROM bookings)
      )
    `);
    
    await p.query(`
      DELETE FROM boarding_points 
      WHERE "routeId" IN (
        SELECT "id" FROM routes 
        WHERE "departureDate" >= CURRENT_DATE 
        AND "id" NOT IN (SELECT "routeId" FROM bookings)
      )
    `);
    
    await p.query(`
      DELETE FROM routes 
      WHERE "departureDate" >= CURRENT_DATE 
      AND "id" NOT IN (SELECT "routeId" FROM bookings)
    `);

    await generateTripsFromTimetables(p);
    
    res.json({ success: true, message: 'Trips successfully synchronized from timetables.' });
  } catch (error: any) {
    console.error('Error generating trips:', error);
    res.status(500).json({ error: 'Failed to generate trips.' });
  }
});

export default router;
