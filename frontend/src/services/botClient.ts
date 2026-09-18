import { botApi, bookingsApi } from './api';
import { useBookingStore } from '../store/bookingStore';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  options?: Array<{ label: string; value: string; icon?: string }>;
  actions?: Array<{
    type: 'VIEW_SCHEDULES' | 'BOOK_SEAT' | 'CHECK_PNR' | 'WHATSAPP_CONTACT' | 'VIEW_SLIP_UPLOAD' | 'CALL_PHONE';
    label: string;
    data?: any;
  }>;
  pnrData?: any;
}

export const INITIAL_BOT_MESSAGE_LANG_SELECT: ChatMessage = {
  id: 'init-lang-select',
  sender: 'bot',
  text: `👋 **Welcome to Dewmina Travels / Dewmina Travels වෙත සාදරයෙන් පිළිගනිමු!**\n\nකරුණාකර ඔබ කැමති භාෂාව තෝරන්න:\nPlease select your preferred language:`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  options: [
    { label: '🇱🇰 සිංහල (Sinhala)', value: 'LANG_SI' },
    { label: '🇬🇧 English', value: 'LANG_EN' },
  ],
};

export const INITIAL_BOT_MESSAGE_SI: ChatMessage = {
  id: 'init-msg-si',
  sender: 'bot',
  text: `👋 **ආයුබෝවන්! Dewmina Travels සහය සේවාව වෙත සාදරයෙන් පිළිගනිමු!**\n\nමම ඔබේ ස්වයංක්‍රීය AI සහයක. මොනරාගල ⇄ කොළඹ බස් කාලසටහන්, ටිකට් ගාස්තු හෝ ඔබගේ ආසනය වෙන්කරවා ගැනීම පිළිබඳ ඕනෑම තොරතුරක් මෙතැනින් ක්ෂණිකව ලබාගත හැක. පහතින් ඔබට අවශ්‍ය සේවාව තෝරන්න:`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  options: [
    { label: '🚌 බස් කාලසටහන', value: 'කාලසටහන' },
    { label: '💵 ටිකට් මිල ගණන්', value: 'මිල ගණන්' },
    { label: '💺 ආසන වෙන්කරන්නේ කෙසේද?', value: 'ආසන වෙන්කිරීම' },
    { label: '🔍 ටිකට් පරීක්ෂාව (PNR)', value: 'PNR පරීක්ෂාව' },
    { label: '📞 Conductor කතාබස් (WhatsApp)', value: 'අපව අමතන්න' },
  ],
};

export const INITIAL_BOT_MESSAGE_EN: ChatMessage = {
  id: 'init-msg-en',
  sender: 'bot',
  text: `👋 **Welcome to Dewmina Travels Support!**\n\nI am your automated virtual travel assistant. You can check Monaragala ⇄ Colombo bus schedules, ticket fares, or book your seat right here. Please select an option below:`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  options: [
    { label: '🚌 Bus Timetable', value: 'Timetable' },
    { label: '💵 Ticket Fares', value: 'Ticket Prices' },
    { label: '💺 How to Book', value: 'Book Seat' },
    { label: '🔍 Check Ticket (PNR)', value: 'Check PNR' },
    { label: '📞 Contact Conductor', value: 'Contact Support' },
  ],
};

// Fallback initial message for backward compatibility
export const INITIAL_BOT_MESSAGE: ChatMessage = INITIAL_BOT_MESSAGE_LANG_SELECT;

/**
 * Intelligent Client-side fallback if backend is unreachable or sleeping
 */
