import React from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { Bell, X, Volume2, VolumeX, CheckCircle2, DollarSign, Clock, Phone, ExternalLink } from 'lucide-react';

export const AdminNotificationDrawer: React.FC = () => {
  const {
    paymentSlips,
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    adminSoundEnabled,
    setAdminSoundEnabled,
    adminReadSlipIds,
    markSlipAsRead,
    markAllSlipsAsRead,
    setCurrentView,
  } = useBookingStore();

  if (!isNotificationDrawerOpen) return null;

  const pendingSlips = paymentSlips.filter((s) => s.status === 'pending');
  const unreadPendingSlips = pendingSlips.filter((s) => !adminReadSlipIds.includes(s.id));

  const handleOpenSlip = (slipId: string) => {
    markSlipAsRead(slipId);
    setCurrentView('admin-panel');
    setIsNotificationDrawerOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Dimmed backdrop overlay */}
      <div
        onClick={() => setIsNotificationDrawerOpen(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col h-full border-l border-slate-200 dark:border-slate-800 animate-slide-in-right">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white">Admin Notifications</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                  {pendingSlips.length} payment {pendingSlips.length === 1 ? 'slip' : 'slips'} awaiting review
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Sound Toggle */}
              <button
                onClick={() => setAdminSoundEnabled(!adminSoundEnabled)}
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  adminSoundEnabled
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100'
                    : 'text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                }`}
                title={adminSoundEnabled ? 'Alert Sound is ON' : 'Alert Sound is MUTED'}
              >
                {adminSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsNotificationDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close Notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Unread banner & mark read button */}
          {unreadPendingSlips.length > 0 && (
            <div className="px-5 py-2.5 bg-orange-50/80 dark:bg-orange-500/10 border-b border-orange-100 dark:border-orange-500/20 flex items-center justify-between text-xs">
              <span className="font-bold text-orange-700 dark:text-orange-300">
                {unreadPendingSlips.length} new unread {unreadPendingSlips.length === 1 ? 'alert' : 'alerts'}
              </span>
              <button
                onClick={markAllSlipsAsRead}
                className="text-[11px] font-extrabold text-blue-600 hover:text-blue-700 dark:text-cyan-400 underline decoration-2 cursor-pointer"
              >
                Mark all as read
              </button>
            </div>
          )}

          {/* Body: Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 p-3 sm:p-4 space-y-2">
            {pendingSlips.length === 0 ? (
              <div className="py-24 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 dark:text-white">All Clear!</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                    No pending payment slips right now. You will be alerted when a new bank slip is uploaded.
                  </p>
                </div>
              </div>
            ) : (
              pendingSlips.map((slip) => {
                const isUnread = !adminReadSlipIds.includes(slip.id);
                const formattedTime = slip.uploadedAt
                  ? new Date(slip.uploadedAt).toLocaleString('en-GB', {
                      timeZone: 'Asia/Colombo',
                      hour: '2-digit',
                      minute: '2-digit',
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'Recently';

                return (
                  <div
                    key={slip.id}
                    onClick={() => handleOpenSlip(slip.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isUnread
                        ? 'bg-orange-50/60 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 shadow-xs'
                        : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
                          )}
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {slip.passengerName || 'Passenger'}
                          </span>
                          <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400 font-bold bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded">
                            {slip.pnr}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{slip.passengerPhone || 'N/A'}</span>
                        </p>

                        <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formattedTime}</span>
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                          Rs. {Number(slip.amount || 0).toLocaleString()}
                        </span>
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-500/20 px-2 py-0.5 rounded-full">
                          Review <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {pendingSlips.length > 0 && (
            <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-center">
              <button
                onClick={() => {
                  setCurrentView('admin-panel');
                  setIsNotificationDrawerOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                Go to Payment Slips ({pendingSlips.length})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
