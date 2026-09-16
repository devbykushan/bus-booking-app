import React, { useState, useEffect } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import {
  Lock, Mail, Eye, EyeOff,
  ArrowLeft, AlertCircle, Sparkles, CheckCircle2, Download, Crown
} from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { login, setCurrentView } = useBookingStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [canInstall, setCanInstall] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__deferredPwaPrompt) {
      setCanInstall(true);
    }
    const handleCaptured = () => setCanInstall(true);
    window.addEventListener('pwa-prompt-captured', handleCaptured);
    return () => window.removeEventListener('pwa-prompt-captured', handleCaptured);
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = typeof window !== 'undefined' ? (window as any).__deferredPwaPrompt : null;
    if (promptEvent) {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice && choice.outcome === 'accepted') {
        (window as any).__deferredPwaPrompt = null;
        setCanInstall(false);
      }
    } else {
      alert('To install "Dewmina Master Admin" on your device:\n\n• On iPhone/iPad (Safari): Tap the Share button, then tap "Add to Home Screen".\n• On Android/Chrome: Tap the 3 dots menu (⋮) and select "Install app".\n• On Mac/PC (Chrome/Edge): Click the Install icon in the browser address bar.');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

      {/* Back to Home Button */}
      <button
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.history.pushState({ view: 'passenger-search' }, '', '/#home');
          }
          setCurrentView('passenger-search');
        }}
        className="absolute top-6 left-6 flex items-center gap-2 text-amber-300/80 hover:text-white text-sm font-medium transition px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Passenger Home</span>
      </button>

      {/* Login Card */}
      <div className={`w-full max-w-md bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 rounded-3xl shadow-2xl p-8 relative z-10 transition-transform ${shake ? 'animate-shake' : ''}`}>
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/20 mx-auto mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Super Admin Command
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">Dewmina Master Admin</h1>
          <p className="text-xs text-slate-400 mt-1">
            Executive Fleet Command & Administrator Provisioning
          </p>
        </div>

        {/* Dedicated PWA Install Banner */}
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full mb-6 py-2.5 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-sm active:scale-98"
        >
          <Download className="w-4 h-4 text-amber-400 group-hover:bounce" />
          <span>Install "Dewmina Master Admin" App{canInstall ? ' (Ready)' : ''}</span>
        </button>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
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
                placeholder="admin@dewminasuperline.lk"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
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
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 transition transform active:scale-95 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {isSubmitting ? 'Authenticating Command...' : 'Sign In as Super Admin'}
          </button>
        </form>

        {/* Security Notice Footer */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-300/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Super Admin Master Session • End-to-End Encrypted</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Restricted access. All login attempts are recorded and monitored.
          </p>
        </div>
      </div>
    </div>
  );
};
