import { dbQuery } from '../db/database';

export interface BotAction {
  type: 'VIEW_SCHEDULES' | 'BOOK_SEAT' | 'CHECK_PNR' | 'WHATSAPP_CONTACT' | 'VIEW_SLIP_UPLOAD' | 'CALL_PHONE';
  label: string;
  data?: any;
}

export interface BotQuickOption {
  label: string;
  value: string;
  icon?: string;
}

export interface BotReplyResult {
  text: string;
  options?: BotQuickOption[];
  actions?: BotAction[];
  pnrData?: any;
}

const DEFAULT_OPTIONS: BotQuickOption[] = [
  { label: '🚌 බස් කාලසටහන', value: 'කාලසටහන', icon: 'bus' },
  { label: '💵 ටිකට් මිල ගණන්', value: 'මිල ගණන්', icon: 'dollar' },
  { label: '💺 ආසන වෙන්කිරීම', value: 'ආසන වෙන්කිරීම', icon: 'seat' },
  { label: '🔍 ටිකට් පරීක්ෂාව (PNR)', value: 'PNR පරීක්ෂාව', icon: 'search' },
  { label: '📞 Conductor සම්බන්ධ කරගන්න', value: 'අපව අමතන්න', icon: 'phone' },
];

/**
 * Intelligent Bot Reply Engine for Dewmina Super Line
 * Processes Sinhala, Singlish, and English passenger queries
 */
