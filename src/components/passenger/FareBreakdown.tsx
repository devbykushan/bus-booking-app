import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import confetti from 'canvas-confetti';
import { ArrowLeft, CreditCard, Shield, CheckCircle, Ticket, Lock, Sparkles, Tag, AlertCircle } from 'lucide-react';

export const FareBreakdown: React.FC = () => {
  const { 
    selectedRoute, 
    selectedSeatIds, 
    selectedBoardingPoint, 
    selectedDropPoint,
    passengerInfo,
    setPassengerInfo,
    appliedPromo,
    discountRate,
    applyPromoCode,
    createBooking,
    setCurrentView
  } = useBookingStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [insuranceSelected, setInsuranceSelected] = useState(true);

  if (!selectedRoute || selectedSeatIds.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-slate-400 text-base">Your cart is empty. Please choose seats first.</p>
        <button
          onClick={() => setCurrentView('passenger-search')}
          className="px-6 py-2.5 bg-teal-500 text-slate-950 font-bold rounded-xl"
        >
          Browse Buses
        </button>
      </div>
    );
  }

  const selectedSeats = selectedRoute.seats.filter(s => selectedSeatIds.includes(s.id));
  const baseFare = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const taxAmount = Number((baseFare * 0.10).toFixed(2));
  const insuranceAmount = insuranceSelected ? 1.50 : 0;
  const discountAmount = Number((baseFare * discountRate).toFixed(2));
  const finalTotal = Number((baseFare + taxAmount + insuranceAmount - discountAmount).toFixed(2));

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    setPromoSuccess('');
    const success = applyPromoCode(promoInput);
    if (success) {
      setPromoSuccess(`Promo Code ${promoInput.toUpperCase()} Applied Successfully!`);
    } else {
      setPromoError('Invalid Promo Code. Try "BUS2026" or "SAVE10".');
    }
  };

  const handleCompletePayment = async () => {
    if (!passengerInfo.fullName || !passengerInfo.email || !passengerInfo.phone) {
      alert('Please fill in all passenger details before proceeding.');
      return;
    }

    setIsProcessing(true);

    const booking = await createBooking(paymentMethod, insuranceSelected);
    setIsProcessing(false);

    if (!booking) {
      // Error is surfaced via the global error banner in App.tsx
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      
      {/* Back Button & Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={() => setCurrentView('seat-selection')}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Seat Map
        </button>
        <h2 className="text-xl font-bold text-white tracking-tight">Checkout & Passenger Details</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Passenger Details & Payment Gateway */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Passenger Contact Info Form */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
              <CheckCircle className="w-5 h-5 text-teal-400" />
              <span>Primary Passenger Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Full Name (Matching ID)</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={passengerInfo.fullName}
                  onChange={(e) => setPassengerInfo({ fullName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Email Address (For E-Ticket)</label>
                <input
                  type="email"
                  placeholder="sarah@example.com"
                  value={passengerInfo.email}
                  onChange={(e) => setPassengerInfo({ email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Mobile Phone (For SMS/WhatsApp Alerts)</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={passengerInfo.phone}
                  onChange={(e) => setPassengerInfo({ phone: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Gender & Age</label>
                <div className="flex gap-2">
                  <select
                    value={passengerInfo.gender}
                    onChange={(e: any) => setPassengerInfo({ gender: e.target.value })}
                    className="w-1/2 bg-slate-900 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-teal-500"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Age"
                    value={passengerInfo.age}
                    onChange={(e) => setPassengerInfo({ age: Number(e.target.value) })}
                    className="w-1/2 bg-slate-900 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800 pb-3">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <span>Select Payment Method</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between font-semibold transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>Credit / Debit Card</span>
                <CreditCard className="w-4 h-4 text-indigo-400" />
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between font-semibold transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>UPI / Digital Wallet</span>
                <Sparkles className="w-4 h-4 text-teal-400" />
              </button>
            </div>

            {/* Card Inputs Mock */}
            {paymentMethod === 'card' && (
              <div className="space-y-3 pt-2 text-xs">
                <input
                  type="text"
                  placeholder="Card Number (4532 •••• •••• 8890)"
                  defaultValue="4532 8901 2345 8890"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl p-3 focus:outline-none"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    defaultValue="08/28"
                    className="w-1/2 bg-slate-900 border border-slate-800 text-white rounded-xl p-3"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    defaultValue="123"
                    className="w-1/2 bg-slate-900 border border-slate-800 text-white rounded-xl p-3"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right: Itemized Fare Summary & Promo Code */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            
            <h3 className="text-base font-bold text-white tracking-tight border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Fare Breakdown</span>
              <span className="text-xs text-teal-400 font-mono font-normal">
                {selectedSeats.length} seat(s)
              </span>
            </h3>

            {/* Trip Details Summary */}
            <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1">
              <p className="font-bold text-white">{selectedRoute.operatorName}</p>
              <p className="text-slate-400">{selectedRoute.origin} → {selectedRoute.destination}</p>
              <p className="text-teal-300 font-mono">Seats: {selectedSeatIds.join(', ')}</p>
            </div>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-400" /> Apply Promo Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. BUS2026 or SAVE10"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs border border-slate-700"
                >
                  Apply
                </button>
              </div>
              {promoSuccess && <p className="text-[11px] text-emerald-400 font-medium">{promoSuccess}</p>}
              {promoError && <p className="text-[11px] text-rose-400 font-medium">{promoError}</p>}
            </form>

            {/* Optional Travel Insurance Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={insuranceSelected}
                onChange={(e) => setInsuranceSelected(e.target.checked)}
                className="mt-0.5 rounded text-teal-500 focus:ring-0"
              />
              <div>
                <span className="font-bold text-white">Add Travel Insurance Protection (+$1.50)</span>
                <p className="text-[11px] text-slate-400">Covers trip delays, baggage loss & medical emergencies.</p>
              </div>
            </label>

            {/* Itemized Price Calculation Table */}
            <div className="space-y-2 text-xs border-t border-slate-800 pt-4">
              <div className="flex justify-between text-slate-400">
                <span>Base Seats Fare</span>
                <span className="font-mono text-white">${baseFare.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Service Taxes & Fees (10%)</span>
                <span className="font-mono text-white">${taxAmount.toFixed(2)}</span>
              </div>

              {insuranceSelected && (
                <div className="flex justify-between text-slate-400">
                  <span>Travel Insurance</span>
                  <span className="font-mono text-white">$1.50</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Promo Discount ({appliedPromo})</span>
                  <span className="font-mono">-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-base font-extrabold text-white">
                <span>Total Payable</span>
                <span className="text-2xl font-mono text-teal-400">${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Final Pay CTA Button */}
            <button
              onClick={handleCompletePayment}
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-indigo-600 to-teal-500 hover:from-teal-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-teal-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Processing Payment via Bank Gateways...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay ${finalTotal.toFixed(2)} & Generate E-Ticket</span>
                </>
              )}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};
