import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { Ticket, MapPin, XCircle, Bus, Clock, Download } from 'lucide-react';

export const UserBookings: React.FC = () => {
  const { bookings, cancelBooking, setCurrentView, goToSearchSchedules, setTrackingRouteId, currentUser, setShowAuthModal, setLatestConfirmedBooking, language } = useBookingStore();

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

  const userBookings = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin' || currentUser.role === 'super_admin') return bookings;

    const userEmail = (currentUser.email || '').trim().toLowerCase();
    const userPhone = (currentUser.phone || '').trim().replace(/[\s-]/g, '');
    const userName = (currentUser.name || '').trim().toLowerCase();

    return bookings.filter(b => {
      const bEmail = (b.passenger?.email || '').trim().toLowerCase();
      const bPhone = (b.passenger?.phone || '').trim().replace(/[\s-]/g, '');
      const bName = (b.passenger?.fullName || '').trim().toLowerCase();

      return (
        (userEmail && bEmail === userEmail) ||
        (userPhone && bPhone === userPhone) ||
        (userName && bName === userName)
      );
    });
  }, [bookings, currentUser]);

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
            <button
              onClick={() => {
                setCurrentView('live-tracking');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 font-bold text-xs border border-cyan-200 dark:border-cyan-800 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{language === 'sinhala' ? 'සජීවී බස් සිතියම' : 'Track Bus Live (GPS)'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600" /> My Bus Bookings & Tickets
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">View upcoming journeys, download tickets, or track your bus in real time.</p>
        </div>
        <button
          onClick={goToSearchSchedules}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
        >
          + Book New Trip
        </button>
      </div>

      {/* ── Live Bus GPS Tracking Quick Banner ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-indigo-950/80 border border-blue-500/30 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3.5">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-400/30 text-cyan-400 flex items-center justify-center shadow-inner">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                {language === 'sinhala' ? 'සජීවී බස් රථ සිතියම (Live GPS)' : 'Live Bus GPS Tracking Map'}
              </h3>
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {language === 'sinhala'
                ? 'මාර්ග අංක 98 බස් රථ වල සජීවී පිහිටීම සිතියම මත ඕනෑම වේලාවක නිරීක්ෂණය කරන්න.'
                : 'Monitor real-time positions of active buses along Route 98 on the interactive map.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setCurrentView('live-tracking');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-md shadow-blue-900/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>{language === 'sinhala' ? 'සිතියම විවෘත කරන්න' : 'Open Live Map'}</span>
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

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {b.bookingStatus === 'confirmed' && (
                    <>
                      <button
                        onClick={() => {
                          setLatestConfirmedBooking(b);
                          setCurrentView('ticket-confirmation');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors flex items-center gap-1.5 font-bold shadow-xs cursor-pointer active:scale-95"
                      >
                        <Bus className="w-3.5 h-3.5 text-blue-600" />
                        <span>View Ticket</span>
                      </button>

                      <button
                        onClick={() => {
                          const text = `🚌 DEWMINA SUPER LINE - E-TICKET 🚌\n\n🎟️ PNR Code: ${b.pnr}\n👤 Passenger: ${b.passenger.fullName}\n🚍 Bus: ${b.operatorName} • ${b.busNumber} (${b.busType})\n🛣️ Route: ${b.origin} ➔ ${b.destination}\n📅 Departure Date: ${b.departureDate}\n⏰ Departure Time: ${b.departureTime}\n📍 Boarding Point: ${b.boardingPoint.name} (${b.boardingPoint.time})\n💺 Reserved Seats: ${b.seats.map(s => s.number).join(', ')}\n💳 Total Paid: LKR ${b.totalFare.toLocaleString()}\n\nThank you for booking with Dewmina Super Line! Have a safe journey! 🌟`;
                          const blob = new Blob([text], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `E-Ticket-${b.pnr}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5 text-white" />
                        <span>Download</span>
                      </button>
                    </>
                  )}

                  {b.bookingStatus === 'confirmed' && (() => {
                    const cancelInfo = getCancellationInfo(b.createdAt, currentUser?.role === 'admin' || currentUser?.role === 'super_admin');
                    return cancelInfo.canCancel ? (
                      <button
                        onClick={() => handleCancel(b.pnr, cancelInfo.canCancel, cancelInfo.text)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-300 transition-all flex items-center gap-1.5 font-bold shadow-xs cursor-pointer active:scale-95"
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
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-semibold" title="Bookings can only be cancelled within 4 hours of booking creation.">
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
