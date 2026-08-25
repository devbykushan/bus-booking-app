import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { routesApi } from '../../services/api';
import type { BusRoute, BoardingPoint } from '../../types/booking';
import { 
  X, Info, Clock, Save, Plus, Trash2, 
  CheckCircle, ShieldCheck, Star, 
  Navigation, AlertCircle, RefreshCw,
  Eye, Edit3, Zap
} from 'lucide-react';

interface RouteDetailsTimetableEditorModalProps {
  route: BusRoute;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_AMENITIES = [
  'AC',
  'Wi-Fi',
  'Charging Ports',
  'Live GPS Tracking',
  'Reclining Seats',
  'Water Bottle',
  'Blanket',
  'Music / Audio',
  'LED TV Screen',
  'Reading Lamp',
  'Emergency First-Aid',
];

export interface BusClassPreset {
  id: string;
  label: string;
  shortName: string;
  seatsCount: number;
  layoutDescription: string;
  defaultPrice: number;
  defaultDuration: string;
  defaultAmenities: string[];
  description: string;
  badge: string;
  badgeColor: string;
  icon: string;
}

export const BUS_CLASS_PRESETS: Record<string, BusClassPreset> = {
  'Super Luxury': {
    id: 'Super Luxury',
    label: '✨ Super Luxury Express',
    shortName: 'Super Luxury Express',
    seatsCount: 49,
    layoutDescription: '49 Seats (2×2 AC Pushback Layout)',
    defaultPrice: 2670,
    defaultDuration: '5h 30m',
    defaultAmenities: [
      'AC',
      'Wi-Fi',
      'Charging Ports',
      'Live GPS Tracking',
      'Reclining Seats',
      'Water Bottle',
      'Blanket',
      'LED TV Screen',
    ],
    description: 'High-speed Expressway coach with 49 comfortable 2×2 pushback seats, air conditioning & VIP passenger amenities.',
    badge: 'Expressway Direct (E01)',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
    icon: '✨',
  },
  'Normal Service': {
    id: 'Normal Service',
    label: '🇱🇰 Normal Service (Route 98)',
    shortName: 'Normal Service (Route 98)',
    seatsCount: 58,
    layoutDescription: '58 Seats (3×2 Standard Leyland Layout)',
    defaultPrice: 950,
    defaultDuration: '7h 30m',
    defaultAmenities: [
      'Live GPS Tracking',
      'Music / Audio',
      'Emergency First-Aid',
      'Reading Lamp',
    ],
    description: 'Classic Route 98 A4 highway intercity service with 58 seats in a 3×2 arrangement at standard fare.',
    badge: 'A4 Highway (Route 98)',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: '🇱🇰',
  },
  'Super Luxury (49 Seats 2*2)': {
    id: 'Super Luxury',
    label: '✨ Super Luxury Express',
    shortName: 'Super Luxury Express',
    seatsCount: 49,
    layoutDescription: '49 Seats (2×2 AC Pushback Layout)',
    defaultPrice: 2670,
    defaultDuration: '5h 30m',
    defaultAmenities: [
      'AC',
      'Wi-Fi',
      'Charging Ports',
      'Live GPS Tracking',
      'Reclining Seats',
      'Water Bottle',
      'Blanket',
      'LED TV Screen',
    ],
    description: 'High-speed Expressway coach with 49 comfortable 2×2 pushback seats, air conditioning & VIP passenger amenities.',
    badge: 'Expressway Direct (E01)',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
    icon: '✨',
  },
  'Normal Service (58 Seats 3*2)': {
    id: 'Normal Service',
    label: '🇱🇰 Normal Service (Route 98)',
    shortName: 'Normal Service (Route 98)',
    seatsCount: 58,
    layoutDescription: '58 Seats (3×2 Standard Leyland Layout)',
    defaultPrice: 950,
    defaultDuration: '7h 30m',
    defaultAmenities: [
      'Live GPS Tracking',
      'Music / Audio',
      'Emergency First-Aid',
      'Reading Lamp',
    ],
    description: 'Classic Route 98 A4 highway intercity service with 58 seats in a 3×2 arrangement at standard fare.',
    badge: 'A4 Highway (Route 98)',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: '🇱🇰',
  },
  'Normal Service (54 Seats 3*2)': {
    id: 'Normal Service',
    label: '🇱🇰 Normal Service (Route 98)',
    shortName: 'Normal Service (Route 98)',
    seatsCount: 58,
    layoutDescription: '58 Seats (3×2 Standard Leyland Layout)',
    defaultPrice: 950,
    defaultDuration: '7h 30m',
    defaultAmenities: [
      'Live GPS Tracking',
      'Music / Audio',
      'Emergency First-Aid',
      'Reading Lamp',
    ],
    description: 'Classic Route 98 A4 highway intercity service with 58 seats in a 3×2 arrangement at standard fare.',
    badge: 'A4 Highway (Route 98)',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: '🇱🇰',
  },
};

const BUS_CLASSES = [
  { id: 'Super Luxury', label: '✨ Super Luxury Express' },
  { id: 'Normal Service', label: '🇱🇰 Normal Service (Route 98)' },
];

export const RouteDetailsTimetableEditorModal: React.FC<RouteDetailsTimetableEditorModalProps> = ({
  route,
  onClose,
  onSuccess,
}) => {
  const { loadRoutes } = useBookingStore();

  const [activeTab, setActiveTab] = useState<'details' | 'timetable' | 'preview'>('details');

  // ─── Details State ───
  const [operatorName, setOperatorName] = useState(route.operatorName || 'Dewmina Super Line');
  const [operatorRating, setOperatorRating] = useState<number>(route.operatorRating || 4.9);
  const [busNumber, setBusNumber] = useState(route.busNumber || '');
  const [busType, setBusType] = useState<string>(route.busType || 'Super Luxury');
  const [origin, setOrigin] = useState(route.origin || '');
  const [destination, setDestination] = useState(route.destination || '');
  const [priceStarting, setPriceStarting] = useState<number | string>(route.priceStarting || 2670);
  const [amenities, setAmenities] = useState<string[]>(
    route.amenities && route.amenities.length > 0
      ? route.amenities
      : ['AC', 'Wi-Fi', 'Charging Ports', 'Live GPS Tracking', 'Reclining Seats']
  );
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [classUpdateNotice, setClassUpdateNotice] = useState<string | null>(null);

  // ─── Timetable State ───
  const [departureTime, setDepartureTime] = useState(route.departureTime || '06:30 AM');
  const [arrivalTime, setArrivalTime] = useState(route.arrivalTime || '12:30 PM');
  const [duration, setDuration] = useState(route.duration || '6h 00m');

  const [boardingPoints, setBoardingPoints] = useState<BoardingPoint[]>(
    route.boardingPoints && route.boardingPoints.length > 0
      ? route.boardingPoints.map((bp) => ({ ...bp }))
      : [
          { id: `bp-1`, name: `${route.origin} Main Terminal`, time: route.departureTime || '06:30 AM', landmark: 'Main Platform 1', lat: 6.8722, lng: 81.3507 },
          { id: `bp-2`, name: 'Wellawaya Junction', time: '07:15 AM', landmark: 'Clock Tower Interchange', lat: 6.7410, lng: 81.1020 },
        ]
  );

  const [dropPoints, setDropPoints] = useState<BoardingPoint[]>(
    route.dropPoints && route.dropPoints.length > 0
      ? route.dropPoints.map((dp) => ({ ...dp }))
      : [
          { id: `dp-1`, name: 'Kottawa Highway Exit', time: '12:00 PM', landmark: 'Makumbura Multimodal Hub', lat: 6.8416, lng: 79.9974 },
          { id: `dp-2`, name: `${route.destination} Fort Station`, time: route.arrivalTime || '12:30 PM', landmark: 'Main Passenger Drop Bay', lat: 6.9344, lng: 79.8510 },
        ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sri Lanka Bus License Plate format validation helper
  const isValidBusRegNumber = (val: string): boolean => {
    const trimmed = val.trim();
    if (trimmed.length < 4) return false;
    const digitsMatch = trimmed.match(/\d+/g);
    if (!digitsMatch) return false;
    const lastDigits = digitsMatch[digitsMatch.length - 1];
    if (lastDigits && lastDigits.length > 4) return false;
    return true;
  };

  // Bus Class Preset Auto-Update Handler
  const applyClassDefaults = (type: string, silent: boolean = false) => {
    const preset = BUS_CLASS_PRESETS[type];
    if (preset) {
      setBusType(type);
      setPriceStarting(preset.defaultPrice);
      setAmenities([...preset.defaultAmenities]);
      setDuration(preset.defaultDuration);
      if (!silent) {
        setClassUpdateNotice(
          `Auto-configured ${preset.shortName}: LKR ${preset.defaultPrice.toLocaleString()} base fare, ${preset.seatsCount} seats (${preset.layoutDescription}) & ${preset.defaultAmenities.length} default amenities.`
        );
        setTimeout(() => setClassUpdateNotice(null), 6000);
      }
    } else {
      setBusType(type);
    }
  };

  const handleBusTypeChange = (newType: string) => {
    applyClassDefaults(newType);
  };

  // Amenities handlers
  const toggleAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter((a) => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenityInput.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setAmenities([...amenities, trimmed]);
      setCustomAmenityInput('');
    }
  };

  // Boarding Point Handlers
  const handleAddBoardingPoint = () => {
    const newBp: BoardingPoint = {
      id: `bp-${Date.now()}`,
      name: 'New Pickup Stop',
      time: departureTime,
      landmark: 'Main Junction Gate',
      lat: 6.8722,
      lng: 81.3507,
    };
    setBoardingPoints([...boardingPoints, newBp]);
  };

  const handleUpdateBoardingPoint = (index: number, field: keyof BoardingPoint, value: any) => {
    const updated = [...boardingPoints];
    updated[index] = { ...updated[index], [field]: value };
    setBoardingPoints(updated);
  };

  const handleRemoveBoardingPoint = (index: number) => {
    if (boardingPoints.length <= 1) {
      alert('At least one boarding stop is required.');
      return;
    }
    setBoardingPoints(boardingPoints.filter((_, i) => i !== index));
  };

  // Drop Point Handlers
  const handleAddDropPoint = () => {
    const newDp: BoardingPoint = {
      id: `dp-${Date.now()}`,
      name: 'New Drop-off Stop',
      time: arrivalTime,
      landmark: 'Main Drop Bay',
      lat: 6.9344,
      lng: 79.8510,
    };
    setDropPoints([...dropPoints, newDp]);
  };

  const handleUpdateDropPoint = (index: number, field: keyof BoardingPoint, value: any) => {
    const updated = [...dropPoints];
    updated[index] = { ...updated[index], [field]: value };
    setDropPoints(updated);
  };

  const handleRemoveDropPoint = (index: number) => {
    if (dropPoints.length <= 1) {
      alert('At least one dropping stop is required.');
      return;
    }
    setDropPoints(dropPoints.filter((_, i) => i !== index));
  };

  // Save handler
  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Basic Validations
    if (!operatorName.trim()) {
      setErrorMessage('Operator name cannot be empty.');
      return;
    }
    if (!busNumber.trim()) {
      setErrorMessage('Bus registration number is required (e.g., ND-8899).');
      return;
    }
    if (!isValidBusRegNumber(busNumber)) {
      setErrorMessage('Invalid bus registration number format. Max 4 digits allowed (e.g., ND-8899).');
      return;
    }
    if (!origin.trim() || !destination.trim()) {
      setErrorMessage('Origin and destination cities are required.');
      return;
    }
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      setErrorMessage('Origin and destination cannot be identical.');
      return;
    }
    const numPrice = Number(priceStarting);
    if (isNaN(numPrice) || numPrice < 500) {
      setErrorMessage('Starting fare must be at least LKR 500.');
      return;
    }
    if (boardingPoints.length === 0) {
      setErrorMessage('At least one boarding stop is required.');
      return;
    }
    if (dropPoints.length === 0) {
      setErrorMessage('At least one drop-off stop is required.');
      return;
    }

    setIsSaving(true);
    try {
      await routesApi.update(route.id, {
        operatorName: operatorName.trim(),
        operatorRating: Number(operatorRating) || 4.9,
        busNumber: busNumber.trim(),
        busType: busType.trim(),
        origin: origin.trim(),
        destination: destination.trim(),
        departureTime: departureTime.trim(),
        arrivalTime: arrivalTime.trim(),
        duration: duration.trim(),
        priceStarting: numPrice,
        hasUpperDeck: busType.includes('Double') || busType.includes('Sleeper'),
        amenities,
        boardingPoints,
        dropPoints,
      });

      await loadRoutes();
      setSuccessMessage('Bus Route Details & Timetable updated successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update route. Please check backend connection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in-up">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[90vh] my-auto animate-pop-in">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex items-center justify-between relative overflow-hidden flex-shrink-0">
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Admin Command Center
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Route ID: {route.id}
              </span>
            </div>
            <h3 className="text-xl font-black mt-2 tracking-tight flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-400" /> Edit Route Details & Timetable
            </h3>
            <p className="text-xs text-blue-200 mt-0.5 font-medium">
              Update fleet configuration, luxury amenities, pick-up points & journey schedule.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'details'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Route Details & Amenities</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timetable')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'timetable'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Timetable & Stops ({boardingPoints.length + dropPoints.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'preview'
                ? 'bg-white text-emerald-600 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Passenger Live Preview</span>
          </button>
        </div>

        {/* Alerts / Error & Success */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0 space-y-6">

          {/* ══════════════════════════════════════════════════════════
              TAB 1: DETAILS & AMENITIES
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              
              {/* Primary Bus Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Operator Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Operator Fleet Name</label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Dewmina Super Line"
                  />
                </div>

                {/* Bus Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Bus Reg. Number</span>
                    <span className="text-[10px] text-slate-400">Max 4 digits (SL Plate)</span>
                  </label>
                  <input
                    type="text"
                    value={busNumber}
                    onChange={(e) => setBusNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="ND-7788"
                  />
                </div>

                {/* Operator Rating */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Operator Rating (1.0 - 5.0)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      value={operatorRating}
                      onChange={(e) => setOperatorRating(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <div className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1 flex-shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {operatorRating.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Starting Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Base Ticket Fare (LKR)</label>
                  <input
                    type="number"
                    step="50"
                    min="500"
                    max="50000"
                    value={priceStarting}
                    onChange={(e) => setPriceStarting(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="2670"
                  />
                </div>

                {/* Origin */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Origin City</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Monaragala"
                  />
                </div>

                {/* Destination */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Destination City</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Colombo"
                  />
                </div>

                {/* Journey Duration */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Estimated Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="6h 00m"
                  />
                </div>

                {/* Bus Class */}
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Bus Class & Service Profile</label>
                    <span className="text-[11px] font-semibold text-blue-600">Auto-syncs price, layout & amenities</span>
                  </div>
                  <select
                    value={busType}
                    onChange={(e) => handleBusTypeChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-900 shadow-xs"
                  >
                    {BUS_CLASSES.map((bc) => (
                      <option key={bc.id} value={bc.id}>
                        {bc.label}
                      </option>
                    ))}
                  </select>

                  {/* Auto-update Notice Banner */}
                  {classUpdateNotice && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                      <Zap className="w-4 h-4 text-blue-600 flex-shrink-0 animate-pulse" />
                      <span>{classUpdateNotice}</span>
                    </div>
                  )}

                  {/* Selected Bus Class Profile Card */}
                  {BUS_CLASS_PRESETS[busType] && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{BUS_CLASS_PRESETS[busType].icon}</span>
                          <span className="text-xs font-bold text-slate-800">{BUS_CLASS_PRESETS[busType].shortName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BUS_CLASS_PRESETS[busType].badgeColor}`}>
                            {BUS_CLASS_PRESETS[busType].badge}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => applyClassDefaults(busType)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-600 text-[11px] font-bold flex items-center gap-1 shadow-xs transition-all"
                          title="Reset price, duration, and amenities to this class's defaults"
                        >
                          <RefreshCw className="w-3 h-3" /> Re-apply Defaults
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {BUS_CLASS_PRESETS[busType].description}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 font-medium block">Capacity</span>
                          <span className="text-xs font-bold text-slate-800 font-mono">{BUS_CLASS_PRESETS[busType].seatsCount} Seats</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 font-medium block">Default Fare</span>
                          <span className="text-xs font-bold text-blue-600 font-mono">LKR {BUS_CLASS_PRESETS[busType].defaultPrice}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 font-medium block">Duration</span>
                          <span className="text-xs font-bold text-slate-800 font-mono">{BUS_CLASS_PRESETS[busType].defaultDuration}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Luxury Amenities Management */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Premium Onboard Amenities ({amenities.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">Click to toggle amenities for passengers</span>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2">
                  {PRESET_AMENITIES.map((item) => {
                    const isSelected = amenities.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleAmenity(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Amenity Tag */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="text"
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAmenity();
                      }
                    }}
                    placeholder="Add custom amenity (e.g. Refreshment Box, USB-C 65W)..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Tag
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: TIMETABLE & STOPS (BOARDING & DROPPING)
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'timetable' && (
            <div className="space-y-6">
              
              {/* Departure & Arrival Time Overview */}
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" /> Main Departure Time
                  </label>
                  <input
                    type="text"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="06:30 AM"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" /> Estimated Arrival Time
                  </label>
                  <input
                    type="text"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="12:30 PM"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-indigo-600" /> Trip Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs font-bold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="6h 00m"
                  />
                </div>
              </div>

              {/* 1. Boarding Stops List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Boarding Stops / Pick-up Points ({boardingPoints.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddBoardingPoint}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Boarding Stop
                  </button>
                </div>

                <div className="space-y-3">
                  {boardingPoints.map((bp, idx) => (
                    <div key={bp.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700">Pickup Location #{idx + 1}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBoardingPoint(idx)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          title="Remove stop"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-5 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Stop Name</label>
                          <input
                            type="text"
                            value={bp.name}
                            onChange={(e) => handleUpdateBoardingPoint(idx, 'name', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="Monaragala Main Station"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Pickup Time</label>
                          <input
                            type="text"
                            value={bp.time}
                            onChange={(e) => handleUpdateBoardingPoint(idx, 'time', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="06:30 AM"
                          />
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Landmark / Station Gate</label>
                          <input
                            type="text"
                            value={bp.landmark}
                            onChange={(e) => handleUpdateBoardingPoint(idx, 'landmark', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="Platform 1 Gate"
                          />
                        </div>

                        <div className="sm:col-span-6 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Latitude (GPS)</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={bp.lat || 0}
                            onChange={(e) => handleUpdateBoardingPoint(idx, 'lat', Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="6.8722"
                          />
                        </div>

                        <div className="sm:col-span-6 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Longitude (GPS)</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={bp.lng || 0}
                            onChange={(e) => handleUpdateBoardingPoint(idx, 'lng', Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="81.3507"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Dropping Stops List */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Dropping Stops / Drop-off Points ({dropPoints.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddDropPoint}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Dropping Stop
                  </button>
                </div>

                <div className="space-y-3">
                  {dropPoints.map((dp, idx) => (
                    <div key={dp.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700">Drop-off Location #{idx + 1}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDropPoint(idx)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                          title="Remove stop"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-5 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Stop Name</label>
                          <input
                            type="text"
                            value={dp.name}
                            onChange={(e) => handleUpdateDropPoint(idx, 'name', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Colombo Fort Terminal"
                          />
                        </div>

                        <div className="sm:col-span-3 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Drop-off Time</label>
                          <input
                            type="text"
                            value={dp.time}
                            onChange={(e) => handleUpdateDropPoint(idx, 'time', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="12:30 PM"
                          />
                        </div>

                        <div className="sm:col-span-4 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Landmark / Drop Bay</label>
                          <input
                            type="text"
                            value={dp.landmark}
                            onChange={(e) => handleUpdateDropPoint(idx, 'landmark', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Main Passenger Gate"
                          />
                        </div>

                        <div className="sm:col-span-6 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Latitude (GPS)</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={dp.lat || 0}
                            onChange={(e) => handleUpdateDropPoint(idx, 'lat', Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="6.9344"
                          />
                        </div>

                        <div className="sm:col-span-6 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Longitude (GPS)</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={dp.lng || 0}
                            onChange={(e) => handleUpdateDropPoint(idx, 'lng', Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder="79.8510"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: LIVE PASSENGER PREVIEW
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              
              {/* Header preview */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                      Passenger View
                    </span>
                    <h3 className="text-xl font-black mt-2">{origin} → {destination}</h3>
                    <p className="text-xs text-blue-200 mt-0.5">{operatorName} • {busNumber} • {busType}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Starting From</span>
                    <p className="text-xl font-black text-amber-400 font-mono">LKR {Number(priceStarting).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Amenities Grid Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" /> Active Amenities
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {amenities.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-2 shadow-xs">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timetable Stops Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                  <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pick-up Stops ({boardingPoints.length})
                  </h5>
                  <div className="space-y-2">
                    {boardingPoints.map((bp, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{bp.name}</p>
                          <p className="text-[10px] text-slate-400">{bp.landmark}</p>
                        </div>
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {bp.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Drop-off Stops ({dropPoints.length})
                  </h5>
                  <div className="space-y-2">
                    {dropPoints.map((dp, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-indigo-200 text-xs flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{dp.name}</p>
                          <p className="text-[10px] text-slate-400">{dp.landmark}</p>
                        </div>
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {dp.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {boardingPoints.length} Boarding Stops • {dropPoints.length} Drop Stops • {amenities.length} Amenities
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Route & Timetable
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
