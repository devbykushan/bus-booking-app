import React, { useState, useEffect, useRef } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { AuthModal } from './AuthModal';
import { Bus, MapPin, Ticket, Clock, ShieldCheck, LogOut, LogIn, Menu, X, ChevronDown, Globe, Route, Settings } from 'lucide-react';
import { AnimatedLogoBadge } from './AnimatedLogoBadge';

export const Navbar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    goToHome,
    goToSearchSchedules,
    currentUser,
    userRole, 
    setUserRole, 
    logout,
    lockActive, 
    lockExpirySeconds,
    selectedSeatIds,
    showAuthModal,
    setShowAuthModal,
    language,
    setLanguage,
    t
  } = useBookingStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // Track scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close profile and language dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false);
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
    { key: 'passenger-search', translationKey: 'findBuses', icon: Bus, activeOn: ['passenger-search'] },
    { key: 'schedules-dashboard', translationKey: 'journeys', icon: Route, activeOn: ['schedules-dashboard', 'seat-selection', 'checkout', 'ticket-confirmation'] },
    { key: 'live-tracking', translationKey: 'liveGps', icon: MapPin, activeOn: ['live-tracking'] },
    { key: 'my-bookings', translationKey: 'myTickets', icon: Ticket, activeOn: ['my-bookings'] },
  ];

  const isActive = (activeOn: string[]) => activeOn.includes(currentView);

  const handleNavItemClick = (view: string) => {
    const requiresAuth = view === 'live-tracking' || view === 'my-bookings';
    if (requiresAuth && !currentUser) {
      setCurrentView(view as any);
      setMobileOpen(false);
      setShowAuthModal(true);
      return;
    }

    if (view === 'passenger-search') {
      goToHome();
      setMobileOpen(false);
      return;
    }

    if (view === 'schedules-dashboard') {
      goToSearchSchedules();
      setMobileOpen(false);
      return;
    }

    setCurrentView(view as any);
    setMobileOpen(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
        <nav
          ref={navRef}
          className={`w-full transition-all duration-500 border-b backdrop-blur-2xl ${
            scrolled
              ? 'bg-white/98 border-slate-200 shadow-md shadow-slate-900/10'
              : 'bg-white/90 border-slate-200/80 shadow-sm shadow-slate-900/5'
          }`}
        >
          {/* Subtle vibrant top accent line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center justify-between h-16 md:h-[72px]">
              
              {/* ── Brand Logo with Cinematic Animated Video-Like Badge ── */}
              <div
                onClick={() => { goToHome(); setMobileOpen(false); }}
                className="cursor-pointer flex items-center gap-3"
              >
                <AnimatedLogoBadge size="md" />
              </div>

              {/* ── Desktop Navigation Links ── */}
              <div className="hidden md:flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/90 p-1.5 rounded-2xl backdrop-blur-md">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.activeOn);
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleNavItemClick(item.key)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 border border-blue-500 scale-[1.02]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
                      <span>{t(item.translationKey)}</span>
                      {item.key === 'live-tracking' && (
                        <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded-md tracking-wider ${
                          active ? 'bg-white/20 text-white border border-white/30' : 'bg-amber-100 text-amber-700 border border-amber-200/70'
                        }`}>
                          Soon
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Admin Portal Tab */}
                {(userRole === 'admin' || currentUser?.role === 'admin') && (
                  <button
                    onClick={() => { setUserRole('admin'); setCurrentView('admin-panel'); }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      currentView === 'admin-panel'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 border border-purple-400 scale-[1.02]'
                        : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50 border border-purple-200/70'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('adminPortal')}</span>
                  </button>
                )}
              </div>

              {/* ── Right side controls ── */}
              <div className="flex items-center gap-2.5">

                {/* Seat hold countdown badge */}
                {lockActive && selectedSeatIds.length > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-800 px-3 py-1.5 rounded-2xl shadow-xs animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-semibold hidden sm:inline">
                      {selectedSeatIds.length} {t('held')}
                    </span>
                    <span className="font-mono font-black text-xs tabular-nums text-amber-900">
                      {formatTimer(lockExpirySeconds)}
                    </span>
                  </div>
                )}

                {/* Language Selector */}
                <div className="relative" ref={langRef}>
                  <button
                    onClick={() => setLangOpen(!langOpen)}
                    className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 px-3 py-2 rounded-2xl transition-all duration-200 cursor-pointer shadow-xs text-slate-700 font-extrabold"
                  >
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span className="text-xs uppercase hidden sm:inline">
                      {language === 'english' ? 'EN' : language === 'sinhala' ? 'සිං' : 'த'}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Language Dropdown */}
                  {langOpen && (
                    <div className="absolute top-[calc(100%+8px)] right-0 w-36 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 p-1.5 animate-fade-in-up">
                      <button
                        onClick={() => { setLanguage('english'); setLangOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          language === 'english' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
                        }`}
                      >
                        <span>English</span>
                        {language === 'english' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </button>
                      <button
                        onClick={() => { setLanguage('sinhala'); setLangOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          language === 'sinhala' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
                        }`}
                      >
                        <span>සිංහල</span>
                        {language === 'sinhala' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </button>
                      <button
                        onClick={() => { setLanguage('tamil'); setLangOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          language === 'tamil' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100 hover:text-blue-600'
                        }`}
                      >
                        <span>தமிழ்</span>
                        {language === 'tamil' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Auth / Profile Capsule */}
                {currentUser ? (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 px-2.5 py-1.5 rounded-2xl transition-all duration-200 cursor-pointer shadow-xs group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden sm:flex flex-col items-start text-left">
                        <span className="text-xs font-extrabold text-slate-800 leading-tight truncate max-w-[110px]">
                          {currentUser.name}
                        </span>
                        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                          currentUser.role === 'admin' ? 'text-purple-600' : 'text-blue-600'
                        }`}>
                          {currentUser.role}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Profile Dropdown */}
                    {profileOpen && (
                      <div className="absolute top-[calc(100%+8px)] right-0 w-56 bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in-up text-slate-800">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                          <p className="text-xs font-extrabold text-slate-900 truncate">{currentUser.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.phone || currentUser.email}</p>
                        </div>
                        <div className="p-1.5 space-y-1">
                          {(currentUser.role === 'admin' || userRole === 'admin') && (
                            <button
                              onClick={() => {
                                setUserRole('admin');
                                setCurrentView('admin-panel');
                                setProfileOpen(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-purple-700 hover:text-purple-900 hover:bg-purple-50 transition-colors cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4 text-purple-600" />
                              <span>Admin Profile</span>
                            </button>
                          )}
                          <button
                            onClick={() => { setCurrentView('my-bookings'); setProfileOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Ticket className="w-4 h-4 text-blue-600" />
                            <span>{t('myTickets')}</span>
                          </button>
                          <button
                            onClick={() => { setCurrentView('passenger-settings'); setProfileOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Settings className="w-4 h-4 text-blue-600" />
                            <span>{t('passengerSettings')}</span>
                          </button>
                          <button
                            onClick={() => { logout(); setProfileOpen(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>{t('signOut')}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t('signIn')}</span>
                  </button>
                )}

                {/* Mobile hamburger button */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 cursor-pointer transition-colors"
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>

            </div>
          </div>

          {/* ── Mobile Menu Dropdown ── */}
          {mobileOpen && (
            <div className="md:hidden bg-white/98 border-t border-slate-200 px-4 py-3 space-y-1.5 animate-fade-in-up backdrop-blur-2xl shadow-xl">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.activeOn);
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNavItemClick(item.key)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t(item.translationKey)}</span>
                    {item.key === 'live-tracking' && (
                      <span className={`ml-auto px-2 py-0.5 text-[10px] font-black uppercase rounded-md tracking-wider ${
                        active ? 'bg-white/20 text-white border border-white/30' : 'bg-amber-100 text-amber-700 border border-amber-200/70'
                      }`}>
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
              {(userRole === 'admin' || currentUser?.role === 'admin') && (
                <button
                  onClick={() => { setUserRole('admin'); setCurrentView('admin-panel'); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    currentView === 'admin-panel'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                      : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('adminPortal')}</span>
                </button>
              )}
              {currentUser && (
                <button
                  onClick={() => { setCurrentView('passenger-settings'); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    currentView === 'passenger-settings'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>{t('passengerSettings')}</span>
                </button>
              )}
            </div>
          )}
        </nav>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};
