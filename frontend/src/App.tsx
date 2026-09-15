import { useEffect, useState } from 'react';
import { useBookingStore, HASH_VIEW_MAP, VIEW_HASH_MAP, type AppView } from './store/bookingStore';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HeroSearch } from './components/passenger/HeroSearch';
import { SchedulesDashboard } from './components/passenger/SchedulesDashboard';
import { StatsSection } from './components/passenger/StatsSection';
import { ServicesSection } from './components/passenger/ServicesSection';
import { BookingGuideSection } from './components/passenger/BookingGuideSection';
import { AboutPlatformSection } from './components/passenger/AboutPlatformSection';
import { BusBookingFAQSection } from './components/passenger/BusBookingFAQSection';
import { SeatMap } from './components/passenger/SeatMap';
import { FareBreakdown } from './components/passenger/FareBreakdown';
import { TicketModal } from './components/passenger/TicketModal';
import { LiveMap } from './components/passenger/LiveMap';
import { UserBookings } from './components/passenger/UserBookings';
import { PassengerSettings } from './components/passenger/PassengerSettings';
import { SlipUploadPage } from './components/passenger/SlipUploadPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { FloatingWhatsApp } from './components/common/FloatingWhatsApp';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { Bus, AlertCircle, Wifi, RefreshCw, ShieldAlert, ShieldCheck, Lock } from 'lucide-react';
import { BASE_URL } from './services/api';

