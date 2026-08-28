import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { Ticket, MapPin, XCircle, Bus, Clock } from 'lucide-react';

export const UserBookings: React.FC = () => {
  const { bookings, cancelBooking, setCurrentView, goToSearchSchedules, setTrackingRouteId, currentUser, setShowAuthModal } = useBookingStore();

  const handleTrack = (routeId: string) => {
    setTrackingRouteId(routeId);
    setCurrentView('live-tracking');
  };

  const getCancellationInfo = (createdAtStr?: string, isAdmin?: boolean) => {
    if (isAdmin) return { canCancel: true, text: 'Admin Override', remainingMs: Infinity };
    if (!createdAtStr) return { canCancel: true, text: '', remainingMs: Infinity };

    const createdTime = new Date(createdAtStr).getTime();
    const now = Date.now();
    const fourHoursMs = 4 * 60 * 60 * 1000;
    const diffMs = fourHoursMs - (now - createdTime);

    if (diffMs <= 0) {
      return { canCancel: false, text: 'Cancellation window expired (> 4h)', remainingMs: 0 };
    }

    const totalMins = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    return { canCancel: true, text: `${timeStr} left to cancel`, remainingMs: diffMs };
  };

  const handleCancel = (pnr: string, canCancel: boolean, text: string) => {
    if (!canCancel) {
      alert(`❌ CANCEL NOT PERMITTED\n\nBookings can only be cancelled within 4 hours of booking.\n\nReason: ${text}`);
      return;
    }
    if (confirm(`Are you sure you want to cancel booking PNR ${pnr}?\n\nCancellation is permitted within 4 hours of booking.`)) {
      cancelBooking(pnr);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-6 animate-fade-in-up">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 md:p-12 text-center border border-slate-200 shadow-xl space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-sm animate-pulse-glow">
            <Ticket className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Sign In Required to View Your Tickets
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Please sign in to your passenger account or register a new account to access your active bus seat reservations, PNR details, live GPS tracking, and printable PDF e-tickets.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              Sign In or Register Account
            </button>
            <button
              onClick={goToSearchSchedules}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              Search Bus Routes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userBookings = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') return bookings;

    const userEmail = (currentUser.email || '').trim().toLowerCase();
    const userPhone = (currentUser.phone || '').trim().replace(/[\s-]/g, '');
    const userName = (currentUser.name || '').trim().toLowerCase();

    return bookings.filter(b => {
      const bEmail = (b.passenger?.email || '').trim().toLowerCase();
      const bPhone = (b.passenger?.phone || '').trim().replace(/[\s-]/g, '');
      const bName = (b.passenger?.fullName || '').trim().toLowerCase();

      if (userEmail && bEmail === userEmail) return true;
      if (userPhone && bPhone && (bPhone === userPhone || bPhone.endsWith(userPhone.slice(-9)))) return true;
      if (userName && bName === userName) return true;
      return false;
    });
  }, [bookings, currentUser]);

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

      {userBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <Ticket className="w-12 h-12 text-slate-400 mx-auto" />
          <p className="text-slate-500 text-sm">No active bookings found for your account ({currentUser.name}).</p>
          <button
            onClick={goToSearchSchedules}
            className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm"
          >
            Search Bus Routes
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {userBookings.map((b) => (
            <div key={b.id} className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-blue-200 transition-all space-y-4 shadow-sm">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-slate-800">{b.operatorName}</span>
                    {b.busNumber && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono font-bold flex items-center gap-1">
                        <Bus className="w-3 h-3 text-blue-600" />
                        {b.busNumber}
                      </span>
                    )}
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
                  {b.bookingStatus === 'confirmed' && (() => {
                    const cancelInfo = getCancellationInfo(b.createdAt, currentUser?.role === 'admin');
                    return cancelInfo.canCancel ? (
                      <button
                        onClick={() => handleCancel(b.pnr, cancelInfo.canCancel, cancelInfo.text)}
                        className="px-3.5 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-300 transition-all flex items-center gap-1.5 font-bold shadow-xs cursor-pointer active:scale-95"
                        title={cancelInfo.text ? `Cancellation active (${cancelInfo.text})` : 'Cancel booking'}
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Cancel Booking</span>
                        {cancelInfo.text && cancelInfo.text !== 'Admin Override' && (
                          <span className="text-[10px] font-mono bg-rose-200/60 text-rose-800 px-1.5 py-0.5 rounded-md ml-0.5">
                            {cancelInfo.text}
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold" title="Bookings can only be cancelled within 4 hours of booking creation.">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Cancel Expired (&gt;4h)</span>
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => handleTrack(b.routeId)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors flex items-center gap-1.5 font-bold"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Track Live GPS <span className="text-[10px] text-amber-700 font-black uppercase bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">Soon</span>
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
