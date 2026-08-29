import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbQuery, hashPassword, verifyPassword } from '../db/database';
import { sendAccountCreationEmail } from '../services/emailService';

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

    // Send account creation confirmation email (asynchronous to avoid blocking registration response)
    sendAccountCreationEmail({
      email: cleanEmail,
      name: cleanName,
      role: cleanRole,
      phone: cleanPhone || undefined,
    }).catch((err) => {
      console.error('[AuthRouter] Error triggering account creation email:', err);
    });

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
      message: 'Account created successfully! A confirmation email has been sent to your email address.',
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

    // 3. Verify strict role matching between requested login tab and actual user account role
    if (role === 'admin' && dbUser.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Your account does not have administrator privileges. Please switch to the "Passenger" tab to sign in.',
      });
    }

    if (role === 'passenger' && dbUser.role === 'admin') {
      return res.status(403).json({
        error: 'This is an Administrator account. Please switch to the "Admin & Staff" tab to sign in.',
      });
    }

    if (role && role !== dbUser.role) {
      return res.status(403).json({
        error: `Account role mismatch. This account is registered as ${dbUser.role.toUpperCase()}. Please select the correct login tab.`,
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
 * Helper to extract userId from Bearer token (format: token-<userId>-<timestamp>)
 */
function getUserIdFromToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  if (token.startsWith('token-')) {
    const raw = token.slice(6);
    const lastDash = raw.lastIndexOf('-');
    if (lastDash > 0) {
      return raw.slice(0, lastDash);
    }
    return raw;
  }
  return token;
}

/**
 * GET /api/auth/me
 * Fetch current user info by token
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req.headers.authorization);

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

const NAME_REGEX = /^[a-zA-Z\s.'-]+$/;

/**
 * PUT /api/auth/profile
 * Update user's name / username and phone number
 */
authRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication token missing or invalid.' });
    }

    const { name, phone } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({ error: 'Full name / username must be at least 3 characters long.' });
    }

    if (name.trim().length > 50) {
      return res.status(400).json({ error: 'Full name / username cannot exceed 50 characters.' });
    }

    if (!NAME_REGEX.test(name.trim())) {
      return res.status(400).json({ error: 'Name can only contain letters, spaces, dots, hyphens, and apostrophes.' });
    }

    const cleanName = name.trim();
    let cleanPhone = phone ? String(phone).trim() : null;
    if (cleanPhone) {
      const stripped = cleanPhone.replace(/[\s-]/g, '');
      if (!SL_PHONE_REGEX.test(stripped)) {
        return res.status(400).json({ error: 'Please enter a valid Sri Lankan mobile number (07XXXXXXXX).' });
      }
      cleanPhone = stripped.startsWith('0') ? `+94${stripped.substring(1)}` : stripped;
    }

    const updated = await dbQuery(
      `UPDATE users
       SET "name" = $1, "phone" = $2
       WHERE "id" = $3
       RETURNING "id", "name", "email", "role", "phone", "createdAt"`,
      [cleanName, cleanPhone, userId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    return res.json({
      success: true,
      message: 'Profile details updated successfully.',
      user: updated.rows[0],
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile due to a server error.' });
  }
});

/**
 * PUT /api/auth/change-password
 * Change current user's password
 */
authRouter.put('/change-password', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication token missing or invalid.' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ error: 'Current password is required.' });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    if (newPassword.length > 64) {
      return res.status(400).json({ error: 'New password cannot exceed 64 characters.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from the current password.' });
    }

    // Fetch current user password hash
    const result = await dbQuery(
      'SELECT "password" FROM users WHERE "id" = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const user = result.rows[0];
    const isMatch = verifyPassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password.' });
    }

    const newHashedPassword = hashPassword(newPassword);
    await dbQuery(
      'UPDATE users SET "password" = $1 WHERE "id" = $2',
      [newHashedPassword, userId]
    );

    return res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ error: 'Failed to change password due to a server error.' });
  }
});

/**
 * GET /api/auth/users
 * Fetch all registered users for Admin User Management Dashboard
 */
authRouter.get('/users', async (_req: Request, res: Response) => {
  try {
    const result = await dbQuery(
      `SELECT u.id, u.name, u.email, u.role, u.phone, u."createdAt",
              COUNT(b.id) as "totalBookings"
       FROM users u
       LEFT JOIN bookings b ON LOWER(u.email) = LOWER(b."passengerEmail")
       GROUP BY u.id, u.name, u.email, u.role, u.phone, u."createdAt"
       ORDER BY u."createdAt" DESC`
    );

    const users = result.rows.map((row) => ({
      ...row,
      totalBookings: parseInt(row.totalBookings || '0', 10),
    }));

    return res.json({
      success: true,
      totalCount: users.length,
      users,
    });
  } catch (error) {
    console.error('Error fetching registered users list:', error);
    return res.status(500).json({ error: 'Failed to fetch registered users list.' });
  }
});

/**
 * PUT /api/auth/users/:id/role
 * Admin endpoint to toggle or change user role (passenger <-> admin)
 */
authRouter.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'admin' && role !== 'passenger')) {
      return res.status(400).json({ error: 'Invalid role specified. Role must be "passenger" or "admin".' });
    }

    const updated = await dbQuery(
      `UPDATE users SET "role" = $1 WHERE "id" = $2 RETURNING "id", "name", "email", "role", "phone", "createdAt"`,
      [role, id]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    return res.json({
      success: true,
      message: `User role updated to ${role} successfully.`,
      user: updated.rows[0],
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
});

/**
 * DELETE /api/auth/users/:id
 * Admin endpoint to delete a registered user account
 */
authRouter.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await dbQuery('DELETE FROM users WHERE "id" = $1 RETURNING "id", "name", "email"', [id]);

    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found or already deleted.' });
    }

    return res.json({
      success: true,
      message: `User account (${deleted.rows[0].email}) deleted successfully.`,
      user: deleted.rows[0],
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return res.status(500).json({ error: 'Failed to delete user account.' });
  }
});



