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
import { AdminDashboard } from './components/admin/AdminDashboard';
import { FloatingWhatsApp } from './components/common/FloatingWhatsApp';
import { Bus, AlertCircle, Wifi, RefreshCw, ShieldAlert, Lock } from 'lucide-react';

export function App() {
  const {
    currentView,
    routes,
    isLoading,
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

  const [backendReady, setBackendReady] = useState(false);
  const [backendError, setBackendError] = useState(false);

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

  // On app start: ping backend health, then load data and check for scanned QR validation parameters
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error('Backend not healthy');
        setBackendReady(true);
        await Promise.all([loadRoutes(), loadBookings()]);

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
        setBackendError(true);
      }
    })();
  }, [loadRoutes, loadBookings]);

  // ─── Backend offline splash ───────────────────────────────────────────────
  if (backendError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 gap-6 px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
          <Wifi className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">Backend Server Offline</h1>
          <p className="text-slate-500 text-sm max-w-sm">
            The API server is not running. Start it with:
          </p>
          <code className="block bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-blue-600 font-mono text-sm mt-2">
            cd backend && npm run dev
          </code>
        </div>
        <button
          onClick={() => { setBackendError(false); window.location.reload(); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry Connection
        </button>
      </div>
    );
  }

  // ─── Loading splash ───────────────────────────────────────────────────────
  if (!backendReady || (isLoading && routes.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
          <Bus className="absolute inset-0 m-auto w-7 h-7 text-blue-500" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-bold text-slate-800 text-lg">Loading Dewmina Super Line…</p>
          <p className="text-slate-400 text-sm">Connecting to API server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <Navbar />

      {/* Global API error banner */}
      {error && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur text-white text-sm font-medium px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold hover:opacity-70">✕</button>
        </div>
      )}

      <main className={`flex-1 transition-all duration-300 ${currentView === 'passenger-search' ? '' : 'pt-20 md:pt-24'}`}>
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
                <div className="bg-slate-50 py-10">
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
          </div>
        )}
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

export default App;
