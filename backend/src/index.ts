import express from 'express';
import cors from 'cors';
import { initDb } from './db/database';
import { routesRouter } from './routes/routesRouter';
import { bookingsRouter } from './routes/bookingsRouter';
import { seatsRouter } from './routes/seatsRouter';
import { validateRouter } from './routes/validateRouter';
import { authRouter } from './routes/authRouter';

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

app.use(express.json());

// ─── Initialize database on startup ──────────────────────────────────────────
initDb().catch((err) => {
  console.error('Failed to initialize Neon PostgreSQL database:', err);
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/routes', routesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/seats', seatsRouter);
app.use('/api/validate-ticket', validateRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'Neon Serverless PostgreSQL (ap-southeast-1)',
    version: '1.0.0',
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚌 OmniBus API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Database: Neon Serverless PostgreSQL\n`);
});

export default app;
