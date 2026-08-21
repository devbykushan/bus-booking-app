import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Printer, MapPin, MessageSquare, Bus, Clock, Calendar } from 'lucide-react';

export const TicketModal: React.FC = () => {
  const { latestConfirmedBooking, setCurrentView, goToSearchSchedules, setTrackingRouteId, t } = useBookingStore();
  const [showSMSModal, setShowSMSModal] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Confirmation Banner */}
      <div className="p-6 rounded-3xl border border-emerald-200 bg-emerald-50 text-center space-y-3 shadow-sm">
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

      {/* Printable Boarding Pass Card */}
      <div id="printable-ticket" className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm relative overflow-hidden space-y-6">
        
        {/* Top Ticket Header */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 pb-6 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs">
          
          <div className="space-y-1">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">{t('from')} & {t('selectBoardingPoint')}</span>
            <p className="text-base font-bold text-slate-800">{t(booking.origin.split(',')[0])}</p>
            <p className="text-blue-600 font-medium">{booking.boardingPoint.name}</p>
            <p className="text-slate-500 text-[11px]">{booking.boardingPoint.landmark} ({booking.boardingPoint.time})</p>
          </div>

          <div className="space-y-1 text-center md:border-x border-slate-200 md:px-4">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">{t('departureDate')}</span>
            <p className="text-base font-bold text-slate-800 flex items-center justify-center gap-1">
              <Calendar className="w-4 h-4 text-amber-500" /> {booking.departureDate}
            </p>
            <p className="text-amber-600 font-mono text-sm font-bold flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-amber-500" /> {booking.departureTime}
            </p>
          </div>

          <div className="space-y-1 md:text-right">
            <span className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">{t('destinationDrop')}</span>
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

          {/* Right Dynamic QR Code */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-950 space-y-2">
            <QRCodeSVG value={booking.qrCodeData} size={130} level="H" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              SCAN TO VALIDATE
            </span>
          </div>

        </div>

      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        
        <button
          onClick={handlePrint}
          className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-200 flex items-center gap-2 transition-all shadow-sm"
        >
          <Printer className="w-4 h-4" /> {t('printTicket')}
        </button>

        <button
          onClick={() => setShowSMSModal(true)}
          className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-blue-600 font-bold text-sm border border-slate-200 flex items-center gap-2 transition-all shadow-sm"
        >
          <MessageSquare className="w-4 h-4 text-blue-500" /> {t('sendAlert')}
        </button>

        <button
          onClick={() => {
            setTrackingRouteId(booking.routeId);
            setCurrentView('live-tracking');
          }}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition-all"
        >
          <MapPin className="w-4 h-4 text-white" /> {t('trackBus')}
        </button>

        <button
          onClick={goToSearchSchedules}
          className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm shadow-sm flex items-center gap-2 transition-all"
        >
          <Bus className="w-4 h-4 text-white" /> {t('backToSearch')}
        </button>

      </div>

      {/* WhatsApp / SMS Modal */}
      {showSMSModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full border border-slate-200 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" /> {t('smsAlertTitle')}
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
              📲 <strong>Dewmina Super Line:</strong> Hi {booking.passenger.fullName}, your booking for {booking.origin} → {booking.destination} on {booking.departureDate} is CONFIRMED. PNR: {booking.pnr}, Seats: {booking.seats.map(s => s.number).join(', ')}. Track bus live: https://dewminasuperline.lk/track/{booking.routeId}
            </p>
            <button
              onClick={() => setShowSMSModal(false)}
              className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs"
            >
              {t('closeAlert')}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