export async function processBotMessage(incomingText: string): Promise<BotReplyResult> {
  const text = (incomingText || '').trim();
  const lower = text.toLowerCase();

  // 1. Check for PNR query (e.g. DSL-XXXXXX or asking to check PNR)
  const pnrMatch = text.match(/DSL-[A-Z0-9]+/i) || (lower.startsWith('pnr') ? text.replace(/pnr[:\s-]*/i, '').trim().match(/[A-Z0-9]{4,10}/i) : null);
  
  if (pnrMatch) {
    const pnrCode = pnrMatch[0].toUpperCase();
    try {
      const res = await dbQuery('SELECT * FROM bookings WHERE UPPER("pnr") = $1', [pnrCode]);
      if (res && res.rows.length > 0) {
        const b = res.rows[0];
        const seats = typeof b.seatNumbers === 'string' ? JSON.parse(b.seatNumbers) : (b.seatNumbers || []);
        const seatsStr = Array.isArray(seats) ? seats.join(', ') : String(seats);
        const statusSinhala = b.status === 'confirmed' ? '✅ තහවුරු කර ඇත (Confirmed)' : b.status === 'pending' ? '⏳ ගෙවීම් පරීක්ෂා කරමින් පවතී (Pending)' : '❌ අවලංගු කර ඇත (Cancelled)';

        const reply = `🎫 *ඔබගේ ටිකට්පත් විස්තර (PNR: ${b.pnr})*\n\n` +
          `👤 *මගී නම:* ${b.passengerName || 'N/A'}\n` +
          `🚌 *බස් රථය:* ${b.busNumber || 'Dewmina Express'}\n` +
          `🛣️ *මාර්ගය:* ${b.origin || 'මොනරාගල'} ➔ ${b.destination || 'කොළඹ'}\n` +
          `📅 *දිනය:* ${b.departureDate || 'N/A'} | ⏰ *වේලාව:* ${b.departureTime || 'N/A'}\n` +
          `💺 *ආසන අංක:* ${seatsStr || 'N/A'}\n` +
          `💵 *ගාස්තුව:* LKR ${Number(b.totalFare || 0).toLocaleString()}\n` +
          `📌 *තත්ත්වය:* ${statusSinhala}\n\n` +
          `ඔබට මෙම ටිකට් පත හෝ වෙනත් සහයක් අවශ්‍ය නම් පහත බොත්තම මගින් අපගේ නියෝජිතයෙකු හා සම්බන්ධ වන්න.`;

        return {
          text: reply,
          options: DEFAULT_OPTIONS,
          actions: [
            { type: 'CHECK_PNR', label: '🎫 විස්තර පෙන්වන්න', data: { pnr: b.pnr } },
            { type: 'WHATSAPP_CONTACT', label: '💬 Conductor අමතන්න (WhatsApp)', data: { number: '94762581841' } },
          ],
          pnrData: b,
        };
      } else {
        return {
          text: `🔍 සමාවන්න, *${pnrCode}* යන PNR අංකයට අදාළව කිසිදු Booking එකක් හමු නොවීය.\n\nකරුණාකර ඔබගේ ටිකට්පත් අංකය (PNR) නිවැරදිදැයි නැවත පරීක්ෂා කර බලන්න, නැතහොත් Conductor අමතන්න.`,
          options: DEFAULT_OPTIONS,
          actions: [
            { type: 'WHATSAPP_CONTACT', label: '📞 සහය ලබාගන්න (WhatsApp)', data: { number: '94762581841' } },
          ],
        };
      }
    } catch (err) {
      console.error('[BotService] Error checking PNR:', err);
    }
  }

  // 2. Timetables / Schedules
  if (
    lower.includes('කාලසටහන') ||
    lower.includes('schedule') ||
    lower.includes('timetable') ||
    lower.includes('time') ||
    lower.includes('වේලාව') ||
    lower.includes('කීයටද') ||
    lower.includes('keeyatada') ||
    lower.includes('welawa') ||
    ['1', '1.', 'one'].includes(lower)
  ) {
    let liveRoutesInfo = '';
    try {
      const routesRes = await dbQuery(
        `SELECT "busNumber", "busType", "origin", "destination", "departureDate", "departureTime", "price" 
         FROM routes 
         WHERE "departureDate" >= CURRENT_DATE 
         ORDER BY "departureDate", "departureTime" 
         LIMIT 4`
      );
      if (routesRes && routesRes.rows.length > 0) {
        liveRoutesInfo = '\n\n*අද සහ ඉදිරි ගමන් වාර:*\n' + routesRes.rows.map((r: any) => 
          `• ${r.origin} ➔ ${r.destination} (${r.departureTime}) - ${r.busNumber} [LKR ${Number(r.price).toLocaleString()}]`
        ).join('\n');
      }
    } catch (e) {
      console.warn('[BotService] Could not query live routes for timetable:', e);
    }

    const reply = `🚌 *Dewmina Super Line දෛනික බස් කාලසටහන*\n\n` +
      `📍 *මොනරාගල ➔ කොළඹ (Daily Express)*\n` +
      `• උදෑසන 05:00 AM — සාමාන්‍ය සේවාව (Normal)\n` +
      `• උදෑසන 10:30 AM — අර්ධ සුඛෝපභෝගී (Semi-Luxury)\n` +
      `• රාත්‍රී 08:00 PM — Super Line A/C Express\n\n` +
      `📍 *කොළඹ ➔ මොනරාගල (Daily Express)*\n` +
      `• උදෑසන 06:30 AM — Semi-Luxury\n` +
      `• රාත්‍රී 08:00 PM — Super Line A/C Express\n` +
      `• රාත්‍රී 09:30 PM — Normal Express` +
      liveRoutesInfo +
      `\n\n💡 _වෙබ් අඩවිය හරහා ඔබට ක්ෂණිකව ආසන තෝරා වෙන්කරගත හැක._`;

    return {
      text: reply,
      options: [
        { label: '💺 දැන්ම ආසනයක් වෙන්කරන්න', value: 'ආසන වෙන්කිරීම' },
        { label: '💵 ටිකට් මිල ගණන්', value: 'මිල ගණන්' },
        { label: '📞 Conductor අමතන්න', value: 'අපව අමතන්න' },
      ],
      actions: [
        { type: 'VIEW_SCHEDULES', label: '📅 සියලු කාලසටහන් බලන්න' },
      ],
    };
  }

  // 3. Ticket Prices / Fares
  if (
    lower.includes('මිල') ||
    lower.includes('ගාස්තු') ||
    lower.includes('price') ||
    lower.includes('fare') ||
    lower.includes('cost') ||
    lower.includes('ticket mila') ||
    lower.includes('keeyada') ||
    ['2', '2.', 'two'].includes(lower)
  ) {
    const reply = `💵 *Dewmina Super Line ටිකට්පත් ගාස්තු*\n\n` +
      `1️⃣ *සාමාන්‍ය සේවාව (Normal Express):* LKR 1,157\n` +
      `2️⃣ *අර්ධ සුඛෝපභෝගී (Semi-Luxury):* LKR 1,500\n` +
      `3️⃣ *සුඛෝපභෝගී (Super Line Luxury A/C):* LKR 2,500\n\n` +
      `✅ *විශේෂ පහසුකම්:*\n` +
      `• සුවපහසු Pushback ආසන\n` +
      `• High-Speed Wi-Fi & USB Charging\n` +
      `• GPS Live Tracking & Real-time Updates\n` +
      `• WhatsApp E-Ticket පහසුකම\n\n` +
      `_සටහන: ජාතික ගමනාගමන කොමිසමේ නීති රෙගුලාසි අනුව මිල ගණන් වෙනස් විය හැක._`;

    return {
      text: reply,
      options: [
        { label: '🚌 කාලසටහන බැලීමට', value: 'කාලසටහන' },
        { label: '💺 ආසන වෙන්කරන්න', value: 'ආසන වෙන්කිරීම' },
        { label: '📞 Conductor අමතන්න', value: 'අපව අමතන්න' },
      ],
      actions: [
        { type: 'BOOK_SEAT', label: '🎟️ ආසනයක් තෝරන්න' },
      ],
    };
  }

  // 4. How to Book Seats
  if (
    lower.includes('ආසන') ||
    lower.includes('book') ||
    lower.includes('reserve') ||
    lower.includes('seat') ||
    lower.includes('kohomada') ||
    lower.includes('order') ||
    lower.includes('වෙන්කිරීම') ||
    ['3', '3.', 'three'].includes(lower)
  ) {
    const reply = `💺 *ආසන වෙන්කරගන්නේ කෙසේද? (How to Book)*\n\n` +
      `පහසු පියවර 4කින් ඔබගේ බස් ආසනය වෙන්කරගන්න:\n\n` +
      `1️⃣ *ගමනාන්තය තෝරන්න:* ආරම්භය (Monaragala), ගමනාන්තය (Colombo) සහ ගමන් දිනය තෝරන්න.\n` +
      `2️⃣ *ආසනය තෝරන්න:* බස් රථයේ ආසන සිතියමෙන් (Seat Map) ඔබට කැමති අසුනක් තෝරාගන්න.\n` +
      `3️⃣ *මගී විස්තර:* ඔබගේ නම සහ WhatsApp දුරකථන අංකය ඇතුළත් කරන්න.\n` +
      `4️⃣ *ගෙවීම:* Online Card මගින් හෝ Bank Transfer (Slip Upload) හරහා ගෙවීම් සිදුකර ක්ෂණික WhatsApp E-Ticket එක ලබාගන්න! 🎉`;

    return {
      text: reply,
      options: [
        { label: '🚌 බස් කාලසටහන', value: 'කාලසටහන' },
        { label: '💵 ටිකට් මිල ගණන්', value: 'මිල ගණන්' },
        { label: '💳 බැංකු ගිණුම් විස්තර', value: 'බැංකු විස්තර' },
      ],
      actions: [
        { type: 'BOOK_SEAT', label: '🚀 දැන්ම ආසනයක් වෙන්කරන්න' },
      ],
    };
  }

  // 5. Contact Info / Phone / WhatsApp
  if (
    lower.includes('අමතන්න') ||
    lower.includes('contact') ||
    lower.includes('phone') ||
    lower.includes('call') ||
    lower.includes('conductor') ||
    lower.includes('number') ||
    lower.includes('කතා') ||
    lower.includes('දුරකථන') ||
    lower.includes('whatsapp') ||
    ['4', '4.', 'four'].includes(lower)
  ) {
    const reply = `📞 *Dewmina Super Line සහය සේවාව*\n\n` +
      `ඔබට ඕනෑම වේලාවක අපගේ Conductor වරුන් හෝ ප්‍රධාන කාර්යාලය සමඟ WhatsApp හරහා හෝ සෘජු ඇමතුමකින් සම්බන්ධ විය හැක:\n\n` +
      `👤 *Conductor & ආසන වෙන්කිරීම්:*\n` +
      `📱 076 258 1841 (Online & Call Support)\n\n` +
      `👤 *ධාවන සහ කාලසටහන් සහය:*\n` +
      `📱 072 417 3143 (Active 24/7 Helpline)\n\n` +
      `🏢 *ප්‍රධාන කාර්යාලය:* බස් නැවතුම්පළ, මොනරාගල\n` +
      `✉️ *විද්‍යුත් තැපෑල:* info@dewminasuperline.com`;

    return {
      text: reply,
      options: DEFAULT_OPTIONS,
      actions: [
        { type: 'WHATSAPP_CONTACT', label: '💬 WhatsApp (076 258 1841)', data: { number: '94762581841' } },
        { type: 'WHATSAPP_CONTACT', label: '💬 WhatsApp (072 417 3143)', data: { number: '94724173143' } },
        { type: 'CALL_PHONE', label: '📞 දැන්ම අමතන්න (076 258 1841)', data: { phone: '0762581841' } },
      ],
    };
  }

  // 6. Bank Details / Slip Upload
  if (
    lower.includes('bank') ||
    lower.includes('බැංකු') ||
    lower.includes('account') ||
    lower.includes('slip') ||
    lower.includes('ස්ලිප්') ||
    lower.includes('payment') ||
    lower.includes('ගෙවීම්')
  ) {
    const reply = `🏦 *Dewmina Super Line බැංකු ගිණුම් විස්තර*\n\n` +
      `බැංකු තැන්පතු හෝ Online Fund Transfer සඳහා:\n\n` +
      `• *බැංකුව:* Commercial Bank\n` +
      `• *ගිණුම් නම:* Dewmina Super Line Travels (Pvt) Ltd\n` +
      `• *ගිණුම් අංකය:* 8009 2341 56\n` +
      `• *ශාඛාව:* Monaragala Branch\n\n` +
      `📌 *වැදගත්:* මුදල් තැන්පත් කළ පසු රිසිට්පත (Slip එක) වෙබ් අඩවියේ 'Upload Slip' වෙත හෝ අපගේ WhatsApp අංකයට යොමු කරන්න.`;

    return {
      text: reply,
      options: [
        { label: '📄 Slip එකක් Upload කරන්න', value: 'slip upload' },
        { label: '📞 Conductor අමතන්න', value: 'අපව අමතන්න' },
      ],
      actions: [
        { type: 'VIEW_SLIP_UPLOAD', label: '📤 Slip Upload පිටුවට පිවිසෙන්න' },
        { type: 'WHATSAPP_CONTACT', label: '💬 Slip එක WhatsApp කරන්න', data: { number: '94762581841' } },
      ],
    };
  }

  // 7. Ticket Cancellation & Refund
  if (
    lower.includes('cancel') ||
    lower.includes('refund') ||
    lower.includes('අවලංගු') ||
    lower.includes('මුදල් ආපසු')
  ) {
    const reply = `⚠️ *ටිකට්පත් අවලංගු කිරීම සහ ප්‍රතිපත්ති*\n\n` +
      `• බස් රථය පිටත්වීමට පැය 4කට පෙර දැනුම් දීමෙන් ආසනය අවලංගු කර වෙනත් දිනයකට මාරු කරගත හැක.\n` +
      `• Online වෙන්කළ ආසන අවලංගු කිරීම සඳහා ඔබගේ PNR අංකය සමඟ Conductor අමතන්න:\n` +
      `  📞 076 258 1841 / 072 417 3143`;

    return {
      text: reply,
      options: DEFAULT_OPTIONS,
      actions: [
        { type: 'WHATSAPP_CONTACT', label: '💬 Conductor අමතන්න (WhatsApp)', data: { number: '94762581841' } },
      ],
    };
  }

  // 8. Default Welcome Menu / Greeting
  const reply = `👋 *Dewmina Super Line වෙත සාදරයෙන් පිළිගනිමු!*\n\n` +
    `මම ඔබේ ස්වයංක්‍රීය සහයක. ඔබට අවශ්‍ය තොරතුරු පහසුවෙන්ම මෙතැනින් ලබාගත හැක:\n\n` +
    `*1.* 🚌 බස් කාලසටහන බැලීමට\n` +
    `*2.* 💵 ටිකට් මිල ගණන් බැලීමට\n` +
    `*3.* 💺 ආසන වෙන් කරගන්නා ආකාරය\n` +
    `*4.* 📞 Conductor සමඟ කතාබස් කිරීමට\n\n` +
    `_හෝ ඔබගේ ප්‍රශ්නය මෙහි Type කරන්න (හෝ ඔබගේ PNR අංකය ලියා එවන්න)._`;

  return {
    text: reply,
    options: DEFAULT_OPTIONS,
    actions: [
      { type: 'VIEW_SCHEDULES', label: '🚌 කාලසටහන් බලන්න' },
      { type: 'BOOK_SEAT', label: '🎟️ ආසනයක් වෙන්කරන්න' },
    ],
  };
}
