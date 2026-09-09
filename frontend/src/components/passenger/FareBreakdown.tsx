import React, { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { ArrowLeft, CreditCard, CheckCircle, Lock, Sparkles, Tag } from 'lucide-react';

export const FareBreakdown: React.FC = () => {
  const { 
    selectedRoute, 
    selectedSeatIds, 
    passengerInfo,
    setPassengerInfo,
    appliedPromo,
    discountRate,
    applyPromoCode,
    createBooking,
    setCurrentView,
    goToSearchSchedules,
    t
  } = useBookingStore();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!selectedRoute || selectedSeatIds.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-slate-500 text-base">{t('noRecentTicket')}</p>
        <button
          onClick={goToSearchSchedules}
          className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl"
        >
          {t('backToSearch')}
        </button>
      </div>
    );
  }

  const selectedSeats = selectedRoute.seats.filter(s => selectedSeatIds.includes(s.id));
  const baseFare = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const taxAmount = 0; // Removed extra tax surcharge
  const discountAmount = Number((baseFare * discountRate).toFixed(2));
  const finalTotal = Number((baseFare - discountAmount).toFixed(2));

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

    const booking = await createBooking(paymentMethod, false);
    setIsProcessing(false);

    if (!booking) {
      // Error is surfaced via global error banner
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      
      {/* Back Button & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goToSearchSchedules}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t('backToSearch')}
          </button>
          <span className="text-slate-300">/</span>
          <button
            onClick={() => setCurrentView('seat-selection')}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200"
          >
            Change Seats
          </button>
        </div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('primaryPassenger')}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Passenger Details & Payment Gateway */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Passenger Info Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-200 pb-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span>{t('primaryPassenger')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('fullNameLabel')}</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={passengerInfo.fullName}
                  onChange={(e) => setPassengerInfo({ fullName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('emailLabel')}</label>
                <input
                  type="email"
                  placeholder="sarah@example.com"
                  value={passengerInfo.email}
                  onChange={(e) => setPassengerInfo({ email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('phoneLabel')}</label>
                <input
                  type="tel"
                  placeholder="+94 77 123 4567"
                  value={passengerInfo.phone}
                  onChange={(e) => setPassengerInfo({ phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">{t('genderAgeLabel')}</label>
                <div className="flex gap-2">
                  <select
                    value={passengerInfo.gender}
                    onChange={(e: any) => setPassengerInfo({ gender: e.target.value })}
                    className="w-1/2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 focus:outline-none focus:border-blue-500"
                  >
                    <option value="female">{t('female')}</option>
                    <option value="male">{t('male')}</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Age"
                    value={passengerInfo.age}
                    onChange={(e) => setPassengerInfo({ age: Number(e.target.value) })}
                    className="w-1/2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-base border-b border-slate-200 pb-3">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span>{t('selectPayment')}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between font-semibold transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
                }`}
              >
                <span>Credit / Debit Card</span>
                <CreditCard className="w-4 h-4 text-blue-600" />
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between font-semibold transition-all ${
                  paymentMethod === 'upi'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800'
                }`}
              >
                <span>Digital Wallet / LKR</span>
                <Sparkles className="w-4 h-4 text-blue-600" />
              </button>
            </div>

            {paymentMethod === 'card' && (
              <div className="space-y-3 pt-2 text-xs">
                <input
                  type="text"
                  placeholder="Card Number (4532 •••• •••• 8890)"
                  defaultValue="4532 8901 2345 8890"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3 focus:outline-none"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    defaultValue="08/28"
                    className="w-1/2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3"
                  />
                  <input
                    type="password"
                    placeholder="CVV"
                    defaultValue="123"
                    className="w-1/2 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-3"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right: Itemized Fare Summary & Promo Code */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            
            <h3 className="text-base font-bold text-slate-800 tracking-tight border-b border-slate-200 pb-3 flex items-center justify-between">
              <span>{t('bookingSummary')}</span>
              <span className="text-xs text-blue-600 font-mono font-normal">
                {selectedSeats.length} {t('seatsLocked')}
              </span>
            </h3>

            {/* Trip Details Summary */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800">{selectedRoute.operatorName}</p>
              <p className="text-slate-600">{t(selectedRoute.origin.split(',')[0])} → {t(selectedRoute.destination.split(',')[0])}</p>
              <p className="text-blue-600 font-mono">Seats: {selectedSeatIds.join(', ')}</p>
            </div>

            {/* Promo Code Input */}
            <form onSubmit={handleApplyPromo} className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-500" /> {t('applyPromo')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. BUS2026 or SAVE10"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-600 font-bold text-xs border border-slate-200"
                >
                  Apply
                </button>
              </div>
              {promoSuccess && <p className="text-[11px] text-emerald-600 font-medium">{promoSuccess}</p>}
              {promoError && <p className="text-[11px] text-rose-500 font-medium">{promoError}</p>}
            </form>

            {/* Itemized Price Table */}
            <div className="space-y-2 text-xs border-t border-slate-200 pt-4">
              <div className="flex justify-between text-slate-600">
                <span>{t('baseSeatFare')}</span>
                <span className="font-mono text-slate-800">LKR {baseFare.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>{t('serviceTax')}</span>
                <span className="font-mono text-slate-800">LKR {taxAmount} (0%)</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>{t('insurancePromoDiscount')} ({appliedPromo})</span>
                  <span className="font-mono">-LKR {discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-base font-extrabold text-slate-800">
                <span>{t('totalPayable')}</span>
                <span className="text-2xl font-mono text-blue-600">LKR {finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Pay CTA */}
            <button
              onClick={handleCompletePayment}
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{t('securePaymentText')} (LKR {finalTotal.toLocaleString()})</span>
                </>
              )}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};
