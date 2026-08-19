import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import type { BusRoute, Seat, BusCategory } from '../../types/booking';
import { LayoutGrid, Save, X, Shield, Bus, RefreshCw } from 'lucide-react';

interface Props {
  route: BusRoute;
  onClose: () => void;
}

export const SeatLayoutCustomizerModal: React.FC<Props> = ({ route, onClose }) => {
  const { loadRoutes } = useBookingStore();

  const [busType, setBusType] = useState<BusCategory>(
    (route.busType as any) || 'Lanka Ashok Leyland (57 Seats 3*2)'
  );
  const [basePrice, setBasePrice] = useState<number>(route.priceStarting || 1800);
  const [seats, setSeats] = useState<Seat[]>([...route.seats]);
  const [isSaving, setIsSaving] = useState(false);

  // Generate preset layouts
  const applyPreset = (type: BusCategory, price: number) => {
    setBusType(type);
    setBasePrice(price);

    const newSeats: Seat[] = [];

    // Lanka Ashok Leyland 57 Seats 3*2
    if (type.includes('3*2') || type.includes('Leyland')) {
      const totalRows = 11;
      for (let r = 1; r <= totalRows; r++) {
        [1, 2, 3, 5, 6].forEach((c) => {
          const seatLetter = String.fromCharCode(64 + (c > 4 ? c - 1 : c));
          const seatNum = `${r}${seatLetter}`;
          const isFemaleOnly = (r === 2 || r === 3) && c <= 3;
          newSeats.push({
            id: `${route.id}-${seatNum}`,
            number: seatNum,
            deck: 'lower',
            row: r,
            col: c,
            price: price,
            status: 'available',
            isSleeper: false,
            isFemaleOnly,
          });
        });
      }
      // Row 12 back row 2 seats = 57 seats total
      [1, 2].forEach((c) => {
        const seatNum = `12${String.fromCharCode(64 + c)}`;
        newSeats.push({
          id: `${route.id}-${seatNum}`,
          number: seatNum,
          deck: 'lower',
          row: 12,
          col: c,
          price: price,
          status: 'available',
          isSleeper: false,
          isFemaleOnly: false,
        });
      });
    } else if (type.includes('2*2')) {
      // 57 Seats 2*2 layout
      const totalRows = 14;
      for (let r = 1; r <= totalRows; r++) {
        [1, 2, 4, 5].forEach((c) => {
          const seatLetter = String.fromCharCode(64 + (c > 3 ? c - 1 : c));
          const seatNum = `${r}${seatLetter}`;
          const isFemaleOnly = (r === 2 || r === 3) && c <= 2;
          newSeats.push({
            id: `${route.id}-${seatNum}`,
            number: seatNum,
            deck: 'lower',
            row: r,
            col: c,
            price: price,
            status: 'available',
            isSleeper: false,
            isFemaleOnly,
          });
        });
      }
      newSeats.push({
        id: `${route.id}-15A`,
        number: '15A',
        deck: 'lower',
        row: 15,
        col: 1,
        price: price,
        status: 'available',
        isSleeper: false,
        isFemaleOnly: false,
      });
    } else {
      // Standard Volvo 40 seats
      for (let r = 1; r <= 10; r++) {
        [1, 2, 4, 5].forEach((c) => {
          const seatNum = `L${r}${String.fromCharCode(64 + c)}`;
          newSeats.push({
            id: `${route.id}-${seatNum}`,
            number: seatNum,
            deck: 'lower',
            row: r,
            col: c,
            price: price,
            status: 'available',
            isSleeper: false,
            isFemaleOnly: (r === 2 || r === 3) && c <= 2,
          });
        });
      }
    }

    setSeats(newSeats);
  };

  // Toggle seat status on grid click (Available -> Female Reserved -> Booked/Blocked -> Available)
  const toggleSeatProperty = (seatId: string) => {
    setSeats(prev =>
      prev.map(s => {
        if (s.id !== seatId) return s;
        if (!s.isFemaleOnly && s.status === 'available') {
          return { ...s, isFemaleOnly: true };
        } else if (s.isFemaleOnly) {
          return { ...s, isFemaleOnly: false, status: 'booked' };
        } else {
          return { ...s, isFemaleOnly: false, status: 'available' };
        }
      })
    );
  };

  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/routes/${route.id}/layout`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busType,
          priceStarting: basePrice,
          seats: seats.map(s => ({ ...s, price: basePrice })),
        }),
      });

      if (!res.ok) throw new Error('Failed to update seat layout');

      await loadRoutes();
      setIsSaving(false);
      alert(`Seat layout updated successfully for ${route.busNumber}! Total seats: ${seats.length}`);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      alert(`Error saving layout: ${err.message}`);
    }
  };

  // Group seats by row for layout preview
  const rowsMap: { [row: number]: Seat[] } = {};
  seats.forEach(s => {
    if (!rowsMap[s.row]) rowsMap[s.row] = [];
    rowsMap[s.row].push(s);
  });
  const rowNumbers = Object.keys(rowsMap).map(Number).sort((a, b) => a - b);
  const is3By2 = busType.includes('3*2') || busType.includes('Leyland');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in-up">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-xl space-y-6 p-6 my-8 max-h-[90vh] overflow-y-auto animate-pop-in">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-blue-600" />
              Customize Seat Layout (Admin / Operator)
            </h3>
            <p className="text-xs text-slate-500">
              {route.operatorName} • {route.busNumber} ({route.origin} → {route.destination})
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layout Presets Selection */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Select Bus Model & Seating Preset
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => applyPreset('Lanka Ashok Leyland (57 Seats 3*2)', 1800)}
              className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                busType.includes('3*2')
                  ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-slate-800">
                <Bus className="w-4 h-4 text-blue-600" /> Lanka Ashok Leyland
              </div>
              <p className="text-[11px] text-blue-600 font-mono mt-1">57 Seats (3*2 Layout)</p>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('Lanka Ashok Leyland (57 Seats 2*2)', 1800)}
              className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                busType.includes('2*2') && !busType.includes('Volvo')
                  ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-slate-800">
                <Bus className="w-4 h-4 text-indigo-600" /> Lanka Ashok Leyland
              </div>
              <p className="text-[11px] text-indigo-600 font-mono mt-1">57 Seats (2*2 Layout)</p>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('Luxury Volvo Multi-Axle', 2800)}
              className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                busType.includes('Volvo')
                  ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-slate-800">
                <Bus className="w-4 h-4 text-amber-600" /> Volvo Multi-Axle
              </div>
              <p className="text-[11px] text-amber-600 font-mono mt-1">40 Seats (2*2 Luxury)</p>
            </button>
          </div>
        </div>

        {/* Pricing & Summary Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Base Seat Price:</span>
            <span className="font-bold text-slate-800">LKR</span>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
              className="w-24 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-mono font-bold"
            />
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <span>Total Configured Seats: <strong className="text-blue-600 font-mono text-sm">{seats.length}</strong></span>
            <span>Female Reserved: <strong className="text-pink-600 font-mono">{seats.filter(s => s.isFemaleOnly).length}</strong></span>
            <span>Blocked: <strong className="text-slate-800 font-mono">{seats.filter(s => s.status === 'booked').length}</strong></span>
          </div>
        </div>

        {/* Interactive Grid Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Interactive Seat Grid (Click seat to toggle Available ➔ Female Reserved ➔ Blocked)</span>
            <span className="text-[11px] italic">Front of Bus / Driver Wheel on Right</span>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 max-h-[300px] overflow-y-auto">
            {rowNumbers.map(rowNum => {
              const rowSeats = rowsMap[rowNum] || [];
              const leftSeats = rowSeats.filter(s => is3By2 ? s.col <= 3 : s.col <= 2).sort((a, b) => a.col - b.col);
              const rightSeats = rowSeats.filter(s => is3By2 ? s.col >= 5 : s.col >= 4).sort((a, b) => a.col - b.col);

              return (
                <div key={rowNum} className="flex items-center justify-between gap-4 px-2">
                  <div className="flex items-center gap-1.5">
                    {leftSeats.map(seat => (
                      <button
                        key={seat.id}
                        type="button"
                        onClick={() => toggleSeatProperty(seat.id)}
                        className={`w-9 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border transition-all ${
                          seat.status === 'booked'
                            ? 'bg-slate-200 border-slate-300 text-slate-500'
                            : seat.isFemaleOnly
                            ? 'bg-pink-100 border-pink-300 text-pink-700'
                            : 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200'
                        }`}
                        title="Click to toggle seat state"
                      >
                        <span>{seat.number}</span>
                        {seat.isFemaleOnly ? <Shield className="w-3 h-3 text-pink-600" /> : null}
                      </button>
                    ))}
                  </div>

                  <div className="text-[9px] font-mono text-slate-400">AISLE</div>

                  <div className="flex items-center gap-1.5">
                    {rightSeats.map(seat => (
                      <button
                        key={seat.id}
                        type="button"
                        onClick={() => toggleSeatProperty(seat.id)}
                        className={`w-9 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border transition-all ${
                          seat.status === 'booked'
                            ? 'bg-slate-200 border-slate-300 text-slate-500'
                            : seat.isFemaleOnly
                            ? 'bg-pink-100 border-pink-300 text-pink-700'
                            : 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200'
                        }`}
                        title="Click to toggle seat state"
                      >
                        <span>{seat.number}</span>
                        {seat.isFemaleOnly ? <Shield className="w-3 h-3 text-pink-600" /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveLayout}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Deploying Layout...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Deploy Custom Layout</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
