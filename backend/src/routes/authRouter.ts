import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbQuery, hashPassword, verifyPassword } from '../db/database';

export const authRouter = Router();

// Validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SL_PHONE_REGEX = /^(?:0|\+94)7\d{8}$/;

/**
 * POST /api/auth/register
 * Register a new user account with Neon PostgreSQL validation
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'passenger', phone } = req.body;

    // 1. Input validations
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({ error: 'Full name must be at least 3 characters long.' });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanRole = role === 'admin' ? 'admin' : 'passenger';
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    let cleanPhone = phone ? phone.trim() : null;
    if (cleanPhone) {
      const stripped = cleanPhone.replace(/[\s-]/g, '');
      if (!SL_PHONE_REGEX.test(stripped)) {
        return res.status(400).json({ error: 'Please enter a valid Sri Lankan mobile number (07XXXXXXXX).' });
      }
      cleanPhone = stripped.startsWith('0') ? `+94${stripped.substring(1)}` : stripped;
    }

    // 2. Check for duplicate email in Neon DB
    const existing = await dbQuery(
      'SELECT "id" FROM users WHERE LOWER("email") = $1',
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'An account with this email address already exists. Please sign in instead.',
      });
    }

    // 3. Hash password and insert record
    const userId = `usr-${Date.now()}-${uuidv4().substring(0, 6)}`;
    const hashedPassword = hashPassword(password);
    const createdAt = new Date().toISOString();

    await dbQuery(
      `INSERT INTO users ("id", "name", "email", "password", "role", "phone", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, cleanName, cleanEmail, hashedPassword, cleanRole, cleanPhone, createdAt]
    );

    const token = `token-${userId}-${Date.now()}`;
    const user = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      role: cleanRole,
      phone: cleanPhone,
      createdAt,
    };

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user,
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ error: 'Failed to complete registration due to a server error.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user with email and password against Neon DB
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch user by email
    const result = await dbQuery(
      'SELECT "id", "name", "email", "password", "role", "phone", "createdAt" FROM users WHERE LOWER("email") = $1',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const dbUser = result.rows[0];

    // 2. Verify password hash
    const isMatch = verifyPassword(password, dbUser.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. Verify role if requested
    if (role === 'admin' && dbUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Your account does not have administrator privileges.',
      });
    }

    const token = `token-${dbUser.id}-${Date.now()}`;
    const user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      phone: dbUser.phone,
      createdAt: dbUser.createdAt,
    };

    return res.json({
      success: true,
      message: `Signed in successfully as ${user.role}.`,
      token,
      user,
    });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ error: 'Failed to sign in due to a server error.' });
  }
});

/**
 * GET /api/auth/me
 * Fetch current user info by token or ID
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing.' });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const parts = token.split('-');
    const userId = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : null;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    const result = await dbQuery(
      'SELECT "id", "name", "email", "role", "phone", "createdAt" FROM users WHERE "id" = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

