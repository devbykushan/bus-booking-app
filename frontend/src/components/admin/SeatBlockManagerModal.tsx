import React, { useState } from 'react';
import type { BusRoute, Seat } from '../../types/booking';
import { seatsAdminApi } from '../../services/api';
import { useBookingStore } from '../../store/bookingStore';
import { X, Lock, Unlock, ShieldAlert, Bus, Wrench, CheckCircle2, RefreshCw } from 'lucide-react';

interface Props {
  route: BusRoute;
  onClose: () => void;
}

export const SeatBlockManagerModal: React.FC<Props> = ({ route, onClose }) => {
  const { loadRoutes } = useBookingStore();
  const [seats, setSeats] = useState<Seat[]>(route.seats || []);
  const [togglingSeatId, setTogglingSeatId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleToggleBlock = async (seat: Seat) => {
    if (seat.status === 'booked') {
      alert(`Seat ${seat.number} is already booked by a passenger and cannot be blocked.`);
      return;
    }

    setTogglingSeatId(seat.id);
    setMessage(null);

    try {
      const res = await seatsAdminApi.toggleBlock(seat.id);
      if (res.success) {
        setSeats(prev => prev.map(s => {
          if (s.id === seat.id) {
            return { ...s, status: res.status };
          }
          return s;
        }));
        setMessage(`Seat ${seat.number} is now ${res.status === 'blocked' ? 'BLOCKED (Maintenance/Reserved)' : 'AVAILABLE for booking'}.`);
        loadRoutes(); // Refresh global routes cache
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'Failed to update seat status');
    } finally {
      setTogglingSeatId(null);
    }
  };

  const blockedCount = seats.filter(s => s.status === 'blocked').length;
  const bookedCount = seats.filter(s => s.status === 'booked').length;
  const availableCount = seats.filter(s => s.status === 'available').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">Seat Maintenance & Lock Manager</h3>
              <p className="text-xs text-slate-500">Block or reserve individual seats for conductor, VIP or repairs</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Route info & stats */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">{route.busNumber} • {route.busType}</h4>
              <p className="text-slate-500">{route.origin} → {route.destination} ({route.departureTime})</p>
            </div>
            <div className="flex items-center gap-3 font-bold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {availableCount} Available
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {blockedCount} Blocked
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> {bookedCount} Booked
              </span>
            </div>
          </div>

          {message && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Click any <strong>Available</strong> seat to Block it (Lock for Maintenance / VIP). Click any <strong>Blocked</strong> seat to release it back to passengers.</span>
          </div>

          {/* Seat Grid */}
          <div className="p-5 rounded-2xl bg-slate-100/70 border border-slate-200">
            <div className="max-w-md mx-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                <span>Front Entrance & Driver</span>
                <Bus className="w-4 h-4 text-slate-400" />
              </div>

              <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                {seats.map((seat) => {
                  const isBlocked = seat.status === 'blocked';
                  const isBooked = seat.status === 'booked';
                  const isToggling = togglingSeatId === seat.id;

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={isBooked || isToggling}
                      onClick={() => handleToggleBlock(seat)}
                      title={`Seat ${seat.number} (${seat.status})`}
                      className={`relative aspect-square rounded-xl p-1 font-mono font-bold text-xs flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isBooked
                          ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                          : isBlocked
                          ? 'bg-amber-500 text-white border-2 border-amber-600 shadow-xs hover:bg-amber-600'
                          : 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500'
                      }`}
                    >
                      {isToggling ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : isBlocked ? (
                        <Lock className="w-3 h-3 text-amber-100 mb-0.5" />
                      ) : isBooked ? (
                        <span className="text-[9px] text-slate-400 mb-0.5">SOLD</span>
                      ) : (
                        <Unlock className="w-3 h-3 text-emerald-600 mb-0.5" />
                      )}
                      <span>{seat.number}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 text-center text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Rear Back Row
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
