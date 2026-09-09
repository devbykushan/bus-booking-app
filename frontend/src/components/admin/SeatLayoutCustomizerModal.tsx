import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { routesApi } from '../../services/api';
import type { BusRoute, Seat, BusCategory, DeckType, SeatStatus } from '../../types/booking';
import { 
  LayoutGrid, Save, X, Shield, Bus, RefreshCw, Plus, Trash2, Edit3, 
  CheckCircle2, DollarSign, Layers, Sliders, Settings2, Zap
} from 'lucide-react';

interface Props {
  route: BusRoute;
  onClose: () => void;
}

export const SeatLayoutCustomizerModal: React.FC<Props> = ({ route, onClose }) => {
  const { loadRoutes, setSelectedRoute, selectedRoute } = useBookingStore();

  const generatePresetSeats = (type: BusCategory | string, price: number, routeId: string): Seat[] => {
    const newSeats: Seat[] = [];

    if (type.includes('49 Seats') || type.includes('Super Luxury')) {
      // 49 Seats Standard Sri Lanka Luxury Coach Layout (1 to 49 numbered layout)
      const femaleSeats = ['15', '19', '20', '23'];
      for (let r = 1; r <= 11; r++) {
        const leftWindowNum = ((r - 1) * 4 + 3).toString();
        const leftAisleNum = ((r - 1) * 4 + 4).toString();
        const rightAisleNum = ((r - 1) * 4 + 2).toString();
        const rightWindowNum = ((r - 1) * 4 + 1).toString();

        newSeats.push(
          { id: `${routeId}-${leftWindowNum}`, number: leftWindowNum, deck: 'lower', row: r, col: 1, price, status: 'available', isSleeper: false, isFemaleOnly: femaleSeats.includes(leftWindowNum) },
          { id: `${routeId}-${leftAisleNum}`, number: leftAisleNum, deck: 'lower', row: r, col: 2, price, status: 'available', isSleeper: false, isFemaleOnly: femaleSeats.includes(leftAisleNum) },
          { id: `${routeId}-${rightAisleNum}`, number: rightAisleNum, deck: 'lower', row: r, col: 4, price, status: 'available', isSleeper: false, isFemaleOnly: femaleSeats.includes(rightAisleNum) },
          { id: `${routeId}-${rightWindowNum}`, number: rightWindowNum, deck: 'lower', row: r, col: 5, price, status: 'available', isSleeper: false, isFemaleOnly: femaleSeats.includes(rightWindowNum) }
        );
      }
      const backSeats = [
        { num: '47', col: 1 },
        { num: '48', col: 2 },
        { num: '49', col: 3 },
        { num: '46', col: 4 },
        { num: '45', col: 5 },
      ];
      backSeats.forEach(s => {
        newSeats.push({ id: `${routeId}-${s.num}`, number: s.num, deck: 'lower', row: 12, col: s.col, price, status: 'available', isSleeper: false, isFemaleOnly: false });
      });
      return newSeats;
    } else if (type.includes('58 Seats') || type.includes('Normal Service') || type.includes('54 Seats 3*2') || type.includes('3*2') || type.includes('Leyland')) {
      // Ashok Leyland 58 seats numeric layout (1 to 58) matching diagram
      const femaleSeats = ['2', '3', '7', '8'];

      // Row 0: Top Left Seat #1
      newSeats.push({
        id: `${routeId}-1`, number: '1', deck: 'lower', row: 0, col: 1, price, status: 'available', isSleeper: false, isFemaleOnly: false
      });

      // Rows 1 to 9: 2 left (cols 1,2) and 3 right (cols 4,5,6)
      let currentNum = 2;
      for (let r = 1; r <= 9; r++) {
        [1, 2, 4, 5, 6].forEach((c) => {
          const numStr = currentNum.toString();
          newSeats.push({
            id: `${routeId}-${numStr}`,
            number: numStr,
            deck: 'lower',
            row: r,
            col: c,
            price,
            status: 'available',
            isSleeper: false,
            isFemaleOnly: femaleSeats.includes(numStr),
          });
          currentNum++;
        });
      }

      // Rows 10 & 11: 3 right seats only (cols 4,5,6)
      for (let r = 10; r <= 11; r++) {
        [4, 5, 6].forEach((c) => {
          const numStr = currentNum.toString();
          newSeats.push({
            id: `${routeId}-${numStr}`,
            number: numStr,
            deck: 'lower',
            row: r,
            col: c,
            price,
            status: 'available',
            isSleeper: false,
            isFemaleOnly: false,
          });
          currentNum++;
        });
      }

      // Row 12: 6 rear seats (cols 1,2,3,4,5,6)
      [1, 2, 3, 4, 5, 6].forEach((c) => {
        const numStr = currentNum.toString();
        newSeats.push({
          id: `${routeId}-${numStr}`,
          number: numStr,
          deck: 'lower',
          row: 12,
          col: c,
          price,
          status: 'available',
          isSleeper: false,
          isFemaleOnly: false,
        });
        currentNum++;
      });

      return newSeats;
    } else if (type.includes('54 Seats')) {
      // Ashok Leyland 54 seats: 13 rows of 4 plus 2 rear seats.
      for (let r = 1; r <= 13; r++) {
        [1, 2, 4, 5].forEach((c) => {
          const seatNum = `${r}${String.fromCharCode(64 + (c > 3 ? c - 1 : c))}`;
          newSeats.push({ id: `${routeId}-${seatNum}`, number: seatNum, deck: 'lower', row: r, col: c, price, status: 'available', isSleeper: false, isFemaleOnly: (r === 2 || r === 3) && c <= 2 });
        });
      }
      [1, 2].forEach((c) => {
        const seatNum = `14${String.fromCharCode(64 + c)}`;
        newSeats.push({ id: `${routeId}-${seatNum}`, number: seatNum, deck: 'lower', row: 14, col: c, price, status: 'available', isSleeper: false, isFemaleOnly: false });
      });
      return newSeats;
    } else if (type.includes('Yutong')) {
      // Yutong 2*2 layouts: 12 rows of 4, with 3 extra rear seats for 51.
      for (let r = 1; r <= 12; r++) {
        [1, 2, 4, 5].forEach((c) => {
          const seatNum = `Y${r}${String.fromCharCode(64 + (c > 3 ? c - 1 : c))}`;
          newSeats.push({ id: `${routeId}-${seatNum}`, number: seatNum, deck: 'lower', row: r, col: c, price, status: 'available', isSleeper: false, isFemaleOnly: (r === 2 || r === 3) && c <= 2 });
        });
      }
      if (type.includes('51 Seats')) {
        [1, 2, 3].forEach((c) => {
          const seatNum = `Y13${String.fromCharCode(64 + c)}`;
          newSeats.push({ id: `${routeId}-${seatNum}`, number: seatNum, deck: 'lower', row: 13, col: c, price, status: 'available', isSleeper: false, isFemaleOnly: false });
        });
      }
      return newSeats;
    } else if (type.includes('3*2') || type.includes('Leyland')) {
      // Lanka Ashok Leyland 57 Seats 3*2
      const totalRows = 11;
      for (let r = 1; r <= totalRows; r++) {
        [1, 2, 3, 5, 6].forEach((c) => {
          const seatLetter = String.fromCharCode(64 + (c > 4 ? c - 1 : c));
          const seatNum = `${r}${seatLetter}`;
          const isFemaleOnly = (r === 2 || r === 3) && c <= 3;
          newSeats.push({
            id: `${routeId}-${seatNum}`,
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
      [1, 2].forEach((c) => {
        const seatNum = `12${String.fromCharCode(64 + c)}`;
        newSeats.push({
          id: `${routeId}-${seatNum}`,
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
      return newSeats;
    } else if (type.includes('AC Sleeper')) {
      // AC Sleeper 36 berths (18 lower, 18 upper)
      ['lower', 'upper'].forEach((deckName) => {
        const prefix = deckName === 'lower' ? 'L' : 'U';
        for (let r = 1; r <= 9; r++) {
          [1, 3].forEach((c) => {
            const seatNum = `${prefix}${r}${c === 1 ? 'A' : 'B'}`;
            newSeats.push({
              id: `${routeId}-${seatNum}`,
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
      return newSeats;
    } else {
      // Standard Volvo 40 seats (2*2 Luxury)
      for (let r = 1; r <= 10; r++) {
        [1, 2, 4, 5].forEach((c) => {
          const seatNum = `V${r}${String.fromCharCode(64 + (c > 3 ? c - 1 : c))}`;
          newSeats.push({
            id: `${routeId}-${seatNum}`,
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
      return newSeats;
    }
  };

  // Helper to validate and normalize seats array for route layout
  const getNormalizedSeats = (rawSeats: Seat[], currentBusType: string, price: number, routeId: string): Seat[] => {
    let baseLayoutSeats: Seat[];
    
    const isNormalService = currentBusType.includes('Normal Service') || currentBusType.includes('58 Seats') || currentBusType.includes('3*2') || currentBusType.includes('Leyland');
    const isSuperLuxury = currentBusType.includes('Super Luxury') || currentBusType.includes('49 Seats');

    if (!rawSeats || rawSeats.length === 0) {
      baseLayoutSeats = generatePresetSeats(currentBusType, price, routeId);
    } else if (isNormalService && (rawSeats.some(s => /[A-Za-z]/.test(s.number)) || rawSeats.length !== 58)) {
      baseLayoutSeats = generatePresetSeats('Normal Service (58 Seats 3*2)', price, routeId);
    } else if (isSuperLuxury && rawSeats.length !== 49) {
      baseLayoutSeats = generatePresetSeats('Super Luxury Express (49 Seats 2*2)', price, routeId);
    } else {
      baseLayoutSeats = rawSeats;
    }

    // Merge real-time booked status from rawSeats if available
    if (rawSeats && rawSeats.length > 0) {
      const bookedSet = new Set(rawSeats.filter(s => s.status === 'booked').map(s => s.number || s.id.replace(/^[^-]+-/, '')));
      if (bookedSet.size > 0) {
        return baseLayoutSeats.map(s => {
          const num = s.number || s.id.replace(/^[^-]+-/, '');
          if (bookedSet.has(num)) {
            return { ...s, status: 'booked' };
          }
          return s;
        });
      }
    }

    return baseLayoutSeats;
  };

  const initialBusType: BusCategory = (route.busType as any) || 'Super Luxury (49 Seats 2*2)';
  const initialBasePrice: number = route.priceStarting || 2800;

  const [busType, setBusType] = useState<BusCategory>(initialBusType);
  const [basePrice, setBasePrice] = useState<number>(initialBasePrice);
  const [seats, setSeats] = useState<Seat[]>(() => {
    return getNormalizedSeats(route.seats || [], initialBusType, initialBasePrice, route.id);
  });
  const [activeDeck, setActiveDeck] = useState<DeckType>('lower');
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddSeatModal, setShowAddSeatModal] = useState(false);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);

  // Fetch real-time live route seat data on mount & periodic polling
  const fetchLiveRouteData = async (isSilent = false) => {
    if (!isSilent) setIsLiveSyncing(true);
    try {
      const res = await fetch(`/api/routes/${route.id}`);
      if (res.ok) {
        const liveRoute: BusRoute = await res.json();
        if (liveRoute) {
          const effectiveBusType = liveRoute.busType || route.busType || initialBusType;
          const effectivePrice = liveRoute.priceStarting || route.priceStarting || initialBasePrice;
          const normalized = getNormalizedSeats(liveRoute.seats || [], effectiveBusType, effectivePrice, route.id);
          setSeats(normalized);
          if (liveRoute.busType) setBusType(liveRoute.busType);
          if (liveRoute.priceStarting) setBasePrice(liveRoute.priceStarting);
        }
      }
    } catch (err) {
      console.warn('Real-time seat layout fetch failed:', err);
    } finally {
      if (!isSilent) setIsLiveSyncing(false);
    }
  };

  useEffect(() => {
    fetchLiveRouteData();
    const timer = setInterval(() => {
      fetchLiveRouteData(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [route.id]);

  // New Seat Form State
  const [newSeatNum, setNewSeatNum] = useState('');
  const [newSeatPrice, setNewSeatPrice] = useState(route.priceStarting || 2670);
  const [newSeatDeck, setNewSeatDeck] = useState<DeckType>('lower');
  const [newSeatRow, setNewSeatRow] = useState(1);
  const [newSeatCol, setNewSeatCol] = useState(1);
  const [newSeatIsSleeper, setNewSeatIsSleeper] = useState(false);

  // Filter selected seat object
  const selectedSeat = seats.find(s => s.id === selectedSeatId) || null;

  // Check if current configuration has upper deck seats
  const hasUpperDeck = seats.some(s => s.deck === 'upper') || busType.includes('Sleeper') || busType.includes('Double');



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
    setFeedbackMsg(null);
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

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: 'Failed to update seat layout' }));
        throw new Error(errJson.error || 'Failed to update seat layout on server');
      }

      await loadRoutes();

      const updatedRoute: BusRoute = {
        ...route,
        busType,
        priceStarting: basePrice,
        seats,
      };
      if (selectedRoute && selectedRoute.id === route.id) {
        setSelectedRoute(updatedRoute);
      }

      setFeedbackMsg({ type: 'success', text: `⚡ Real-Time Live Seat Layout deployed & synced for ${route.busNumber}! (${seats.length} seats active)` });
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Error saving layout: ${err.message}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLayout = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }

    setIsDeleting(true);
    setConfirmDelete(false);
    setFeedbackMsg(null);
    try {
      await routesApi.deleteLayout(route.id);
      setSeats([]);
      setSelectedSeatId(null);
      await loadRoutes();
      setFeedbackMsg({ type: 'success', text: `Seat layout deleted for ${route.busNumber}.` });
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: `Error deleting layout: ${err.message}` });
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
  const is3By2 =
    busType.includes('3*2') ||
    busType.includes('Leyland') ||
    busType.includes('Normal Service') ||
    seats.some((s) => s.col === 6 || /[A-E]$/i.test(s.number));

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
              <span className={`px-2.5 py-0.5 rounded-full border font-bold text-xs flex items-center gap-1.5 shadow-2xs ${
                isLiveSyncing ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                <Zap className={`w-3.5 h-3.5 ${isLiveSyncing ? 'text-amber-600 animate-spin' : 'text-emerald-600 animate-pulse'}`} />
                <span>{isLiveSyncing ? 'Syncing...' : 'Real-Time Live Sync'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {route.operatorName} • <strong className="text-slate-700">{route.busNumber}</strong> ({route.origin} → {route.destination})
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* In-Modal Feedback Banner */}
        {feedbackMsg && (
          <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in-up ${
            feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Bus Model & Real-Time Auto-Matched Category Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <Bus className="w-4.5 h-4.5 text-blue-600 shrink-0" />
            <span>Auto-Loaded Bus Category:</span>
            <span className="px-3 py-1 rounded-xl bg-white border border-blue-300 font-extrabold text-blue-800 shadow-2xs">
              {busType || route.busType}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Real-Time Auto-Selected ({seats.length} Seats Layout)
          </span>
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
              className="w-24 bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => bulkSetAllPrices(basePrice)}
              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 font-bold rounded-xl transition-colors cursor-pointer"
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
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Clear All Blocks
            </button>
            <button
              type="button"
              onClick={() => setShowAddSeatModal(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer"
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
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
              <span className="text-[11px] font-semibold text-blue-600">Front Cockpit (Top) • Rear Engine (Bottom)</span>
            </div>

            {/* Bus Body Container */}
            <div className={`bg-slate-50/90 rounded-3xl p-4 border border-slate-200/90 space-y-4 shadow-sm mx-auto transition-all ${
              is3By2 ? 'max-w-[500px]' : 'max-w-[440px]'
            }`}>
              
              {/* Top Cockpit & Driver Header Bar */}
              <div className="bg-slate-900 rounded-2xl p-3 text-white flex items-center justify-between text-xs font-bold shadow-md">
                {/* Entry Door */}
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-[11px] tracking-wider uppercase">
                  <div className="flex flex-col gap-0.5">
                    <div className="w-4 h-0.5 bg-emerald-400 rounded-full" />
                    <div className="w-4 h-0.5 bg-emerald-400/70 rounded-full" />
                    <div className="w-4 h-0.5 bg-emerald-400/40 rounded-full" />
                  </div>
                  <span>ENTRY DOOR</span>
                </div>

                {/* Front Cockpit Badge */}
                <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-full text-[10px] font-bold text-slate-200">
                  <Bus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Front Cockpit</span>
                </div>

                {/* Driver Steering Wheel */}
                <div className="flex items-center gap-2 text-slate-300 font-extrabold text-[11px] tracking-wider uppercase">
                  <span>DRIVER</span>
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border border-dashed border-slate-400 flex items-center justify-center">
                      <div className="w-1 h-1 bg-blue-400 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seating Matrix */}
              <div className="relative space-y-2.5 py-1 flex flex-col items-center">
                {/* Ambient Aisle Strip - positioned at exact aisle location */}
                <div className={`absolute inset-y-0 pointer-events-none z-0 rounded-full bg-indigo-100/60 border-x border-indigo-200/40 ${
                  is3By2 ? 'left-[60%] -translate-x-1/2 w-8' : 'left-1/2 -translate-x-1/2 w-9'
                }`} />

                {rowNumbers.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-medium">
                    No seats configured on {activeDeck} deck. Click a preset above or "Add Custom Seat" to insert seats.
                  </div>
                ) : (
                  rowNumbers.map(rowNum => {
                    const rowSeats = rowsMap[rowNum] || [];
                    const leftSeats = rowSeats.filter(s => is3By2 ? s.col <= 3 : s.col <= 2).sort((a, b) => a.col - b.col);
                    const centerSeats = rowSeats.filter(s => !is3By2 && s.col === 3).sort((a, b) => a.col - b.col);
                    const rightSeats = rowSeats.filter(s => is3By2 ? s.col >= 4 : s.col >= 4).sort((a, b) => a.col - b.col);

                    const renderSeatButton = (seat: Seat) => {
                      const isSelected = selectedSeatId === seat.id;
                      const hasCustomPrice = seat.price && seat.price !== basePrice;

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          onClick={() => handleSeatClick(seat.id)}
                          className={`w-10 h-12 sm:w-11 sm:h-13 rounded-xl flex flex-col items-center justify-between p-1.5 font-bold transition-all relative z-10 shadow-2xs hover:z-20 cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-blue-600 bg-blue-100 border-2 border-blue-500 text-blue-900 shadow-md scale-105'
                              : seat.status === 'booked'
                              ? 'bg-slate-200 border-2 border-slate-300 text-slate-500 opacity-80'
                              : seat.isFemaleOnly
                              ? 'bg-pink-50 border-2 border-pink-400 text-pink-700 hover:bg-pink-100 shadow-2xs'
                              : 'bg-white border-2 border-slate-300 text-slate-800 hover:border-blue-500 hover:bg-blue-50/50'
                          }`}
                          title={`Seat ${seat.number} • LKR ${seat.price || basePrice} • ${seat.status}${seat.isFemaleOnly ? ' • Female Priority' : ''}`}
                        >
                          {/* Headrest Cushion Bar */}
                          <div className={`w-full h-1.5 rounded-t-sm ${
                            isSelected ? 'bg-blue-500' : seat.status === 'booked' ? 'bg-slate-400' : seat.isFemaleOnly ? 'bg-pink-400' : 'bg-slate-200'
                          }`} />

                          <span className={`text-[11px] sm:text-xs font-black tracking-tight ${seat.isFemaleOnly ? 'text-pink-800' : ''}`}>
                            {seat.number}
                          </span>

                          {/* Bottom Accent Bar or Custom Price */}
                          {hasCustomPrice ? (
                            <span className="text-[8px] font-mono font-extrabold text-amber-700">LKR {seat.price}</span>
                          ) : (
                            <div className={`w-3/4 h-1 rounded-full ${
                              isSelected ? 'bg-blue-600' : seat.isFemaleOnly ? 'bg-pink-500' : 'bg-blue-500/80'
                            }`} />
                          )}
                        </button>
                      );
                    };

                    return (
                      <div key={rowNum} className="flex flex-wrap items-center justify-between gap-2 sm:gap-2.5 px-1 w-full relative z-10">
                        {/* Left side seats (3 seats for 3x2, 2 seats for 2x2) */}
                        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 max-w-[210px]">
                          {leftSeats.map(renderSeatButton)}
                        </div>

                        {/* Center Aisle Spacer */}
                        <div className="flex items-center justify-center min-w-[20px] sm:min-w-[28px] text-center shrink-0">
                          {!is3By2 && centerSeats.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {centerSeats.map(renderSeatButton)}
                            </div>
                          ) : (
                            <div className="text-[9px] font-mono font-black text-slate-400/60 select-none">│</div>
                          )}
                        </div>

                        {/* Right side seats (2 seats for 3x2, 2 seats for 2x2) */}
                        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 max-w-[210px]">
                          {rightSeats.map(renderSeatButton)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Rear Engine Footer Bar */}
              <div className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-center flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1 text-rose-500">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> REAR ENGINE
                </span>
                <span>DEWMINA LUXURY COACH</span>
                <span className="flex items-center gap-1 text-rose-500">
                  BACK <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                </span>
              </div>
            </div>

            {/* Grid Legend */}
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1 justify-center">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-white border-2 border-slate-300" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-pink-50 border-2 border-pink-400" /> Female Reserved (Pink)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 border-2 border-slate-300" /> Admin Blocked / Booked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-100 border-2 border-blue-600 ring-2 ring-blue-600" /> Currently Selected
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
                  <label className="flex items-center justify-between p-2.5 rounded-xl bg-pink-50/70 border border-pink-200 cursor-pointer">
                    <span className="font-semibold text-pink-900 flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-pink-600" /> Female Reserved Priority (Pink)
                    </span>
                    <input
                      type="checkbox"
                      checked={!!selectedSeat.isFemaleOnly}
                      onChange={(e) => updateSelectedSeatProperty('isFemaleOnly', e.target.checked)}
                      className="w-4 h-4 accent-pink-600 rounded"
                    />
                  </label>

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
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 border transition-all duration-200 ${
                confirmDelete
                  ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 shadow-md ring-2 ring-rose-400'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200'
              } disabled:opacity-60`}
            >
              {isDeleting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>
                {isDeleting
                  ? 'Deleting Layout...'
                  : confirmDelete
                  ? 'Confirm Delete Layout?'
                  : 'Delete Layout'}
              </span>
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

