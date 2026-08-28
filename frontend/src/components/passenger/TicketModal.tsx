import React, { useState, useEffect, useRef } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Printer, MapPin, MessageSquare, Bus, Clock, Calendar, Send, Copy, Check, ExternalLink, X, Smartphone, Settings2, Zap } from 'lucide-react';

export const TicketModal: React.FC = () => {
  const { latestConfirmedBooking, setCurrentView, goToSearchSchedules, setTrackingRouteId, validateTicketByPNR, t } = useBookingStore();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [sentToast, setSentToast] = useState(false);
  const [autoSendBlocked, setAutoSendBlocked] = useState(false);
  const [qrValidationResult, setQrValidationResult] = useState<{ success: boolean; booking?: any; message: string } | null>(null);
  const [isValidatingQr, setIsValidatingQr] = useState(false);
  const hasAutoSent = useRef(false);

  if (!latestConfirmedBooking) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">{t('noRecentTicket')}</p>
        <button onClick={goToSearchSchedules} className="mt-4 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl">
          {t('backToSearch')}
        </button>
      </div>
    );
  }

  const booking = latestConfirmedBooking;

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppMessageText = () => {
    return `🚌 *DEWMINA SUPER LINE - E-TICKET CONFIRMATION*

🎟️ *PNR Code:* ${booking.pnr}
👤 *Passenger:* ${booking.passenger.fullName}
` + "🚍 *Bus:* " + booking.operatorName + " • " + booking.busNumber + " (" + booking.busType + ")" + `
` + "🛣️ *Route:* " + booking.origin + " ➔ " + booking.destination + `
📅 *Departure Date:* ${booking.departureDate}
⏰ *Departure Time:* ${booking.departureTime}
📍 *Boarding Point:* ${booking.boardingPoint.name} (${booking.boardingPoint.time})
💺 *Reserved Seats:* ${booking.seats.map(s => s.number).join(', ')}
💳 *Total Paid:* LKR ${booking.totalFare.toLocaleString()}

Thank you for booking with Dewmina Super Line! Have a safe journey! 🌟`;
  };

  const formatWhatsAppPhone = (rawPhone: string) => {
    let clean = (rawPhone || '').replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '94' + clean.slice(1);
    } else if (!clean.startsWith('94') && clean.length === 9) {
      clean = '94' + clean;
    }
    return clean;
  };

  const handleSendViaWhatsApp = (phoneToUse?: string) => {
    const rawPhone = phoneToUse || phoneInput || booking.passenger.phone || '';
    const cleanPhone = formatWhatsAppPhone(rawPhone);
    const textMsg = getWhatsAppMessageText();
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textMsg)}`;
    window.open(whatsappUrl, '_blank');
    setSentToast(true);
    setAutoSendBlocked(false);
    setTimeout(() => setSentToast(false), 5000);
  };

  // Auto-send WhatsApp alert on screen load
  useEffect(() => {
    if (booking && !hasAutoSent.current) {
      hasAutoSent.current = true;
      const rawPhone = booking.passenger.phone || '';
      if (rawPhone) {
        const cleanPhone = formatWhatsAppPhone(rawPhone);
        const textMsg = getWhatsAppMessageText();
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(textMsg)}`;
        
        try {
          const win = window.open(whatsappUrl, '_blank');
          if (!win || win.closed || typeof win.closed === 'undefined') {
            setAutoSendBlocked(true);
          } else {
            setSentToast(true);
          }
        } catch (e) {
          setAutoSendBlocked(true);
        }
      }
    }
  }, [booking?.id]);

  const handleOpenWhatsAppModal = () => {
    setPhoneInput(booking.passenger.phone || '');
    setShowWhatsAppModal(true);
  };

  const handleCopyWhatsAppText = () => {
    navigator.clipboard.writeText(getWhatsAppMessageText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScanValidateQR = async () => {
    if (!booking) return;
    setIsValidatingQr(true);
    const res = await validateTicketByPNR(booking.pnr);
    setQrValidationResult(res);
    setIsValidatingQr(false);
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const qrCodeValue = `${currentOrigin}/#validate?pnr=${booking.pnr}&pass=${encodeURIComponent(booking.passenger.fullName)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* Confirmation Banner */}
      <div className="no-print p-6 rounded-3xl border border-emerald-200 bg-emerald-50 text-center space-y-3 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">{t('bookingSuccessful')}</h2>
        <p className="text-slate-600 text-sm max-w-xl mx-auto">
          Your bus seat reservation is locked and confirmed. We’ve sent your E-Ticket to <strong className="text-slate-800">{booking.passenger.email}</strong>.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-700 font-mono font-bold text-sm">
          <span>{t('pnrCode')} {booking.pnr}</span>
        </div>
      </div>

      {/* Automatic WhatsApp Alert Dispatch Banner */}
      <div className={`no-print p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm border transition-all ${
        autoSendBlocked
          ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
          : 'bg-emerald-600 text-white border-emerald-500'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-sm leading-tight">
              {autoSendBlocked ? '⚡ Tap to Auto-Send WhatsApp Ticket' : '✅ Automatic WhatsApp Dispatch Active'}
            </p>
            <p className="text-[11px] font-normal opacity-90">
              Sending E-Ticket to <strong className="font-mono">+{formatWhatsAppPhone(booking.passenger.phone)}</strong> via WhatsApp.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleSendViaWhatsApp(booking.passenger.phone)}
          className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5 text-emerald-700" />
          <span>Auto Send Now</span>
        </button>
      </div>

      {/* WhatsApp Toast Notification */}
      {sentToast && (
        <div className="no-print p-4 rounded-2xl bg-emerald-700 text-white font-bold text-xs flex items-center justify-between shadow-lg animate-fade-in-up">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-200" />
            <span>WhatsApp launched! Ticket confirmation message sent to +{formatWhatsAppPhone(booking.passenger.phone)}.</span>
          </div>
          <button onClick={() => setSentToast(false)} className="text-emerald-200 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* Printable Boarding Pass Card */}
      <div id="printable-ticket" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden space-y-6">
        
        {/* Top Ticket Header */}
        <div className="ticket-header flex flex-col md:flex-row items-center justify-between border-b border-slate-200 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-sm">
              <Bus className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{booking.operatorName}</h3>
              <p className="text-xs text-slate-500 font-mono">{booking.busType} • {booking.busNumber}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-widest block">{t('status')}</span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold uppercase">
              {booking.bookingStatus} & Paid
            </span>
          </div>
        </div>

        {/* Journey Details Grid */}
        <div className="journey-grid grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs">
          
          <div className="space-y-1">
            <span className="text-blue-600 uppercase tracking-wider text-[10px] font-bold flex items-center gap-1.5">
              <span className="relative flex items-center justify-center w-4 h-4 rounded bg-blue-100 text-blue-600">
                <MapPin className="w-2.5 h-2.5 animate-from-icon" />
              </span>
              {t('from')} & {t('selectBoardingPoint')}
            </span>
            <p className="text-base font-bold text-slate-800">{t(booking.origin.split(',')[0])}</p>
            <p className="text-blue-600 font-medium">{booking.boardingPoint.name}</p>
            <p className="text-slate-500 text-[11px]">{booking.boardingPoint.landmark} ({booking.boardingPoint.time})</p>
          </div>

          <div className="space-y-1 text-center md:border-x border-slate-200 md:px-4">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">{t('departureDate')}</span>
            <p className="text-base font-bold text-slate-800 flex items-center justify-center gap-1">
              <Calendar className="w-4 h-4 text-amber-500 animate-date-icon" /> {booking.departureDate}
            </p>
            <p className="text-amber-600 font-mono text-sm font-bold flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-amber-500" /> {booking.departureTime}
            </p>
          </div>

          <div className="space-y-1 md:text-right">
            <span className="text-indigo-600 uppercase tracking-wider text-[10px] font-bold flex items-center md:justify-end gap-1.5">
              <span className="relative flex items-center justify-center w-4 h-4 rounded bg-indigo-100 text-indigo-600">
                <MapPin className="w-2.5 h-2.5 animate-to-icon" />
              </span>
              {t('destinationDrop')}
            </span>
            <p className="text-base font-bold text-slate-800">{t(booking.destination.split(',')[0])}</p>
            <p className="text-indigo-600 font-medium">{booking.dropPoint.name}</p>
          </div>

        </div>

        {/* Seats, Passenger Info & Dynamic QR Code */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-t border-slate-200 pt-6">
          
          {/* Left Passenger Specs */}
          <div className="md:col-span-8 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-400 block font-medium">{t('passengerName')}</span>
                <span className="text-sm font-bold text-slate-800">{booking.passenger.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">{t('selectedSeats')}</span>
                <span className="text-sm font-extrabold text-blue-600 font-mono">
                  {booking.seats.map(s => s.number).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">{t('totalPaid')}</span>
                <span className="text-sm font-extrabold text-slate-800 font-mono">LKR {booking.totalFare.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              💡 <strong>{t('boardingInstructions')}</strong> Please present this E-Ticket or PNR code with a valid photo ID at the boarding gate. Conductor will scan the QR code before boarding.
            </div>
          </div>

          {/* Right Dynamic Interactive QR Code */}
          <div
            onClick={handleScanValidateQR}
            className="qr-container md:col-span-4 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 shadow-2xs text-slate-950 space-y-2 cursor-pointer transition-all group relative"
            title="Click to validate QR Code PNR status"
          >
            <div className="relative flex items-center justify-center">
              <QRCodeSVG value={qrCodeValue} size={135} level="H" includeMargin={true} />
              {isValidatingQr && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center rounded-lg">
                  <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <span className="font-mono text-[10px] font-bold tracking-widest text-slate-500 group-hover:text-emerald-600 uppercase flex items-center gap-1 transition-colors no-print">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> SCAN / CLICK TO VALIDATE
            </span>
          </div>

        </div>

      </div>

      {/* Action Buttons Row */}
      <div className="no-print flex flex-wrap items-center justify-center gap-4">
        
        <button
          onClick={handlePrint}
          className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4 text-slate-500" /> {t('printTicket')}
        </button>

        {/* 1-Click WhatsApp Direct Auto Send Button */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleSendViaWhatsApp(booking.passenger.phone)}
            className="px-6 py-3 rounded-l-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            title="Auto send ticket via WhatsApp to passenger mobile"
          >
            <MessageSquare className="w-4 h-4 text-white" /> {t('sendAlert')}
          </button>
          <button
            onClick={handleOpenWhatsAppModal}
            className="px-3 py-3 rounded-r-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md border-l border-emerald-500 transition-all cursor-pointer"
            title="Change phone number or preview ticket message"
          >
            <Settings2 className="w-4 h-4 text-white" />
          </button>
        </div>

        <button
          onClick={() => {
            setTrackingRouteId(booking.routeId);
            setCurrentView('live-tracking');
          }}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <MapPin className="w-4 h-4 text-white" /> {t('trackBus')} <span className="text-[9px] font-black uppercase bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded">Soon</span>
        </button>

        <button
          onClick={goToSearchSchedules}
          className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer"
        >
          <Bus className="w-4 h-4 text-white" /> {t('backToSearch')}
        </button>

      </div>

      {/* Live QR Validation Status Result Modal */}
      {qrValidationResult && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full border border-slate-200 space-y-4 shadow-2xl text-center animate-pop-in">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
              qrValidationResult.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
            }`}>
              {qrValidationResult.success ? <CheckCircle2 className="w-8 h-8" /> : <X className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {qrValidationResult.success ? 'Ticket Verified & Validated! ✅' : 'Validation Failed ❌'}
            </h3>
            <p className="text-xs text-slate-600 font-semibold">{qrValidationResult.message}</p>
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-1.5 font-mono">
              <div className="flex justify-between"><span className="text-slate-400">PNR Code:</span> <strong className="text-slate-800">{booking.pnr}</strong></div>
              <div className="flex justify-between"><span className="text-slate-400">Passenger:</span> <strong className="text-slate-800">{booking.passenger.fullName}</strong></div>
              <div className="flex justify-between"><span className="text-slate-400">Route:</span> <strong className="text-slate-800">{booking.origin} ➔ {booking.destination}</strong></div>
              <div className="flex justify-between"><span className="text-slate-400">Seats:</span> <strong className="text-blue-600">{booking.seats.map(s => s.number).join(', ')}</strong></div>
            </div>

            <button
              onClick={() => setQrValidationResult(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close Validation Report
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Dispatcher Modal (For custom number or message preview) */}
      {showWhatsAppModal && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl max-w-lg w-full border border-slate-200 space-y-5 shadow-2xl animate-pop-in">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {t('smsAlertTitle')}
                  </h3>
                  <p className="text-xs text-slate-500">Dispatch ticket confirmation directly via WhatsApp</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recipient Phone Input Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Mobile Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 px-2 py-1 rounded bg-slate-100 text-[11px] font-bold text-slate-600 border border-slate-200 flex items-center gap-1">
                  <span>🇱🇰</span> +94
                </div>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="077 123 4567"
                  className="w-full pl-20 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400">Pre-filled from booking contact information.</p>
            </div>

            {/* WhatsApp Text Message Preview Card */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 font-sans">Formatted Ticket Message</span>
                <button
                  type="button"
                  onClick={handleCopyWhatsAppText}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-800 space-y-2 font-sans max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                <div className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <span>📲 WhatsApp Preview</span>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-700">
                  {getWhatsAppMessageText()}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  handleSendViaWhatsApp(phoneInput);
                  setShowWhatsAppModal(false);
                }}
                className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4 text-white" />
                <span>Send Ticket on WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
              </button>

              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="w-full sm:w-auto py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
