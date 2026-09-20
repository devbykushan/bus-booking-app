import React, { useState } from 'react';
import type { BusRoute, Booking } from '../../types/booking';
import { whatsappApi } from '../../services/api';
import { X, MessageSquare, Send, AlertTriangle, CheckCircle2, Clock, ShieldAlert, Bus } from 'lucide-react';

interface Props {
  route: BusRoute;
  bookings: Booking[];
  onClose: () => void;
}

export const BroadcastAnnouncementModal: React.FC<Props> = ({ route, bookings, onClose }) => {
  const activeBookings = bookings.filter(b => b.bookingStatus !== 'cancelled');
  
  // Extract unique phone numbers
  const uniquePhones = Array.from(new Set(
    activeBookings
      .map(b => (b.passenger?.phone || (b as any).passengerPhone || '').trim())
      .filter(p => p.length >= 9)
  ));

  const [message, setMessage] = useState<string>(
    `⚠️ Transit Alert: This is an official update regarding bus ${route.busNumber} (${route.origin} → ${route.destination}) scheduled for ${route.departureTime}.\n\n`
  );
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const applyTemplate = (type: 'delay' | 'detour' | 'replacement' | 'reminder') => {
    switch (type) {
      case 'delay':
        setMessage(
          `⏱️ Transit Delay Alert: Bus ${route.busNumber} on route ${route.origin} → ${route.destination} will experience a delay of 25 minutes due to heavy traffic. Estimated revised departure is at your boarding point. We apologize for the inconvenience.\n- ${route.operatorName || 'National Express'}`
        );
        break;
      case 'detour':
        setMessage(
          `🚧 Route Notice: Bus ${route.busNumber} (${route.origin} → ${route.destination}) will take an alternate highway route today due to road repairs. Drop points remain unchanged.\n- ${route.operatorName || 'National Express'}`
        );
        break;
      case 'replacement':
        setMessage(
          `🚌 Vehicle Update: Bus ${route.busNumber} has been replaced with a luxury coach of equal category. All assigned seat numbers remain valid. Please check with the conductor on platform.\n- ${route.operatorName || 'National Express'}`
        );
        break;
      case 'reminder':
        setMessage(
          `🔔 Boarding Reminder: Bus ${route.busNumber} from ${route.origin} to ${route.destination} departs at ${route.departureTime}. Please arrive at your selected boarding point 15 minutes prior. Safe travels!\n- ${route.operatorName || 'National Express'}`
        );
        break;
    }
  };

  const handleSendBroadcast = async () => {
    if (!message.trim()) {
      alert('Please enter a message to broadcast.');
      return;
    }
    if (uniquePhones.length === 0) {
      alert('No passenger phone numbers found for this route.');
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const res = await whatsappApi.broadcast(route.id, message.trim());
      if (res.success) {
        setResult({
          success: true,
          message: res.message || 'WhatsApp broadcast dispatched successfully!',
          count: res.sentCount || uniquePhones.length
        });
      } else {
        setResult({
          success: false,
          message: (res as any).error || res.message || 'Failed to dispatch broadcast.'
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.response?.data?.error || err.message || 'Broadcast failed.'
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 bg-emerald-50/70 dark:bg-slate-800/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">Passenger WhatsApp Broadcast</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Send instant emergency notifications to route passengers</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Target Route Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{route.busNumber}</span>
              <p className="text-slate-500 dark:text-slate-400">{route.origin} → {route.destination} • {route.departureTime}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
                {uniquePhones.length} Verified {uniquePhones.length === 1 ? 'Passenger' : 'Passengers'}
              </span>
            </div>
          </div>

          {/* Quick Templates */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Quick Announcement Templates
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyTemplate('delay')}
                className="p-2 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-[11px] font-bold text-left transition-colors cursor-pointer flex flex-col gap-1"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Departure Delay</span>
              </button>

              <button
                type="button"
                onClick={() => applyTemplate('detour')}
                className="p-2 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-900 dark:text-blue-200 text-[11px] font-bold text-left transition-colors cursor-pointer flex flex-col gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Route Detour</span>
              </button>

              <button
                type="button"
                onClick={() => applyTemplate('replacement')}
                className="p-2 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-900 dark:text-purple-200 text-[11px] font-bold text-left transition-colors cursor-pointer flex flex-col gap-1"
              >
                <Bus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Bus Replacement</span>
              </button>

              <button
                type="button"
                onClick={() => applyTemplate('reminder')}
                className="p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 text-[11px] font-bold text-left transition-colors cursor-pointer flex flex-col gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Trip Reminder</span>
              </button>
            </div>
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <label>Message Content (WhatsApp Text)</label>
              <span className="text-slate-400 dark:text-slate-500 font-mono">{message.length} chars</span>
            </div>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your official announcement here..."
              className="w-full p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-hidden resize-none bg-slate-50/50 dark:bg-slate-850 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Result Alert */}
          {result && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
              result.success 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
            }`}>
              {result.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />}
              <div>
                <p>{result.message}</p>
                {result.count !== undefined && (
                  <p className="font-normal text-[11px] mt-0.5">Dispatched to {result.count} registered WhatsApp numbers.</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={sending || uniquePhones.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Broadcasting...' : `Send to ${uniquePhones.length} Passengers`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
