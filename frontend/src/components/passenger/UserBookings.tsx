import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { Ticket, MapPin, XCircle } from 'lucide-react';

export const UserBookings: React.FC = () => {
  const { bookings, cancelBooking, setCurrentView, goToSearchSchedules, setTrackingRouteId } = useBookingStore();

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
      
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600" /> My Bus Bookings & Tickets
          </h2>
          <p className="text-xs text-slate-500">View upcoming journeys, download tickets, or track your bus in real time.</p>
        </div>
        <button
          onClick={goToSearchSchedules}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
        >
          + Book New Trip
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <Ticket className="w-12 h-12 text-slate-400 mx-auto" />
          <p className="text-slate-500 text-sm">No active bookings found.</p>
          <button
            onClick={goToSearchSchedules}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm"
          >
            Search Bus Routes
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-200 transition-all space-y-4 shadow-sm">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-800">{b.operatorName}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-mono">
                      PNR: {b.pnr}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 font-medium">
                    {b.origin} → {b.destination} ({b.departureTime})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    b.bookingStatus === 'confirmed'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : b.bookingStatus === 'boarded'
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}>
                    {b.bookingStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">Passenger</span>
                  <span className="font-semibold text-slate-800">{b.passenger.fullName}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Departure Date</span>
                  <span className="font-semibold text-slate-800">{b.departureDate}</span>
                </div>

                <div>
                  <span className="text-slate-400 block">Seats Reserved</span>
                  <span className="font-bold text-blue-600 font-mono">
                    {b.seats.map(s => s.number).join(', ')}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Total Fare</span>
                  <span className="font-extrabold text-slate-800 font-mono">LKR {b.totalFare.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="text-[11px] text-slate-500">
                  Boarding: <strong>{b.boardingPoint.name}</strong> ({b.boardingPoint.time})
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {b.bookingStatus === 'confirmed' && (
                    <button
                      onClick={() => handleCancel(b.pnr)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors flex items-center gap-1 font-semibold"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                    </button>
                  )}

                  <button
                    onClick={() => handleTrack(b.routeId)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors flex items-center gap-1.5 font-bold"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Track Live GPS
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
