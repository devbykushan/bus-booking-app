import React from 'react';
import type { BusRoute } from '../../types/booking';
import { X, Clock, MapPin, Navigation, ExternalLink, Calendar } from 'lucide-react';

interface RouteTimetableModalProps {
  route: BusRoute;
  onClose: () => void;
  onBookNow: () => void;
}

export const RouteTimetableModal: React.FC<RouteTimetableModalProps> = ({ route, onClose, onBookNow }) => {
  // Combine boarding & drop points or generate default timeline
  const boardingStops = route.boardingPoints && route.boardingPoints.length > 0 
    ? route.boardingPoints 
    : [
        { id: 'bp-1', name: `${route.origin} Main Terminal`, time: route.departureTime, landmark: 'Main Station Gate', lat: 6.8722, lng: 81.3507 },
        { id: 'bp-2', name: 'Wellawaya Junction', time: '01:45 PM', landmark: 'Clock Tower Interchange', lat: 6.7410, lng: 81.1020 },
      ];

  const dropStops = route.dropPoints && route.dropPoints.length > 0
    ? route.dropPoints
    : [
        { id: 'dp-1', name: 'Kottawa Highway Exit', time: '06:45 PM', landmark: 'Makumbura Multimodal Hub', lat: 6.8416, lng: 79.9974 },
        { id: 'dp-2', name: `${route.destination} Fort Station`, time: route.arrivalTime, landmark: 'Main Passenger Drop Bay', lat: 6.9344, lng: 79.8510 },
      ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in-up">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[85vh] my-auto animate-pop-in"
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between relative overflow-hidden flex-shrink-0">
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Scheduled Journey Timetable
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {route.duration} Trip
              </span>
            </div>
            <h3 className="text-xl font-black mt-2 tracking-tight">
              {route.origin} → {route.destination}
            </h3>
            <p className="text-xs text-blue-200 mt-0.5">
              {route.operatorName} • <strong className="text-white">{route.busNumber}</strong> • {route.busType}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timetable Content */}
        <div 
          className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 min-h-0 text-slate-700"
        >
          
          {/* Journey Overview Bar */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-950">Daily Scheduled Express Route</p>
                <p className="text-xs text-blue-700">
                  Departure at <strong className="font-mono">{route.departureTime}</strong> • Estimated Arrival <strong className="font-mono">{route.arrivalTime}</strong>
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
              On Schedule
            </span>
          </div>

          {/* Boarding Points Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Boarding Stops (Pickup)
            </h4>
            
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
              {boardingStops.map((stop, idx) => (
                <div key={stop.id || idx} className="relative flex items-start justify-between gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors">
                  <div className="absolute -left-6 top-3.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {stop.time || route.departureTime}
                      </span>
                      <h5 className="text-sm font-bold text-slate-800">{stop.name}</h5>
                    </div>
                    {stop.landmark && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {stop.landmark}
                      </p>
                    )}
                  </div>

                  {stop.lat && stop.lng && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-blue-600 border border-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors flex-shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-500" /> Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dropping Points Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Dropping Stops (Destination)
            </h4>
            
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200">
              {dropStops.map((stop, idx) => (
                <div key={stop.id || idx} className="relative flex items-start justify-between gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors">
                  <div className="absolute -left-6 top-3.5 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {stop.time || route.arrivalTime}
                      </span>
                      <h5 className="text-sm font-bold text-slate-800">{stop.name}</h5>
                    </div>
                    {stop.landmark && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {stop.landmark}
                      </p>
                    )}
                  </div>

                  {stop.lat && stop.lng && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-indigo-600 border border-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors flex-shrink-0"
                    >
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" /> Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Regular daily departure timings</span>
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
