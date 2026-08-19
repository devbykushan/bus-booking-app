import React from 'react';
import { useBookingStore } from './store/bookingStore';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HeroSearch } from './components/passenger/HeroSearch';
import { BusCard } from './components/passenger/BusCard';
import { SeatMap } from './components/passenger/SeatMap';
import { FareBreakdown } from './components/passenger/FareBreakdown';
import { TicketModal } from './components/passenger/TicketModal';
import { LiveMap } from './components/passenger/LiveMap';
import { UserBookings } from './components/passenger/UserBookings';
import { OperatorDashboard } from './components/operator/OperatorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Bus, AlertCircle } from 'lucide-react';

export function App() {
  const { 
    currentView, 
    userRole, 
    routes, 
    searchOrigin, 
    searchDestination, 
    busTypeFilter, 
    soloFemaleOnly 
  } = useBookingStore();

  // Filter routes based on active search criteria
  const filteredRoutes = routes.filter(route => {
    // If bus type specified
    if (busTypeFilter !== 'all' && route.busType !== busTypeFilter) {
      return false;
    }
    // If solo female filter active, ensure female seats exist
    if (soloFemaleOnly) {
      const hasFemaleSeats = route.seats.some(s => s.isFemaleOnly && s.status === 'available');
      if (!hasFemaleSeats) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-teal-500 selection:text-white">
      {/* Top Header Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {userRole === 'passenger' && (
          <>
            {currentView === 'passenger-search' && (
              <div className="space-y-8 pb-16">
                <HeroSearch />

                {/* Available Bus Routes Results List */}
                <div className="max-w-5xl mx-auto px-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Bus className="w-5 h-5 text-teal-400" />
                      <span>Available Bus Schedules ({filteredRoutes.length})</span>
                    </h2>
                    <span className="text-xs text-slate-400 font-mono">
                      Showing results for {searchOrigin} → {searchDestination}
                    </span>
                  </div>

                  {filteredRoutes.length === 0 ? (
                    <div className="glass-panel p-12 rounded-3xl text-center border border-slate-800 space-y-3">
                      <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                      <p className="text-slate-300 font-semibold text-sm">No direct buses matched your exact filters.</p>
                      <p className="text-xs text-slate-500">Try resetting the Bus Category filter or solo female option.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredRoutes.map(route => (
                        <BusCard key={route.id} route={route} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentView === 'seat-selection' && <SeatMap />}
            {currentView === 'checkout' && <FareBreakdown />}
            {currentView === 'ticket-confirmation' && <TicketModal />}
            {currentView === 'live-tracking' && <LiveMap />}
            {currentView === 'my-bookings' && <UserBookings />}
          </>
        )}

        {userRole === 'operator' && <OperatorDashboard />}
        {userRole === 'admin' && <AdminDashboard />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
