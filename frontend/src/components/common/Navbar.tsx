import React, { useState, useEffect, useRef } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { AuthModal } from './AuthModal';
import { Bus, MapPin, Ticket, Clock, ShieldCheck, User, LogOut, LogIn, Menu, X, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    currentUser,
    userRole, 
    setUserRole, 
    logout,
    lockActive, 
    lockExpirySeconds,
    selectedSeatIds,
    showAuthModal,
    setShowAuthModal
  } = useBookingStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Track scroll for navbar style change
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const navItems = [
    { key: 'passenger-search', label: 'Find Buses', icon: Bus, activeOn: ['passenger-search', 'seat-selection'] },
    { key: 'live-tracking', label: 'Live GPS', icon: MapPin, activeOn: ['live-tracking'] },
    { key: 'my-bookings', label: 'My Tickets', icon: Ticket, activeOn: ['my-bookings'] },
  ];

  const isActive = (activeOn: string[]) => activeOn.includes(currentView);

  return (
    <>
      <nav
        className={`navbar-root sticky top-0 z-40 transition-all duration-500 ${
          scrolled
            ? 'navbar-scrolled'
            : 'navbar-top'
        }`}
      >
        {/* Animated gradient line at top */}
        <div className="navbar-gradient-line" />

        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            
            {/* ── Brand ── */}
            <div
              onClick={() => { setCurrentView('passenger-search'); setMobileOpen(false); }}
              className="navbar-brand group cursor-pointer flex items-center gap-3"
            >
              <img
                src="/dewmina-logo.png"
                alt="Dewmina Super Line"
                className="h-11 md:h-14 w-auto object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
              />
            </div>

            {/* ── Desktop Nav ── */}
            <div className="hidden md:flex items-center gap-1.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const active = isActive(item.activeOn);
                return (
                  <button
                    key={item.key}
                    onClick={() => setCurrentView(item.key as any)}
                    className={`navbar-link group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      active
                        ? 'navbar-link-active'
                        : 'navbar-link-inactive'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-all duration-300 ${
                      active ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-400'
                    }`} />
                    <span>{item.label}</span>
                    {active && <span className="navbar-active-dot" />}
                  </button>
                );
              })}

              {/* Admin tab */}
              {(userRole === 'admin' || currentUser?.role === 'admin') && (
                <button
                  onClick={() => { setUserRole('admin'); setCurrentView('admin-panel'); }}
                  className={`navbar-link group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    currentView === 'admin-panel'
                      ? 'navbar-admin-active'
                      : 'navbar-admin-inactive'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Portal</span>
                  {currentView === 'admin-panel' && <span className="navbar-active-dot navbar-active-dot-purple" />}
                </button>
              )}
            </div>

            {/* ── Right side: Seat Lock + Auth ── */}
            <div className="flex items-center gap-3">

              {/* Seat hold countdown */}
              {lockActive && selectedSeatIds.length > 0 && (
                <div className="navbar-seat-lock">
                  <div className="navbar-seat-lock-pulse" />
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-amber-100 text-xs font-medium hidden sm:inline">
                    {selectedSeatIds.length} seat{selectedSeatIds.length > 1 ? 's' : ''} held
                  </span>
                  <span className="font-mono font-black text-amber-300 text-sm tabular-nums">
                    {formatTimer(lockExpirySeconds)}
                  </span>
                </div>
              )}

              {/* Auth / Profile */}
              {currentUser ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="navbar-profile-btn group flex items-center gap-2"
                  >
                    <div className="navbar-avatar">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-xs font-bold text-white leading-none truncate max-w-[100px]">
                        {currentUser.name}
                      </span>
                      <span className={`text-[10px] font-mono uppercase leading-tight ${
                        currentUser.role === 'admin' ? 'text-purple-300' : 'text-blue-300'
                      }`}>
                        {currentUser.role}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Profile Dropdown */}
                  {profileOpen && (
                    <div className="navbar-profile-dropdown animate-pop-in">
                      <div className="px-4 py-3 border-b border-slate-700/50">
                        <p className="text-sm font-bold text-white">{currentUser.name}</p>
                        <p className="text-xs text-slate-400">{currentUser.phone || currentUser.role}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { setCurrentView('my-bookings'); setProfileOpen(false); }}
                          className="navbar-dropdown-item"
                        >
                          <Ticket className="w-4 h-4" />
                          My Tickets
                        </button>
                        <button
                          onClick={() => { logout(); setProfileOpen(false); }}
                          className="navbar-dropdown-item text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="navbar-signin-btn group"
                >
                  <span className="navbar-signin-glow" />
                  <LogIn className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <div className={`md:hidden navbar-mobile-menu ${mobileOpen ? 'navbar-mobile-open' : 'navbar-mobile-closed'}`}>
          <div className="px-4 py-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = isActive(item.activeOn);
              return (
                <button
                  key={item.key}
                  onClick={() => { setCurrentView(item.key as any); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-blue-500/15 text-blue-300'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
            {(userRole === 'admin' || currentUser?.role === 'admin') && (
              <button
                onClick={() => { setUserRole('admin'); setCurrentView('admin-panel'); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  currentView === 'admin-panel'
                    ? 'bg-purple-500/15 text-purple-300'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
                Admin Portal
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};
