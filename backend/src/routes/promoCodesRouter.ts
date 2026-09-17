import { Router, Request, Response } from 'express';
import { getPool } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export const promoCodesRouter = Router();

// ─── GET /api/promo-codes — List all promo codes (Admin) ────────────────────
promoCodesRouter.get('/', async (_req: Request, res: Response) => {
  const pool = getPool();
  try {
    const result = await pool.query('SELECT * FROM promo_codes ORDER BY "createdAt" DESC');
    res.json({ success: true, promoCodes: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/promo-codes — Create a new promo code (Admin) ────────────────
promoCodesRouter.post('/', async (req: Request, res: Response) => {
  const pool = getPool();
  const { code, discountPercent, maxDiscount, validUntil, maxUsage } = req.body;

  if (!code || !discountPercent) {
    res.status(400).json({ success: false, error: 'Promo code and discount percent are required.' });
    return;
  }

  const cleanCode = String(code).trim().toUpperCase();
  const percent = Number(discountPercent);

  if (isNaN(percent) || percent <= 0 || percent > 100) {
    res.status(400).json({ success: false, error: 'Discount percent must be between 1 and 100.' });
    return;
  }

  try {
    const id = `promo-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    await pool.query(`
      INSERT INTO promo_codes ("id", "code", "discountPercent", "maxDiscount", "validUntil", "maxUsage", "isActive", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
      ON CONFLICT ("code") DO UPDATE
      SET "discountPercent" = EXCLUDED."discountPercent",
          "maxDiscount" = EXCLUDED."maxDiscount",
          "validUntil" = EXCLUDED."validUntil",
          "maxUsage" = EXCLUDED."maxUsage",
          "isActive" = TRUE
    `, [id, cleanCode, percent, maxDiscount ? Number(maxDiscount) : null, validUntil || null, maxUsage ? Number(maxUsage) : null, now]);

    res.status(201).json({ success: true, message: `Promo code ${cleanCode} created successfully!` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PATCH /api/promo-codes/:id/toggle — Toggle active state (Admin) ────────
promoCodesRouter.patch('/:id/toggle', async (req: Request, res: Response) => {
  const pool = getPool();
  const { id } = req.params;

  try {
    const check = await pool.query('SELECT "isActive" FROM promo_codes WHERE "id" = $1', [id]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Promo code not found.' });
      return;
    }

    const currentStatus = check.rows[0].isActive;
    await pool.query('UPDATE promo_codes SET "isActive" = $1 WHERE "id" = $2', [!currentStatus, id]);

    res.json({ success: true, message: `Promo code status updated to ${!currentStatus ? 'Active' : 'Inactive'}.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/promo-codes/:id — Delete promo code (Admin) ────────────────
promoCodesRouter.delete('/:id', async (req: Request, res: Response) => {
  const pool = getPool();
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM promo_codes WHERE "id" = $1', [id]);
    res.json({ success: true, message: 'Promo code deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/promo-codes/validate — Validate promo code on Checkout ────────
promoCodesRouter.post('/validate', async (req: Request, res: Response) => {
  const pool = getPool();
  const { code, totalFare } = req.body;

  if (!code) {
    res.status(400).json({ success: false, error: 'Promo code is required.' });
    return;
  }

  const cleanCode = String(code).trim().toUpperCase();

  try {
    const result = await pool.query('SELECT * FROM promo_codes WHERE "code" = $1 AND "isActive" = TRUE', [cleanCode]);
    const promo = result.rows[0];

    if (!promo) {
      res.status(404).json({ success: false, error: 'Invalid or inactive promo code.' });
      return;
    }

    if (promo.validUntil && new Date(promo.validUntil).getTime() < Date.now()) {
      res.status(400).json({ success: false, error: 'This promo code has expired.' });
      return;
    }

    if (promo.maxUsage && promo.usageCount >= promo.maxUsage) {
      res.status(400).json({ success: false, error: 'This promo code usage limit has been reached.' });
      return;
    }

    const fare = Number(totalFare || 0);
    let discount = (fare * Number(promo.discountPercent)) / 100;
    if (promo.maxDiscount && discount > Number(promo.maxDiscount)) {
      discount = Number(promo.maxDiscount);
    }

    res.json({
      success: true,
      code: promo.code,
      discountPercent: promo.discountPercent,
      discountAmount: Math.round(discount),
      message: `${promo.discountPercent}% discount applied successfully!`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
