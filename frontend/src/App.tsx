import { useEffect, useState } from 'react';
import { useBookingStore } from './store/bookingStore';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HeroSearch } from './components/passenger/HeroSearch';
import { StatsSection } from './components/passenger/StatsSection';
import { ServicesSection } from './components/passenger/ServicesSection';
import { BusCard } from './components/passenger/BusCard';
import { SeatMap } from './components/passenger/SeatMap';
import { FareBreakdown } from './components/passenger/FareBreakdown';
import { TicketModal } from './components/passenger/TicketModal';
import { LiveMap } from './components/passenger/LiveMap';
import { UserBookings } from './components/passenger/UserBookings';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Bus, AlertCircle, Wifi, RefreshCw } from 'lucide-react';

export function App() {
  const {
    currentView,
    routes,
    searchOrigin,
    searchDestination,
    busTypeFilter,
    isLoading,
    error,
    loadRoutes,
    loadBookings,
    setError,
  } = useBookingStore();

  const [backendReady, setBackendReady] = useState(false);
  const [backendError, setBackendError] = useState(false);

  // On app start: ping backend health, then load data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error('Backend not healthy');
        setBackendReady(true);
        await Promise.all([loadRoutes(), loadBookings()]);
      } catch {
        setBackendError(true);
      }
    })();
  }, []);

  // Filter routes based on active search criteria
  const filteredRoutes = routes.filter(route => {
    if (busTypeFilter !== 'all' && !route.busType.toLowerCase().includes(busTypeFilter.toLowerCase())) return false;
    if (searchOrigin && route.origin.toLowerCase() !== searchOrigin.toLowerCase()) return false;
    if (searchDestination && route.destination.toLowerCase() !== searchDestination.toLowerCase()) return false;
    return route.availableSeatsCount > 0;
  });

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

      <main className="flex-1 transition-all duration-300">
        {currentView === 'admin-panel' ? (
          <div key="admin">
            <AdminDashboard />
          </div>
        ) : (
          <div key={currentView} className="animate-fade-in-up">
            {currentView === 'passenger-search' && (
              <div className="pb-16">
                <HeroSearch />

                <div className="bg-slate-50 py-10">
                  <StatsSection />
                </div>

                <div className="bg-slate-50 pb-10">
                  <div className="max-w-5xl mx-auto px-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Bus className="w-5 h-5 text-blue-500 animate-bus-drive" />
                        <span>Available Bus Schedules ({filteredRoutes.length})</span>
                      </h2>
                      <span className="text-xs text-slate-400 font-mono">
                        Showing results for {searchOrigin} → {searchDestination}
                      </span>
                    </div>

                    {filteredRoutes.length === 0 ? (
                      <div className="glass-panel p-12 rounded-3xl text-center border border-slate-200 space-y-3">
                        <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                        <p className="text-slate-600 font-semibold text-sm">No buses matched your filters.</p>
                        <p className="text-xs text-slate-400">Try resetting the Bus Category filter.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredRoutes.map((route, idx) => (
                          <div key={route.id} style={{ animationDelay: `${idx * 0.08}s` }} className="animate-fade-in-up">
                            <BusCard route={route as any} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <ServicesSection />
              </div>
            )}

            {currentView === 'seat-selection' && <SeatMap />}
            {currentView === 'checkout' && <FareBreakdown />}
            {currentView === 'ticket-confirmation' && <TicketModal />}
            {currentView === 'live-tracking' && <LiveMap />}
            {currentView === 'my-bookings' && <UserBookings />}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
