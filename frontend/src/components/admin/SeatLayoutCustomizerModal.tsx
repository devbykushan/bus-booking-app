import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { routesApi } from '../../services/api';
import type { BusRoute, Seat, BusCategory, DeckType, SeatStatus } from '../../types/booking';
import { 
  LayoutGrid, Save, X, Shield, Bus, RefreshCw, Plus, Trash2, Edit3, 
  CheckCircle2, DollarSign, Layers, Sliders, Settings2
} from 'lucide-react';

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
  const [seats, setSeats] = useState<Seat[]>([...(route.seats || [])]);
  const [activeDeck, setActiveDeck] = useState<DeckType>('lower');
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddSeatModal, setShowAddSeatModal] = useState(false);

  // New Seat Form State
  const [newSeatNum, setNewSeatNum] = useState('');
  const [newSeatPrice, setNewSeatPrice] = useState(route.priceStarting || 1800);
  const [newSeatDeck, setNewSeatDeck] = useState<DeckType>('lower');
  const [newSeatRow, setNewSeatRow] = useState(1);
  const [newSeatCol, setNewSeatCol] = useState(1);
  const [newSeatIsSleeper, setNewSeatIsSleeper] = useState(false);

  // Filter selected seat object
  const selectedSeat = seats.find(s => s.id === selectedSeatId) || null;

  // Check if current configuration has upper deck seats
  const hasUpperDeck = seats.some(s => s.deck === 'upper') || busType.includes('Sleeper') || busType.includes('Double');

  // Generate preset layouts
  const applyPreset = (type: BusCategory, price: number) => {
    setBusType(type);
    setBasePrice(price);
    setSelectedSeatId(null);

    const newSeats: Seat[] = [];

    if (type.includes('54 Seats 3*2')) {
      // Ashok Leyland 54 seats: 10 rows of 5 plus 4 rear seats.
      for (let r = 1; r <= 10; r++) {
        [1, 2, 3, 5, 6].forEach((c) => {
          const seatNum = `${r}${String.fromCharCode(64 + (c > 4 ? c - 1 : c))}`;
          newSeats.push({ id: `${route.id}-${seatNum}`, number: seatNum, deck: 'lower', row: r, col: c, price, status: 'available', isSleeper: false, isFemaleOnly: (r === 2 || r === 3) && c <= 3 });
        });
      }
      [1, 2, 3, 5].forEach((c) => {
        const seatNum = `11${String.fromCharCode(64 + (c > 4 ? c - 1 : c))}`;
        newSeats.push({ id: `${route.id}-${seatNum}`, number: seatNum, deck: 'lower', row: 12, col: c, price, status: 'available', isSleeper: false, isFemaleOnly: false });
      });
    } else if (type.includes('54 Seats')) {
      // Ashok Leyland 54 seats: 13 rows of 4 plus 2 rear seats.
      for (let r = 1; r <= 13; r++) {
        [1, 2, 4, 5].forEach((c) => {
          const seatNum = `${r}${String.fromCharCode(64 + (c > 3 ? c - 1 : c))}`;
          newSeats.push({ id: `${route.id}-${seatNum}`, number: seatNum, deck: 'lower', row: r, col: c, price, status: 'available', isSleeper: false, isFemaleOnly: (r === 2 || r === 3) && c <= 2 });
        });
      }
      [1, 2].forEach((c) => {
        const seatNum = `14${String.fromCharCode(64 + c)}`;
        newSeats.push({ id: `${route.id}-${seatNum}`, number: seatNum, deck: 'lower', row: 14, col: c, price, status: 'available', isSleeper: false, isFemaleOnly: false });
      });
    } else if (type.includes('Yutong')) {
      // Yutong 2*2 layouts: 12 rows of 4, with 3 extra rear seats for 51.
      for (let r = 1; r <= 12; r++) {
        [1, 2, 4, 5].forEach((c) => {
          const seatNum = `Y${r}${String.fromCharCode(64 + (c > 3 ? c - 1 : c))}`;
          newSeats.push({ id: `${route.id}-${seatNum}`, number: seatNum, deck: 'lower', row: r, col: c, price, status: 'available', isSleeper: false, isFemaleOnly: (r === 2 || r === 3) && c <= 2 });
        });
      }
      if (type.includes('51 Seats')) {
        [1, 2, 3].forEach((c) => {
          const seatNum = `Y13${String.fromCharCode(64 + c)}`;
          newSeats.push({ id: `${route.id}-${seatNum}`, number: seatNum, deck: 'lower', row: 13, col: c, price, status: 'available', isSleeper: false, isFemaleOnly: false });
        });
      }
    } else if (type.includes('3*2') || type.includes('Leyland')) {
      // Lanka Ashok Leyland 57 Seats 3*2
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
    } else if (type.includes('2*2') && !type.includes('Volvo')) {
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
    } else if (type.includes('AC Sleeper')) {
      // AC Sleeper 36 berths (18 lower, 18 upper)
      ['lower', 'upper'].forEach((deckName) => {
        const prefix = deckName === 'lower' ? 'L' : 'U';
        for (let r = 1; r <= 9; r++) {
          [1, 3].forEach((c) => {
            const seatNum = `${prefix}${r}${c === 1 ? 'A' : 'B'}`;
            newSeats.push({
              id: `${route.id}-${seatNum}`,
              number: seatNum,
              deck: deckName as DeckType,
              row: r,
              col: c,
              price: price + (deckName === 'upper' ? 200 : 0),
              status: 'available',
              isSleeper: true,
              isFemaleOnly: r <= 2 && c === 1,
            });
          });
        }
      });
    } else if (type.includes('Double Decker Sleeper')) {
      // Double Decker Sleeper 48 Seats (24 lower, 24 upper)
      ['lower', 'upper'].forEach((deckName) => {
        const prefix = deckName === 'lower' ? 'L' : 'U';
        for (let r = 1; r <= 6; r++) {
          [1, 2, 4, 5].forEach((c) => {
            const seatLetter = String.fromCharCode(64 + (c > 3 ? c - 1 : c));
            const seatNum = `${prefix}${r}${seatLetter}`;
            newSeats.push({
              id: `${route.id}-${seatNum}`,
              number: seatNum,
              deck: deckName as DeckType,
              row: r,
              col: c,
              price: price + (deckName === 'upper' ? 300 : 0),
              status: 'available',
              isSleeper: true,
              isFemaleOnly: r === 1 && c <= 2,
            });
          });
        }
      });
    } else {
      // Standard Volvo 40 seats (2*2 Luxury)
      for (let r = 1; r <= 10; r++) {
        [1, 2, 4, 5].forEach((c) => {
          const seatNum = `V${r}${String.fromCharCode(64 + (c > 3 ? c - 1 : c))}`;
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

  // Toggle seat status on quick grid click
  const handleSeatClick = (seatId: string) => {
    setSelectedSeatId(seatId);
  };

  // Update a specific property on the selected seat
  const updateSelectedSeatProperty = (key: keyof Seat, value: any) => {
    if (!selectedSeatId) return;
    setSeats(prev =>
      prev.map(s => {
        if (s.id !== selectedSeatId) return s;
        return { ...s, [key]: value };
      })
    );
  };

  // Delete individual seat
  const handleDeleteSeat = (seatId: string) => {
    if (!confirm('Are you sure you want to remove this seat from layout?')) return;
    setSeats(prev => prev.filter(s => s.id !== seatId));
    if (selectedSeatId === seatId) setSelectedSeatId(null);
  };

  // Add new seat manually
  const handleAddNewSeat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeatNum.trim()) return;

    const seatId = `${route.id}-${newSeatNum.trim().toUpperCase()}`;
    const newSeatObj: Seat = {
      id: seatId,
      number: newSeatNum.trim().toUpperCase(),
      deck: newSeatDeck,
      row: Number(newSeatRow),
      col: Number(newSeatCol),
      price: Number(newSeatPrice),
      status: 'available',
      isFemaleOnly: false,
      isSleeper: newSeatIsSleeper,
    };

    // Replace if exists, or append
    setSeats(prev => [...prev.filter(s => s.id !== seatId && s.number !== newSeatObj.number), newSeatObj]);
    setSelectedSeatId(seatId);
    setShowAddSeatModal(false);
    setNewSeatNum('');
  };

  // Bulk action handlers
  const bulkSetAllPrices = (price: number) => {
    setSeats(prev => prev.map(s => ({ ...s, price })));
  };

  const bulkMakeAllAvailable = () => {
    setSeats(prev => prev.map(s => ({ ...s, status: 'available' })));
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
          seats: seats.map(s => ({
            ...s,
            price: s.price || basePrice,
          })),
        }),
      });

      if (!res.ok) throw new Error('Failed to update seat layout on server');

      await loadRoutes();
      setIsSaving(false);
      alert(`Seat layout saved & deployed for ${route.busNumber}! (${seats.length} seats active)`);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      alert(`Error saving layout: ${err.message}`);
    }
  };

  const handleDeleteLayout = async () => {
    if (!confirm(`Delete the entire seat layout for ${route.busNumber}? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      await routesApi.deleteLayout(route.id);
      await loadRoutes();
      alert(`Seat layout deleted for ${route.busNumber}.`);
      onClose();
    } catch (err: any) {
      alert(`Error deleting layout: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Group seats by deck & row for grid rendering
  const deckSeats = seats.filter(s => s.deck === activeDeck);
  const rowsMap: { [row: number]: Seat[] } = {};
  deckSeats.forEach(s => {
    if (!rowsMap[s.row]) rowsMap[s.row] = [];
    rowsMap[s.row].push(s);
  });
  const rowNumbers = Object.keys(rowsMap).map(Number).sort((a, b) => a - b);
  const is3By2 = busType.includes('3*2') || busType.includes('Leyland');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in-up">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl space-y-5 p-6 my-6 max-h-[92vh] overflow-y-auto animate-pop-in">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <LayoutGrid className="w-6 h-6 text-blue-600" />
                Comprehensive Seat Layout Customizer
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold text-xs">
                Admin & Operator Control
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {route.operatorName} • <strong className="text-slate-700">{route.busNumber}</strong> ({route.origin} → {route.destination})
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bus Model & Seating Presets Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1. Choose Bus Model & Seating Preset Template
            </label>
            <span className="text-[11px] text-slate-400">Click a preset to reset grid to standard model layout</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <button
              type="button"
              onClick={() => applyPreset('Ashok Leyland (54 Seats 3*2)', 1800)}
              className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                busType.includes('3*2')
                  ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-slate-800 text-[11px]">
                <Bus className="w-4 h-4 text-blue-600 flex-shrink-0" /> Ashok Leyland
              </div>
                <p className="text-[10px] text-blue-600 font-mono mt-1 font-semibold">54 Seats (3*2 Express)</p>
            </button>

            <button
              type="button"
              onClick={() => applyPreset('Ashok Leyland (54 Seats 2*2)', 1800)}
              className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                busType.includes('2*2') && !busType.includes('Volvo')
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm ring-2 ring-indigo-500/20'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5 text-slate-800 text-[11px]">
                <Bus className="w-4 h-4 text-indigo-600 flex-shrink-0" /> Ashok Leyland
              </div>
                <p className="text-[10px] text-indigo-600 font-mono mt-1 font-semibold">54 Seats (2*2 Air Bus)</p>
            </button>

              <button
                type="button"
                onClick={() => applyPreset('Yutong (48 Seats 2*2)', 2200)}
                className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                  busType === 'Yutong (48 Seats 2*2)'
                    ? 'bg-cyan-50 border-cyan-500 text-cyan-700 shadow-sm ring-2 ring-cyan-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-slate-800 text-[11px]">
                  <Bus className="w-4 h-4 text-cyan-600 flex-shrink-0" /> Yutong
                </div>
                <p className="text-[10px] text-cyan-600 font-mono mt-1 font-semibold">48 Seats (2*2 Coach)</p>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('Yutong (51 Seats 2*2)', 2200)}
                className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                  busType === 'Yutong (51 Seats 2*2)'
                    ? 'bg-teal-50 border-teal-500 text-teal-700 shadow-sm ring-2 ring-teal-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5 text-slate-800 text-[11px]">
                  <Bus className="w-4 h-4 text-teal-600 flex-shrink-0" /> Yutong
                </div>
                <p className="text-[10px] text-teal-600 font-mono mt-1 font-semibold">51 Seats (2*2 Coach)</p>
              </button>

          </div>
        </div>

        {/* Global Toolbar & Statistics */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Default Fare (LKR):
            </span>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                setBasePrice(val);
              }}
              className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-mono font-bold"
            />
            <button
              type="button"
              onClick={() => bulkSetAllPrices(basePrice)}
              className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[11px]"
              title="Apply this fare to all seats in bus"
            >
              Apply Fare to All Seats
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-600 text-[11px]">
            <span>Total Seats: <strong className="text-blue-600 font-mono text-xs">{seats.length}</strong></span>
            <span>Blocked / Reserved: <strong className="text-slate-800 font-mono text-xs">{seats.filter(s => s.status === 'booked').length}</strong></span>
          </div>
        </div>

        {/* Batch Operations Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <Settings2 className="w-4 h-4 text-blue-600" /> Admin Quick Tools:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={bulkMakeAllAvailable}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Clear All Blocks
            </button>
            <button
              type="button"
              onClick={() => setShowAddSeatModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Add Custom Seat
            </button>
          </div>
        </div>

        {/* Deck Switcher (If Multi-Deck) */}
        {hasUpperDeck && (
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-2">
              <Layers className="w-4 h-4 text-indigo-600" /> Bus Decks:
            </span>
            <button
              type="button"
              onClick={() => setActiveDeck('lower')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDeck === 'lower'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Lower Deck ({seats.filter(s => s.deck === 'lower').length} Seats)
            </button>
            <button
              type="button"
              onClick={() => setActiveDeck('upper')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDeck === 'upper'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Upper Deck ({seats.filter(s => s.deck === 'upper').length} Seats)
            </button>
          </div>
        )}

        {/* Interactive Layout Grid & Inspector Split Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left / Main Visual Grid */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                Interactive Grid ({activeDeck.toUpperCase()} DECK) — Click seat to inspect & modify properties
              </span>
              <span className="text-[11px] italic">Front of Bus / Driver Steering Wheel Right</span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
              {rowNumbers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-medium">
                  No seats configured on {activeDeck} deck. Click "Add Custom Seat" above to insert seats.
                </div>
              ) : (
                rowNumbers.map(rowNum => {
                  const rowSeats = rowsMap[rowNum] || [];
                  const leftSeats = rowSeats.filter(s => is3By2 ? s.col <= 3 : s.col <= 2).sort((a, b) => a.col - b.col);
                  const rightSeats = rowSeats.filter(s => is3By2 ? s.col >= 5 : s.col >= 4).sort((a, b) => a.col - b.col);

                  return (
                    <div key={rowNum} className="flex items-center justify-between gap-4 px-2">
                      {/* Left side seats */}
                      <div className="flex items-center gap-1.5">
                        {leftSeats.map(seat => {
                          const isSelected = selectedSeatId === seat.id;
                          const hasCustomPrice = seat.price && seat.price !== basePrice;

                          return (
                            <button
                              key={seat.id}
                              type="button"
                              onClick={() => handleSeatClick(seat.id)}
                              className={`w-10 h-11 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border transition-all relative ${
                                isSelected
                                  ? 'ring-2 ring-blue-600 ring-offset-1 bg-blue-100 border-blue-500 text-blue-900 shadow-md scale-105 z-10'
                                  : seat.status === 'booked'
                                  ? 'bg-slate-200 border-slate-300 text-slate-500'
                                  : seat.isFemaleOnly
                                  ? 'bg-pink-100 border-pink-300 text-pink-700 hover:bg-pink-200'
                                  : 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'
                              }`}
                              title={`Seat ${seat.number} • LKR ${seat.price || basePrice} • ${seat.status}`}
                            >
                              <span>{seat.number}</span>
                              {seat.isFemaleOnly ? (
                                <Shield className="w-3 h-3 text-pink-600 mt-0.5" />
                              ) : hasCustomPrice ? (
                                <span className="text-[8px] font-mono text-amber-700">LKR {seat.price}</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-[9px] font-mono font-bold text-slate-300 tracking-wider">AISLE</div>

                      {/* Right side seats */}
                      <div className="flex items-center gap-1.5">
                        {rightSeats.map(seat => {
                          const isSelected = selectedSeatId === seat.id;
                          const hasCustomPrice = seat.price && seat.price !== basePrice;

                          return (
                            <button
                              key={seat.id}
                              type="button"
                              onClick={() => handleSeatClick(seat.id)}
                              className={`w-10 h-11 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border transition-all relative ${
                                isSelected
                                  ? 'ring-2 ring-blue-600 ring-offset-1 bg-blue-100 border-blue-500 text-blue-900 shadow-md scale-105 z-10'
                                  : seat.status === 'booked'
                                  ? 'bg-slate-200 border-slate-300 text-slate-500'
                                  : seat.isFemaleOnly
                                  ? 'bg-pink-100 border-pink-300 text-pink-700 hover:bg-pink-200'
                                  : 'bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-emerald-200'
                              }`}
                              title={`Seat ${seat.number} • LKR ${seat.price || basePrice} • ${seat.status}`}
                            >
                              <span>{seat.number}</span>
                              {seat.isFemaleOnly ? (
                                <Shield className="w-3 h-3 text-pink-600 mt-0.5" />
                              ) : hasCustomPrice ? (
                                <span className="text-[8px] font-mono text-amber-700">LKR {seat.price}</span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Grid Legend */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300" /> Admin Blocked / Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-100 border border-blue-500 ring-2 ring-blue-500" /> Currently Selected
              </span>
            </div>
          </div>

          {/* Right Seat Inspector Panel */}
          <div className="lg:col-span-4 h-full min-h-[560px] bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm animate-inspector-in">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between border-b border-slate-200 pb-3 animate-fade-in-up">
              <span className="flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-blue-600" /> Seat Property Inspector
              </span>
              {selectedSeat && (
                <span className="font-mono text-blue-600 font-bold text-xs">{selectedSeat.number}</span>
              )}
            </h4>

            {selectedSeat ? (
              <div className="flex flex-1 flex-col space-y-3 text-xs animate-fade-in-up" key={selectedSeat.id}>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Seat Label / Number</label>
                  <input
                    type="text"
                    value={selectedSeat.number}
                    onChange={(e) => updateSelectedSeatProperty('number', e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Individual Seat Price (LKR)</label>
                  <input
                    type="number"
                    value={selectedSeat.price}
                    onChange={(e) => updateSelectedSeatProperty('price', Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Seat Status</label>
                  <select
                    value={selectedSeat.status}
                    onChange={(e) => updateSelectedSeatProperty('status', e.target.value as SeatStatus)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-800 font-medium"
                  >
                    <option value="available">Available (Open for passengers)</option>
                    <option value="booked">Booked / Blocked (Admin lock)</option>
                    <option value="locked">Locked (Hold status)</option>
                  </select>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200">
                  <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Bus className="w-4 h-4 text-purple-600" /> Sleeper Berth Type
                    </span>
                    <input
                      type="checkbox"
                      checked={!!selectedSeat.isSleeper}
                      onChange={(e) => updateSelectedSeatProperty('isSleeper', e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <label className="block font-semibold mb-1">Row Pos</label>
                    <input
                      type="number"
                      value={selectedSeat.row}
                      onChange={(e) => updateSelectedSeatProperty('row', Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-1.5 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Col Pos</label>
                    <input
                      type="number"
                      value={selectedSeat.col}
                      onChange={(e) => updateSelectedSeatProperty('col', Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl p-1.5 font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteSeat(selectedSeat.id)}
                    className="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-200"
                  >
                    <Trash2 className="w-4 h-4" /> Remove Seat from Layout
                  </button>
                </div>

                <div className="mt-auto rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-[11px] text-blue-800">
                  <p className="font-bold">Layout guidance</p>
                  <p className="mt-1 leading-relaxed text-blue-700/80">
                    Changes apply to this seat only. Use row and column positions to fine-tune its placement in the bus grid.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center py-12 text-slate-400 text-xs space-y-2 animate-fade-in-up">
                <Sliders className="w-8 h-8 mx-auto text-slate-300" />
                <p>Click any seat on the grid to inspect and edit its properties individually.</p>
              </div>
            )}
          </div>

        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div className="text-xs text-slate-500">
            Total active layout seats: <strong className="text-blue-600 font-mono">{seats.length}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDeleteLayout}
              disabled={isDeleting || isSaving}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-2 border border-rose-200 disabled:opacity-60"
            >
              {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>{isDeleting ? 'Deleting Layout...' : 'Delete Layout'}</span>
            </button>
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
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all hover:scale-105"
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

      {/* Add Custom Seat Dialog */}
      {showAddSeatModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={handleAddNewSeat} className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-pop-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" /> Add Custom Seat to Layout
              </h4>
              <button type="button" onClick={() => setShowAddSeatModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Seat Number / Code</label>
                <input
                  type="text"
                  placeholder="e.g. 1A or VIP1"
                  value={newSeatNum}
                  onChange={e => setNewSeatNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Price (LKR)</label>
                <input
                  type="number"
                  value={newSeatPrice}
                  onChange={e => setNewSeatPrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Deck</label>
                <select
                  value={newSeatDeck}
                  onChange={e => setNewSeatDeck(e.target.value as DeckType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800"
                >
                  <option value="lower">Lower Deck</option>
                  <option value="upper">Upper Deck</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Row (1-20)</label>
                <input
                  type="number"
                  value={newSeatRow}
                  onChange={e => setNewSeatRow(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Column (1-6)</label>
                <input
                  type="number"
                  value={newSeatCol}
                  onChange={e => setNewSeatCol(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800"
                />
              </div>

              <div className="col-span-2 space-y-2 pt-1 border-t border-slate-200">
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Bus className="w-4 h-4 text-purple-600" /> Sleeper Berth Type
                  </span>
                  <input
                    type="checkbox"
                    checked={newSeatIsSleeper}
                    onChange={e => setNewSeatIsSleeper(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddSeatModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm"
              >
                Insert Seat
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

