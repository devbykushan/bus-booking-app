import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import {
  Lock, Mail, Eye, EyeOff,
  ArrowLeft, AlertCircle, CheckCircle2, Download, ShieldCheck,
  X, Smartphone, Sparkles
} from 'lucide-react';
import { AnimatedLogoBadge } from '../common/AnimatedLogoBadge';

export const AdminLoginPage: React.FC = () => {
  const { login, setCurrentView } = useBookingStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [showInstallGuide, setShowInstallGuide] = useState<boolean>(false);

  // Auto-detect and prepare PWA install
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__deferredPwaPrompt) {
      setCanInstall(true);
    }
    const handleCaptured = () => setCanInstall(true);
    window.addEventListener('pwa-prompt-captured', handleCaptured);

    // Auto-prompt on Android upon first screen touch or when ready
    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    let autoPrompted = false;

    const tryAutoPrompt = async () => {
      if (autoPrompted) return;
      const promptEvent = typeof window !== 'undefined' ? (window as any).__deferredPwaPrompt : null;
      if (promptEvent && isAndroid) {
        autoPrompted = true;
        try {
          await promptEvent.prompt();
          const choice = await promptEvent.userChoice;
          if (choice && choice.outcome === 'accepted') {
            (window as any).__deferredPwaPrompt = null;
            setCanInstall(false);
          }
        } catch (e) {
          console.log('[Super Admin PWA] Auto-install prompt handled:', e);
        }
      }
    };

    const handleFirstTouch = () => {
      tryAutoPrompt();
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };

    window.addEventListener('click', handleFirstTouch, { passive: true });
    window.addEventListener('touchstart', handleFirstTouch, { passive: true });
    window.addEventListener('pwa-prompt-captured', tryAutoPrompt);

    return () => {
      window.removeEventListener('pwa-prompt-captured', handleCaptured);
      window.removeEventListener('pwa-prompt-captured', tryAutoPrompt);
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('touchstart', handleFirstTouch);
    };
  }, []);

  const handleInstallClick = async () => {
    let promptEvent = typeof window !== 'undefined' ? (window as any).__deferredPwaPrompt : null;
    
    // If on Android/Chrome and prompt event is buffering, wait up to 3 seconds
    if (!promptEvent) {
      setIsInstalling(true);
      promptEvent = await new Promise<any>((resolve) => {
        const timer = setTimeout(() => {
          cleanup();
          resolve((window as any).__deferredPwaPrompt || null);
        }, 3000);

        const onCaptured = () => {
          cleanup();
          resolve((window as any).__deferredPwaPrompt || null);
        };

        const cleanup = () => {
          clearTimeout(timer);
          window.removeEventListener('pwa-prompt-captured', onCaptured);
          window.removeEventListener('beforeinstallprompt', onCaptured);
        };

        window.addEventListener('pwa-prompt-captured', onCaptured);
        window.addEventListener('beforeinstallprompt', onCaptured);
      });
      setIsInstalling(false);
    }

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          (window as any).__deferredPwaPrompt = null;
          setCanInstall(false);
        }
      } catch (e) {
        console.error('PWA install error:', e);
        setShowInstallGuide(true);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setShake(false);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setShake(true);
      setErrorMessage('Please enter a valid Super Admin email address.');
      return;
    }

    if (!password || password.length < 6) {
      setShake(true);
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email.trim().toLowerCase(), password, 'admin');
      if (res.success) {
        if (typeof window !== 'undefined') {
          window.history.pushState({ view: 'admin-panel' }, '', '/#admin');
        }
        setCurrentView('admin-panel');
      } else {
        setShake(true);
        setErrorMessage(res.message || 'Authentication failed. Please verify your Super Admin credentials.');
      }
    } catch (err: any) {
      setShake(true);
      setErrorMessage(err.message || 'An unexpected connection error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans select-none antialiased">
      {/* ── Ambient Liquid Color Fields (Refracted through the glass) ── */}
      <div className="absolute -top-32 -left-20 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-blue-400/40 via-sky-300/30 to-indigo-400/35 blur-[100px] pointer-events-none animate-orb-1" />
      <div className="absolute -bottom-32 -right-20 w-[520px] h-[520px] rounded-full bg-gradient-to-bl from-indigo-400/35 via-purple-300/25 to-blue-500/30 blur-[110px] pointer-events-none animate-orb-2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-300/20 blur-[130px] pointer-events-none" />

      {/* Back to Home Button with Apple frosted style */}
      <button
        onClick={() => {
          if (typeof window !== 'undefined' && window.location.hostname.toLowerCase().includes('dewmina-super-admin')) {
            window.location.href = 'https://dewminatravels.vercel.app';
            return;
          }
          if (typeof window !== 'undefined') {
            window.history.pushState({ view: 'passenger-search' }, '', '/#home');
          }
          setCurrentView('passenger-search');
        }}
        className="absolute top-6 left-6 flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 text-xs sm:text-sm font-semibold transition px-4 py-2.5 rounded-2xl bg-white/60 dark:bg-slate-800/80 hover:bg-white/90 dark:hover:bg-slate-700 border border-white/80 dark:border-slate-700 shadow-sm backdrop-blur-xl active:scale-95 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <span>Back to Passenger Portal</span>
      </button>

      {/* ── Apple iOS Liquid Frosted Glass Card ── */}
      <div className={`w-full max-w-md ios-liquid-glass dark:bg-slate-900/90 dark:border-slate-800 rounded-[32px] p-7 sm:p-9 relative z-10 transition-all duration-300 ${shake ? 'animate-shake' : ''}`}>
        
        {/* Specular Top Edge Light Refraction */}
        <div className="absolute inset-x-8 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="relative w-18 h-18 mx-auto mb-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 blur-sm opacity-30 animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-white/95 to-white/70 dark:from-slate-800 dark:to-slate-900 border border-white dark:border-slate-700 p-2.5 shadow-md flex items-center justify-center mx-auto backdrop-blur-md">
              <AnimatedLogoBadge size="lg" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-600/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 mb-2.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Master Fleet Command</span>
          </div>
          <h1 className="text-2xl sm:text-[26px] font-black text-slate-900 dark:text-white tracking-tight">Dewmina Master Admin</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto font-medium">
            Super Administrator Portal & Operations Control
          </p>
        </div>

        {/* Dedicated PWA Install Banner */}
        <button
          type="button"
          disabled={isInstalling}
          onClick={handleInstallClick}
          className="w-full mb-6 py-3 px-4 rounded-2xl bg-white/60 dark:bg-slate-800/80 hover:bg-white/90 dark:hover:bg-slate-700 border border-white/80 dark:border-slate-700 hover:border-blue-400/40 text-blue-700 dark:text-blue-400 text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm backdrop-blur-md active:scale-98 cursor-pointer disabled:opacity-60"
        >
          {isInstalling ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              <span>Connecting Auto-Install...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-y-0.5 transition-transform" />
              <span>Install "Dewmina Master Admin" App{canInstall ? ' (Ready)' : ''}</span>
            </>
          )}
        </button>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Super Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin.dewminasuperline@gmail.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl ios-input-glass dark:bg-slate-800/80 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden transition shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-11 py-3.5 rounded-2xl ios-input-glass dark:bg-slate-800/80 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden transition shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm tracking-wide shadow-lg shadow-blue-600/25 transition transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating Command...
              </span>
            ) : (
              'Sign In as Super Admin'
            )}
          </button>
        </form>

        {/* Security Notice Footer */}
        <div className="mt-7 pt-5 border-t border-slate-200/60 dark:border-slate-800 text-center">
          <div className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Executive Session • End-to-End Encrypted</span>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Authorized Dewmina Super Line Personnel Only
          </p>
        </div>
      </div>

      {/* Modern In-App Installation Guide Modal (Frosted Glass) */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl ios-liquid-glass dark:bg-slate-900/95 dark:border-slate-800 p-6 shadow-2xl text-slate-900 dark:text-white border border-white/80">
            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-xs">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Install "Dewmina Master Admin"</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add to your device home screen</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 mb-6 bg-slate-50/80 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Install Steps:</span>
              </div>
              <p>1. Tap the <strong className="text-slate-900 dark:text-white">three dots (⋮)</strong> or browser menu.</p>
              <p>2. Select <strong className="text-slate-900 dark:text-white">"Install app"</strong> (or <strong className="text-slate-900 dark:text-white">"Add to Home screen"</strong>).</p>
              <p>3. Tap <strong className="text-slate-900 dark:text-white">Install</strong> to add the Super Admin app directly.</p>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                <span>iOS Safari: Tap Share (⎋) ➔ "Add to Home Screen"</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowInstallGuide(false);
                  handleInstallClick();
                }}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs transition shadow-md shadow-blue-500/25 cursor-pointer"
              >
                Try Auto-Install Again
              </button>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="px-4 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
