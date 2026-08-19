import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import type { Seat, DeckType } from '../../types/booking';
import { ArrowLeft, Shield, Clock, Check, Armchair, ChevronRight, Lock } from 'lucide-react';

export const SeatMap: React.FC = () => {
  const { 
    selectedRoute, 
    selectedSeatIds, 
    toggleSeatSelection, 
    setCurrentView,
    lockActive,
    lockExpirySeconds,
    tickLockTimer
  } = useBookingStore();

  const [activeDeck, setActiveDeck] = useState<DeckType>('lower');

  useEffect(() => {
    let interval: any = null;
    if (lockActive) {
      interval = setInterval(() => {
        tickLockTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockActive, tickLockTimer]);

  if (!selectedRoute) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No bus selected. Please search and pick a route.</p>
        <button
          onClick={() => setCurrentView('passenger-search')}
          className="mt-4 px-4 py-2 bg-teal-500 text-slate-950 font-bold rounded-xl"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const deckSeats = selectedRoute.seats.filter(s => s.deck === activeDeck);
  const selectedSeatsList = selectedRoute.seats.filter(s => selectedSeatIds.includes(s.id));
  const totalPrice = selectedSeatsList.reduce((sum, s) => sum + s.price, 0);

  const rowsMap: { [row: number]: Seat[] } = {};
  deckSeats.forEach(s => {
    if (!rowsMap[s.row]) rowsMap[s.row] = [];
    rowsMap[s.row].push(s);
  });
  const rowNumbers = Object.keys(rowsMap).map(Number).sort((a, b) => a - b);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <button
          onClick={() => setCurrentView('passenger-search')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Search Results
        </button>

        <div className="text-left sm:text-right">
          <h2 className="text-xl font-bold text-white tracking-tight">{selectedRoute.operatorName}</h2>
          <p className="text-xs text-teal-400 font-medium">
            {selectedRoute.origin} → {selectedRoute.destination} ({selectedRoute.departureTime})
          </p>
        </div>
      </div>

      {lockActive && (
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-200">Temporary Seat Hold (Concurrency Control Active)</p>
              <p className="text-xs text-amber-300/80">
                Your selected seats ({selectedSeatIds.join(', ')}) are reserved exclusively for you.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-xl border border-amber-500/30">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Expires in:</span>
            <span className="text-base font-mono font-extrabold text-amber-400">{formatTimer(lockExpirySeconds)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          {selectedRoute.hasUpperDeck && (
            <div className="flex items-center justify-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-sm mx-auto">
              <button
                onClick={() => setActiveDeck('lower')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeDeck === 'lower' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Armchair className="w-4 h-4" /> Lower Deck
              </button>
              <button
                onClick={() => setActiveDeck('upper')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeDeck === 'upper' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Armchair className="w-4 h-4" /> Upper Deck
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md seat-available border-emerald-500" />
              <span className="text-slate-300">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md seat-selected" />
              <span className="text-slate-300">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md seat-booked" />
              <span className="text-slate-300">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md seat-female flex items-center justify-center">
                <Shield className="w-3 h-3 text-pink-400" />
              </div>
              <span className="text-slate-300">Women Only</span>
            </div>
          </div>

          <div className="relative bg-slate-900/90 rounded-3xl p-6 border-4 border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-500">
                Front of Bus ({activeDeck.toUpperCase()} DECK)
              </span>
              <div className="flex items-center gap-2 text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700">
                <span className="text-xs font-semibold">Driver Wheel</span>
              </div>
            </div>

            <div className="space-y-4 py-2 overflow-x-auto">
              {rowNumbers.map(rowNum => {
                const rowSeats = rowsMap[rowNum] || [];
                const leftSeats = rowSeats.filter(s => s.col <= 2).sort((a, b) => a.col - b.col);
                const rightSeats = rowSeats.filter(s => s.col >= 4).sort((a, b) => a.col - b.col);

                return (
                  <div key={rowNum} className="flex items-center justify-between gap-6 px-2">
                    <div className="flex items-center gap-3">
                      {leftSeats.map(seat => {
                        const isSelected = selectedSeatIds.includes(seat.id);
                        const isBooked = seat.status === 'booked';
                        const isFemale = seat.isFemaleOnly;

                        let styleClass = 'seat-available';
                        if (isBooked) styleClass = 'seat-booked';
                        else if (isSelected) styleClass = 'seat-selected';
                        else if (isFemale) styleClass = 'seat-female';

                        return (
                          <button
                            key={seat.id}
                            disabled={isBooked}
                            onClick={() => toggleSeatSelection(seat.id)}
                            className={`w-12 h-14 rounded-xl flex flex-col items-center justify-between p-1.5 text-xs font-bold transition-all transform active:scale-90 relative group ${styleClass}`}
                          >
                            <span className="text-[10px] opacity-80">{seat.number}</span>
                            {isSelected ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : isFemale ? (
                              <Shield className="w-3.5 h-3.5 text-pink-400" />
                            ) : (
                              <span className="text-[10px] font-mono">${seat.price}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex-1 text-center font-mono text-[10px] uppercase tracking-widest text-slate-700 select-none">
                      AISLE
                    </div>

                    <div className="flex items-center gap-3">
                      {rightSeats.map(seat => {
                        const isSelected = selectedSeatIds.includes(seat.id);
                        const isBooked = seat.status === 'booked';
                        const isFemale = seat.isFemaleOnly;

                        let styleClass = 'seat-available';
                        if (isBooked) styleClass = 'seat-booked';
                        else if (isSelected) styleClass = 'seat-selected';
                        else if (isFemale) styleClass = 'seat-female';

                        return (
                          <button
                            key={seat.id}
                            disabled={isBooked}
                            onClick={() => toggleSeatSelection(seat.id)}
                            className={`w-12 h-14 rounded-xl flex flex-col items-center justify-between p-1.5 text-xs font-bold transition-all transform active:scale-90 relative group ${styleClass}`}
                          >
                            <span className="text-[10px] opacity-80">{seat.number}</span>
                            {isSelected ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : isFemale ? (
                              <Shield className="w-3.5 h-3.5 text-pink-400" />
                            ) : (
                              <span className="text-[10px] font-mono">${seat.price}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-800 pt-3 text-center text-xs text-slate-600 font-mono uppercase tracking-widest">
              Rear Engine & Emergency Exit
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <h3 className="text-lg font-bold text-white tracking-tight border-b border-slate-800 pb-3">
            Booking Summary
          </h3>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Selected Seats ({selectedSeatIds.length})
            </label>

            {selectedSeatIds.length === 0 ? (
              <div className="bg-slate-900/60 rounded-2xl p-6 text-center border border-dashed border-slate-800">
                <Armchair className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Click on any green or pink seat on the map to select.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSeatsList.map(s => (
                  <div key={s.id} className="flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 px-3 py-1.5 rounded-xl text-xs font-bold">
                    <span>Seat {s.number} ({s.deck} deck)</span>
                    <span className="text-white font-mono">${s.price}</span>
                    <button onClick={() => toggleSeatSelection(s.id)} className="hover:text-red-400">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Select Boarding Point
            </label>
            <select
              className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-teal-500"
              onChange={(e) => {
                const bp = selectedRoute.boardingPoints.find(p => p.id === e.target.value);
                if (bp) useBookingStore.getState().setSelectedBoardingPoint(bp);
              }}
            >
              {selectedRoute.boardingPoints.map(bp => (
                <option key={bp.id} value={bp.id}>
                  {bp.name} ({bp.time}) - {bp.landmark}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Base Seat Fare ({selectedSeatIds.length}x)</span>
              <span className="font-mono text-white">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Service Tax (10%)</span>
              <span className="font-mono text-white">${(totalPrice * 0.10).toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
              <span>Subtotal</span>
              <span className="font-mono text-teal-400">${(totalPrice * 1.10).toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={selectedSeatIds.length === 0}
            onClick={() => setCurrentView('checkout')}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
              selectedSeatIds.length > 0
                ? 'bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white shadow-teal-500/25 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <span>Continue to Passenger Details</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
