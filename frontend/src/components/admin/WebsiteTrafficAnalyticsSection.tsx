import React, { useState, useEffect } from 'react';
import {
  Globe, Users, Eye, Smartphone, Laptop, RefreshCw,
  TrendingUp, Compass, Share2, ShieldCheck, ArrowUpRight, Clock
} from 'lucide-react';
import { analyticsApi, type AnalyticsStatsResponse } from '../../services/api';

interface WebsiteTrafficAnalyticsSectionProps {
  onSwitchToRevenue?: () => void;
}

export const WebsiteTrafficAnalyticsSection: React.FC<WebsiteTrafficAnalyticsSectionProps> = ({ onSwitchToRevenue }) => {
  const [stats, setStats] = useState<AnalyticsStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyticsApi.getStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load website analytics:', err);
      setError('Could not fetch traffic data. Ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Auto-refresh every 45 seconds for live monitor feel
    const interval = setInterval(loadStats, 45000);
    return () => clearInterval(interval);
  }, []);

  const totalToday = stats?.summary.totalToday ?? 0;
  const uniqueToday = stats?.summary.uniqueToday ?? 0;
  const totalAllTime = stats?.summary.totalAllTime ?? 0;
  const uniqueAllTime = stats?.summary.uniqueAllTime ?? 0;

  // Calculate mobile percentage
  const mobileCount = stats?.devices.find(d => d.device === 'Mobile')?.count ?? 0;
  const desktopCount = stats?.devices.find(d => d.device.includes('Desktop'))?.count ?? 0;
  const totalDeviceVisits = mobileCount + desktopCount;
  const mobilePercent = totalDeviceVisits > 0 ? Math.round((mobileCount / totalDeviceVisits) * 100) : 100;

  // Calculate max visits in trend for scaling bars
  const maxTrendVisits = Math.max(1, ...(stats?.trend.map(t => t.visits) || [1]));

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* ─── Top Header & Controls ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Globe className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Website Traffic & Passenger Analytics
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                  LIVE TRACKER
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Real-time traffic monitor for Dewmina Timetable Web App & Expressway Passenger Reach
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onSwitchToRevenue && (
            <button
              onClick={onSwitchToRevenue}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl transition-colors border border-indigo-200/60 dark:border-indigo-800/60"
            >
              <span>💰 Revenue & Bookings</span>
            </button>
          )}

          <a
            href="https://dewminatravels-schedule.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl transition-colors"
          >
            <span>Open Timetable</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={loadStats}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-amber-800 dark:text-amber-300 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={loadStats} className="text-xs underline font-semibold">Retry</button>
        </div>
      )}

      {/* ─── 4 Key Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Today's Page Views */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Today's Total Views</span>
            <span className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              <Eye className="w-5 h-5 text-blue-100" />
            </span>
          </div>
          <div className="text-3xl font-extrabold tracking-tight">
            {totalToday.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-blue-200 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Live page sessions today</span>
          </div>
        </div>

        {/* Card 2: Unique Visitors Today */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Unique Passengers</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {uniqueToday.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Distinct devices today
          </div>
        </div>

        {/* Card 3: All-Time Visits */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">All-Time Visitors</span>
            <span className="p-2 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600 dark:text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {totalAllTime.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {uniqueAllTime > 0 ? `${uniqueAllTime.toLocaleString()} unique passengers` : 'Total lifetime timetable sessions'}
          </div>
        </div>

        {/* Card 4: Mobile Traffic Share */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mobile Dominance</span>
            <span className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400">
              <Smartphone className="w-5 h-5" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {mobilePercent}%
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Passengers on smartphones
          </div>
        </div>

      </div>

      {/* ─── Traffic Sources & Device Breakdown (Two Column Layout) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2 Cols): Traffic Sources Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Passenger Traffic Sources (Last 30 Days)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Where are passengers discovering us?</span>
          </div>

          {stats?.sources && stats.sources.length > 0 ? (
            <div className="space-y-4">
              {stats.sources.map((item, idx) => {
                const totalSrcVisits = stats.sources.reduce((acc, curr) => acc + curr.count, 0);
                const percent = totalSrcVisits > 0 ? Math.round((item.count / totalSrcVisits) * 100) : 0;
                
                // Colors by channel
                let colorClass = 'bg-blue-600';
                let badgeClass = 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800';
                
                if (item.source.toLowerCase().includes('facebook')) {
                  colorClass = 'bg-blue-600';
                  badgeClass = 'text-blue-700 bg-blue-50 border-blue-200';
                } else if (item.source.toLowerCase().includes('whatsapp')) {
                  colorClass = 'bg-emerald-500';
                  badgeClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                } else if (item.source.toLowerCase().includes('instagram')) {
                  colorClass = 'bg-pink-600';
                  badgeClass = 'text-pink-700 bg-pink-50 border-pink-200';
                } else if (item.source.toLowerCase().includes('tiktok')) {
                  colorClass = 'bg-cyan-600';
                  badgeClass = 'text-cyan-700 bg-cyan-50 border-cyan-200';
                } else if (item.source.toLowerCase().includes('google')) {
                  colorClass = 'bg-amber-500';
                  badgeClass = 'text-amber-700 bg-amber-50 border-amber-200';
                }

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                      <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                        <span className={`px-2 py-0.5 text-xs rounded-md border font-bold ${badgeClass}`}>
                          {item.source}
                        </span>
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {item.count.toLocaleString()} visits ({percent}%)
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${Math.max(4, percent)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">
              Waiting for incoming passenger clicks from Facebook & WhatsApp posts...
            </div>
          )}

          {/* Social Media Tip Banner */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
            <Compass className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">Pro Tip: </span>
              Whenever you share the timetable link on WhatsApp status or Facebook pinned posts, visits automatically register under that channel with real-time attribution.
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Device & Platform Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Device Breakdown
            </h3>
          </div>

          <div className="p-5 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/40 dark:to-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
            
            {/* Mobile Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-xl">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-white">Smartphones</div>
                  <div className="text-xs text-slate-400">{mobileCount} visits</div>
                </div>
              </div>
              <div className="text-base font-bold text-blue-600 dark:text-blue-400">{mobilePercent}%</div>
            </div>

            {/* Desktop Row */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl">
                  <Laptop className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-white">Desktop / Laptop</div>
                  <div className="text-xs text-slate-400">{desktopCount} visits</div>
                </div>
              </div>
              <div className="text-base font-bold text-slate-600 dark:text-slate-300">
                {100 - mobilePercent}%
              </div>
            </div>

          </div>

          {/* Privacy & Compliance Assurance */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>100% Privacy-Preserving (Zero Cookies, No Personal Data Stored)</span>
          </div>
        </div>

      </div>

      {/* ─── Last 7 Days Trend ─── */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              7-Day Passenger View Trajectory
            </h3>
          </div>
          <span className="text-xs text-slate-400">Daily passenger volume</span>
        </div>

        {stats?.trend && stats.trend.length > 0 ? (
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-6 px-2">
            {stats.trend.map((day, i) => {
              const heightPercent = Math.max(15, Math.round((day.visits / maxTrendVisits) * 100));
              const isToday = i === stats.trend.length - 1;

              return (
                <div key={day.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.visits}
                  </div>
                  <div
                    className={`w-full rounded-2xl transition-all duration-300 ${
                      isToday
                        ? 'bg-gradient-to-t from-blue-700 to-blue-500 shadow-md shadow-blue-500/20'
                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                    title={`${day.date}: ${day.visits} visits (${day.uniqueVisitors} unique)`}
                  ></div>
                  <div className={`text-[10px] font-semibold truncate ${isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400'}`}>
                    {day.date.substring(5)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-sm">
            Daily historical trend will build up automatically as passengers view your timetable.
          </div>
        )}
      </div>

      {/* ─── Live Activity Log (Recent 15 Visits) ─── */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Real-Time Traffic Log
            </h3>
          </div>
          <span className="text-xs text-slate-400">Latest passenger sessions</span>
        </div>

        {stats?.recent && stats.recent.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {stats.recent.map((visit) => {
              const date = new Date(visit.createdAt);
              const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <div key={visit.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                      {visit.isMobile ? <Smartphone className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {visit.source}
                      </span>
                      <span className="text-slate-400 ml-2">
                        {visit.path || '/'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-400">
                    <span className="hidden sm:inline-block">{visit.city || 'Sri Lanka'}</span>
                    <span className="font-mono text-slate-500">{timeStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400 text-xs">
            No visits recorded yet. Open your timetable app to see your first live log!
          </div>
        )}
      </div>

    </div>
  );
};
