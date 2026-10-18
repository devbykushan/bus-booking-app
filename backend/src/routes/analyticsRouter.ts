import { Router, Request, Response } from 'express';
import { getPool } from '../db/database';
import crypto from 'crypto';

export const analyticsRouter = Router();

// POST /api/analytics/visit - Track a new website visit
analyticsRouter.post('/visit', async (req: Request, res: Response) => {
  try {
    const { source, referrer, isMobile, screenWidth, path } = req.body || {};

    const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const today = new Date().toISOString().split('T')[0];
    
    // Anonymized daily IP hash to count unique daily visitors without storing raw personal IP
    const ipHash = crypto.createHash('sha256').update(`${rawIp}-${today}`).digest('hex').substring(0, 16);

    // Detect approximate location from proxy headers if available
    const city = (req.headers['x-vercel-ip-city'] as string) || 
                 (req.headers['cf-ipcity'] as string) || 
                 (req.headers['x-appengine-city'] as string) || 
                 'Sri Lanka';

    const pool = getPool();
    await pool.query(
      `INSERT INTO website_analytics ("source", "referrer", "isMobile", "screenWidth", "city", "ipHash", "path")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        source || 'Direct',
        referrer || 'Direct',
        typeof isMobile === 'boolean' ? isMobile : true,
        screenWidth || 390,
        city,
        ipHash,
        path || '/'
      ]
    );

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[Analytics] Error tracking visit:', error?.message);
    res.status(200).json({ success: false, error: 'Tracking failed gracefully' });
  }
});

// GET /api/analytics/stats - Retrieve aggregated visitor metrics for Super Admin Dashboard
analyticsRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const pool = getPool();

    // 1. Today's metrics (Midnight to now in Sri Lanka UTC+5:30)
    const todayResult = await pool.query(`
      SELECT 
        COUNT(*)::int AS "totalToday",
        COUNT(DISTINCT "ipHash")::int AS "uniqueToday"
      FROM website_analytics
      WHERE "createdAt" >= CURRENT_DATE
    `);

    // 2. All-time total visits
    const totalResult = await pool.query(`
      SELECT 
        COUNT(*)::int AS "totalAllTime",
        COUNT(DISTINCT "ipHash")::int AS "uniqueAllTime"
      FROM website_analytics
    `);

    // 3. Traffic sources breakdown (Last 30 days)
    const sourcesResult = await pool.query(`
      SELECT 
        "source",
        COUNT(*)::int AS "count"
      FROM website_analytics
      WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY "source"
      ORDER BY "count" DESC
      LIMIT 8
    `);

    // 4. Device breakdown (Mobile vs Desktop)
    const devicesResult = await pool.query(`
      SELECT 
        CASE WHEN "isMobile" = TRUE THEN 'Mobile' ELSE 'Desktop / Tablet' END AS "device",
        COUNT(*)::int AS "count"
      FROM website_analytics
      WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY "device"
    `);

    // 5. Last 7 Days trend
    const trendResult = await pool.query(`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') AS "date",
        COUNT(*)::int AS "visits",
        COUNT(DISTINCT "ipHash")::int AS "uniqueVisitors"
      FROM website_analytics
      WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY "date" ASC
    `);

    // 6. Recent 15 real-time visits
    const recentResult = await pool.query(`
      SELECT 
        "id",
        "source",
        "referrer",
        "isMobile",
        "city",
        "path",
        "createdAt"
      FROM website_analytics
      ORDER BY "createdAt" DESC
      LIMIT 15
    `);

    const totalToday = todayResult.rows[0]?.totalToday || 0;
    const uniqueToday = todayResult.rows[0]?.uniqueToday || 0;
    const totalAllTime = totalResult.rows[0]?.totalAllTime || 0;
    const uniqueAllTime = totalResult.rows[0]?.uniqueAllTime || 0;

    res.json({
      summary: {
        totalToday,
        uniqueToday,
        totalAllTime,
        uniqueAllTime,
      },
      sources: sourcesResult.rows,
      devices: devicesResult.rows,
      trend: trendResult.rows,
      recent: recentResult.rows,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Analytics] Error retrieving stats:', error?.message);
    res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
});
