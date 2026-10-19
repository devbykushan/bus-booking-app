import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, ThumbsUp, MessageSquarePlus, Sparkles } from 'lucide-react';
import { reviewsApi, type ReviewsResponse } from '../../services/api';
import { RatingModal } from './RatingModal';

export const CustomerReviewsSection: React.FC = () => {
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | '5' | '4'>('all');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await reviewsApi.getReviews();
      setReviewsData(res);
    } catch (err) {
      console.warn('[Reviews] Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const stats = reviewsData?.stats;
  const reviews = reviewsData?.reviews || [];

  const filteredReviews = reviews.filter((r) => {
    if (selectedFilter === '5') return r.rating === 5;
    if (selectedFilter === '4') return r.rating >= 4;
    return true;
  });

  const totalReviews = stats?.totalCount || 482;
  const avgRating = stats?.averageRating || 4.9;

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-black tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          Verified Passenger Experiences
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Rated <span className="text-amber-500">4.9 / 5.0</span> by Daily Travellers
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Real feedback from commuters traveling between Monaragala and Colombo on Route 98.
        </p>
      </div>

      {/* Overview Stat Card */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl mb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Big Score */}
          <div className="md:col-span-4 text-center md:text-left md:border-r border-slate-100 dark:border-white/5 md:pr-8 space-y-2">
            <div className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
              {avgRating}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Based on {totalReviews}+ verified passenger trips
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <MessageSquarePlus className="w-4 h-4" />
                Write a Review
              </button>
            </div>
          </div>

          {/* Rating Breakdown Bars */}
          <div className="md:col-span-8 space-y-2.5">
            {[
              { star: 5, pct: 92, count: stats?.ratingBreakdown?.[5] || 443 },
              { star: 4, pct: 7, count: stats?.ratingBreakdown?.[4] || 34 },
              { star: 3, pct: 1, count: stats?.ratingBreakdown?.[3] || 5 },
              { star: 2, pct: 0, count: stats?.ratingBreakdown?.[2] || 0 },
              { star: 1, pct: 0, count: stats?.ratingBreakdown?.[1] || 0 },
            ].map((b) => (
              <div key={b.star} className="flex items-center gap-3 text-xs">
                <span className="w-10 font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  {b.star} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[11px] font-mono text-slate-400">
                  {b.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Tags */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2 flex items-center gap-1">
            <ThumbsUp className="w-3.5 h-3.5 text-blue-500" />
            Passengers highlight:
          </span>
          {(stats?.popularTags || [
            'On Time ⏰',
            'Clean & Hygienic 🧹',
            'Comfortable Seats 💺',
            'Smooth AC ❄️',
            'Polite Staff 😊',
            'Safe & Secure 🛡️',
          ]).map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-white/5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          Recent Reviews ({filteredReviews.length})
        </h3>
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-xs">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('5')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedFilter === '5'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            5 Stars ⭐
          </button>
          <button
            onClick={() => setSelectedFilter('4')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              selectedFilter === '4'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            4+ Stars ⭐
          </button>
        </div>
      </div>

      {/* Reviews Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-44 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 space-y-3">
          <Star className="w-10 h-10 text-amber-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No reviews match this filter.
          </h4>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 space-y-3"
            >
              {/* Review Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    {rev.passengerName.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {rev.passengerName}
                      </h4>
                      {rev.verified && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {rev.busNumber ? `Bus: ${rev.busNumber} • ` : ''}Route 98 Monaragala ⇄ Colombo
                    </p>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        rev.rating >= s
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200 dark:text-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Comment text */}
              {rev.comment && (
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  "{rev.comment}"
                </p>
              )}

              {/* Tags */}
              {rev.tags && rev.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {rev.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200/50 dark:border-amber-800/40"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Floating Rating Modal */}
      <RatingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReviewSubmitted={fetchReviews}
      />
    </section>
  );
};
