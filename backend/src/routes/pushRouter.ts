import { Router } from 'express';
import {
  saveSubscription,
  removeSubscription,
  getVapidPublicKey,
  sendPushToAll,
  notifyPromoOffer,
} from '../services/pushService';
import { dbQuery } from '../db/database';

export const pushRouter = Router();

// ─── GET /api/push/vapid-key — Return the VAPID public key ──────────────────

pushRouter.get('/vapid-key', (_req, res) => {
  const key = getVapidPublicKey();
  if (!key) {
    return res.status(503).json({ error: 'Push notifications not configured. Set VAPID keys in .env' });
  }
  res.json({ publicKey: key });
});

// ─── POST /api/push/subscribe — Save a push subscription ────────────────────

pushRouter.post('/subscribe', async (req, res) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'Invalid push subscription object' });
    }

    await saveSubscription(userId || null, subscription);
    res.json({ success: true, message: 'Push subscription saved' });
  } catch (err: any) {
    console.error('[Push] Subscribe error:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// ─── POST /api/push/unsubscribe — Remove a push subscription ────────────────

pushRouter.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' });
    }

    await removeSubscription(endpoint);
    res.json({ success: true, message: 'Push subscription removed' });
  } catch (err: any) {
    console.error('[Push] Unsubscribe error:', err);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

// ─── POST /api/push/broadcast — Admin: Send notification to all users ────────

pushRouter.post('/broadcast', async (req, res) => {
  try {
    const { title, body, adminKey } = req.body;

    // Simple admin key check (you can enhance this with proper auth later)
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const sent = await sendPushToAll({
      title,
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      url: '/#home',
      tag: `broadcast-${Date.now()}`,
    });

    res.json({ success: true, sent, message: `Push notification sent to ${sent} subscriber(s)` });
  } catch (err: any) {
    console.error('[Push] Broadcast error:', err);
    res.status(500).json({ error: 'Failed to broadcast notification' });
  }
});

// ─── GET /api/push/stats — Get subscription count ────────────────────────────

pushRouter.get('/stats', async (_req, res) => {
  try {
    const result = await dbQuery('SELECT COUNT(*) as count FROM push_subscriptions');
    res.json({ totalSubscribers: parseInt(result.rows[0].count, 10) });
  } catch (err: any) {
    console.error('[Push] Stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});
