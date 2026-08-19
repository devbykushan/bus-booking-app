import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { Ticket, MapPin, XCircle } from 'lucide-react';

export const UserBookings: React.FC = () => {
  const { bookings, cancelBooking, setCurrentView, setTrackingRouteId } = useBookingStore();

  const handleTrack = (routeId: string) => {
    setTrackingRouteId(routeId);
    setCurrentView('live-tracking');
  };

  const handleCancel = (pnr: string) => {
    if (confirm(`Are you sure you want to cancel booking PNR ${pnr}? Full refund will be credited.`)) {
      cancelBooking(pnr);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-teal-400" /> My Bus Bookings & Tickets
          </h2>
          <p className="text-xs text-slate-400">View upcoming journeys, download tickets, or track your bus in real time.</p>
        </div>
        <button
          onClick={() => setCurrentView('passenger-search')}
          className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md"
        >
          + Book New Trip
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-slate-800 space-y-4">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400 text-sm">No active bookings found.</p>
          <button
            onClick={() => setCurrentView('passenger-search')}
            className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg"
          >
            Search Bus Routes
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="glass-card p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{b.operatorName}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                      PNR: {b.pnr}
                    </span>
                  </div>
                  <p className="text-xs text-teal-400 font-medium">
                    {b.origin} → {b.destination} ({b.departureTime})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    b.bookingStatus === 'confirmed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : b.bookingStatus === 'boarded'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {b.bookingStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Passenger</span>
                  <span className="font-semibold text-white">{b.passenger.fullName}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Departure Date</span>
                  <span className="font-semibold text-white">{b.departureDate}</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Seats Reserved</span>
                  <span className="font-bold text-teal-300 font-mono">
                    {b.seats.map(s => s.number).join(', ')}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Total Fare</span>
                  <span className="font-extrabold text-white font-mono">${b.totalFare.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                <div className="text-[11px] text-slate-400">
                  Boarding: <strong>{b.boardingPoint.name}</strong> ({b.boardingPoint.time})
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {b.bookingStatus === 'confirmed' && (
                    <button
                      onClick={() => handleCancel(b.pnr)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-rose-400 border border-rose-900/50 transition-colors flex items-center gap-1 font-semibold"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                    </button>
                  )}

                  <button
                    onClick={() => handleTrack(b.routeId)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition-colors flex items-center gap-1.5 font-bold"
                  >
                    <MapPin className="w-3.5 h-3.5 text-teal-400" /> Track Live GPS
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
