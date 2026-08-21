import React from 'react';
import type { BusRoute } from '../../types/booking';
import { 
  X, CheckCircle, ShieldCheck, Zap, 
  Clock, Luggage, Ban, PhoneCall, Star, Bus 
} from 'lucide-react';

interface RouteDetailsModalProps {
  route: BusRoute;
  onClose: () => void;
  onBookNow: () => void;
}

export const RouteDetailsModal: React.FC<RouteDetailsModalProps> = ({ route, onClose, onBookNow }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '85vh', height: '100%' }}
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between relative overflow-hidden flex-shrink-0">
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Certified Luxury Fleet
              </span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{route.operatorRating || 4.9}</span>
              </div>
            </div>
            <h3 className="text-xl font-black mt-2 tracking-tight">
              {route.origin} → {route.destination}
            </h3>
            <p className="text-xs text-blue-200 mt-0.5 font-medium">
              {route.operatorName} • <strong className="text-white">{route.busNumber}</strong> ({route.busType})
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div 
          className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-slate-700"
          style={{ minHeight: 0 }}
        >
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
              <p className="text-sm font-extrabold text-slate-800 mt-1 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4 text-blue-600" /> {route.duration}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Seats</span>
              <p className="text-sm font-extrabold text-slate-800 mt-1 flex items-center justify-center gap-1">
                <Bus className="w-4 h-4 text-indigo-600" /> {route.totalSeatsCount || route.seats?.length || 48} Seats
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-center">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Fare Starts</span>
              <p className="text-sm font-black text-blue-700 mt-1 font-mono">
                LKR {route.priceStarting.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Luxury Amenities */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Premium Onboard Amenities
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(route.amenities || ['AC', 'Wi-Fi', 'Charging Ports', 'Live GPS Tracking', 'Reclining Seats']).map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Luggage & Policies */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Luggage className="w-4 h-4 text-blue-600" /> Luggage Allowance
              </h5>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• 1 Check-in luggage up to 20kg included</li>
                <li>• 1 Handbag/backpack allowed inside cabin</li>
                <li>• Fragile item tagging available at counter</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-500" /> Cancellation Policy
              </h5>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• <strong>100% refund</strong> up to 24 hrs prior to departure</li>
                <li>• <strong>50% refund</strong> up to 6 hrs prior to departure</li>
                <li>• Instant e-ticket QR verification upon boarding</li>
              </ul>
            </div>
          </div>

          {/* 24/7 Conductor Support */}
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-950">24/7 Operator Helpline</p>
                <p className="text-xs text-indigo-700 font-mono">+94 77 123 4567 • Dewmina Dispatch</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-white text-indigo-700 text-xs font-bold border border-indigo-200 shadow-sm">
              Live Support
            </span>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div>
            <span className="text-xs text-slate-400">Total Starting Price</span>
            <p className="text-xl font-black text-slate-900 font-mono">
              LKR {route.priceStarting.toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBookNow();
              }}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
            >
              Book Now & Select Seats
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
