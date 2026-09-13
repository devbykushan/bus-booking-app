import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  Browsers,
  WASocket,
  ConnectionState,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

export interface BookingNotificationPayload {
  pnr: string;
  passengerName: string;
  passengerPhone: string;
  busNumber: string;
  busType: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  seatNumbers: string[];
  totalFare: number;
  paymentMethod: string;
  qrCodeUrl?: string;
}

export type WhatsAppConnectionStatus = 'connected' | 'connecting' | 'qr_ready' | 'disconnected';

let sock: WASocket | null = null;
let currentStatus: WhatsAppConnectionStatus = 'disconnected';
let currentQrDataUrl: string | null = null;
let currentQrRaw: string | null = null;
let connectedUser: { id: string; name?: string } | null = null;
let isInitializing = false;
let lastEngineError: string | null = null;
const engineLogs: string[] = [];

function addEngineLog(msg: string) {
  const line = `[${new Date().toISOString().substring(11, 19)}] ${msg}`;
  console.log(line);
  engineLogs.unshift(line);
  if (engineLogs.length > 50) engineLogs.pop();
}

const AUTH_DIR = process.env.AUTH_DIR || path.resolve(process.cwd(), 'auth_info_baileys');

/**
 * Format Sri Lankan and international phone numbers to Baileys WhatsApp JID (e.g. 94771234567@s.whatsapp.net)
 */
export function formatSriLankanPhoneJid(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '').trim();

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Handle local 07X format (e.g., 0771234567 -> 94771234567)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '94' + cleaned.substring(1);
  } else if (!cleaned.startsWith('94') && cleaned.length === 9) {
    cleaned = '94' + cleaned;
  }

  return `${cleaned}@s.whatsapp.net`;
}

/**
 * Initialize WhatsApp connection via Baileys (Pure Node.js)
 */
export async function initWhatsApp(): Promise<void> {
  if (isInitializing) {
    addEngineLog('Already initializing, skipping duplicate init.');
    return;
  }
  isInitializing = true;
  lastEngineError = null;

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    addEngineLog(`Loading auth state from: ${AUTH_DIR}`);
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    
    let version: [number, number, number] | undefined = undefined;
    try {
      const vRes = await fetchLatestBaileysVersion();
      if (vRes?.version) {
        version = vRes.version;
        addEngineLog(`Fetched latest Baileys version: ${version.join('.')}`);
      }
    } catch (vErr) {
      addEngineLog('Could not fetch latest version from GitHub, using defaults.');
    }

    addEngineLog('Starting Baileys WASocket...');
    const logger = pino({ level: 'silent' });

    sock = makeWASocket({
      ...(version ? { version } : {}),
      auth: state,
      logger,
      browser: Browsers.macOS('Desktop'),
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      syncFullHistory: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQrRaw = qr;
        addEngineLog(`Received QR string (length ${qr.length}). Generating QR Image...`);
        try {
          currentQrDataUrl = await QRCode.toDataURL(qr, {
            scale: 7,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          currentStatus = 'qr_ready';
          addEngineLog('QR Data URL generated successfully! Ready for pairing.');
        } catch (qrErr: any) {
          lastEngineError = `QR generation error: ${qrErr?.message || qrErr}`;
          addEngineLog(lastEngineError);
        }
      }

      if (connection === 'connecting') {
        if (!currentQrDataUrl) {
          currentStatus = 'connecting';
        }
        addEngineLog('Socket status: connecting...');
      }

      if (connection === 'open') {
        currentStatus = 'connected';
        currentQrDataUrl = null;
        currentQrRaw = null;
        const userJid = sock?.user?.id || 'Unknown';
        const userName = sock?.user?.name || 'Dewmina Super Line Bot';
        connectedUser = { id: userJid, name: userName };
        addEngineLog(`🎉 WhatsApp CONNECTED as ${userName} (${userJid})`);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const errMsg = lastDisconnect?.error?.message || String(lastDisconnect?.error || 'Unknown error');
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        lastEngineError = `Connection closed: ${errMsg} (Status: ${statusCode || 'N/A'})`;
        addEngineLog(lastEngineError);

        if (shouldReconnect) {
          if (!currentQrDataUrl) {
            currentStatus = 'disconnected';
          }
          addEngineLog('Scheduling reconnect in 4s...');
          setTimeout(() => {
            isInitializing = false;
            initWhatsApp();
          }, 4000);
        } else {
          currentStatus = 'disconnected';
          connectedUser = null;
          currentQrDataUrl = null;
          addEngineLog('Logged out. Clearing auth directory to regenerate QR...');
          try {
            if (fs.existsSync(AUTH_DIR)) {
              fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            }
          } catch (e) {}
          setTimeout(() => {
            isInitializing = false;
            initWhatsApp();
          }, 2000);
        }
      }
    });

  } catch (error: any) {
    lastEngineError = `Baileys init failed: ${error?.message || error}`;
    addEngineLog(lastEngineError);
    currentStatus = 'disconnected';
  } finally {
    isInitializing = false;
  }
}

/**
 * Get current live status and QR code
 */
