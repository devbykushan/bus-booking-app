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
    <div className="min-h-screen bg-slate-950 bg-radial-at-t from-blue-950/40 via-slate-950 to-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Dynamic Ambient Background Glow matching Dewmina web theme */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[140px] pointer-events-none" />

      {/* Back to Home Button */}
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
        className="absolute top-6 left-6 flex items-center gap-2 text-blue-200/80 hover:text-white text-xs sm:text-sm font-semibold transition px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 backdrop-blur-md cursor-pointer shadow-sm hover:border-blue-400/30 active:scale-98"
      >
        <ArrowLeft className="w-4 h-4 text-blue-400" />
        <span>Back to Passenger Portal</span>
      </button>

      {/* Login Card */}
      <div className={`w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-blue-500/30 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(37,99,235,0.15)] p-7 sm:p-9 relative z-10 transition-all ${shake ? 'animate-shake' : ''}`}>
        
        {/* Specular Top Rim Sheen */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent pointer-events-none rounded-t-3xl" />

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-2.5 rounded-2xl bg-gradient-to-b from-blue-600/20 to-indigo-600/10 border border-blue-500/30 shadow-inner flex items-center justify-center">
              <AnimatedLogoBadge size="lg" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 mb-2.5 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Master Fleet Command
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Dewmina Master Admin</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Super Administrator Portal & Operations Control
          </p>
        </div>

        {/* Dedicated PWA Install Banner */}
        <button
          type="button"
          disabled={isInstalling}
          onClick={handleInstallClick}
          className="w-full mb-6 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-blue-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-sm active:scale-98 disabled:opacity-60"
        >
          {isInstalling ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              <span>Connecting Auto-Install...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-blue-400 group-hover:translate-y-0.5 transition-transform" />
              <span>Install "Dewmina Master Admin" App{canInstall ? ' (Ready)' : ''}</span>
            </>
          )}
        </button>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
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
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-600/30 transition transform active:scale-98 disabled:opacity-50 mt-3 cursor-pointer"
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
        <div className="mt-7 pt-5 border-t border-slate-800/80 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-blue-300/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Executive Session • End-to-End Encrypted</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Authorized Dewmina Super Line Personnel Only
          </p>
        </div>
      </div>

      {/* Modern In-App Installation Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-blue-500/30 p-6 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30">
                <Smartphone className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base font-black">Install "Super Admin"</h3>
                <p className="text-xs text-slate-400">Add to your device home screen</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 mb-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="font-bold text-blue-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Android Chrome Quick Steps:</span>
              </div>
              <p>1. Tap the <strong className="text-white">three dots (⋮)</strong> at the top-right of Chrome.</p>
              <p>2. Select <strong className="text-white">"Install app"</strong> (or <strong className="text-white">"Add to Home screen"</strong>).</p>
              <p>3. Tap <strong className="text-white">Install</strong> to add the Super Admin app directly.</p>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
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
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Try Auto-Install Again
              </button>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
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