export function App() {
  const {
    currentView,
    routes,
    error,
    loadRoutes,
    loadBookings,
    setError,
    currentUser,
    userRole,
    setShowAuthModal,
    setCurrentView,
  } = useBookingStore();

  const isAdmin = currentUser?.role === 'admin' || userRole === 'admin';

  const [backendReady, setBackendReady] = useState(routes.length > 0);
  const [backendError, setBackendError] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);

  // Initialize theme
  useEffect(() => {
    const theme = useBookingStore.getState().theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Sync browser history state and handle browser Back / Forward buttons
  useEffect(() => {
    const rawHash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    const initialView = HASH_VIEW_MAP[rawHash] || currentView;
    const initialHash = VIEW_HASH_MAP[initialView] || 'home';

    // Replace current history entry with initial view state
    window.history.replaceState(
      { view: initialView, routeId: useBookingStore.getState().selectedRoute?.id },
      '',
      `#${initialHash}`
    );

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      let targetView: AppView = 'passenger-search';

      if (state && state.view && (HASH_VIEW_MAP[state.view] || VIEW_HASH_MAP[state.view as AppView])) {
        targetView = (HASH_VIEW_MAP[state.view] || state.view) as AppView;
      } else {
        const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
        if (hash && HASH_VIEW_MAP[hash]) {
          targetView = HASH_VIEW_MAP[hash];
        }
      }

      // If returning to a seat selection view, restore route if possible
      if (state?.routeId) {
        const storeRoutes = useBookingStore.getState().routes;
        const matchingRoute = storeRoutes.find((r) => r.id === state.routeId);
        if (matchingRoute) {
          useBookingStore.getState().setSelectedRoute(matchingRoute);
        }
      }

      // If going to seat selection or checkout with no route selected, fallback to schedules
      const currentRoute = useBookingStore.getState().selectedRoute;
      if ((targetView === 'seat-selection' || targetView === 'checkout') && !currentRoute) {
        targetView = 'schedules-dashboard';
      }

      // Transition view without pushing redundant history entry
      useBookingStore.getState().setCurrentView(targetView, false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // On app start: Parallelize health ping, routes load, and bookings load (Eliminate waterfall)
  useEffect(() => {
    let isMounted = true;

    // Detect if cloud server (Render free tier) takes more than 3.5s to wake up
    const wakeUpTimer = setTimeout(() => {
      if (isMounted && useBookingStore.getState().routes.length === 0) {
        setIsWakingUp(true);
      }
    }, 3500);

    (async () => {
      try {
        const routesPromise = loadRoutes();
        const bookingsPromise = loadBookings();
        const healthPromise = fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(25000) })
          .then((res) => res.ok)
          .catch(() => false);

        await Promise.allSettled([routesPromise, bookingsPromise, healthPromise]);

        if (!isMounted) return;
        clearTimeout(wakeUpTimer);
        setIsWakingUp(false);
        setBackendReady(true);

        // Check if app was opened via scanned QR code URL (e.g. #validate?pnr=OMNI-12345 or ?pnr=OMNI-12345)
        const fullUrl = window.location.href;
        const match = fullUrl.match(/pnr=([A-Z0-9-]+)/i);
        if (match && match[1]) {
          const pnr = match[1].toUpperCase();
          const valRes = await useBookingStore.getState().validateTicketByPNR(pnr);
          if (valRes.success) {
            alert(`✅ TICKET VALIDATED SUCCESSFULLY!\n\nPassenger: ${valRes.booking?.passenger?.fullName || 'Confirmed'}\nPNR Code: ${pnr}\nSeats: ${valRes.booking?.seats?.join(', ') || 'Reserved'}\nStatus: ${valRes.message}`);
          } else {
            alert(`❌ TICKET VALIDATION FAILED\n\nPNR Code: ${pnr}\nReason: ${valRes.message}`);
          }
        }
      } catch {
        if (isMounted && useBookingStore.getState().routes.length === 0) {
          setBackendError(true);
        }
      }
    })();

    return () => {
      isMounted = false;
      clearTimeout(wakeUpTimer);
    };
  }, [loadRoutes, loadBookings]);

  // ─── Backend offline splash (only if zero routes available) ─────────────────
  if (backendError && routes.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 gap-6 px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
          <Wifi className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Connecting to Server</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
            Cloud server is waking up or temporarily unavailable. Please retry.
          </p>
        </div>
        <button
          onClick={() => { setBackendError(false); window.location.reload(); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  // ─── Non-blocking: only show full splash on deep views that strictly require routes ───
  const isSearchLanding = currentView === 'passenger-search';
  const shouldBlock = !isSearchLanding && routes.length === 0 && !backendReady;

  if (shouldBlock) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 gap-6 px-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-800 border-t-blue-500 animate-spin" />
          <Bus className="absolute inset-0 m-auto w-7 h-7 text-blue-500" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-bold text-slate-800 dark:text-white text-lg">Loading Dewmina Super Line…</p>
          <p className="text-slate-400 text-sm">
            {isWakingUp ? 'Waking up cloud server (takes ~30s on first load)...' : 'Connecting to API server'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 antialiased selection:bg-blue-500 selection:text-white overflow-x-hidden transition-colors duration-300">
      <Navbar />

      {/* Cloud Server Wake-up notification (Render free tier cold start notification) */}
      {isWakingUp && routes.length === 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-amber-500/90 dark:bg-amber-600/90 backdrop-blur-xl text-white text-xs font-bold shadow-xl flex items-center gap-2.5 animate-bounce-short border border-amber-300/40">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>Connecting to cloud server... Live bus schedules will update momentarily.</span>
        </div>
      )}

      {/* Global API error banner */}
      {error && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold hover:opacity-70">✕</button>
        </div>
      )}

      <main className={`flex-1 transition-all duration-300 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0 ${currentView === 'passenger-search' ? '' : 'pt-[calc(5rem+env(safe-area-inset-top,0px))] md:pt-24'}`}>
        {currentView === 'admin-panel' ? (
          isAdmin ? (
            <div key="admin">
              <AdminDashboard />
            </div>
          ) : (
            <div key="admin-restricted" className="max-w-xl mx-auto my-12 px-6 py-10 bg-white rounded-3xl border border-red-200 shadow-xl text-center space-y-5 animate-fade-in-up">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600 shadow-sm">
                <ShieldAlert className="w-8 h-8 text-red-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Operator Portal Access Restricted</h2>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  The Operator & Admin Portal is restricted to authorized fleet administrators. Passenger accounts cannot access fleet management.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => useBookingStore.getState().setUserRole('admin')}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4" /> Enable Admin Portal Access
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Lock className="w-4 h-4" /> Sign In as Admin
                </button>
                <button
                  onClick={() => setCurrentView('passenger-search')}
                  className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm border border-slate-200 transition-all cursor-pointer"
                >
                  Return to Passenger Portal
                </button>
              </div>
            </div>
          )
        ) : (
          <div key={currentView} className="animate-fade-in-up">
            {currentView === 'passenger-search' && (
              <div>
                <HeroSearch />
                <div className="bg-slate-50 dark:bg-slate-900/50 py-10 transition-colors duration-300">
                  <StatsSection />
                </div>
                <ServicesSection />
                <BookingGuideSection />
                <AboutPlatformSection />
                <BusBookingFAQSection />
              </div>
            )}

            {currentView === 'schedules-dashboard' && <SchedulesDashboard />}
            {currentView === 'seat-selection' && <SeatMap />}
            {currentView === 'checkout' && <FareBreakdown />}
            {currentView === 'ticket-confirmation' && <TicketModal />}
            {currentView === 'live-tracking' && <LiveMap />}
            {currentView === 'my-bookings' && <UserBookings />}
            {currentView === 'passenger-settings' && <PassengerSettings />}
            {currentView === 'slip-upload' && <SlipUploadPage />}
          </div>
        )}
      </main>

      <Footer />
      <FloatingWhatsApp />
      <PwaInstallPrompt />
    </div>
  );
}

export default App;