export function getWhatsAppStatus(): {
  status: WhatsAppConnectionStatus;
  qrCode: string | null;
  user: { id: string; name?: string } | null;
  lastError?: string | null;
  logs?: string[];
} {
  return {
    status: currentQrDataUrl && currentStatus !== 'connected' ? 'qr_ready' : currentStatus,
    qrCode: currentQrDataUrl,
    user: connectedUser,
    lastError: lastEngineError,
    logs: engineLogs.slice(0, 10),
  };
}

/**
 * Restart WhatsApp session (e.g. from Admin Dashboard)
 */
export async function restartWhatsAppSession(): Promise<boolean> {
  try {
    if (sock) {
      sock.end(undefined);
      sock = null;
    }
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
    currentStatus = 'disconnected';
    currentQrDataUrl = null;
    connectedUser = null;
    isInitializing = false;
    await initWhatsApp();
    return true;
  } catch (err: any) {
    console.error('[WhatsApp Service] Error restarting session:', err);
    return false;
  }
}

/**
 * Send custom text message to a phone number
 */
export async function sendWhatsAppMessage(phone: string, text: string): Promise<boolean> {
  if (!sock || currentStatus !== 'connected') {
    console.warn(`[WhatsApp Service] Cannot send message: WhatsApp client is not connected (Status: ${currentStatus})`);
    return false;
  }

  try {
    const jid = formatSriLankanPhoneJid(phone);
    console.log(`[WhatsApp Service] Sending message to ${jid}...`);

    await sock.sendMessage(jid, { text });
    console.log(`[WhatsApp Service] Message successfully sent to ${jid}!`);
    return true;
  } catch (error: any) {
    console.error(`[WhatsApp Service] Failed to send message to ${phone}:`, error?.message || error);
    return false;
  }
}

/**
 * Send automated E-Ticket WhatsApp message
 */
export async function sendWhatsAppETicket(payload: BookingNotificationPayload): Promise<boolean> {
  if (!payload.passengerPhone) {
    console.warn('[WhatsApp Service] Cannot send E-Ticket: passenger phone is missing');
    return false;
  }

  const seatsText = payload.seatNumbers && payload.seatNumbers.length > 0
    ? payload.seatNumbers.join(', ')
    : 'Assigned';

  const ticketMessage = 
`🚌 *E-TICKET CONFIRMATION* 🚌
*Dewmina Super Line*

Dear *${payload.passengerName}*,
Your bus ticket booking is confirmed! 🎉

📌 *PNR / Ticket ID:* \`${payload.pnr}\`
🚌 *Bus:* ${payload.busNumber} (${payload.busType})
🛣️ *Route:* ${payload.origin} ➔ ${payload.destination}
💺 *Seat No(s):* ${seatsText}
📅 *Departure Date:* ${payload.departureDate}
⏰ *Time:* ${payload.departureTime}
💵 *Total Amount:* LKR ${payload.totalFare.toLocaleString()}
💳 *Payment:* ${payload.paymentMethod.toUpperCase()}

🔍 *Boarding Pass:*
Present your PNR Code \`${payload.pnr}\` or QR Code at the boarding gate.

Thank you for choosing Dewmina Super Line! Have a safe & comfortable journey! 🎒✨`;

  return sendWhatsAppMessage(payload.passengerPhone, ticketMessage);
}

/**
 * Send WhatsApp OTP verification code
 */
export async function sendWhatsAppOtp(phone: string, otp: string): Promise<boolean> {
  const otpMessage = 
`🔐 *Dewmina Super Line* — Verification Code 🔐

Your WhatsApp verification OTP code is:
👉 *${otp}* 👈

This code is valid for 10 minutes.
Enter this OTP on the booking screen to confirm your identity and proceed with your bus seat booking.

_If you did not request this verification code, please ignore this message._`;

  console.log(`[WhatsApp Service] Generated OTP ${otp} for WhatsApp: ${phone}`);
  return sendWhatsAppMessage(phone, otpMessage);
}

/**
 * Send payment verification status notification
 */
export async function sendWhatsAppPaymentUpdate(payload: {
  pnr: string;
  passengerName: string;
  passengerPhone: string;
  amount: number;
  status: 'approved' | 'rejected';
  reason?: string;
}): Promise<boolean> {
  if (!payload.passengerPhone) return false;

  const message = payload.status === 'approved'
    ? `✅ *Payment Approved — Booking Confirmed!*
*Dewmina Super Line*

Dear *${payload.passengerName}*,

Your bank transfer payment of *LKR ${Number(payload.amount).toLocaleString()}* has been *verified and approved*! 🎉

📌 *PNR:* \`${payload.pnr}\`

Your booking is now *CONFIRMED*. Please show your PNR at the boarding point.

Thank you for choosing Dewmina Super Line! 🚌`
    : `❌ *Payment Rejected — Booking Cancelled*
*Dewmina Super Line*

Dear *${payload.passengerName}*,

Unfortunately, your bank transfer slip for *LKR ${Number(payload.amount).toLocaleString()}* could not be verified.

📌 *PNR:* \`${payload.pnr}\`
📝 *Reason:* ${payload.reason || 'Payment could not be verified.'}

Your booking has been *cancelled* and your seats have been released. Please try booking again or contact us for assistance.

Dewmina Super Line 🚌`;

  return sendWhatsAppMessage(payload.passengerPhone, message);
}
