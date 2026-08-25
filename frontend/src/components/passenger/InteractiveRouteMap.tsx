import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { BusRoute } from '../../types/booking';
import { Bus, ExternalLink, Sparkles, Navigation } from 'lucide-react';

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
  html: `<div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); border: 3px solid #ffffff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(37,99,235,0.5); color: white; font-weight: bold; font-size: 16px;">
           🚌
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Custom destination marker
const destIcon = L.divIcon({
  className: 'custom-map-marker-dest',
  html: `<div style="background: linear-gradient(135deg, #059669, #047857); border: 3px solid #ffffff; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(5,150,105,0.5); color: white; font-weight: bold; font-size: 16px;">
           🏁
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Custom highway stop marker
const stopIcon = L.divIcon({
  className: 'custom-map-marker-stop',
  html: `<div style="background: #6366f1; border: 2px solid #ffffff; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(99,102,241,0.45);">
           <div style="width: 7px; height: 7px; background: white; border-radius: 50%;"></div>
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
  'Thanamalwila': [6.4380, 81.1328],
  'Mattala': [6.3025, 81.1189],
  'Ratnapura': [6.6828, 80.3992],
  'Kottawa': [6.8416, 79.9974],
  'Makumbura': [6.8416, 79.9974],
};

// Route 98 Normal Service (Colombo <-> Monaragala via A4 Trunk Road: Avissawella - Ratnapura - Balangoda - Beragala - Wellawaya - Buttala)
const MONARAGALA_COLOMBO_NORMAL_ROUTE_98: { name: string; desc: string; coords: [number, number] }[] = [
  { name: 'Monaragala Central Bus Stand', desc: 'Starting Point & Boarding Terminal', coords: [6.8722, 81.3507] },
  { name: 'Buttala Junction', desc: 'A4 Main Road Station', coords: [6.7580, 81.2470] },
  { name: 'Wellawaya Town (Clock Tower)', desc: 'A4 Trunk Highway Intersection', coords: [6.7410, 81.1020] },
  { name: 'Koslanda / Diyaluma Falls', desc: 'A4 Mountain Pass Corridor', coords: [6.7450, 81.0180] },
  { name: 'Beragala Junction', desc: 'A4 / A16 Highland Junction', coords: [6.7820, 80.9160] },
  { name: 'Haldummulla', desc: 'A4 Scenic Mountain Stop', coords: [6.7710, 80.8950] },
  { name: 'Belihuloya', desc: 'A4 River Valley Corridor', coords: [6.7160, 80.7720] },
  { name: 'Balangoda Bus Stand', desc: 'Major Town Transit Station', coords: [6.6580, 80.7020] },
  { name: 'Pelmadulla Junction', desc: 'A4 / A18 Intersection', coords: [6.6230, 80.5480] },
  { name: 'Ratnapura City (Clock Tower)', desc: 'City of Gems Main Bus Stand', coords: [6.6828, 80.3992] },
  { name: 'Kuruwita', desc: 'A4 Main Road Stop', coords: [6.7720, 80.3660] },
  { name: 'Eheliyagoda', desc: 'Sabaragamuwa Province Boundary', coords: [6.8480, 80.2600] },
  { name: 'Avissawella (Seethawaka)', desc: 'Major A4 Junction Terminal', coords: [6.9530, 80.2070] },
  { name: 'Kosgama', desc: 'High Level Road Station', coords: [6.9380, 80.1430] },
  { name: 'Hanwella Junction', desc: 'Western Province Transit', coords: [6.9020, 80.0820] },
  { name: 'Kaduwela / Kottawa', desc: 'Low Country A4 Corridor', coords: [6.9340, 79.9840] },
  { name: 'Battaramulla (Kotte)', desc: 'Suburban Transit Hub', coords: [6.9016, 79.9230] },
  { name: 'Colombo Fort (Bastian Mawatha / Pettah)', desc: 'Final Destination & Central Terminal', coords: [6.9344, 79.8530] },
];

// Precise Southern Expressway (E01) Highway Waypoints for Monaragala <-> Colombo
const MONARAGALA_COLOMBO_HIGHWAY_ROUTE: { name: string; desc: string; coords: [number, number] }[] = [
  { name: 'Monaragala Main Terminal', desc: 'Starting Point & Passenger Boarding', coords: [6.8722, 81.3507] },
  { name: 'Wellawaya Clock Tower', desc: 'A4 / A23 Trunk Intersection', coords: [6.7410, 81.1020] },
  { name: 'Thanamalwila Junction', desc: 'Express Highway Connector', coords: [6.4380, 81.1328] },
  { name: 'Mattala / Andarawewa Interchange', desc: 'Southern Expressway (E01) Highway Entry', coords: [6.3025, 81.1189] },
  { name: 'Barawakumbuka Interchange', desc: 'E01 Expressway Node', coords: [6.2052, 80.8920] },
  { name: 'Beliatta / Kasagala Interchange', desc: 'E01 Expressway Node', coords: [6.1754, 80.7853] },
  { name: 'Matara (Godagama Interchange)', desc: 'E01 Expressway Flyover', coords: [6.0025, 80.5480] },
  { name: 'Galle (Pinnaduwa Interchange)', desc: 'E01 Expressway Corridor', coords: [6.0725, 80.2464] },
  { name: 'Kurundugahahetekma Interchange', desc: 'E01 Expressway Connector', coords: [6.3421, 80.1250] },
  { name: 'Welipenna Expressway Service Area', desc: 'Express Rest Stop & Highway Transit', coords: [6.6111, 80.0520] },
  { name: 'Dodangoda Interchange', desc: 'E01 Expressway Node', coords: [6.6850, 80.0230] },
  { name: 'Gelanigama Interchange', desc: 'E01 Bandaragama Exit', coords: [6.7325, 80.0120] },
  { name: 'Kahathuduwa Interchange', desc: 'E01 Expressway Corridor', coords: [6.7950, 79.9980] },
  { name: 'Makumbura (Kottawa) Multimodal Center', desc: 'Expressway Exit & Drop Hub', coords: [6.8416, 79.9974] },
  { name: 'Maharagama', desc: 'High Level Road Corridor', coords: [6.8480, 79.9265] },
  { name: 'Colombo Fort (Bastian Mawatha)', desc: 'Super Luxury Terminal & Final Drop', coords: [6.9344, 79.8530] },
];

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
  // Toggle between Normal Service (Route 98) and Expressway (E01)
  const [selectedServiceType, setSelectedServiceType] = React.useState<'normal' | 'expressway'>('normal');

  const originCoord = getCoords(route.origin, route.boardingPoints?.[0]?.lat, route.boardingPoints?.[0]?.lng);
  const destCoord = getCoords(route.destination, route.dropPoints?.[0]?.lat, route.dropPoints?.[0]?.lng);

  const isMonaragalaColomboRoute =
    (route.origin.toLowerCase().includes('monaragala') && route.destination.toLowerCase().includes('colombo')) ||
    (route.origin.toLowerCase().includes('colombo') && route.destination.toLowerCase().includes('monaragala'));

  let polylineCoords: [number, number][] = [];
  let intermediateWaypoints: { name: string; desc: string; coords: [number, number] }[] = [];

  if (isMonaragalaColomboRoute) {
    if (selectedServiceType === 'normal') {
      // Exact Route 98 (Normal Service A4 Highway: Ratnapura, Balangoda, Wellawaya)
      const normalSequence = route.origin.toLowerCase().includes('monaragala')
        ? MONARAGALA_COLOMBO_NORMAL_ROUTE_98
        : [...MONARAGALA_COLOMBO_NORMAL_ROUTE_98].reverse();

      polylineCoords = normalSequence.map((h) => h.coords);
      intermediateWaypoints = normalSequence.slice(1, -1);
    } else {
      // Southern Expressway E01 Highway Route
      const highwaySequence = route.origin.toLowerCase().includes('monaragala')
        ? MONARAGALA_COLOMBO_HIGHWAY_ROUTE
        : [...MONARAGALA_COLOMBO_HIGHWAY_ROUTE].reverse();

      polylineCoords = highwaySequence.map((h) => h.coords);
      intermediateWaypoints = highwaySequence.slice(1, -1).filter((_, idx) => idx % 2 === 0 || idx === 1 || idx === 2);
    }
  } else {
    // Generic route waypoints
    const genericCoords: [number, number][] = [];
    if (route.boardingPoints && route.boardingPoints.length > 1) {
      route.boardingPoints.slice(1).forEach((bp) => {
        if (bp.lat && bp.lng) {
          genericCoords.push([bp.lat, bp.lng]);
          intermediateWaypoints.push({ name: bp.name, desc: bp.landmark || 'Scheduled Transit Stop', coords: [bp.lat, bp.lng] });
        }
      });
    } else {
      const midLat = (originCoord[0] + destCoord[0]) / 2 + (originCoord[0] < destCoord[0] ? -0.12 : 0.08);
      const midLng = (originCoord[1] + destCoord[1]) / 2;
      genericCoords.push([midLat, midLng]);
      intermediateWaypoints.push({ name: 'Highway Transit Corridor', desc: 'Transit Waypoint', coords: [midLat, midLng] });
    }
    polylineCoords = [originCoord, ...genericCoords, destCoord];
  }

  // Google Maps directions URL
  const googleMapsUrl = isMonaragalaColomboRoute
    ? selectedServiceType === 'normal'
      ? `https://www.google.com/maps/dir/?api=1&origin=${originCoord[0]},${originCoord[1]}&destination=${destCoord[0]},${destCoord[1]}&waypoints=6.6828,80.3992%7C6.6580,80.7020%7C6.7410,81.1020`
      : `https://www.google.com/maps/dir/?api=1&origin=${originCoord[0]},${originCoord[1]}&destination=${destCoord[0]},${destCoord[1]}&waypoints=6.4380,81.1328%7C6.3025,81.1189%7C6.0725,80.2464%7C6.8416,79.9974`
    : `https://www.google.com/maps/dir/?api=1&origin=${originCoord[0]},${originCoord[1]}&destination=${destCoord[0]},${destCoord[1]}`;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full sticky top-24 min-h-[480px]">
      {/* Map Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Interactive Route Map</span>
              {isMonaragalaColomboRoute && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                  selectedServiceType === 'normal'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}>
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {selectedServiceType === 'normal' ? 'Route 98 (Normal Service - A4 Highway)' : 'Southern Expressway (E01)'}
                </span>
              )}
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">
            {route.origin} → {route.destination} ({route.busNumber})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isMonaragalaColomboRoute && (
            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-[10px] font-extrabold">
              <button
                type="button"
                onClick={() => setSelectedServiceType('normal')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedServiceType === 'normal'
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Route 98 (Normal)
              </button>
              <button
                type="button"
                onClick={() => setSelectedServiceType('expressway')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedServiceType === 'expressway'
                    ? 'bg-blue-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expressway (E01)
              </button>
            </div>
          )}
          <div className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold font-mono">
            {selectedServiceType === 'normal' && isMonaragalaColomboRoute ? '6h 30m' : route.duration}
          </div>
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

          {/* Polyline connecting route highway nodes */}
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: selectedServiceType === 'normal' ? '#059669' : '#2563eb',
              weight: 5,
              opacity: 0.9,
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
                <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                  {selectedServiceType === 'normal' ? 'Route 98 Normal Service' : 'Super Luxury Service'}
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Intermediate Highway Stops */}
          {intermediateWaypoints.map((stop, idx) => (
            <Marker key={idx} position={stop.coords} icon={stopIcon}>
              <Popup>
                <div className="text-xs p-1 font-sans">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-indigo-600" />
                    {stop.name}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">{stop.desc}</p>
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
                <p className="text-slate-500">Fare: LKR {(route.priceStarting || 2800).toLocaleString()}</p>
                <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                  {selectedServiceType === 'normal' ? 'Route 98 A4 Direct Arrival' : 'Expressway Direct Arrival'}
                </span>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating Route Summary Overlay */}
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 shadow-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold shadow-md ${
              selectedServiceType === 'normal' ? 'bg-gradient-to-br from-emerald-600 to-teal-700 shadow-emerald-500/20' : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/20'
            }`}>
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-extrabold text-slate-800 leading-tight">
                  {selectedServiceType === 'normal' ? 'Route 98 (Monaragala - Colombo)' : (route.busType.toLowerCase().includes('leyland') ? 'Super Luxury' : route.busType)}
                </p>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-extrabold tracking-wide uppercase">
                  {selectedServiceType === 'normal' ? 'Normal Service Only' : 'Super Luxury Only'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                via Ratnapura • Balangoda • Wellawaya • A4 Road
              </p>
            </div>
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1.5 transition-all hover:scale-105 shadow-sm flex-shrink-0"
            title="Open Route on Google Maps"
          >
            <span>Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
