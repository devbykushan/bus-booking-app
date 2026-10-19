import React, { useState, useEffect } from 'react';
import { Bell, BellOff, BellRing, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  isPushSupported,
  getPushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
  sendTestNotification,
} from '../../services/pushService';
import { useBookingStore } from '../../store/bookingStore';

export const PushNotificationToggle: React.FC = () => {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentUser = useBookingStore((s) => s.currentUser);

  useEffect(() => {
    const checkStatus = async () => {
      setSupported(isPushSupported());
      const isSub = await isSubscribedToPush();
      setSubscribed(isSub);
    };
    checkStatus();
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    setStatusMessage(null);

    try {
      if (subscribed) {
        const result = await unsubscribeFromPush();
        setSubscribed(false);
        setStatusMessage({ type: result.success ? 'success' : 'error', text: result.message });
      } else {
        const result = await subscribeToPush(currentUser?.id);
        if (result.success) {
          setSubscribed(true);
          // Send test notification after enabling
          setTimeout(() => sendTestNotification(), 1000);
        }
        setStatusMessage({ type: result.success ? 'success' : 'error', text: result.message });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Something went wrong' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
          <BellOff className="w-5 h-5 text-slate-400" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400">Push Notifications</h4>
          <p className="text-xs text-slate-500">Not supported in this browser</p>
        </div>
      </div>
    );
  }

  const permission = getPushPermission();
  const isDenied = permission === 'denied';

  return (
    <div className="space-y-2">
      <button
        onClick={handleToggle}
        disabled={loading || isDenied}
        className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 cursor-pointer group ${
          subscribed
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50'
            : isDenied
            ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 cursor-not-allowed opacity-60'
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
            subscribed
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
              : isDenied
              ? 'bg-red-400 text-white'
              : 'bg-blue-500 text-white shadow-md shadow-blue-500/30 group-hover:scale-105'
          }`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : subscribed ? (
            <BellRing className="w-5 h-5" />
          ) : isDenied ? (
            <BellOff className="w-5 h-5" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 text-left">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            Push Notifications
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {loading
              ? 'Processing...'
              : subscribed
              ? '🟢 Active — Booking updates, reminders & offers'
              : isDenied
              ? '🔴 Blocked — Enable in browser settings'
              : 'Get booking confirmations, trip reminders & offers'}
          </p>
        </div>

        <div
          className={`w-12 h-7 rounded-full flex items-center px-0.5 transition-all duration-300 ${
            subscribed ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
          }`}
        >
          <div className="w-6 h-6 bg-white rounded-full shadow-sm transition-transform" />
        </div>
      </button>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold animate-fade-in-up ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          {statusMessage.text}
        </div>
      )}
    </div>
  );
};
