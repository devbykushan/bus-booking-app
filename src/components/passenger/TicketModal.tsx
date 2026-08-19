import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Download, Printer, MapPin, Share2, MessageSquare, Phone, Bus, Clock, Calendar } from 'lucide-react';

export const TicketModal: React.FC = () => {
  const { latestConfirmedBooking, setCurrentView, setTrackingRouteId } = useBookingStore();
  const [showSMSModal, setShowSMSModal] = useState(false);

  if (!latestConfirmedBooking) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">No recent ticket found.</p>
        <button onClick={() => setCurrentView('passenger-search')} className="mt-4 px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl">
          Back to Search
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
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 text-center space-y-3 shadow-xl">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white">Booking Confirmed!</h2>
        <p className="text-slate-300 text-sm max-w-xl mx-auto">
          Your bus seat reservation is locked and confirmed. We’ve sent your E-Ticket to <strong className="text-white">{booking.passenger.email}</strong>.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/80 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-sm">
          <span>PNR CODE: {booking.pnr}</span>
        </div>
      </div>

      {/* Printable Boarding Pass Card */}
      <div id="printable-ticket" className="glass-card rounded-3xl p-6 md:p-8 border border-slate-700 bg-slate-900/90 shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Top Ticket Header */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500 flex items-center justify-center text-slate-950 font-extrabold text-xl shadow-lg shadow-teal-500/20">
              <Bus className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">{booking.operatorName}</h3>
              <p className="text-xs text-slate-400 font-mono">{booking.busType} • {booking.busNumber}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-widest block">Status</span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase">
              {booking.bookingStatus} & Paid
            </span>
          </div>
        </div>

        {/* Journey Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-800 text-xs">
          
          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Origin & Boarding Point</span>
            <p className="text-base font-bold text-white">{booking.origin}</p>
            <p className="text-teal-300 font-medium">{booking.boardingPoint.name}</p>
            <p className="text-slate-400 text-[11px]">{booking.boardingPoint.landmark} ({booking.boardingPoint.time})</p>
          </div>

          <div className="space-y-1 text-center md:border-x border-slate-800 md:px-4">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Departure Date & Time</span>
            <p className="text-base font-bold text-white flex items-center justify-center gap-1">
              <Calendar className="w-4 h-4 text-amber-400" /> {booking.departureDate}
            </p>
            <p className="text-amber-300 font-mono text-sm font-bold flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-amber-400" /> {booking.departureTime}
            </p>
          </div>

          <div className="space-y-1 md:text-right">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">Destination & Drop Point</span>
            <p className="text-base font-bold text-white">{booking.destination}</p>
            <p className="text-indigo-300 font-medium">{booking.dropPoint.name}</p>
          </div>

        </div>

        {/* Seats, Passenger Info & Dynamic QR Code */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-t border-slate-800 pt-6">
          
          {/* Left Passenger Specs */}
          <div className="md:col-span-8 space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-500 block font-medium">Passenger Name</span>
                <span className="text-sm font-bold text-white">{booking.passenger.fullName}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Reserved Seats</span>
                <span className="text-sm font-extrabold text-teal-400 font-mono">
                  {booking.seats.map(s => s.number).join(', ')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-medium">Total Paid Amount</span>
                <span className="text-sm font-extrabold text-white font-mono">${booking.totalFare.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 text-[11px] leading-relaxed">
              💡 <strong>Boarding Instructions:</strong> Please present this E-Ticket or PNR code with a valid photo ID at the boarding gate. Conductor will scan the QR code before boarding.
            </div>
          </div>

          {/* Right Dynamic QR Code */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl text-slate-950 space-y-2">
            <QRCodeSVG value={booking.qrCodeData} size={130} level="H" />
            <span className="font-mono text-[10px] font-bold tracking-widest text-slate-700 uppercase">
              SCAN TO VALIDATE
            </span>
          </div>

        </div>

      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        
        <button
          onClick={handlePrint}
          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 flex items-center gap-2 transition-all"
        >
          <Printer className="w-4 h-4" /> Print / Save Ticket PDF
        </button>

        <button
          onClick={() => setShowSMSModal(true)}
          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-sm border border-slate-700 flex items-center gap-2 transition-all"
        >
          <MessageSquare className="w-4 h-4 text-teal-400" /> Send WhatsApp / SMS Alert
        </button>

        <button
          onClick={() => {
            setTrackingRouteId(booking.routeId);
            setCurrentView('live-tracking');
          }}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-teal-500/25 flex items-center gap-2 transition-all"
        >
          <MapPin className="w-4 h-4 text-white animate-bounce" /> Track Bus Live Location
        </button>

      </div>

      {/* WhatsApp / SMS Modal Simulation */}
      {showSMSModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" /> WhatsApp & SMS Ticket Sent
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono">
              📲 <strong>OmniBus Alert:</strong> Hi {booking.passenger.fullName}, your booking for {booking.origin} → {booking.destination} on {booking.departureDate} is CONFIRMED. PNR: {booking.pnr}, Seats: {booking.seats.map(s => s.number).join(', ')}. Track bus live: https://omnibus.app/track/{booking.routeId}
            </p>
            <button
              onClick={() => setShowSMSModal(false)}
              className="w-full py-2.5 bg-teal-500 text-slate-950 font-bold rounded-xl text-xs"
            >
              Close Alert
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
