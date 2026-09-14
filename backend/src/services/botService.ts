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
 * Build real-time dynamic timetable reply from the database (Supports English and Sinhala)
 */
async function buildRealtimeTimetableReply(isEnglish = false): Promise<string> {
  const now = new Date();
  const todayDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(tomorrow);

  let routes: any[] = [];

  try {
    // 1. Fetch upcoming routes starting from today in Sri Lanka
    const routesRes = await dbQuery(
      `SELECT r."id", r."busNumber", r."busType", r."origin", r."destination", r."departureDate", r."departureTime", r."priceStarting",
              COUNT(CASE WHEN s."status" = 'available' THEN 1 END) as "availableSeats",
              COUNT(s."id") as "totalSeats"
       FROM routes r
       LEFT JOIN seats s ON s."routeId" = r."id"
       WHERE r."departureDate" >= $1
       GROUP BY r."id", r."busNumber", r."busType", r."origin", r."destination", r."departureDate", r."departureTime", r."priceStarting"
       ORDER BY r."departureDate" ASC, r."departureTime" ASC
       LIMIT 16`,
      [todayDateStr]
    );

    if (routesRes && routesRes.rows.length > 0) {
      routes = routesRes.rows;
    } else {
      // Fallback: If no future trips, fetch the latest scheduled trips
      const fallbackRes = await dbQuery(
        `SELECT r."id", r."busNumber", r."busType", r."origin", r."destination", r."departureDate", r."departureTime", r."priceStarting",
                COUNT(CASE WHEN s."status" = 'available' THEN 1 END) as "availableSeats",
                COUNT(s."id") as "totalSeats"
         FROM routes r
         LEFT JOIN seats s ON s."routeId" = r."id"
         GROUP BY r."id", r."busNumber", r."busType", r."origin", r."destination", r."departureDate", r."departureTime", r."priceStarting"
         ORDER BY r."departureDate" DESC, r."departureTime" ASC
         LIMIT 10`
      );
      if (fallbackRes && fallbackRes.rows.length > 0) {
        routes = fallbackRes.rows;
      }
    }
  } catch (err) {
    console.error('[BotService] Error querying real-time routes for timetable:', err);
  }

  // If live routes found in DB
  if (routes.length > 0) {
    const todayRoutes = routes.filter((r) => r.departureDate === todayDateStr);
    const futureRoutes = routes.filter((r) => r.departureDate !== todayDateStr);

    let reply = isEnglish
      ? `🚌 *Dewmina Super Line Live Bus Timetable*\n_Route 98: Colombo ⇄ Monaragala_\n\n`
      : `🚌 *Dewmina Super Line සජීවී බස් කාලසටහන (Live Timetable)*\n_Route 98: කොළඹ ⇄ මොනරාගල_\n\n`;

    const formatRouteList = (items: any[]) => {
      const monToCol = items.filter((r) => 
        (r.origin || '').toLowerCase().includes('monaragala') || (r.destination || '').toLowerCase().includes('colombo')
      );
      const colToMon = items.filter((r) => 
        (r.origin || '').toLowerCase().includes('colombo') || (r.destination || '').toLowerCase().includes('monaragala')
      );

      let text = '';
      if (monToCol.length > 0) {
        text += isEnglish
          ? `📍 *Monaragala ➔ Colombo*\n`
          : `📍 *මොනරාගල ➔ කොළඹ*\n`;
        for (const r of monToCol) {
          const time = (r.departureTime || '').replace('.', ':');
          const seatsInfo = Number(r.totalSeats) > 0
            ? (isEnglish ? ` | 💺 Seats Left: ${r.availableSeats}` : ` | 💺 ඇබෑර්තු: ${r.availableSeats}`)
            : '';
          const busTypeLabel = (r.busType || 'Normal').includes('Normal') ? 'Normal' : r.busType;
          text += `• ⏰ ${time} — *${r.busNumber}* (${busTypeLabel}) [LKR ${Number(r.priceStarting || 1157).toLocaleString()}]${seatsInfo}\n`;
        }
      }

      if (colToMon.length > 0) {
        if (text) text += '\n';
        text += isEnglish
          ? `📍 *Colombo ➔ Monaragala*\n`
          : `📍 *කොළඹ ➔ මොනරාගල*\n`;
        for (const r of colToMon) {
          const time = (r.departureTime || '').replace('.', ':');
          const seatsInfo = Number(r.totalSeats) > 0
            ? (isEnglish ? ` | 💺 Seats Left: ${r.availableSeats}` : ` | 💺 ඇබෑර්තු: ${r.availableSeats}`)
            : '';
          const busTypeLabel = (r.busType || 'Normal').includes('Normal') ? 'Normal' : r.busType;
          text += `• ⏰ ${time} — *${r.busNumber}* (${busTypeLabel}) [LKR ${Number(r.priceStarting || 1157).toLocaleString()}]${seatsInfo}\n`;
        }
      }

      const others = items.filter((r) => !monToCol.includes(r) && !colToMon.includes(r));
      if (others.length > 0) {
        if (text) text += '\n';
        for (const r of others) {
          const time = (r.departureTime || '').replace('.', ':');
          const seatsInfo = Number(r.totalSeats) > 0
            ? (isEnglish ? ` | 💺 Seats Left: ${r.availableSeats}` : ` | 💺 ඇබෑර්තු: ${r.availableSeats}`)
            : '';
          text += `• ${r.origin} ➔ ${r.destination} (${time}) - *${r.busNumber}* [LKR ${Number(r.priceStarting || 1157).toLocaleString()}]${seatsInfo}\n`;
        }
      }

      return text;
    };

    if (todayRoutes.length > 0) {
      reply += isEnglish
        ? `🗓️ *Today's Scheduled Trips (${todayDateStr}):*\n\n`
        : `🗓️ *අද දින ගමන් වාර (${todayDateStr}):*\n\n`;
      reply += formatRouteList(todayRoutes);
    } else {
      reply += isEnglish
        ? `📍 *Daily Departure Times:*\n\n` +
          `• *Monaragala ➔ Colombo:*\n` +
          `  05:00 AM, 06:00 AM, 07:10 AM, 11:40 AM, 02:20 PM, 10:55 PM, 11:35 PM\n\n` +
          `• *Colombo ➔ Monaragala:*\n` +
          `  12:40 AM, 01:40 PM, 02:20 PM, 04:10 PM, 05:10 PM, 06:00 PM, 06:50 PM\n\n`
        : `📍 *දෛනික ප්‍රධාන ගමන් වාර වේලාවන්:*\n\n` +
          `• *මොනරාගල ➔ කොළඹ:*\n` +
          `  උදෑසන 05:00 AM, 06:00 AM, 07:10 AM, 11:40 AM | දහවල් 02:20 PM | රාත්‍රී 10:55 PM, 11:35 PM\n\n` +
          `• *කොළඹ ➔ මොනරාගල:*\n` +
          `  මධ්‍යම රාත්‍රී 12:40 AM | දහවල් 01:40 PM, 02:20 PM, 04:10 PM | සවස 05:10 PM, 06:00 PM, 06:50 PM\n\n`;
    }

    reply += isEnglish
      ? `\n💡 _You can select and book your seats online instantly on our website:_\n🌐 https://dewminasuperline.lk`
      : `\n💡 _වෙබ් අඩවිය හරහා ඔබට ක්ෂණිකව ආසන තෝරා වෙන්කරගත හැක._\n🌐 https://dewminasuperline.lk`;
    return reply;
  }

  // Fallback to master rotation table if routes empty
  try {
    const ttRes = await dbQuery('SELECT * FROM timetables ORDER BY "busNumber"');
    if (ttRes && ttRes.rows.length > 0) {
      let reply = isEnglish
        ? `🚌 *Dewmina Super Line Master Bus Schedule*\n_Route 98: Colombo ⇄ Monaragala Daily Service_\n\n`
        : `🚌 *Dewmina Super Line නිල බස් කාලසටහන (Master Schedule)*\n_Route 98: කොළඹ ⇄ මොනරාගල Daily Service_\n\n`;
      for (const tt of ttRes.rows) {
        reply += `🚍 *${tt.busNumber} (${tt.busType || 'Normal Service'})* — LKR ${Number(tt.price || 1157).toLocaleString()}\n`;
      }
      reply += isEnglish
        ? `\n📍 *Main Daily Departure Times:*\n• Monaragala: 05:00 AM, 06:00 AM, 07:10 AM, 11:40 AM, 02:20 PM, 10:55 PM, 11:35 PM\n• Colombo: 12:40 AM, 01:40 PM, 02:20 PM, 04:10 PM, 05:10 PM, 06:00 PM, 06:50 PM\n\n💡 _Book your seat online on our website:_\n🌐 https://dewminasuperline.lk`
        : `\n📍 *දෛනික ප්‍රධාන ගමන් වාර වේලාවන්:*\n• මොනරාගලින් පිටත්වීම: 05:00 AM, 06:00 AM, 07:10 AM, 11:40 AM, 02:20 PM, 10:55 PM, 11:35 PM\n• කොළඹින් පිටත්වීම: 12:40 AM, 01:40 PM, 02:20 PM, 04:10 PM, 05:10 PM, 06:00 PM, 06:50 PM\n\n💡 _වෙබ් අඩවිය හරහා අද සහ ඉදිරි දින සඳහා ආසන වෙන්කරවා ගත හැක._\n🌐 https://dewminasuperline.lk`;
      return reply;
    }
  } catch (ttErr) {
    console.error('[BotService] Error querying master timetables:', ttErr);
  }

  return isEnglish
    ? `🚌 *Dewmina Super Line Daily Bus Schedule*\n\n` +
      `📍 *Monaragala ➔ Colombo*\n` +
      `• Morning: 05:00 AM / 07:10 AM / 11:40 AM\n` +
      `• Night: 10:55 PM / 11:35 PM\n\n` +
      `📍 *Colombo ➔ Monaragala*\n` +
      `• Afternoon: 01:40 PM / 02:20 PM / 04:10 PM\n` +
      `• Evening: 06:00 PM / 06:50 PM\n\n` +
      `💡 _Visit our website for live seat booking:_\n🌐 https://dewminasuperline.lk`
    : `🚌 *Dewmina Super Line දෛනික බස් කාලසටහන*\n\n` +
      `📍 *මොනරාගල ➔ කොළඹ*\n` +
      `• උදෑසන 05:00 AM / 07:10 AM / 11:40 AM\n` +
      `• රාත්‍රී 10:55 PM / 11:35 PM\n\n` +
      `📍 *කොළඹ ➔ මොනරාගල*\n` +
      `• දහවල් 01:40 PM / 02:20 PM / 04:10 PM\n` +
      `• සවස 06:00 PM / 06:50 PM\n\n` +
      `💡 _සජීවී ආසන ඇබෑර්තු සහ වෙන්කිරීම් සඳහා අපගේ වෙබ් අඩවියට පිවිසෙන්න._\n🌐 https://dewminasuperline.lk`;
}