async function generateClientFallback(incomingText: string, lang: 'si' | 'en' = 'si'): Promise<Omit<ChatMessage, 'id' | 'timestamp'>> {
  const text = (incomingText || '').trim();
  const lower = text.toLowerCase();
  const isEn = lang === 'en';

  const defaultOptions = isEn ? INITIAL_BOT_MESSAGE_EN.options : INITIAL_BOT_MESSAGE_SI.options;

  // 1. PNR Query
  const pnrMatch = text.match(/DSL-[A-Z0-9]+/i) || (lower.startsWith('pnr') ? text.replace(/pnr[:\s-]*/i, '').trim().match(/[A-Z0-9]{4,10}/i) : null);
  if (pnrMatch) {
    const pnrCode = pnrMatch[0].toUpperCase();
    try {
      const b = await bookingsApi.getByPnr(pnrCode);
      if (b && b.pnr) {
        const seats = typeof b.seatNumbers === 'string' ? JSON.parse(b.seatNumbers) : (b.seatNumbers || []);
        const seatsStr = Array.isArray(seats) ? seats.join(', ') : String(seats);
        
        if (isEn) {
          const statusEng = b.status === 'confirmed' ? '✅ Confirmed' : b.status === 'pending' ? '⏳ Verification Pending' : '❌ Cancelled';
          return {
            sender: 'bot',
            text: `🎫 **Your Ticket Details (PNR: ${b.pnr})**\n\n` +
              `👤 **Passenger:** ${b.passengerName || 'N/A'}\n` +
              `🚌 **Bus:** ${b.busNumber || 'Dewmina Express'}\n` +
              `🛣️ **Route:** ${b.origin || 'Monaragala'} ➔ ${b.destination || 'Colombo'}\n` +
              `📅 **Date:** ${b.departureDate || 'N/A'} | ⏰ **Time:** ${b.departureTime || 'N/A'}\n` +
              `💺 **Seats:** ${seatsStr || 'N/A'}\n` +
              `💵 **Total Fare:** LKR ${Number(b.totalFare || 0).toLocaleString()}\n` +
              `📌 **Status:** ${statusEng}\n\n` +
              `If you require further assistance with your ticket, please contact our conductor via WhatsApp.`,
            options: defaultOptions,
            actions: [
              { type: 'CHECK_PNR', label: '🎫 View Ticket', data: { pnr: b.pnr } },
              { type: 'WHATSAPP_CONTACT', label: '💬 WhatsApp Conductor', data: { number: '94762581841' } },
            ],
            pnrData: b,
          };
        } else {
          const statusSinhala = b.status === 'confirmed' ? '✅ තහවුරු කර ඇත (Confirmed)' : b.status === 'pending' ? '⏳ පරීක්ෂා කරමින් පවතී (Pending)' : '❌ අවලංගු කර ඇත (Cancelled)';
          return {
            sender: 'bot',
            text: `🎫 **ඔබගේ ටිකට්පත් විස්තර (PNR: ${b.pnr})**\n\n` +
              `👤 **මගී නම:** ${b.passengerName || 'N/A'}\n` +
              `🚌 **බස් රථය:** ${b.busNumber || 'Dewmina Express'}\n` +
              `🛣️ **මාර්ගය:** ${b.origin || 'මොනරාගල'} ➔ ${b.destination || 'කොළඹ'}\n` +
              `📅 **දිනය:** ${b.departureDate || 'N/A'} | ⏰ **වේලාව:** ${b.departureTime || 'N/A'}\n` +
              `💺 **ආසන අංක:** ${seatsStr || 'N/A'}\n` +
              `💵 **ගාස්තුව:** LKR ${Number(b.totalFare || 0).toLocaleString()}\n` +
              `📌 **තත්ත්වය:** ${statusSinhala}\n\n` +
              `ඔබට මෙම ටිකට් පත පිළිබඳ වැඩිදුර විස්තර අවශ්‍ය නම් Conductor අමතන්න.`,
            options: defaultOptions,
            actions: [
              { type: 'CHECK_PNR', label: '🎫 විස්තර පෙන්වන්න', data: { pnr: b.pnr } },
              { type: 'WHATSAPP_CONTACT', label: '💬 Conductor අමතන්න (WhatsApp)', data: { number: '94762581841' } },
            ],
            pnrData: b,
          };
        }
      }
    } catch {
      // ignore
    }

    return {
      sender: 'bot',
      text: isEn
        ? `🔍 Sorry, no booking was found for PNR **${pnrCode}**.\n\nPlease check if your PNR is correct or contact our conductor for assistance.`
        : `🔍 සමාවන්න, **${pnrCode}** යන PNR අංකයට අදාළව Booking එකක් හමු නොවීය.\n\nකරුණාකර PNR අංකය නිවැරදිදැයි පරීක්ෂා කරන්න හෝ Conductor අමතන්න.`,
      options: defaultOptions,
      actions: [
        { type: 'WHATSAPP_CONTACT', label: isEn ? '📞 Contact Conductor' : '📞 Conductor අමතන්න (WhatsApp)', data: { number: '94762581841' } },
      ],
    };
  }

  // 2. Timetable / Schedules
  if (
    lower.includes('කාලසටහන') ||
    lower.includes('schedule') ||
    lower.includes('timetable') ||
    lower.includes('time table') ||
    lower.includes('time') ||
    lower.includes('times') ||
    lower.includes('වේලාව') ||
    lower.includes('කීයටද') ||
    lower.includes('keeyatada') ||
    lower.includes('welawa') ||
    ['1', '1.', 'one'].includes(lower)
  ) {
    const liveRoutes = useBookingStore.getState().routes || [];
    let textOut = '';
    if (liveRoutes.length > 0) {
      const monToCol = liveRoutes.filter((r) => 
        (r.origin || '').toLowerCase().includes('monaragala') || (r.destination || '').toLowerCase().includes('colombo')
      );
      const colToMon = liveRoutes.filter((r) => 
        (r.origin || '').toLowerCase().includes('colombo') || (r.destination || '').toLowerCase().includes('monaragala')
      );

      textOut = isEn
        ? `🚌 **Dewmina Super Line Live Bus Timetable**\n\n`
        : `🚌 **Dewmina Super Line සජීවී බස් කාලසටහන (Live Timetable)**\n\n`;

      if (monToCol.length > 0) {
        textOut += isEn ? `📍 **Monaragala ➔ Colombo**\n` : `📍 **මොනරාගල ➔ කොළඹ**\n`;
        for (const r of monToCol) {
          const time = (r.departureTime || '').replace('.', ':');
          const seatsInfo = r.availableSeatsCount !== undefined
            ? (isEn ? ` | 💺 Seats: ${r.availableSeatsCount}` : ` | 💺 ඇබෑර්තු: ${r.availableSeatsCount}`)
            : '';
          textOut += `• ⏰ ${time} — **${r.busNumber}** (${r.busType || 'Normal'}) [LKR ${Number(r.priceStarting || 1157).toLocaleString()}]${seatsInfo}\n`;
        }
      }

      if (colToMon.length > 0) {
        if (monToCol.length > 0) textOut += '\n';
        textOut += isEn ? `📍 **Colombo ➔ Monaragala**\n` : `📍 **කොළඹ ➔ මොනරාගල**\n`;
        for (const r of colToMon) {
          const time = (r.departureTime || '').replace('.', ':');
          const seatsInfo = r.availableSeatsCount !== undefined
            ? (isEn ? ` | 💺 Seats: ${r.availableSeatsCount}` : ` | 💺 ඇබෑර්තු: ${r.availableSeatsCount}`)
            : '';
          textOut += `• ⏰ ${time} — **${r.busNumber}** (${r.busType || 'Normal'}) [LKR ${Number(r.priceStarting || 1157).toLocaleString()}]${seatsInfo}\n`;
        }
      }

      textOut += isEn
        ? `\n💡 *You can select and book your seat online right now.*`
        : `\n💡 *දැන්ම ආසන තෝරා Online වෙන්කරවා ගත හැක.*`;
    } else {
      textOut = isEn
        ? `🚌 **Dewmina Super Line Daily Bus Timetable**\n\n` +
          `📍 **Monaragala ➔ Colombo**\n` +
          `• Morning: 05:00 AM / 07:10 AM / 11:40 AM\n` +
          `• Night: 10:55 PM / 11:35 PM\n\n` +
          `📍 **Colombo ➔ Monaragala**\n` +
          `• Afternoon: 01:40 PM / 02:20 PM / 04:10 PM\n` +
          `• Evening: 06:00 PM / 06:50 PM\n\n` +
          `💡 *View live schedules below to select seats.*`
        : `🚌 **Dewmina Super Line දෛනික බස් කාලසටහන**\n\n` +
          `📍 **මොනරාගල ➔ කොළඹ**\n` +
          `• උදෑසන 05:00 AM / 07:10 AM / 11:40 AM\n` +
          `• රාත්‍රී 10:55 PM / 11:35 PM\n\n` +
          `📍 **කොළඹ ➔ මොනරාගල**\n` +
          `• දහවල් 01:40 PM / 02:20 PM / 04:10 PM\n` +
          `• සවස 06:00 PM / 06:50 PM\n\n` +
          `💡 *සජීවී ආසන ඇබෑර්තු සහ වෙන්කිරීම් සඳහා පහතින් කාලසටහන බලන්න.*`;
    }

    return {
      sender: 'bot',
      text: textOut,
      options: defaultOptions,
      actions: isEn ? [
        { type: 'VIEW_SCHEDULES', label: '📅 View All Schedules' },
        { type: 'BOOK_SEAT', label: '🎟️ Book a Seat' },
      ] : [
        { type: 'VIEW_SCHEDULES', label: '📅 සියලු කාලසටහන් බලන්න' },
        { type: 'BOOK_SEAT', label: '🎟️ ආසන වෙන්කරන්න' },
      ],
    };
  }

  // 3. Fares & Prices
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
    return {
      sender: 'bot',
      text: isEn
        ? `💵 **Dewmina Super Line Ticket Fares**\n\n` +
          `1️⃣ **Normal Express Service:** LKR 1,157\n` +
          `2️⃣ **Super Luxury A/C:** LKR 2,670\n\n` +
          `✅ **Included Amenities:**\n` +
          `• Comfortable Pushback Seats\n` +
          `• High-Speed Free Wi-Fi & USB Charging Ports\n` +
          `• Real-Time GPS Bus Tracking\n` +
          `• Instant WhatsApp E-Ticket Confirmation\n\n` +
          `*(Fares adhere to National Transport Commission guidelines)*`
        : `💵 **Dewmina Super Line ටිකට්පත් ගාස්තු**\n\n` +
          `1️⃣ **සාමාන්‍ය සේවාව (Normal Express):** LKR 1,157\n` +
          `2️⃣ **සුඛෝපභෝගී (Super Luxury A/C):** LKR 2,670\n\n` +
          `✅ **අමතර පහසුකම්:**\n` +
          `• සුවපහසු Pushback ආසන\n` +
          `• High-Speed Free Wi-Fi & USB Charging Ports\n` +
          `• GPS Live Tracking පහසුකම\n` +
          `• ක්ෂණික WhatsApp E-Ticket පත\n\n` +
          `*(ජාතික ගමනාගමන කොමිසමේ නීති අනුව මිල ගණන් සංශෝධනය විය හැක)*`,
      options: defaultOptions,
      actions: [
        { type: 'BOOK_SEAT', label: isEn ? '🎟️ Select a Seat' : '🎟️ ආසනයක් තෝරන්න' },
      ],
    };
  }

  // 4. How to Book
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
    return {
      sender: 'bot',
      text: isEn
        ? `💺 **How to Book Your Bus Seat**\n\n` +
          `Book easily in 4 quick steps:\n\n` +
          `1️⃣ **Select Route & Date:** Choose Origin (Monaragala), Destination (Colombo), and travel date.\n` +
          `2️⃣ **Choose Your Seat:** Pick your preferred seat from the interactive seat map.\n` +
          `3️⃣ **Passenger Info:** Enter your name and WhatsApp phone number.\n` +
          `4️⃣ **Payment:** Pay securely with Card or Bank Transfer (Slip Upload) to receive an instant WhatsApp E-Ticket! 🎉`
        : `💺 **ආසන වෙන්කරගන්නේ කෙසේද? (How to Book)**\n\n` +
          `පහසු පියවර 4කින් ඔබගේ ආසනය වෙන්කරවා ගන්න:\n\n` +
          `1️⃣ **ගමනාන්තය තෝරන්න:** ආරම්භය (Monaragala), ගමනාන්තය (Colombo) සහ ගමන් දිනය තෝරන්න.\n` +
          `2️⃣ **ආසනය තෝරන්න:** බස් රථයේ ආසන සිතියමෙන් (Seat Map) කැමති අසුනක් තෝරන්න.\n` +
          `3️⃣ **මගී විස්තර:** ඔබගේ නම සහ WhatsApp දුරකථන අංකය ඇතුළත් කරන්න.\n` +
          `4️⃣ **ගෙවීම:** Online Card මගින් හෝ Bank Transfer (Slip Upload) හරහා ගෙවා ක්ෂණික WhatsApp E-Ticket එක ලබාගන්න! 🎉`,
      options: defaultOptions,
      actions: [
        { type: 'BOOK_SEAT', label: isEn ? '🚀 Book Seat Now' : '🚀 දැන්ම ආසනයක් වෙන්කරන්න' },
      ],
    };
  }

  // 5. Contact / Conductor
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
    return {
      sender: 'bot',
      text: isEn
        ? `📞 **Dewmina Super Line Customer Support**\n\n` +
          `You can connect with us anytime via WhatsApp or phone call:\n\n` +
          `👤 **Seat Booking & Inquiries:**\n` +
          `📱 076 258 1841 (Online Support)\n\n` +
          `👤 **Express Dispatch & Helpline:**\n` +
          `📱 078 196 3397 (Route & Schedule 24/7 Helpline)\n\n` +
          `🏢 **Main Office:** Central Bus Stand, Monaragala`
        : `📞 **Dewmina Super Line සජීවී සහය සේවාව**\n\n` +
          `අපව WhatsApp හරහා හෝ දුරකථන ඇමතුමකින් සම්බන්ධ විය හැක:\n\n` +
          `👤 **Seat Booking & Inquiries:**\n` +
          `📱 076 258 1841 (Online Support)\n\n` +
          `👤 **Express Dispatch & Route Helpline:**\n` +
          `📱 078 196 3397 (24/7 Schedule Helpline)\n\n` +
          `🏢 **ප්‍රධාන කාර්යාලය:** බස් නැවතුම්පළ, මොනරාගල`,
      options: defaultOptions,
      actions: [
        { type: 'WHATSAPP_CONTACT', label: '💬 WhatsApp (076 258 1841)', data: { number: '94762581841' } },
        { type: 'WHATSAPP_CONTACT', label: '💬 WhatsApp (078 196 3397)', data: { number: '94781963397' } },
        { type: 'CALL_PHONE', label: isEn ? '📞 Call (076 258 1841)' : '📞 ඇමතුමක් ගන්න (076 258 1841)', data: { phone: '0762581841' } },
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
    return {
      sender: 'bot',
      text: isEn
        ? `🏦 **Dewmina Super Line Bank Account Details**\n\n` +
          `For bank deposits or online fund transfers:\n\n` +
          `• **Bank:** Commercial Bank\n` +
          `• **Account Name:** Dewmina Super Line Travels (Pvt) Ltd\n` +
          `• **Account Number:** 8009 2341 56\n` +
          `• **Branch:** Monaragala Branch\n\n` +
          `📌 *After deposit, please upload the receipt slip under 'Upload Slip' or send it via WhatsApp to the conductor.*`
        : `🏦 **Dewmina Super Line බැංකු ගිණුම් විස්තර**\n\n` +
          `බැංකු තැන්පතු හෝ Online Fund Transfer සඳහා:\n\n` +
          `• **බැංකුව:** Commercial Bank\n` +
          `• **ගිණුම් නම:** Dewmina Super Line Travels (Pvt) Ltd\n` +
          `• **ගිණුම් අංකය:** 8009 2341 56\n` +
          `• **ශාඛාව:** Monaragala Branch\n\n` +
          `📌 *මුදල් තැන්පත් කළ පසු රිසිට්පත (Slip) 'Upload Slip' පිටුවෙන් හෝ WhatsApp මගින් Conductor වෙත එවන්න.*`,
      options: defaultOptions,
      actions: [
        { type: 'VIEW_SLIP_UPLOAD', label: isEn ? '📤 Go to Slip Upload' : '📤 Slip Upload පිටුවට පිවිසෙන්න' },
        { type: 'WHATSAPP_CONTACT', label: isEn ? '💬 WhatsApp the Slip' : '💬 Slip එක WhatsApp කරන්න', data: { number: '94762581841' } },
      ],
    };
  }

  // 7. Greetings / Default Menu
  return {
    sender: 'bot',
    text: isEn
      ? `👋 **Welcome to Dewmina Super Line!**\n\n` +
        `Please select an option below or type your question or PNR number:\n\n` +
        `*1.* 🚌 Bus Timetables & Schedules\n` +
        `*2.* 💵 Ticket Fares & Prices\n` +
        `*3.* 💺 How to Book a Seat Online\n` +
        `*4.* 📞 Contact Conductor & Support`
      : `👋 **Dewmina Super Line වෙත සාදරයෙන් පිළිගනිමු!**\n\n` +
        `ඔබට අවශ්‍ය සේවාව පහත විකල්ප වලින් තෝරන්න හෝ ප්‍රශ්නය මෙහි සටහන් කරන්න:\n\n` +
        `*1.* 🚌 බස් කාලසටහන බැලීමට\n` +
        `*2.* 💵 ටිකට් මිල ගණන් බැලීමට\n` +
        `*3.* 💺 ආසන වෙන් කරගන්නා ආකාරය\n` +
        `*4.* 📞 Conductor සමඟ කතාබස් කිරීමට`,
    options: defaultOptions,
    actions: [
      { type: 'VIEW_SCHEDULES', label: isEn ? '🚌 View Schedules' : '🚌 කාලසටහන් බලන්න' },
      { type: 'BOOK_SEAT', label: isEn ? '🎟️ Book a Seat' : '🎟️ ආසනයක් වෙන්කරන්න' },
    ],
  };
}

/**
 * Send message to Bot with backend-first and seamless client fallback
 */
export async function sendChatMessage(incomingText: string, lang: 'si' | 'en' = 'si'): Promise<ChatMessage> {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const text = (incomingText || '').trim();
  const defaultOptions = lang === 'en' ? INITIAL_BOT_MESSAGE_EN.options : INITIAL_BOT_MESSAGE_SI.options;

  // Try backend first with a quick 3s timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await botApi.chat(text, lang);
    clearTimeout(timeoutId);

    if (res && res.success && res.text) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: res.text,
        timestamp,
        options: res.options || defaultOptions,
        actions: (res.actions as any) || undefined,
        pnrData: res.pnrData,
      };
    }
  } catch {
    // Fallback to client-side logic seamlessly
  }

  const fallback = await generateClientFallback(text, lang);
  return {
    id: `bot-${Date.now()}`,
    ...fallback,
    timestamp,
  };
}
