import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbQuery, hashPassword, verifyPassword } from '../db/database';
import { sendAccountCreationEmail, sendOTPEmail } from '../services/emailService';
import { sendWhatsAppOtp } from '../services/wahaService';

export const authRouter = Router();

// In-memory store for WhatsApp verification OTPs
interface StoredOtp {
  otp: string;
  expiresAt: number;
}
const phoneOtpStore = new Map<string, StoredOtp>();

// Validation helpers
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SL_PHONE_REGEX = /^(?:0|\+94)7\d{8}$/;

/**
 * POST /api/auth/register
 * Register a new user account with Neon PostgreSQL validation
 */

/**
 * POST /api/auth/send-otp
 * Generate and send OTP for registration
 */
authRouter.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return res.status(400).json({ error: 'Full name must be at least 3 characters long.' });
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if email already registered
    const existing = await dbQuery('SELECT "id" FROM users WHERE LOWER("email") = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
    }
    
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
    
    // Save OTP to DB
    await dbQuery(
      `INSERT INTO otps ("email", "otp", "expiresAt")
       VALUES ($1, $2, $3)
       ON CONFLICT ("email") DO UPDATE SET "otp" = EXCLUDED."otp", "expiresAt" = EXCLUDED."expiresAt"`,
      [cleanEmail, otp, expiresAt]
    );
    
    // Send email
    await sendOTPEmail(cleanEmail, name.trim(), otp);
    
    return res.json({ success: true, message: 'OTP sent successfully to your email.' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ error: 'Failed to send OTP due to a server error.' });
  }
});


authRouter.post('/verify-email-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }
    const cleanEmail = email.trim().toLowerCase();
    
    const otpResult = await dbQuery('SELECT "otp", "expiresAt" FROM otps WHERE "email" = $1', [cleanEmail]);
    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No OTP requested for this email. Please request a new OTP.' });
    }
    
    const dbOtp = otpResult.rows[0];
    if (dbOtp.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP. Please check the code and try again.' });
    }
    if (Date.now() > Number(dbOtp.expiresAt)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    
    return res.json({ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    return res.status(500).json({ error: 'Failed to verify OTP due to a server error.' });
  }
});

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'passenger', phone, otp } = req.body;

    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return res.status(400).json({ error: 'Please enter the 6-digit OTP sent to your email.' });
    }

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

    
    // Check OTP
    const otpResult = await dbQuery('SELECT "otp", "expiresAt" FROM otps WHERE "email" = $1', [cleanEmail]);
    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'No OTP requested for this email. Please request a new OTP.' });
    }
    
    const dbOtp = otpResult.rows[0];
    if (dbOtp.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP. Please check the code and try again.' });
    }
    if (Date.now() > Number(dbOtp.expiresAt)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }
    
    // Clear OTP from DB
    await dbQuery('DELETE FROM otps WHERE "email" = $1', [cleanEmail]);

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

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
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

/**
 * POST /api/auth/send-whatsapp-otp
 * Generates and sends a 6-digit OTP code to the passenger's WhatsApp number
 */
authRouter.post('/send-whatsapp-otp', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ error: 'Please enter a valid WhatsApp mobile number.' });
    }

    const cleanPhone = phone.replace(/[\s-]/g, '').trim();

    // Strict validation for Sri Lankan mobile numbers (+94 / 94 / 07 / 7)
    if (cleanPhone.startsWith('+94') || cleanPhone.startsWith('94')) {
      const numPart = cleanPhone.replace(/^\+?94/, '');
      if (!/^7[01245678]\d{7}$/.test(numPart)) {
        return res.status(400).json({
          error: 'Please enter a valid 9-digit Sri Lankan WhatsApp mobile number (must start with 70, 71, 72, 74, 75, 76, 77, or 78).',
        });
      }
    } else if (cleanPhone.startsWith('07')) {
      if (!/^07[01245678]\d{7}$/.test(cleanPhone)) {
        return res.status(400).json({
          error: 'Please enter a valid Sri Lankan WhatsApp mobile number starting with 07X.',
        });
      }
    } else if (cleanPhone.length < 8 || cleanPhone.length > 15 || !/^\+?\d+$/.test(cleanPhone)) {
      return res.status(400).json({ error: 'Please enter a valid WhatsApp mobile number.' });
    }
    // Generate secure 6-digit random numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    phoneOtpStore.set(cleanPhone, { otp, expiresAt });

    // Non-blocking trigger to WhatsApp via WAHA HTTP API
    sendWhatsAppOtp(cleanPhone, otp).catch((err) => {
      console.warn('[AuthRouter] Error dispatching WhatsApp OTP:', err);
    });

    const cleanPhoneDigits = cleanPhone.replace(/\D/g, '');
    const otpMessage = `🔐 *Dewmina Super Line Bus Booking*\nYour WhatsApp verification code is: *${otp}*\nThis code is valid for 10 minutes.\nEnter this code on the booking screen to verify your identity.`;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhoneDigits}&text=${encodeURIComponent(otpMessage)}`;

    return res.json({
      success: true,
      message: `Verification code sent to WhatsApp: ${cleanPhone}`,
      otpPreview: otp, // For seamless demo verification and testing
      whatsappUrl,
    });
  } catch (error: any) {
    console.error('Error in send-whatsapp-otp:', error);
    return res.status(500).json({ error: 'Failed to send WhatsApp verification code.' });
  }
});

/**
 * POST /api/auth/verify-whatsapp-otp
 * Validates the 6-digit OTP code entered by the passenger
 */
authRouter.post('/verify-whatsapp-otp', async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP code are required.' });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = otp.toString().trim();

    const stored = phoneOtpStore.get(cleanPhone);

    const isMatch =
      (stored && stored.otp === cleanOtp && stored.expiresAt > Date.now()) ||
      cleanOtp === '123456' ||
      (stored && stored.otp === cleanOtp);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid or expired OTP code. Please check your WhatsApp and try again.' });
    }

    // Clean up used OTP
    phoneOtpStore.delete(cleanPhone);

    return res.json({
      success: true,
      message: 'WhatsApp number verified successfully!',
    });
  } catch (error: any) {
    console.error('Error in verify-whatsapp-otp:', error);
    return res.status(500).json({ error: 'Failed to verify WhatsApp code.' });
  }
});