/**
 * Intelligent Bot Reply Engine for Dewmina Super Line
 * Processes Sinhala, Singlish, and English passenger queries
 */
export async function processBotMessage(incomingText: string, preferredLang?: string): Promise<BotReplyResult> {
  const text = (incomingText || '').trim();
  const lower = text.toLowerCase();

  const hasSinhalaChars = /[ඐ-෦]/.test(text);
  const isExplicitEnglish = preferredLang === 'en' || preferredLang === 'english';
  const isExplicitSinhala = preferredLang === 'si' || preferredLang === 'sinhala';

  const isEnglish = isExplicitEnglish || (!isExplicitSinhala && !hasSinhalaChars && (
    lower.includes('schedule') ||
    lower.includes('timetable') ||
    lower.includes('time table') ||
    lower.includes('time') ||
    lower.includes('times') ||
    lower.includes('bus') ||
    lower.includes('route') ||
    lower.includes('fare') ||
    lower.includes('price') ||
    lower.includes('cost') ||
    lower.includes('book') ||
    lower.includes('seat') ||
    lower.includes('contact') ||
    lower.includes('help') ||
    lower.includes('phone') ||
    lower.includes('call') ||
    lower.includes('hi') ||
    lower.includes('hello')
  ));

  const defaultOpts: BotQuickOption[] = isEnglish ? [
    { label: '🚌 Bus Timetable', value: 'Timetable', icon: 'bus' },
    { label: '💵 Ticket Fares', value: 'Ticket Prices', icon: 'dollar' },
    { label: '💺 Book a Seat', value: 'Book Seat', icon: 'seat' },
    { label: '🔍 Check Ticket (PNR)', value: 'Check PNR', icon: 'search' },
    { label: '📞 Contact Conductor', value: 'Contact Support', icon: 'phone' },
  ] : DEFAULT_OPTIONS;

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
        const statusEng = b.status === 'confirmed' ? '✅ Confirmed' : b.status === 'pending' ? '⏳ Verification Pending' : '❌ Cancelled';

        const reply = isEnglish ? (
          `🎫 *Your Ticket Details (PNR: ${b.pnr})*\n\n` +
          `👤 *Passenger Name:* ${b.passengerName || 'N/A'}\n` +
          `🚌 *Bus:* ${b.busNumber || 'Dewmina Express'}\n` +
          `🛣️ *Route:* ${b.origin || 'Monaragala'} ➔ ${b.destination || 'Colombo'}\n` +
          `📅 *Date:* ${b.departureDate || 'N/A'} | ⏰ *Time:* ${b.departureTime || 'N/A'}\n` +
          `💺 *Seats:* ${seatsStr || 'N/A'}\n` +
          `💵 *Fare:* LKR ${Number(b.totalFare || 0).toLocaleString()}\n` +
          `📌 *Status:* ${statusEng}\n\n` +
          `If you require any assistance, please contact our conductor via WhatsApp.`
        ) : (
          `🎫 *ඔබගේ ටිකට්පත් විස්තර (PNR: ${b.pnr})*\n\n` +
          `👤 *මගී නම:* ${b.passengerName || 'N/A'}\n` +
          `🚌 *බස් රථය:* ${b.busNumber || 'Dewmina Express'}\n` +
          `🛣️ *මාර්ගය:* ${b.origin || 'මොනරාගල'} ➔ ${b.destination || 'කොළඹ'}\n` +
          `📅 *දිනය:* ${b.departureDate || 'N/A'} | ⏰ *වේලාව:* ${b.departureTime || 'N/A'}\n` +
          `💺 *ආසන අංක:* ${seatsStr || 'N/A'}\n` +
          `💵 *ගාස්තුව:* LKR ${Number(b.totalFare || 0).toLocaleString()}\n` +
          `📌 *තත්ත්වය:* ${statusSinhala}\n\n` +
          `ඔබට මෙම ටිකට් පත හෝ වෙනත් සහයක් අවශ්‍ය නම් පහත බොත්තම මගින් අපගේ නියෝජිතයෙකු හා සම්බන්ධ වන්න.`
        );

        return {
          text: reply,
          options: defaultOpts,
          actions: [
            { type: 'CHECK_PNR', label: isEnglish ? '🎫 View Ticket' : '🎫 විස්තර පෙන්වන්න', data: { pnr: b.pnr } },
            { type: 'WHATSAPP_CONTACT', label: isEnglish ? '💬 Contact Conductor (WhatsApp)' : '💬 Conductor අමතන්න (WhatsApp)', data: { number: '94762581841' } },
          ],
          pnrData: b,
        };
      } else {
        return {
          text: isEnglish
            ? `🔍 Sorry, no booking found for PNR *${pnrCode}*.\n\nPlease double-check your PNR or contact our conductor for help.`
            : `🔍 සමාවන්න, *${pnrCode}* යන PNR අංකයට අදාළව කිසිදු Booking එකක් හමු නොවීය.\n\nකරුණාකර ඔබගේ ටිකට්පත් අංකය (PNR) නිවැරදිදැයි නැවත පරීක්ෂා කර බලන්න, නැතහොත් Conductor අමතන්න.`,
          options: defaultOpts,
          actions: [
            { type: 'WHATSAPP_CONTACT', label: isEnglish ? '📞 Support (WhatsApp)' : '📞 සහය ලබාගන්න (WhatsApp)', data: { number: '94762581841' } },
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
    lower.includes('time table') ||
    lower.includes('time') ||
    lower.includes('times') ||
    lower.includes('වේලාව') ||
    lower.includes('වේලාවන්') ||
    lower.includes('කීයටද') ||
    lower.includes('keeyatada') ||
    lower.includes('welawa') ||
    lower.includes('welawan') ||
    lower.includes('bus welawa') ||
    lower.includes('bus time') ||
    lower.includes('buses') ||
    lower.includes('bus table') ||
    lower.includes('boot time') ||
    lower.includes('monaragala to colombo') ||
    lower.includes('colombo to monaragala') ||
    ['1', '1.', 'one', 'bus'].includes(lower)
  ) {
    const reply = await buildRealtimeTimetableReply(isEnglish);
    return {
      text: reply,
      options: isEnglish ? [
        { label: '💺 Book a Seat Now', value: 'Book Seat' },
        { label: '💵 Ticket Fares', value: 'Ticket Prices' },
        { label: '📞 Contact Conductor', value: 'Contact Support' },
      ] : [
        { label: '💺 දැන්ම ආසනයක් වෙන්කරන්න', value: 'ආසන වෙන්කිරීම' },
        { label: '💵 ටිකට් මිල ගණන්', value: 'මිල ගණන්' },
        { label: '📞 Conductor අමතන්න', value: 'අපව අමතන්න' },
      ],
      actions: [
        { type: 'VIEW_SCHEDULES', label: isEnglish ? '📅 View All Schedules' : '📅 සියලු කාලසටහන් බලන්න' },
        { type: 'BOOK_SEAT', label: isEnglish ? '🎟️ Book Seats' : '🎟️ ආසන වෙන්කරන්න' },
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
    const reply = isEnglish ? (
      `💵 *Dewmina Super Line Ticket Fares*\n\n` +
      `1️⃣ *Normal Express Service:* LKR 1,157\n` +
      `2️⃣ *Super Luxury A/C:* LKR 2,670\n\n` +
      `✅ *Features & Amenities:*\n` +
      `• Comfortable Pushback Seats\n` +
      `• High-Speed Wi-Fi & USB Charging\n` +
      `• Real-Time GPS Tracking & Updates\n` +
      `• Instant WhatsApp E-Ticket\n\n` +
      `_Note: Fares are subject to National Transport Commission (NTC) regulations._`
    ) : (
      `💵 *Dewmina Super Line ටිකට්පත් ගාස්තු*\n\n` +
      `1️⃣ *සාමාන්‍ය සේවාව (Normal Express):* LKR 1,157\n` +
      `2️⃣ *සුඛෝපභෝගී (Super Luxury A/C):* LKR 2,670\n\n` +
      `✅ *විශේෂ පහසුකම්:*\n` +
      `• සුවපහසු Pushback ආසන\n` +
      `• High-Speed Wi-Fi & USB Charging\n` +
      `• GPS Live Tracking & Real-time Updates\n` +
      `• WhatsApp E-Ticket පහසුකම\n\n` +
      `_සටහන: ජාතික ගමනාගමන කොමිසමේ නීති රෙගුලාසි අනුව මිල ගණන් වෙනස් විය හැක._`
    );

    return {
      text: reply,
      options: isEnglish ? [
        { label: '🚌 View Timetable', value: 'Timetable' },
        { label: '💺 Book a Seat', value: 'Book Seat' },
        { label: '📞 Contact Conductor', value: 'Contact Support' },
      ] : [
        { label: '🚌 කාලසටහන බැලීමට', value: 'කාලසටහන' },
        { label: '💺 ආසන වෙන්කරන්න', value: 'ආසන වෙන්කිරීම' },
        { label: '📞 Conductor අමතන්න', value: 'අපව අමතන්න' },
      ],
      actions: [
        { type: 'BOOK_SEAT', label: isEnglish ? '🎟️ Select Seats' : '🎟️ ආසනයක් තෝරන්න' },
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
    const reply = isEnglish ? (
      `💺 *How to Book Your Seat Online*\n\n` +
      `Book your seat in 4 simple steps:\n\n` +
      `1️⃣ *Select Destination:* Origin (Monaragala), Destination (Colombo), and travel date.\n` +
      `2️⃣ *Choose Seat:* Select your preferred seat from the interactive bus seat layout.\n` +
      `3️⃣ *Passenger Details:* Enter your passenger name and WhatsApp phone number.\n` +
      `4️⃣ *Payment:* Pay securely via Card or Bank Transfer (Upload Slip) to receive your instant WhatsApp E-Ticket! 🎉`
    ) : (
      `💺 *ආසන වෙන්කරගන්නේ කෙසේද? (How to Book)*\n\n` +
      `පහසු පියවර 4කින් ඔබගේ බස් ආසනය වෙන්කරගන්න:\n\n` +
      `1️⃣ *ගමනාන්තය තෝරන්න:* ආරම්භය (Monaragala), ගමනාන්තය (Colombo) සහ ගමන් දිනය තෝරන්න.\n` +
      `2️⃣ *ආසනය තෝරන්න:* බස් රථයේ ආසන සිතියමෙන් (Seat Map) ඔබට කැමති අසුනක් තෝරාගන්න.\n` +
      `3️⃣ *මගී විස්තර:* ඔබගේ නම සහ WhatsApp දුරකථන අංකය ඇතුළත් කරන්න.\n` +
      `4️⃣ *ගෙවීම:* Online Card මගින් හෝ Bank Transfer (Slip Upload) හරහා ගෙවීම් සිදුකර ක්ෂණික WhatsApp E-Ticket එක ලබාගන්න! 🎉`
    );

    return {
      text: reply,
      options: defaultOpts,
      actions: [
        { type: 'BOOK_SEAT', label: isEnglish ? '🚀 Book Seat Now' : '🚀 දැන්ම ආසනයක් වෙන්කරන්න' },
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
    const reply = isEnglish ? (
      `📞 *Dewmina Super Line Customer Support*\n\n` +
      `Connect directly with our conductors or main office anytime via WhatsApp or phone call:\n\n` +
      `👤 *Conductor & Seat Bookings:*\n` +
      `📱 076 258 1841 (Online & Call Support)\n\n` +
      `👤 *Route & Schedule Dispatcher:*\n` +
      `📱 072 417 3143 (Active 24/7 Helpline)\n\n` +
      `🏢 *Main Office:* Bus Stand, Monaragala\n` +
      `✉️ *Email:* info@dewminasuperline.com`
    ) : (
      `📞 *Dewmina Super Line සහය සේවාව*\n\n` +
      `ඔබට ඕනෑම වේලාවක අපගේ Conductor වරුන් හෝ ප්‍රධාන කාර්යාලය සමඟ WhatsApp හරහා හෝ සෘජු ඇමතුමකින් සම්බන්ධ විය හැක:\n\n` +
      `👤 *Conductor & ආසන වෙන්කිරීම්:*\n` +
      `📱 076 258 1841 (Online & Call Support)\n\n` +
      `👤 *ධාවන සහ කාලසටහන් සහය:*\n` +
      `📱 072 417 3143 (Active 24/7 Helpline)\n\n` +
      `🏢 *ප්‍රධාන කාර්යාලය:* බස් නැවතුම්පළ, මොනරාගල\n` +
      `✉️ *විද්‍යුත් තැපෑල:* info@dewminasuperline.com`
    );

    return {
      text: reply,
      options: defaultOpts,
      actions: [
        { type: 'WHATSAPP_CONTACT', label: '💬 WhatsApp (076 258 1841)', data: { number: '94762581841' } },
        { type: 'WHATSAPP_CONTACT', label: '💬 WhatsApp (072 417 3143)', data: { number: '94724173143' } },
        { type: 'CALL_PHONE', label: isEnglish ? '📞 Call Now (076 258 1841)' : '📞 දැන්ම අමතන්න (076 258 1841)', data: { phone: '0762581841' } },
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
    const reply = isEnglish ? (
      `🏦 *Dewmina Super Line Bank Account Details*\n\n` +
      `For bank deposits or online bank transfers:\n\n` +
      `• *Bank:* Commercial Bank\n` +
      `• *Account Name:* Dewmina Super Line Travels (Pvt) Ltd\n` +
      `• *Account Number:* 8009 2341 56\n` +
      `• *Branch:* Monaragala Branch\n\n` +
      `📌 *Important:* After payment, please upload your deposit slip on our website under 'Upload Slip' or send it via WhatsApp.`
    ) : (
      `🏦 *Dewmina Super Line බැංකු ගිණුම් විස්තර*\n\n` +
      `බැංකු තැන්පතු හෝ Online Fund Transfer සඳහා:\n\n` +
      `• *බැංකුව:* Commercial Bank\n` +
      `• *ගිණුම් නම:* Dewmina Super Line Travels (Pvt) Ltd\n` +
      `• *ගිණුම් අංකය:* 8009 2341 56\n` +
      `• *ශාඛාව:* Monaragala Branch\n\n` +
      `📌 *වැදගත්:* මුදල් තැන්පත් කළ පසු රිසිට්පත (Slip එක) වෙබ් අඩවියේ 'Upload Slip' වෙත හෝ අපගේ WhatsApp අංකයට යොමු කරන්න.`
    );

    return {
      text: reply,
      options: defaultOpts,
      actions: [
        { type: 'VIEW_SLIP_UPLOAD', label: isEnglish ? '📤 Go to Slip Upload' : '📤 Slip Upload පිටුවට පිවිසෙන්න' },
        { type: 'WHATSAPP_CONTACT', label: isEnglish ? '💬 Send Slip via WhatsApp' : '💬 Slip එක WhatsApp කරන්න', data: { number: '94762581841' } },
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
    const reply = isEnglish ? (
      `⚠️ *Ticket Cancellation & Refund Policy*\n\n` +
      `• Seats can be cancelled or rescheduled up to 4 hours before departure time.\n` +
      `• To cancel or reschedule an online booking, please contact our conductor with your PNR:\n` +
      `  📞 076 258 1841 / 072 417 3143`
    ) : (
      `⚠️ *ටිකට්පත් අවලංගු කිරීම සහ ප්‍රතිපත්ති*\n\n` +
      `• බස් රථය පිටත්වීමට පැය 4කට පෙර දැනුම් දීමෙන් ආසනය අවලංගු කර වෙනත් දිනයකට මාරු කරගත හැක.\n` +
      `• Online වෙන්කළ ආසන අවලංගු කිරීම සඳහා ඔබගේ PNR අංකය සමඟ Conductor අමතන්න:\n` +
      `  📞 076 258 1841 / 072 417 3143`
    );

    return {
      text: reply,
      options: defaultOpts,
      actions: [
        { type: 'WHATSAPP_CONTACT', label: isEnglish ? '💬 Contact Conductor (WhatsApp)' : '💬 Conductor අමතන්න (WhatsApp)', data: { number: '94762581841' } },
      ],
    };
  }

  // 8. Default Welcome Menu / Greeting
  const reply = isEnglish ? (
    `👋 *Welcome to Dewmina Super Line!*\n\n` +
    `I am your automated virtual travel assistant. Choose an option below or type your question:\n\n` +
    `*1.* 🚌 Bus Timetable & Live Schedules\n` +
    `*2.* 💵 Ticket Fares & Prices\n` +
    `*3.* 💺 How to Book a Seat Online\n` +
    `*4.* 📞 Contact Conductor & Support\n\n` +
    `_You can also reply with your PNR code (e.g. DSL-XXXX) to check your ticket._`
  ) : (
    `👋 *Dewmina Super Line වෙත සාදරයෙන් පිළිගනිමු!*\n\n` +
    `මම ඔබේ ස්වයංක්‍රීය සහයක. ඔබට අවශ්‍ය තොරතුරු පහසුවෙන්ම මෙතැනින් ලබාගත හැක:\n\n` +
    `*1.* 🚌 බස් කාලසටහන බැලීමට\n` +
    `*2.* 💵 ටිකට් මිල ගණන් බැලීමට\n` +
    `*3.* 💺 ආසන වෙන් කරගන්නා ආකාරය\n` +
    `*4.* 📞 Conductor සමඟ කතාබස් කිරීමට\n\n` +
    `_හෝ ඔබගේ ප්‍රශ්නය මෙහි Type කරන්න (හෝ ඔබගේ PNR අංකය ලියා එවන්න)._`
  );

  return {
    text: reply,
    options: defaultOpts,
    actions: [
      { type: 'VIEW_SCHEDULES', label: isEnglish ? '🚌 View Schedules' : '🚌 කාලසටහන් බලන්න' },
      { type: 'BOOK_SEAT', label: isEnglish ? '🎟️ Book a Seat' : '🎟️ ආසනයක් වෙන්කරන්න' },
    ],
  };
}
