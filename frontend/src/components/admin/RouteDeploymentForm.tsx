import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { routesApi } from '../../services/api';
import type { BusCategory } from '../../types/booking';
import { LayoutGrid, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface RouteDeploymentFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const RouteDeploymentForm: React.FC<RouteDeploymentFormProps> = ({ onClose, onSuccess }) => {
  const { routes, loadRoutes } = useBookingStore();

  const [operatorName, setOperatorName] = useState('Dewmina Super Line');
  const [busNumber, setBusNumber] = useState('ND-8899');
  const [busType, setBusType] = useState<BusCategory | '__custom__'>('Ashok Leyland (54 Seats 3*2)');
  const [customBusType, setCustomBusType] = useState('');
  const [origin, setOrigin] = useState('Monaragala');
  const [destination, setDestination] = useState('Colombo');
  const [departureTime, setDepartureTime] = useState('10:00 AM');
  const [arrivalTime, setArrivalTime] = useState('03:30 PM');
  const [duration, setDuration] = useState('5h 30m');
  const [priceStarting, setPriceStarting] = useState<number | string>(1800);
  const [amenities, setAmenities] = useState<string[]>(['AC', 'Wi-Fi', 'Charging Ports', 'Live GPS Tracking', 'Reclining Seats']);
  const [showAdvancedStops, setShowAdvancedStops] = useState(false);
  const [pickupStop1, setPickupStop1] = useState('');
  const [pickupStop2, setPickupStop2] = useState('');
  const [dropStop1, setDropStop1] = useState('');
  const [dropStop2, setDropStop2] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sri Lanka Bus License Plate format validation helper
  // Strictly max 4 digits in number portion, e.g. "ND-8899", "WP ND-8899", "62-1234"
  const isValidBusRegNumber = (val: string): boolean => {
    const trimmed = val.trim();
    if (trimmed.length < 4) return false;
    // Count total trailing/license digits - must be between 1 and 4
    const digitsMatch = trimmed.match(/\d+/g);
    if (!digitsMatch) return false;
    
    // Check if the primary number sequence exceeds 4 digits
    const lastDigits = digitsMatch[digitsMatch.length - 1];
    if (lastDigits && lastDigits.length > 4) return false;

    const platePattern = /^(([A-Za-z]{1,3}|[0-9]{2,3})\s*[- ]\s*[0-9]{1,4}|(WP|CP|SP|NP|EP|NW|NC|UP|SG)[- ]([A-Za-z]{2,3}|[0-9]{2,3})[- ][0-9]{1,4})$/i;
    const generalPattern = /^[A-Za-z0-9\s\-]+[- ]\d{1,4}$/i;
    return platePattern.test(trimmed) || generalPattern.test(trimmed);
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Operator Name
    if (!operatorName.trim()) {
      errs.operatorName = 'Operator name is required.';
    } else if (operatorName.trim().length < 2) {
      errs.operatorName = 'Operator name must be at least 2 characters.';
    }

    // 2. Bus Reg. Number (Strictly max 4 numbers)
    const trimmedBusNum = busNumber.trim();
    const numPartMatch = trimmedBusNum.split('-')[1]?.replace(/\D/g, '');

    if (!trimmedBusNum) {
      errs.busNumber = 'Bus registration number is required (e.g., ND-8899).';
    } else if (numPartMatch && numPartMatch.length > 4) {
      errs.busNumber = 'Bus registration number cannot exceed 4 digits (e.g., ND-8899).';
    } else if (trimmedBusNum.length < 4 || !isValidBusRegNumber(trimmedBusNum)) {
      errs.busNumber = 'Invalid format. Max 4 digits allowed (e.g., ND-8899 or WP ND-8899).';
    } else if (routes.some(r => r.busNumber.trim().toLowerCase() === trimmedBusNum.toLowerCase())) {
      errs.busNumber = `Bus ${trimmedBusNum} is already active in the fleet.`;
    }

    // 3. Bus Model
    if (busType === '__custom__' && !customBusType.trim()) {
      errs.busType = 'Please enter the custom bus model name.';
    }

    // 4. Origin
    if (!origin.trim()) {
      errs.origin = 'Origin city is required.';
    }

    // 5. Destination
    if (!destination.trim()) {
      errs.destination = 'Destination city is required.';
    } else if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      errs.destination = 'Destination city must be different from Origin city.';
    }

    // 6. Departure Time
    if (!departureTime.trim()) {
      errs.departureTime = 'Departure time is required (e.g., 10:00 AM).';
    }

    // 7. Arrival Time
    if (!arrivalTime.trim()) {
      errs.arrivalTime = 'Arrival time is required (e.g., 03:30 PM).';
    }

    // 8. Duration
    if (!duration.trim()) {
      errs.duration = 'Journey duration is required (e.g., 5h 30m).';
    }

    // 9. Base Price
    const numericPrice = Number(priceStarting);
    if (!priceStarting || isNaN(numericPrice)) {
      errs.priceStarting = 'Base price is required.';
    } else if (numericPrice < 500) {
      errs.priceStarting = 'Base price must be at least 500 LKR.';
    } else if (numericPrice > 50000) {
      errs.priceStarting = 'Base price cannot exceed 50,000 LKR.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    const selectedBusType = busType === '__custom__' ? customBusType.trim() : busType;
    const newId = `route-${Date.now()}`;
    const numericPrice = Number(priceStarting);

    const bpList = [
      { name: pickupStop1.trim() || `${origin.trim()} Main Terminal`, time: departureTime.trim(), landmark: 'Main Station Gate', lat: 6.8722, lng: 81.3507 },
      ...(pickupStop2.trim() ? [{ name: pickupStop2.trim(), time: departureTime.trim(), landmark: 'Intermediate Pickup Stop', lat: 6.7410, lng: 81.1020 }] : [])
    ];
    const dpList = [
      ...(dropStop1.trim() ? [{ name: dropStop1.trim(), time: arrivalTime.trim(), landmark: 'Highway Exit Hub', lat: 6.8416, lng: 79.9974 }] : []),
      { name: dropStop2.trim() || `${destination.trim()} Fort Station`, time: arrivalTime.trim(), landmark: 'Main Passenger Drop Bay', lat: 6.9344, lng: 79.8510 }
    ];

    setIsSubmitting(true);
    try {
      await routesApi.create({
        id: newId,
        operatorId: 'op-custom',
        operatorName: operatorName.trim(),
        operatorRating: 4.9,
        busNumber: busNumber.trim(),
        busType: selectedBusType,
        origin: origin.trim(),
        destination: destination.trim(),
        departureTime: departureTime.trim(),
        arrivalTime: arrivalTime.trim(),
        duration: duration.trim(),
        priceStarting: numericPrice,
        hasUpperDeck: selectedBusType.includes('Double') || selectedBusType.includes('Sleeper'),
        amenities: amenities.length > 0 ? amenities : ['Wi-Fi', 'AC', 'Live GPS', 'Charging Ports', 'Reclining Seats'],
        boardingPoints: bpList,
        dropPoints: dpList,
      });

      await loadRoutes();
      setSuccessMessage(`Bus Route ${busNumber} successfully deployed to live fleet!`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setServerError(err.message || 'Failed to deploy route. Please check server connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-blue-200 shadow-sm space-y-4 animate-pop-in">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-blue-600" /> Route & Visual Seat Layout Designer
        </h3>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          Fleet Deployment Validator
        </span>
      </div>

      {/* Global Server Error Banner */}
      {serverError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        
        {/* Operator Name */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Operator Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={operatorName}
            onChange={e => {
              setOperatorName(e.target.value);
              if (errors.operatorName) setErrors(prev => ({ ...prev, operatorName: '' }));
            }}
            placeholder="Dewmina Super Line"
            className={`w-full rounded-xl p-2.5 font-semibold text-slate-800 border transition-all ${
              errors.operatorName
                ? 'bg-rose-50/50 border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            }`}
          />
          {errors.operatorName && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.operatorName}
            </p>
          )}
        </div>

        {/* Bus Reg. Number */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-slate-700 font-bold">
              Bus Reg. Number <span className="text-rose-500">*</span>
            </label>
            {busNumber.trim().length >= 5 && isValidBusRegNumber(busNumber) && !errors.busNumber && (
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Valid Plate
              </span>
            )}
          </div>
          <input
            type="text"
            value={busNumber}
            onChange={e => {
              let val = e.target.value.toUpperCase();
              
              // If there's a dash (e.g. ND-3333), prevent typing more than 4 digits after the dash
              const parts = val.split('-');
              if (parts.length >= 2) {
                const prefix = parts[0];
                const rest = parts.slice(1).join('');
                const digits = rest.replace(/\D/g, '').slice(0, 4);
                val = `${prefix}-${digits}`;
              } else {
                // If no dash yet, prevent typing more than 4 numbers anywhere
                let digitCount = 0;
                val = val.split('').filter(ch => {
                  if (/\d/.test(ch)) {
                    digitCount++;
                    return digitCount <= 4;
                  }
                  return true;
                }).join('');
              }

              setBusNumber(val);
              if (errors.busNumber) setErrors(prev => ({ ...prev, busNumber: '' }));
            }}
            placeholder="e.g. ND-8899 or WP ND-8899"
            maxLength={12}
            className={`w-full rounded-xl p-2.5 font-semibold text-slate-800 border transition-all ${
              errors.busNumber
                ? 'bg-rose-50/50 border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            }`}
          />
          {errors.busNumber ? (
            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.busNumber}
            </p>
          ) : (
            <p className="text-[10px] text-slate-400 mt-1">
              Format: <span className="font-mono text-slate-500">ND-8899</span> or <span className="font-mono text-slate-500">WP ND-8899</span>
            </p>
          )}
        </div>

        {/* Bus Model & Seating */}
        <div>
          <label className="block text-slate-700 font-bold mb-1 text-blue-600">
            Bus Model & Seating <span className="text-rose-500">*</span>
          </label>
          <select
            value={busType}
            onChange={(e: any) => {
              setBusType(e.target.value);
              if (errors.busType) setErrors(prev => ({ ...prev, busType: '' }));
            }}
            className="w-full bg-slate-50 border border-blue-300 rounded-xl p-2.5 text-slate-800 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="Ashok Leyland (54 Seats 3*2)">🚌 Ashok Leyland (54 Seats 3*2)</option>
            <option value="Ashok Leyland (54 Seats 2*2)">🚌 Ashok Leyland (54 Seats 2*2)</option>
            <option value="Lanka Ashok Leyland (57 Seats 3*2)">🚌 Lanka Ashok Leyland (57 Seats 3*2)</option>
            <option value="Lanka Ashok Leyland (57 Seats 2*2)">🚌 Lanka Ashok Leyland (57 Seats 2*2)</option>
            <option value="Yutong (48 Seats 2*2)">🚌 Yutong (48 Seats 2*2)</option>
            <option value="Yutong (51 Seats 2*2)">🚌 Yutong (51 Seats 2*2)</option>
            <option value="AC Sleeper">🛌 AC Sleeper</option>
            <option value="Luxury Volvo Multi-Axle">✨ Luxury Volvo Multi-Axle</option>
            <option value="__custom__">⚙️ Custom Bus Model</option>
          </select>
          {busType === '__custom__' && (
            <input
              type="text"
              value={customBusType}
              onChange={e => {
                setCustomBusType(e.target.value);
                if (errors.busType) setErrors(prev => ({ ...prev, busType: '' }));
              }}
              placeholder="Enter custom bus model"
              className={`w-full mt-2 rounded-xl p-2.5 font-semibold text-slate-800 border transition-all ${
                errors.busType
                  ? 'bg-rose-50/50 border-rose-400 focus:border-rose-500'
                  : 'bg-white border-blue-300 focus:border-blue-500'
              }`}
            />
          )}
          {errors.busType && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.busType}
            </p>
          )}
        </div>

        {/* Origin City */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Origin City <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={origin}
            onChange={e => {
              setOrigin(e.target.value);
              if (errors.origin) setErrors(prev => ({ ...prev, origin: '' }));
              if (errors.destination) setErrors(prev => ({ ...prev, destination: '' }));
            }}
            placeholder="Monaragala"
            className={`w-full rounded-xl p-2.5 font-semibold text-slate-800 border transition-all ${
              errors.origin
                ? 'bg-rose-50/50 border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            }`}
          />
          {errors.origin && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.origin}
            </p>
          )}
        </div>

        {/* Destination City */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Destination City <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={destination}
            onChange={e => {
              setDestination(e.target.value);
              if (errors.destination) setErrors(prev => ({ ...prev, destination: '' }));
            }}
            placeholder="Colombo"
            className={`w-full rounded-xl p-2.5 font-semibold text-slate-800 border transition-all ${
              errors.destination
                ? 'bg-rose-50/50 border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            }`}
          />
          {errors.destination && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.destination}
            </p>
          )}
        </div>

        {/* Departure Time */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Departure Time <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={departureTime}
            onChange={e => {
              setDepartureTime(e.target.value);
              if (errors.departureTime) setErrors(prev => ({ ...prev, departureTime: '' }));
            }}
            placeholder="10:00 AM"
            className={`w-full rounded-xl p-2.5 font-semibold text-slate-800 border transition-all ${
              errors.departureTime
                ? 'bg-rose-50/50 border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            }`}
          />
          {errors.departureTime && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.departureTime}
            </p>
          )}
        </div>

        {/* Arrival Time */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Arrival Time <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={arrivalTime}
            onChange={e => {
              setArrivalTime(e.target.value);
              if (errors.arrivalTime) setErrors(prev => ({ ...prev, arrivalTime: '' }));
            }}
            placeholder="03:30 PM"
            className={`w-full rounded-xl p-2.5 font-semibold text-slate-800 border transition-all ${
              errors.arrivalTime
                ? 'bg-rose-50/50 border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            }`}
          />
          {errors.arrivalTime && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.arrivalTime}
            </p>
          )}
        </div>

        {/* Journey Duration */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Journey Duration <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={duration}
            onChange={e => {
              setDuration(e.target.value);
              if (errors.duration) setErrors(prev => ({ ...prev, duration: '' }));
            }}
            placeholder="5h 30m"
            className={`w-full rounded-xl p-2.5 font-semibold text-slate-800 border transition-all ${
              errors.duration
                ? 'bg-rose-50/50 border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            }`}
          />
          {errors.duration && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.duration}
            </p>
          )}
        </div>

        {/* Base Price (LKR) */}
        <div>
          <label className="block text-slate-700 font-bold mb-1">
            Base Price (LKR) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            min={500}
            max={50000}
            step={50}
            value={priceStarting}
            onChange={e => {
              setPriceStarting(e.target.value);
              if (errors.priceStarting) setErrors(prev => ({ ...prev, priceStarting: '' }));
            }}
            className={`w-full rounded-xl p-2.5 font-semibold text-slate-800 border transition-all ${
              errors.priceStarting
                ? 'bg-rose-50/50 border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'bg-slate-50 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
            }`}
          />
          {errors.priceStarting && (
            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.priceStarting}
            </p>
          )}
        </div>

      </div>

      {/* Luxury Amenities & Timetable Stops Section */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800">
            Luxury Amenities ({amenities.length})
          </label>
          <button
            type="button"
            onClick={() => setShowAdvancedStops(!showAdvancedStops)}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline"
          >
            {showAdvancedStops ? 'Hide Timetable Stops' : '+ Custom Timetable Stops (Optional)'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {['AC', 'Wi-Fi', 'Charging Ports', 'Live GPS Tracking', 'Reclining Seats', 'Water Bottle', 'Blanket', 'Music'].map(item => {
            const isSelected = amenities.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setAmenities(amenities.filter(a => a !== item));
                  } else {
                    setAmenities([...amenities, item]);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{item}</span>
              </button>
            );
          })}
        </div>

        {showAdvancedStops && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-fade-in">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Pickup Stop 1 (Origin)</label>
              <input
                type="text"
                value={pickupStop1}
                onChange={e => setPickupStop1(e.target.value)}
                placeholder={`${origin || 'Origin'} Main Bus Stand`}
                className="w-full rounded-xl p-2 bg-white border border-slate-200 text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Pickup Stop 2 (Intermediate)</label>
              <input
                type="text"
                value={pickupStop2}
                onChange={e => setPickupStop2(e.target.value)}
                placeholder="Wellawaya Clock Tower Junction"
                className="w-full rounded-xl p-2 bg-white border border-slate-200 text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Drop Stop 1 (Highway Exit)</label>
              <input
                type="text"
                value={dropStop1}
                onChange={e => setDropStop1(e.target.value)}
                placeholder="Kottawa Highway Exit Hub"
                className="w-full rounded-xl p-2 bg-white border border-slate-200 text-slate-800 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Drop Stop 2 (Destination)</label>
              <input
                type="text"
                value={dropStop2}
                onChange={e => setDropStop2(e.target.value)}
                placeholder={`${destination || 'Destination'} Fort Bus Station`}
                className="w-full rounded-xl p-2 bg-white border border-slate-200 text-slate-800 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all hover:scale-105 disabled:opacity-60 flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Validating & Deploying...</span>
            </>
          ) : (
            <span>Deploy Bus to Live Fleet</span>
          )}
        </button>
      </div>
    </form>
  );
};
