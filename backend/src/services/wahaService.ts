/**
 * WAHA (WhatsApp HTTP API) Service
 * Sends automated E-Tickets & notifications to passengers via WAHA WhatsApp service.
 */

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

/**
 * Formats Sri Lankan and international phone numbers to WAHA WhatsApp chatId format (e.g., 94771234567@c.us)
 */
export function formatSriLankanPhone(phone: string): string {
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

  return `${cleaned}@c.us`;
}

/**
 * Trigger E-Ticket WhatsApp message via WAHA API
 */
export async function sendWhatsAppETicket(payload: BookingNotificationPayload): Promise<boolean> {
  const wahaApiUrl = process.env.WAHA_API_URL || 'http://localhost:3000';
  const session = process.env.WAHA_SESSION || 'default';
  const isEnabled = process.env.WAHA_ENABLED !== 'false';

  if (!isEnabled) {
    console.log('[WAHA Service] WhatsApp notifications are disabled via WAHA_ENABLED=false');
    return false;
  }

  if (!payload.passengerPhone) {
    console.warn('[WAHA Service] Cannot send E-Ticket: passenger phone is missing');
    return false;
  }

  const chatId = formatSriLankanPhone(payload.passengerPhone);
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

  try {
    console.log(`[WAHA Service] Sending WhatsApp E-Ticket for PNR ${payload.pnr} to ${chatId}...`);

    const endpoint = `${wahaApiUrl.replace(/\/$/, '')}/api/sendText`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session,
        chatId,
        text: ticketMessage,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[WAHA Service] Failed to send WhatsApp message (HTTP ${response.status}):`, errText);
      return false;
    }

    const data = await response.json();
    console.log(`[WAHA Service] E-Ticket sent successfully to ${chatId}! Response:`, data);
    return true;
  } catch (error: any) {
    console.error('[WAHA Service] Connection error sending WhatsApp E-Ticket via WAHA:', error?.message || error);
    return false;
  }
}

/**
 * Send WhatsApp OTP verification code via WAHA API
 */
export async function sendWhatsAppOtp(phone: string, otp: string): Promise<boolean> {
  const wahaApiUrl = process.env.WAHA_API_URL || 'http://localhost:3000';
  const session = process.env.WAHA_SESSION || 'default';
  const isEnabled = process.env.WAHA_ENABLED !== 'false';

  const chatId = formatSriLankanPhone(phone);
  const otpMessage = 
`🔐 *Dewmina Super Line* — Verification Code 🔐

Your WhatsApp verification OTP code is:
👉 *${otp}* 👈

This code is valid for 10 minutes.
Enter this OTP on the booking screen to confirm your identity and proceed with your bus seat booking.

_If you did not request this verification code, please ignore this message._`;

  console.log(`[WAHA Service] Generated OTP ${otp} for WhatsApp: ${phone} (${chatId})`);

  if (!isEnabled) {
    console.log('[WAHA Service] WhatsApp notifications are disabled via WAHA_ENABLED=false');
    return true;
  }

  try {
    const endpoint = `${wahaApiUrl.replace(/\/$/, '')}/api/sendText`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session,
        chatId,
        text: otpMessage,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[WAHA Service] WAHA HTTP ${response.status} when sending OTP:`, errText);
      return false;
    }

    const data = await response.json();
    console.log(`[WAHA Service] WhatsApp OTP sent successfully to ${chatId}:`, data);
    return true;
  } catch (error: any) {
    console.warn('[WAHA Service] WAHA connection unavailable (will proceed in dev mode):', error?.message || error);
    return false;
  }
}

/**
 * Send WhatsApp payment approval/rejection notification to passenger
 */
export async function sendWhatsAppPaymentUpdate(payload: {
  pnr: string;
  passengerName: string;
  passengerPhone: string;
  amount: number;
  status: 'approved' | 'rejected';
  reason?: string;
}): Promise<boolean> {
  const wahaApiUrl = process.env.WAHA_API_URL || 'http://localhost:3000';
  const session = process.env.WAHA_SESSION || 'default';
  const isEnabled = process.env.WAHA_ENABLED !== 'false';

  if (!isEnabled) return false;
  if (!payload.passengerPhone) return false;

  const chatId = formatSriLankanPhone(payload.passengerPhone);

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

  try {
    const endpoint = `${wahaApiUrl.replace(/\/$/, '')}/api/sendText`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session, chatId, text: message }),
    });
    return response.ok;
  } catch (error: any) {
    console.error('[WAHA Service] Failed to send payment update:', error?.message);
    return false;
  }
}
