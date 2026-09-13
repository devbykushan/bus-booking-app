import React, { useState, useEffect } from 'react';
import { 
  X, Smartphone, Star, Sparkles, Download, 
  Share2, PlusSquare, CheckCircle2 
} from 'lucide-react';
import { useBookingStore } from '../../store/bookingStore';

export const PwaInstallPrompt: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const setIsPwaPromptOpen = useBookingStore((state) => state.setIsPwaPromptOpen);

  useEffect(() => {
    setIsPwaPromptOpen(isOpen);
    return () => {
      setIsPwaPromptOpen(false);
    };
  }, [isOpen, setIsPwaPromptOpen]);

  useEffect(() => {
    // 1. Check if already installed as standalone PWA
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if user is on mobile/tablet device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isMobileDevice = 
      /android|iphone|ipad|ipod|windows phone|mobile/i.test(userAgent) ||
      window.innerWidth <= 768;

    if (!isMobileDevice) {
      // Don't show to desktop/laptop users
      return;
    }

    // 3. Detect iOS Safari
    const isAppleIos = /iphone|ipad|ipod/i.test(userAgent) && !(window as any).MSStream;
    setIsIos(isAppleIos);

    // 4. Check if dismissed within the last 7 days
    const dismissedUntil = localStorage.getItem('dewmina_pwa_dismissed_until');
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // 5. Listen to Android / Chrome PWA install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 6. Smooth delayed entrance (2.5 seconds after page load)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Native Android Chrome 1-click install
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      // Open Apple Safari instructions sheet
      setShowIosGuide(true);
    } else {
      // Generic fallback for other mobile browsers
      alert('To install the app, tap your browser menu (⋮) and choose "Install app" or "Add to Home Screen".');
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    // Hide for 7 days so it doesn't disturb the user repeatedly
    localStorage.setItem('dewmina_pwa_dismissed_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setIsOpen(false);
  };

  if (isInstalled || !isOpen) return null;

  return (
    <>
      {/* Floating Bottom Card */}
      <div className="pwa-install-prompt-container fixed left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[110] transition-all duration-300">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl shadow-emerald-950/20 relative overflow-hidden">
          {/* Subtle Ambient Background Gradient */}
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close"
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Row with App Icon & Name */}
          <div className="flex items-start gap-3.5 pr-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden p-1.5">
                <img 
                  src="/dewmina-logo.png" 
                  alt="Dewmina Super Line" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>

            <div className="space-y-0.5 flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                <Sparkles className="w-3 h-3" />
                <span>Official Mobile App</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                Dewmina Super Line
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-bold">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-slate-600 dark:text-slate-400 font-medium">4.9 • Free</span>
              </div>
            </div>
          </div>

          {/* Quick Value Points */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Instant 1-Click Booking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Offline Ticket Access</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isIos ? 'Install on iPhone' : '⚡ Install Mobile App'}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Step-by-Step Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Smartphone className="w-5 h-5" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Install on iPhone / iPad</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Install <strong>Dewmina Super Line</strong> directly onto your iPhone home screen in 2 simple taps:
            </p>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center flex-shrink-0 text-[11px]">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5">
                    <span>Tap the Safari Share button</span>
                    <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                  </p>
                  <p className="text-[11px] text-slate-500">Located at the bottom of your Safari browser bar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center flex-shrink-0 text-[11px]">
                  2
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1.5">
                    <span>Scroll down & tap</span>
                    <strong className="text-slate-900 dark:text-white font-extrabold flex items-center gap-1">
                      Add to Home Screen <PlusSquare className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 inline" />
                    </strong>
                  </p>
                  <p className="text-[11px] text-slate-500">Tap "Add" in the top-right corner to finish.</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIosGuide(false);
                setIsOpen(false);
              }}
              className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
