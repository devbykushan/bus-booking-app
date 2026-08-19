import React from 'react';
import type { BusRoute } from '../../types/booking';
import { useBookingStore } from '../../store/bookingStore';
import { Star, Clock, Wifi, Zap, MapPin, Armchair, ChevronRight } from 'lucide-react';

interface BusCardProps {
  route: BusRoute;
}

export const BusCard: React.FC<BusCardProps> = ({ route }) => {
  const { setSelectedRoute, setCurrentView, setTrackingRouteId } = useBookingStore();

  const handleSelectSeats = () => {
    setSelectedRoute(route);
    setCurrentView('seat-selection');
  };

  const handleLiveTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTrackingRouteId(route.id);
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 hover:border-teal-500/50 transition-all duration-300 relative group overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between lg:justify-start gap-3">
            <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-teal-300 transition-colors">
              {route.operatorName}
            </h3>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{route.operatorRating}</span>
            </div>
            <span className="text-xs text-slate-400 font-mono px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
              {route.busNumber}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20 font-medium">
              {route.busType}
            </span>
            {route.hasUpperDeck && (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium flex items-center gap-1">
                <Armchair className="w-3.5 h-3.5" /> Double Deck (Upper & Lower)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-400 text-xs pt-1">
            {route.amenities.map(a => (
              <span key={a} className="flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded text-[11px]">
                {a === 'Wi-Fi' && <Wifi className="w-3 h-3 text-teal-400" />}
                {a === 'Power Outlet' && <Zap className="w-3 h-3 text-amber-400" />}
                {a === 'Live GPS' && <MapPin className="w-3 h-3 text-pink-400" />}
                {a}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-center gap-6 px-4 py-3 bg-slate-900/70 rounded-xl border border-slate-800/80">
          <div className="text-center">
            <p className="text-base font-bold text-white">{route.departureTime}</p>
            <p className="text-xs text-slate-400 font-medium">{route.origin.split(',')[0]}</p>
          </div>

          <div className="flex flex-col items-center gap-1 px-3">
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-teal-400" /> {route.duration}
            </span>
            <div className="w-20 md:w-24 h-0.5 bg-gradient-to-r from-teal-500 via-indigo-500 to-pink-500 rounded-full relative">
              <div className="w-2 h-2 rounded-full bg-teal-400 absolute -top-0.75 left-0" />
              <div className="w-2 h-2 rounded-full bg-pink-400 absolute -top-0.75 right-0" />
            </div>
            <span className="text-[10px] text-teal-300 font-semibold">Direct Route</span>
          </div>

          <div className="text-center">
            <p className="text-base font-bold text-white">{route.arrivalTime}</p>
            <p className="text-xs text-slate-400 font-medium">{route.destination.split(',')[0]}</p>
          </div>
        </div>

        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-800">
          <div className="text-left lg:text-right">
            <span className="text-xs text-slate-400">Starting from</span>
            <p className="text-2xl font-extrabold text-white font-mono tracking-tight">
              ${route.priceStarting}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {route.availableSeatsCount} seats left
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLiveTrack}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition-colors"
              title="Track Live GPS Location"
            >
              <MapPin className="w-4 h-4 text-teal-400" />
            </button>

            <button
              onClick={handleSelectSeats}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
            >
              <span>View Seats</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
