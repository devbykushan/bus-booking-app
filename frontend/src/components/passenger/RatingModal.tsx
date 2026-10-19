import React, { useState } from 'react';
import { Star, X, CheckCircle2, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { reviewsApi } from '../../services/api';
import { useBookingStore } from '../../store/bookingStore';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted?: () => void;
  defaultPnr?: string;
  defaultBusNumber?: string;
  defaultRouteId?: string;
}

const AVAILABLE_TAGS = [
  'On Time ⏰',
  'Clean & Hygienic 🧹',
  'Comfortable Seats 💺',
  'Smooth AC ❄️',
  'Polite Staff 😊',
  'Careful Driver 🛡️',
  'Smooth Booking 📱',
  'Spacious Legroom 🛋️',
];

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Poor Service', color: 'text-rose-500' },
  2: { text: 'Fair Experience', color: 'text-amber-500' },
  3: { text: 'Good Journey', color: 'text-yellow-500' },
  4: { text: 'Very Good & Smooth!', color: 'text-emerald-500' },
  5: { text: 'Outstanding & Highly Recommended! ⭐', color: 'text-amber-400' },
};

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  onReviewSubmitted,
  defaultPnr = '',
  defaultBusNumber = '',
  defaultRouteId = '',
}) => {
  const currentUser = useBookingStore((s) => s.currentUser);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [passengerName, setPassengerName] = useState<string>(currentUser?.name || '');
  const [pnr, setPnr] = useState<string>(defaultPnr);
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['On Time ⏰', 'Clean & Hygienic 🧹']);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName.trim()) {
      setErrorMsg('Please enter your name.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setErrorMsg('Please select a rating between 1 and 5 stars.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await reviewsApi.submitReview({
        passengerName: passengerName.trim(),
        rating,
        comment: comment.trim(),
        tags: selectedTags,
        pnr: pnr.trim() || undefined,
        routeId: defaultRouteId || undefined,
        busNumber: defaultBusNumber || undefined,
        userId: currentUser?.id,
      });

      setIsSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto animate-bounce-short">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Thank You for Your Feedback!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Your verified review helps other passengers choose Dewmina Super Line with confidence.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-[11px] font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Rate Your Journey
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                How was your trip with Dewmina?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Share your experience on Route 98 (Monaragala ⇄ Colombo).
              </p>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 5-Star Interactive Rating */}
            <div className="text-center py-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-slate-300 dark:text-slate-700 hover:scale-125 transition-transform duration-150 cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          active
                            ? 'fill-amber-400 text-amber-400 drop-shadow-md'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className={`text-xs font-bold transition-all ${RATING_LABELS[hoverRating || rating]?.color}`}>
                {RATING_LABELS[hoverRating || rating]?.text}
              </p>
            </div>

            {/* Quick Experience Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                What did you like the most?
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs scale-102'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Chamara"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <span>PNR / Ticket Code</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" /> Verified Badge
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. DW-872194 (optional)"
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Review Comment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Your Review & Feedback
              </label>
              <textarea
                rows={3}
                placeholder="Share more details about the bus cleanliness, AC, punctuality, or driver service..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 fill-white" />
                  <span>Submit Passenger Review</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
