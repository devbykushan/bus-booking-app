import React from 'react';
import type { BusRoute } from '../../types/booking';
import { useBookingStore } from '../../store/bookingStore';
import { Star, Clock, Wifi, Zap, MapPin, Armchair, ChevronRight } from 'lucide-react';

interface BusCardProps {
  route: BusRoute;
}

export const BusCard: React.FC<BusCardProps> = ({ route }) => {
  const { setSelectedRoute, setCurrentView, setTrackingRouteId, setShowAuthModal, t } = useBookingStore();

  const handleSelectSeats = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      // User is not logged in, trigger the login modal
      setShowAuthModal(true);
      return;
    }
    setSelectedRoute(route);
    setCurrentView('seat-selection');
  };

  const handleLiveTrack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTrackingRouteId(route.id);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-300 transition-all duration-300 relative group overflow-hidden shadow-sm hover:shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="flex items-center justify-between lg:justify-start gap-3">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">
              {route.operatorName}
            </h3>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{route.operatorRating}</span>
            </div>
            <span className="text-xs text-slate-500 font-mono px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
              {route.busNumber}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 font-medium">
              {route.busType}
            </span>
            {route.hasUpperDeck && (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 font-medium flex items-center gap-1">
                <Armchair className="w-3.5 h-3.5" /> {t('upperLowerDeck')}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-500 text-xs pt-1">
            {route.amenities.map(a => (
              <span key={a} className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                {a === 'Wi-Fi' && <Wifi className="w-3 h-3 text-blue-500" />}
                {a === 'Power Outlet' && <Zap className="w-3 h-3 text-amber-500" />}
                {a === 'Live GPS' && <MapPin className="w-3 h-3 text-pink-500" />}
                {a}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-center gap-6 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="text-center">
            <p className="text-base font-bold text-slate-800">{route.departureTime}</p>
            <p className="text-xs text-slate-500 font-medium">{t(route.origin.split(',')[0])}</p>
          </div>

          <div className="flex flex-col items-center gap-1 px-3">
            <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" /> {route.duration}
            </span>
            <div className="w-20 md:w-24 h-0.5 bg-slate-300 rounded-full relative">
              <div className="w-2 h-2 rounded-full bg-blue-500 absolute -top-0.75 left-0" />
              <div className="w-2 h-2 rounded-full bg-indigo-500 absolute -top-0.75 right-0" />
            </div>
            <span className="text-[10px] text-blue-600 font-semibold">{t('directRoute')}</span>
          </div>

          <div className="text-center">
            <p className="text-base font-bold text-slate-800">{route.arrivalTime}</p>
            <p className="text-xs text-slate-500 font-medium">{t(route.destination.split(',')[0])}</p>
          </div>
        </div>

        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <div className="text-left lg:text-right">
            <span className="text-xs text-slate-400">{t('startingFrom')}</span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              LKR {route.priceStarting.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {route.availableSeatsCount} {t('seatsLeft')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLiveTrack}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors"
              title="Track Live GPS Location"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
            </button>

            <button
              onClick={handleSelectSeats}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
            >
              <span>{t('viewSeats')}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
