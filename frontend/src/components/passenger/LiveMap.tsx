import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Clock, Gauge, ArrowLeft, ExternalLink } from 'lucide-react';

const busIcon = L.divIcon({
  className: 'custom-bus-marker',
  html: `<div style="background-color: #2563eb; border: 3px solid #ffffff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(37, 99, 235, 0.4);">
           <span style="color: white; font-weight: bold; font-size: 16px;">🚌</span>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const stopIcon = L.divIcon({
  className: 'custom-stop-marker',
  html: `<div style="background-color: #4f46e5; border: 2px solid #ffffff; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(79, 70, 229, 0.4);">
           <span style="color: white; font-weight: bold; font-size: 10px;">📍</span>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const LiveMap: React.FC = () => {
  const { routes, trackingRouteId, goToSearchSchedules } = useBookingStore();

  const activeRoute = routes.find(r => r.id === trackingRouteId) || routes[0];

  const [simulatedGps, setSimulatedGps] = useState(activeRoute.gpsLocation);

  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedGps(prev => ({
        ...prev,
        lat: prev.lat + (Math.random() - 0.5) * 0.002,
        lng: prev.lng + (Math.random() - 0.5) * 0.002,
        speedKmH: Math.floor(75 + Math.random() * 20),
        lastUpdated: 'Just now'
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const boardingStop = activeRoute.boardingPoints[0];

  const polylineCoords: [number, number][] = [
    [boardingStop.lat, boardingStop.lng],
    [simulatedGps.lat, simulatedGps.lng],
    [activeRoute.dropPoints[0].lat, activeRoute.dropPoints[0].lng]
  ];

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${boardingStop.lat},${boardingStop.lng}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <button
          onClick={goToSearchSchedules}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Passenger Portal
        </button>

        <div className="text-left sm:text-right">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            Live GPS Fleet Tracking
          </h2>
          <p className="text-xs text-blue-600 font-medium">
            {activeRoute.operatorName} • {activeRoute.busNumber}
          </p>
        </div>
      </div>

      {/* Telemetry Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 uppercase">
            <Gauge className="w-3.5 h-3.5 text-blue-500" /> Current Speed
          </span>
          <p className="text-xl font-extrabold text-slate-800 font-mono">{simulatedGps.speedKmH} <span className="text-xs font-normal text-slate-400">km/h</span></p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 uppercase">
            <Navigation className="w-3.5 h-3.5 text-indigo-500" /> Current Location
          </span>
          <p className="text-sm font-bold text-slate-800 truncate">{simulatedGps.currentStopName}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 uppercase">
            <MapPin className="w-3.5 h-3.5 text-amber-500" /> Next Stop
          </span>
          <p className="text-sm font-bold text-slate-800 truncate">{simulatedGps.nextStopName}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 uppercase">
            <Clock className="w-3.5 h-3.5 text-pink-500" /> Boarding Stop ETA
          </span>
          <p className="text-xl font-extrabold text-blue-600 font-mono">~{simulatedGps.etaMinutes} <span className="text-xs font-normal text-slate-400">mins</span></p>
        </div>

      </div>

      {/* Map Viewport */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative">
        
        <div className="absolute top-4 right-4 z-20">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-white/90 text-blue-600 hover:text-blue-700 border border-slate-200 text-xs font-bold shadow-md flex items-center gap-2 backdrop-blur-md transition-all"
          >
            <span>Open Boarding Stop in Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="h-[450px] w-full">
          <MapContainer
            center={[simulatedGps.lat, simulatedGps.lng]}
            zoom={10}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', borderRadius: '1.5rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[simulatedGps.lat, simulatedGps.lng]} icon={busIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <strong>{activeRoute.operatorName}</strong><br />
                  Bus: {activeRoute.busNumber}<br />
                  Speed: {simulatedGps.speedKmH} km/h
                </div>
              </Popup>
            </Marker>

            <Marker position={[boardingStop.lat, boardingStop.lng]} icon={stopIcon}>
              <Popup>
                <div className="text-xs p-1">
                  <strong>Boarding Stop: {boardingStop.name}</strong><br />
                  Time: {boardingStop.time}<br />
                  Landmark: {boardingStop.landmark}
                </div>
              </Popup>
            </Marker>

            <Polyline positions={polylineCoords} color="#2563eb" weight={4} dashArray="8, 8" />
          </MapContainer>
        </div>

      </div>

    </div>
  );
};
