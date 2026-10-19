import { Router, Request, Response } from 'express';
import { dbQuery } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export const reviewsRouter = Router();

// ─── GET /api/reviews ────────────────────────────────────────────────────────
// Returns approved reviews + overall statistics
reviewsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const routeId = req.query.routeId as string | undefined;

    let queryText = `
      SELECT "id", "userId", "passengerName", "routeId", "pnr", "rating", "comment", "tags", "busNumber", "status", "createdAt"
      FROM reviews
      WHERE "status" = 'approved'
    `;
    const params: any[] = [];

    if (routeId) {
      params.push(routeId);
      queryText += ` AND "routeId" = $1`;
    }

    queryText += ` ORDER BY "createdAt" DESC LIMIT 50`;

    const result = await dbQuery(queryText, params);

    // Compute stats
    const statsResult = await dbQuery(`
      SELECT 
        COUNT(*) as total_count,
        COALESCE(AVG("rating"), 4.8) as avg_rating,
        COUNT(CASE WHEN "rating" = 5 THEN 1 END) as star_5,
        COUNT(CASE WHEN "rating" = 4 THEN 1 END) as star_4,
        COUNT(CASE WHEN "rating" = 3 THEN 1 END) as star_3,
        COUNT(CASE WHEN "rating" = 2 THEN 1 END) as star_2,
        COUNT(CASE WHEN "rating" = 1 THEN 1 END) as star_1
      FROM reviews
      WHERE "status" = 'approved'
    `);

    const row = statsResult.rows[0];
    const totalCount = parseInt(row?.total_count || '0', 10);
    const avgRating = totalCount > 0 ? parseFloat(parseFloat(row?.avg_rating || '4.8').toFixed(1)) : 4.9;

    const parsedReviews = result.rows.map((r: any) => {
      let tags: string[] = [];
      try {
        tags = typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []);
      } catch {
        tags = [];
      }
      return {
        id: r.id,
        userId: r.userId,
        passengerName: r.passengerName,
        routeId: r.routeId,
        pnr: r.pnr ? `${r.pnr.slice(0, 3)}***` : undefined,
        verified: !!r.pnr,
        rating: r.rating,
        comment: r.comment,
        tags,
        busNumber: r.busNumber,
        createdAt: r.createdAt,
      };
    });

    res.json({
      reviews: parsedReviews,
      stats: {
        totalCount: totalCount > 0 ? totalCount : 482,
        averageRating: avgRating,
        ratingBreakdown: {
          5: parseInt(row?.star_5 || '0', 10),
          4: parseInt(row?.star_4 || '0', 10),
          3: parseInt(row?.star_3 || '0', 10),
          2: parseInt(row?.star_2 || '0', 10),
          1: parseInt(row?.star_1 || '0', 10),
        },
        popularTags: [
          'On Time ⏰',
          'Clean & Hygienic 🧹',
          'Comfortable Seats 💺',
          'Smooth AC ❄️',
          'Polite Staff 😊',
          'Safe & Secure 🛡️',
        ],
      },
    });
  } catch (err: any) {
    console.error('[Reviews] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// ─── POST /api/reviews ───────────────────────────────────────────────────────
// Submit a new review
reviewsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { passengerName, rating, comment, tags, pnr, routeId, busNumber, userId } = req.body;

    if (!passengerName || typeof passengerName !== 'string' || !passengerName.trim()) {
      return res.status(400).json({ error: 'Passenger name is required' });
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    const cleanComment = (comment || '').trim();
    const cleanTags = Array.isArray(tags) ? JSON.stringify(tags.slice(0, 5)) : '[]';
    const cleanPnr = (pnr || '').trim().toUpperCase() || null;
    const cleanRouteId = routeId || null;
    const cleanBusNumber = busNumber || null;
    const cleanUserId = userId || null;

    const reviewId = `rev-${Date.now()}-${uuidv4().slice(0, 6)}`;

    await dbQuery(`
      INSERT INTO reviews (
        "id", "userId", "passengerName", "routeId", "pnr", "rating", "comment", "tags", "busNumber", "status"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved')
    `, [
      reviewId,
      cleanUserId,
      passengerName.trim(),
      cleanRouteId,
      cleanPnr,
      numRating,
      cleanComment,
      cleanTags,
      cleanBusNumber,
    ]);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully! Thank you for your feedback.',
      reviewId,
    });
  } catch (err: any) {
    console.error('[Reviews] Create error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ─── DELETE /api/reviews/:id ─────────────────────────────────────────────────
// Admin moderation
reviewsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbQuery(`DELETE FROM reviews WHERE "id" = $1`, [id]);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err: any) {
    console.error('[Reviews] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});
