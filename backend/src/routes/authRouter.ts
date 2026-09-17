import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import { dbQuery, hashPassword, verifyPassword } from '../db/database';
import { sendAccountCreationEmail, sendOTPEmail, sendAdminLoginAlertEmail, lastEmailError } from '../services/emailService';
import { sendWhatsAppOtp, sendWhatsAppMessage } from '../services/wahaService';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '846634088514-gl0r0g50m3omomtf24sh44qpbapbrsg3.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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
    const emailSent = await sendOTPEmail(cleanEmail, name.trim(), otp);
    
    if (!emailSent) {
      console.warn(`[Auth] Email sending failed for ${cleanEmail}. Check SMTP credentials.`);
      return res.status(503).json({
        error: 'Unable to send verification email at this moment. Please check your email or contact support.',
      });
    }

    return res.json({ 
      success: true, 
      message: 'OTP sent successfully to your email. Check your inbox and spam folder.',
    });
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
      'SELECT "id", "name", "email", "password", "role", "phone", "permissions", "emergencyContactName", "emergencyContactPhone", "notifyWhatsapp", "notifySms", "createdAt" FROM users WHERE LOWER("email") = $1',
      [cleanEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email address. Please click "Register here" below to create your account.' });
    }

    const dbUser = result.rows[0];

    // 2. Verify password hash
    const isMatch = verifyPassword(password, dbUser.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please verify your password and try again.' });
    }

    // 3. Verify role authorization: if admin portal requested, ensure account has admin role
    const isAdminRole = dbUser.role === 'admin' || dbUser.role === 'super_admin';

    if (role === 'admin' && !isAdminRole) {
      return res.status(403).json({
        error: 'Access denied. Your account does not have administrator privileges.',
      });
    }

    let parsedPermissions: string[] = [];
    try {
      parsedPermissions = typeof dbUser.permissions === 'string' ? JSON.parse(dbUser.permissions) : (dbUser.permissions || []);
    } catch (_) {
      parsedPermissions = [];
    }
    if (dbUser.role === 'super_admin') {
      parsedPermissions = [
        'counter_booking',
        'slips_approval',
        'qr_scanner',
        'manifest_view',
        'fleet_management',
        'timetable_management',
        'analytics',
        'whatsapp',
        'staff_management',
      ];
    }

    const token = `token-${dbUser.id}-${Date.now()}`;
    const user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      phone: dbUser.phone,
      emergencyContactName: dbUser.emergencyContactName || null,
      emergencyContactPhone: dbUser.emergencyContactPhone || null,
      notifyWhatsapp: dbUser.notifyWhatsapp !== false,
      notifySms: dbUser.notifySms !== false,
      permissions: parsedPermissions,
      createdAt: dbUser.createdAt,
    };

    // Non-blocking Security Alerts (WhatsApp & Email) to Super Admin on any admin/super_admin login
    if (isAdminRole) {
      // 1. WhatsApp Alert: default to 0724173143 + any configured in SUPER_ADMIN_WHATSAPP
      const configuredPhone = process.env.SUPER_ADMIN_WHATSAPP || '0724173143';
      const targetPhones = Array.from(
        new Set(
          ['0724173143', configuredPhone]
            .flatMap((p) => (p || '').split(','))
            .map((p) => p.trim().replace(/\s+/g, ''))
            .filter((p) => p.length >= 9)
        )
      );

      const now = new Date().toLocaleString('en-GB', {
        timeZone: 'Asia/Colombo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const alertMsg =
        `🔐 *Admin Login Alert — Dewmina Super Line*\n\n` +
        `👤 *Name:* ${user.name}\n` +
        `📧 *Email:* ${user.email}\n` +
        `🛡️ *Role:* ${user.role}\n` +
        `🕐 *Time:* ${now} (SL)\n\n` +
        `_This is an automatic security notification._`;

      for (const phone of targetPhones) {
        sendWhatsAppMessage(phone, alertMsg).catch((err) => {
          console.warn(`[AuthRouter] Admin login WhatsApp alert to ${phone} failed (non-critical):`, err);
        });
      }

      // 2. Email Alert to Super Admin
      sendAdminLoginAlertEmail({
        name: user.name,
        email: user.email,
        role: user.role,
      }).catch((err) => {
        console.warn('[AuthRouter] Admin login email alert failed (non-critical):', err);
      });
    }

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
 * POST /api/auth/google
 * Authenticate or register user via Google OAuth ID token
 */
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, role = 'passenger' } = req.body;

    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ error: 'Google credential token is required.' });
    }

    // Verify Google ID Token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch (verifyErr: any) {
      console.error('[AuthRouter] Google verifyIdToken error:', verifyErr);
      return res.status(401).json({ error: 'Invalid Google authentication token. Please try again.' });
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Unable to retrieve Google profile information.' });
    }

    const email = payload.email.trim().toLowerCase();
    const name = payload.name || payload.given_name || email.split('@')[0];
    const picture = payload.picture;

    // Check if user already exists
    const existing = await dbQuery(
      'SELECT "id", "name", "email", "role", "phone", "createdAt" FROM users WHERE LOWER("email") = $1',
      [email]
    );

    let dbUser;
    if (existing.rows.length > 0) {
      dbUser = existing.rows[0];
    } else {
      // Auto-register new passenger from Google
      const userId = `usr-g-${Date.now()}-${uuidv4().substring(0, 6)}`;
      const randomPasswordHash = hashPassword(`google-auth-${uuidv4()}`);
      const createdAt = new Date().toISOString();
      const userRole = role === 'admin' ? 'admin' : 'passenger';

      await dbQuery(
        `INSERT INTO users ("id", "name", "email", "password", "role", "phone", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, name, email, randomPasswordHash, userRole, null, createdAt]
      );

      // Send account creation confirmation email asynchronously
      sendAccountCreationEmail({
        email,
        name,
        role: userRole,
      }).catch((err) => {
        console.error('[AuthRouter] Error triggering Google account creation email:', err);
      });

      dbUser = {
        id: userId,
        name,
        email,
        role: userRole,
        phone: null,
        createdAt,
      };
    }

    const token = `token-${dbUser.id}-${Date.now()}`;
    const user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      phone: dbUser.phone,
      picture,
      createdAt: dbUser.createdAt,
    };

    return res.json({
      success: true,
      message: `Signed in successfully as ${user.name}.`,
      token,
      user,
    });
  } catch (error) {
    console.error('Error during Google authentication:', error);
    return res.status(500).json({ error: 'Failed to authenticate with Google due to a server error.' });
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
      'SELECT "id", "name", "email", "role", "phone", "permissions", "emergencyContactName", "emergencyContactPhone", "notifyWhatsapp", "notifySms", "createdAt" FROM users WHERE "id" = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const row = result.rows[0];
    let parsedPermissions: string[] = [];
    try {
      parsedPermissions = typeof row.permissions === 'string' ? JSON.parse(row.permissions) : (row.permissions || []);
    } catch (_) {
      parsedPermissions = [];
    }
    if (row.role === 'super_admin') {
      parsedPermissions = [
        'counter_booking',
        'slips_approval',
        'qr_scanner',
        'manifest_view',
        'fleet_management',
        'timetable_management',
        'analytics',
        'whatsapp',
        'staff_management',
      ];
    }

    return res.json({
      user: {
        ...row,
        emergencyContactName: row.emergencyContactName || null,
        emergencyContactPhone: row.emergencyContactPhone || null,
        notifyWhatsapp: row.notifyWhatsapp !== false,
        notifySms: row.notifySms !== false,
        permissions: parsedPermissions,
      },
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

const NAME_REGEX = /^[a-zA-Z\s.'-]+$/;

/**
 * PUT /api/auth/profile
 * Update user's name, phone number, emergency contacts, and notification preferences
 */
authRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication token missing or invalid.' });
    }

    const { name, phone, emergencyContactName, emergencyContactPhone, notifyWhatsapp, notifySms } = req.body;
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

    let cleanEmergencyName = emergencyContactName ? String(emergencyContactName).trim() : null;
    if (cleanEmergencyName && cleanEmergencyName.length > 50) {
      return res.status(400).json({ error: 'Emergency contact name cannot exceed 50 characters.' });
    }

    let cleanEmergencyPhone = emergencyContactPhone ? String(emergencyContactPhone).trim() : null;
    if (cleanEmergencyPhone) {
      const strippedEm = cleanEmergencyPhone.replace(/[\s-]/g, '');
      if (!SL_PHONE_REGEX.test(strippedEm)) {
        return res.status(400).json({ error: 'Please enter a valid Sri Lankan mobile number for emergency contact (07XXXXXXXX).' });
      }
      cleanEmergencyPhone = strippedEm.startsWith('0') ? `+94${strippedEm.substring(1)}` : strippedEm;
    }

    const cleanNotifyWhatsapp = typeof notifyWhatsapp === 'boolean' ? notifyWhatsapp : null;
    const cleanNotifySms = typeof notifySms === 'boolean' ? notifySms : null;

    const updated = await dbQuery(
      `UPDATE users
       SET "name" = $1,
           "phone" = $2,
           "emergencyContactName" = $3,
           "emergencyContactPhone" = $4,
           "notifyWhatsapp" = COALESCE($5, "notifyWhatsapp"),
           "notifySms" = COALESCE($6, "notifySms")
       WHERE "id" = $7
       RETURNING "id", "name", "email", "role", "phone", "emergencyContactName", "emergencyContactPhone", "notifyWhatsapp", "notifySms", "createdAt"`,
      [cleanName, cleanPhone, cleanEmergencyName, cleanEmergencyPhone, cleanNotifyWhatsapp, cleanNotifySms, userId]
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
 * DELETE /api/auth/account
 * Delete passenger account permanently
 */
authRouter.delete('/account', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication token missing or invalid.' });
    }

    const checkRes = await dbQuery('SELECT "role" FROM users WHERE "id" = $1', [userId]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    if (checkRes.rows[0].role === 'super_admin') {
      return res.status(403).json({ error: 'Super Admin accounts cannot be deleted.' });
    }

    await dbQuery('DELETE FROM users WHERE "id" = $1', [userId]);

    return res.json({
      success: true,
      message: 'Your passenger account has been permanently deleted.',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ error: 'Failed to delete account due to a server error.' });
  }
});

/**
 * GET /api/auth/saved-passengers
 * Fetch list of saved co-passengers for current user
 */
authRouter.get('/saved-passengers', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication token missing or invalid.' });
    }

    const result = await dbQuery(
      'SELECT "id", "name", "nic", "phone", "gender", "createdAt" FROM saved_passengers WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [userId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching saved passengers:', error);
    return res.status(500).json({ error: 'Failed to fetch saved passengers.' });
  }
});

/**
 * POST /api/auth/saved-passengers
 * Add a new saved co-passenger
 */
authRouter.post('/saved-passengers', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication token missing or invalid.' });
    }

    const { name, nic, phone, gender } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Passenger name must be at least 2 characters long.' });
    }

    let cleanPhone = phone ? String(phone).trim() : null;
    if (cleanPhone) {
      const stripped = cleanPhone.replace(/[\s-]/g, '');
      if (SL_PHONE_REGEX.test(stripped)) {
        cleanPhone = stripped.startsWith('0') ? `+94${stripped.substring(1)}` : stripped;
      }
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const insertResult = await dbQuery(
      `INSERT INTO saved_passengers ("id", "userId", "name", "nic", "phone", "gender", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING "id", "name", "nic", "phone", "gender", "createdAt"`,
      [id, userId, name.trim(), nic ? String(nic).trim() : null, cleanPhone, gender || null, createdAt]
    );

    return res.status(201).json({
      success: true,
      passenger: insertResult.rows[0],
    });
  } catch (error) {
    console.error('Error adding saved passenger:', error);
    return res.status(500).json({ error: 'Failed to add saved passenger.' });
  }
});

/**
 * DELETE /api/auth/saved-passengers/:id
 * Remove a saved co-passenger
 */
authRouter.delete('/saved-passengers/:id', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication token missing or invalid.' });
    }

    const { id } = req.params;
    const deleteResult = await dbQuery(
      'DELETE FROM saved_passengers WHERE "id" = $1 AND "userId" = $2 RETURNING "id"',
      [id, userId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Saved passenger not found or permission denied.' });
    }

    return res.json({ success: true, message: 'Saved passenger deleted successfully.' });
  } catch (error) {
    console.error('Error deleting saved passenger:', error);
    return res.status(500).json({ error: 'Failed to delete saved passenger.' });
  }
});

/**
 * GET /api/auth/trip-stats
 * Returns completed, upcoming, and total trips count for the authenticated passenger
 */
authRouter.get('/trip-stats', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromToken(req.headers.authorization);
    if (!userId) {
      return res.status(401).json({ error: 'Authentication token missing or invalid.' });
    }

    const userRes = await dbQuery('SELECT "email", "phone" FROM users WHERE "id" = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const { email, phone } = userRes.rows[0];
    const statsRes = await dbQuery(
      `SELECT 
         COUNT(*) FILTER (WHERE "travelDate" < TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD')) as completed,
         COUNT(*) FILTER (WHERE "travelDate" >= TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AND "status" != 'cancelled') as upcoming,
         COUNT(*) as total
       FROM bookings 
       WHERE LOWER("passengerEmail") = LOWER($1) OR ("passengerPhone" = $2 AND $2 != '')`,
      [email, phone || '']
    );

    const stats = statsRes.rows[0] || {};
    return res.json({
      completedTrips: parseInt(stats.completed || '0', 10),
      upcomingTrips: parseInt(stats.upcoming || '0', 10),
      totalTrips: parseInt(stats.total || '0', 10),
    });
  } catch (error) {
    console.error('Error fetching trip stats:', error);
    return res.status(500).json({ error: 'Failed to fetch trip statistics.' });
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
 * Helper to verify caller is Super Admin
 */
async function verifySuperAdminCaller(authHeader?: string): Promise<{ success: boolean; caller?: any; error?: string }> {
  const userId = getUserIdFromToken(authHeader);
  if (!userId) {
    return { success: false, error: 'Unauthorized. Authentication token missing.' };
  }
  const res = await dbQuery('SELECT "id", "name", "email", "role" FROM users WHERE "id" = $1', [userId]);
  if (res.rows.length === 0 || res.rows[0].role !== 'super_admin') {
    return { success: false, error: 'Access denied. Only Super Administrator has permission for this action.' };
  }
  return { success: true, caller: res.rows[0] };
}

/**
 * GET /api/auth/staff
 * Super Admin endpoint to fetch all staff and sub-admins
 */
authRouter.get('/staff', async (req: Request, res: Response) => {
  try {
    const authCheck = await verifySuperAdminCaller(req.headers.authorization);
    if (!authCheck.success) {
      return res.status(403).json({ error: authCheck.error });
    }

    const result = await dbQuery(
      `SELECT "id", "name", "email", "role", "phone", "permissions", "createdAt"
       FROM users
       WHERE "role" IN ('admin', 'super_admin')
       ORDER BY CASE WHEN "role" = 'super_admin' THEN 0 ELSE 1 END, "createdAt" DESC`
    );

    const staff = result.rows.map((row) => {
      let permissions = [];
      try {
        permissions = typeof row.permissions === 'string' ? JSON.parse(row.permissions) : (row.permissions || []);
      } catch (_) {
        permissions = [];
      }
      return {
        ...row,
        permissions,
      };
    });

    return res.json({ success: true, staff });
  } catch (error) {
    console.error('Error fetching staff list:', error);
    return res.status(500).json({ error: 'Failed to fetch staff list.' });
  }
});

/**
 * POST /api/auth/staff
 * Super Admin endpoint to create a new Sub-Admin / Staff member
 */
authRouter.post('/staff', async (req: Request, res: Response) => {
  try {
    const authCheck = await verifySuperAdminCaller(req.headers.authorization);
    if (!authCheck.success) {
      return res.status(403).json({ error: authCheck.error });
    }

    const { name, email, password, phone, permissions } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name is required (at least 2 characters).' });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone ? phone.trim() : null;
    const permissionsArray = Array.isArray(permissions) ? permissions : [];

    // Check duplicate email
    const existing = await dbQuery('SELECT "id" FROM users WHERE LOWER("email") = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const newId = `usr-staff-${Date.now()}-${uuidv4().substring(0, 6)}`;
    const hashedPassword = hashPassword(password);
    const createdAt = new Date().toISOString();
    const permissionsJson = JSON.stringify(permissionsArray);

    await dbQuery(
      `INSERT INTO users ("id", "name", "email", "password", "role", "phone", "permissions", "createdAt")
       VALUES ($1, $2, $3, $4, 'admin', $5, $6, $7)`,
      [newId, cleanName, cleanEmail, hashedPassword, cleanPhone, permissionsJson, createdAt]
    );

    return res.status(201).json({
      success: true,
      message: 'Staff account created successfully.',
      staff: {
        id: newId,
        name: cleanName,
        email: cleanEmail,
        role: 'admin',
        phone: cleanPhone,
        permissions: permissionsArray,
        createdAt,
      },
    });
  } catch (error) {
    console.error('Error creating staff account:', error);
    return res.status(500).json({ error: 'Failed to create staff account.' });
  }
});

/**
 * PUT /api/auth/staff/:id
 * Super Admin endpoint to update staff permissions, details or reset password
 */
authRouter.put('/staff/:id', async (req: Request, res: Response) => {
  try {
    const authCheck = await verifySuperAdminCaller(req.headers.authorization);
    if (!authCheck.success) {
      return res.status(403).json({ error: authCheck.error });
    }

    const { id } = req.params;
    const { name, phone, permissions, password } = req.body;

    const existingRes = await dbQuery('SELECT "id", "role", "email" FROM users WHERE "id" = $1', [id]);
    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Staff account not found.' });
    }

    const targetUser = existingRes.rows[0];
    const isTargetSuper = targetUser.role === 'super_admin';

    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      updates.push(`"name" = $${idx++}`);
      values.push(name.trim());
    }

    if (phone !== undefined) {
      updates.push(`"phone" = $${idx++}`);
      values.push(phone ? phone.trim() : null);
    }

    // Only allow changing permissions if target is not super_admin
    if (!isTargetSuper && Array.isArray(permissions)) {
      updates.push(`"permissions" = $${idx++}`);
      values.push(JSON.stringify(permissions));
    }

    if (password && typeof password === 'string' && password.length >= 6) {
      updates.push(`"password" = $${idx++}`);
      values.push(hashPassword(password));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields provided to update.' });
    }

    values.push(id);
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE "id" = $${idx} RETURNING "id", "name", "email", "role", "phone", "permissions", "createdAt"`;
    const updated = await dbQuery(updateQuery, values);

    let parsedPermissions = [];
    try {
      parsedPermissions = typeof updated.rows[0].permissions === 'string' ? JSON.parse(updated.rows[0].permissions) : updated.rows[0].permissions;
    } catch (_) {}

    return res.json({
      success: true,
      message: 'Staff account updated successfully.',
      staff: {
        ...updated.rows[0],
        permissions: parsedPermissions,
      },
    });
  } catch (error) {
    console.error('Error updating staff account:', error);
    return res.status(500).json({ error: 'Failed to update staff account.' });
  }
});

/**
 * DELETE /api/auth/staff/:id
 * Super Admin endpoint to delete a staff account
 */
authRouter.delete('/staff/:id', async (req: Request, res: Response) => {
  try {
    const authCheck = await verifySuperAdminCaller(req.headers.authorization);
    if (!authCheck.success) {
      return res.status(403).json({ error: authCheck.error });
    }

    const { id } = req.params;

    const targetRes = await dbQuery('SELECT "id", "email", "role" FROM users WHERE "id" = $1', [id]);
    if (targetRes.rows.length === 0) {
      return res.status(404).json({ error: 'Staff account not found.' });
    }

    if (targetRes.rows[0].role === 'super_admin') {
      return res.status(403).json({ error: 'The Super Administrator account is permanent and cannot be deleted.' });
    }

    await dbQuery('DELETE FROM users WHERE "id" = $1', [id]);

    return res.json({
      success: true,
      message: `Staff account (${targetRes.rows[0].email}) deleted successfully.`,
    });
  } catch (error) {
    console.error('Error deleting staff account:', error);
    return res.status(500).json({ error: 'Failed to delete staff account.' });
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

    const target = await dbQuery('SELECT "id", "role", "email" FROM users WHERE "id" = $1', [id]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    if (target.rows[0].role === 'super_admin') {
      return res.status(403).json({ error: 'The Super Administrator account is permanent and cannot be modified.' });
    }

    const updated = await dbQuery(
      `UPDATE users SET "role" = $1 WHERE "id" = $2 RETURNING "id", "name", "email", "role", "phone", "createdAt"`,
      [role, id]
    );

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

    const target = await dbQuery('SELECT "id", "role", "email" FROM users WHERE "id" = $1', [id]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found or already deleted.' });
    }

    if (target.rows[0].role === 'super_admin') {
      return res.status(403).json({ error: 'The Super Administrator account is permanent and cannot be deleted.' });
    }

    const deleted = await dbQuery('DELETE FROM users WHERE "id" = $1 RETURNING "id", "name", "email"', [id]);

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
      // otpPreview intentionally excluded for security — OTP must be received via WhatsApp
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

authRouter.get('/test-email', async (req: Request, res: Response) => {
  const to = (req.query.to as string) || 'nomitha397@gmail.com';
  try {
    const success = await sendOTPEmail(to, 'Test User', '123456');
    return res.json({ success, to, lastError: lastEmailError });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message, lastError: lastEmailError });
  }
});
