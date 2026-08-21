import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { BusRoute } from '../../types/booking';
import { Bus, ExternalLink } from 'lucide-react';

// Fix default leaflet marker asset paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom origin marker
const originIcon = L.divIcon({
  className: 'custom-map-marker-origin',
  html: `<div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); border: 3px solid #ffffff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(37,99,235,0.45); color: white; font-weight: bold; font-size: 15px;">
           🚌
         </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Custom destination marker
const destIcon = L.divIcon({
  className: 'custom-map-marker-dest',
  html: `<div style="background: linear-gradient(135deg, #059669, #047857); border: 3px solid #ffffff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(5,150,105,0.45); color: white; font-weight: bold; font-size: 15px;">
           🏁
         </div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// Custom stop marker
const stopIcon = L.divIcon({
  className: 'custom-map-marker-stop',
  html: `<div style="background: #4f46e5; border: 2px solid #ffffff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(79,70,229,0.4);">
           <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
         </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// Coordinate presets for Sri Lankan stations
const SRI_LANKA_COORDS: Record<string, [number, number]> = {
  'Monaragala': [6.8722, 81.3507],
  'Colombo': [6.9271, 79.8612],
  'Colombo Fort': [6.9344, 79.8510],
  'Dehiwala': [6.8510, 79.8659],
  'Panama': [6.7554, 81.8037],
  'Arugam Bay': [6.8416, 81.8315],
  'Kandy': [7.2906, 80.6337],
  'Galle': [6.0535, 80.2210],
  'Matara': [5.9549, 80.5550],
  'Jaffna': [9.6615, 80.0255],
  'Batticaloa': [7.7170, 81.7000],
  'Kataragama': [6.4167, 81.3333],
  'Wellawaya': [6.7410, 81.1020],
  'Ratnapura': [6.6828, 80.3992],
  'Kottawa': [6.8416, 79.9974],
};

function getCoords(place: string, defaultLat: number, defaultLng: number): [number, number] {
  const clean = place.split('(')[0].trim();
  for (const [key, val] of Object.entries(SRI_LANKA_COORDS)) {
    if (clean.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(clean.toLowerCase())) {
      return val;
    }
  }
  return defaultLat && defaultLng ? [defaultLat, defaultLng] : [6.9271, 79.8612];
}

// Sub-component to fit map bounds whenever active route changes
const MapBoundsAdjuster: React.FC<{ coords: [number, number][] }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }, [coords, map]);
  return null;
};

interface InteractiveRouteMapProps {
  route: BusRoute;
  allRoutes?: BusRoute[];
  onSelectRoute?: (route: BusRoute) => void;
}

export const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({ route }) => {
  const originCoord = getCoords(route.origin, route.boardingPoints?.[0]?.lat, route.boardingPoints?.[0]?.lng);
  const destCoord = getCoords(route.destination, route.dropPoints?.[0]?.lat, route.dropPoints?.[0]?.lng);

  // Generate intermediate curve/waypoint coordinates across Sri Lanka highway network
  const intermediateWaypoints: [number, number][] = [];
  if (route.boardingPoints && route.boardingPoints.length > 1) {
    route.boardingPoints.slice(1).forEach(bp => {
      if (bp.lat && bp.lng) intermediateWaypoints.push([bp.lat, bp.lng]);
    });
  } else {
    // Generate realistic midpoint curve across Uva / Sabaragamuwa / Central highway
    const midLat = (originCoord[0] + destCoord[0]) / 2 + (originCoord[0] < destCoord[0] ? -0.12 : 0.08);
    const midLng = (originCoord[1] + destCoord[1]) / 2;
    intermediateWaypoints.push([midLat, midLng]);
  }

  const polylineCoords: [number, number][] = [
    originCoord,
    ...intermediateWaypoints,
    destCoord,
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full sticky top-24 min-h-[480px]">
      
      {/* Map Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Interactive Route Map
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">
            {route.origin} → {route.destination} ({route.busNumber})
          </p>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold font-mono">
          {route.duration}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="relative flex-1 min-h-[380px] w-full">
        <MapContainer
          center={[(originCoord[0] + destCoord[0]) / 2, (originCoord[1] + destCoord[1]) / 2]}
          zoom={8}
          scrollWheelZoom={false}
          className="w-full h-full z-0"
          style={{ minHeight: '380px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsAdjuster coords={polylineCoords} />

          {/* Polyline connecting route stops */}
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: '#2563eb',
              weight: 5,
              opacity: 0.85,
              dashArray: '8, 8',
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />

          {/* Departure Marker */}
          <Marker position={originCoord} icon={originIcon}>
            <Popup>
              <div className="text-xs space-y-1 p-1 font-sans">
                <p className="font-extrabold text-slate-800 text-sm">Departure: {route.origin}</p>
                <p className="text-blue-600 font-bold font-mono">Departs at {route.departureTime}</p>
                <p className="text-slate-500">{route.operatorName}</p>
              </div>
            </Popup>
          </Marker>

          {/* Intermediate Stops */}
          {intermediateWaypoints.map((coord, idx) => (
            <Marker key={idx} position={coord} icon={stopIcon}>
              <Popup>
                <div className="text-xs p-1 font-sans">
                  <p className="font-bold text-slate-800">Intermediate Transit Hub</p>
                  <p className="text-slate-500 font-mono">Scheduled Express Stop</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Destination Marker */}
          <Marker position={destCoord} icon={destIcon}>
            <Popup>
              <div className="text-xs space-y-1 p-1 font-sans">
                <p className="font-extrabold text-slate-800 text-sm">Destination: {route.destination}</p>
                <p className="text-emerald-600 font-bold font-mono">Arrives at {route.arrivalTime}</p>
                <p className="text-slate-500">Fare: LKR {route.priceStarting.toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating Route Summary Overlay */}
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-800 leading-tight">{route.busType}</p>
              <p className="text-[11px] text-slate-500">Starting from <strong className="text-blue-600 font-mono font-bold">LKR {route.priceStarting.toLocaleString()}</strong></p>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${originCoord[0]},${originCoord[1]}&destination=${destCoord[0]},${destCoord[1]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-[11px] flex items-center gap-1 transition-colors flex-shrink-0"
          >
            Google Maps <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

    </div>
  );
};
