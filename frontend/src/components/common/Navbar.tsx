import React, { useState, useEffect, useRef } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { AuthModal } from './AuthModal';
import { Bus, MapPin, Ticket, Clock, ShieldCheck, LogOut, LogIn, ChevronDown, Globe, Route, Settings, Moon, Sun, User } from 'lucide-react';
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
    theme,
    setTheme,
    t
  } = useBookingStore();

  
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

  const isAdmin = currentUser?.role === 'admin' || userRole === 'admin';

  const mobileNavItems = isAdmin
    ? [
        { key: 'passenger-search', translationKey: 'findBuses', icon: Bus, activeOn: ['passenger-search'] },
        { key: 'schedules-dashboard', translationKey: 'journeys', icon: Route, activeOn: ['schedules-dashboard', 'seat-selection', 'checkout', 'ticket-confirmation'] },
        { key: 'live-tracking', translationKey: 'liveGps', icon: MapPin, activeOn: ['live-tracking'] },
        { 
          key: 'admin-panel', 
          label: language === 'sinhala' ? 'පරිපාලක' : language === 'tamil' ? 'நிர்வாகம்' : 'Admin', 
          icon: ShieldCheck, 
          activeOn: ['admin-panel'],
          isAdminTab: true 
        },
      ]
    : [
        { key: 'passenger-search', translationKey: 'findBuses', icon: Bus, activeOn: ['passenger-search'] },
        { key: 'schedules-dashboard', translationKey: 'journeys', icon: Route, activeOn: ['schedules-dashboard', 'seat-selection', 'checkout', 'ticket-confirmation'] },
        { key: 'my-bookings', translationKey: 'myTickets', icon: Ticket, activeOn: ['my-bookings'] },
        currentUser
          ? { 
              key: 'passenger-settings', 
              label: language === 'sinhala' ? 'ගිණුම' : language === 'tamil' ? 'கணக்கு' : 'Profile', 
              icon: User, 
              activeOn: ['passenger-settings'] 
            }
          : { 
              key: 'sign-in', 
              label: language === 'sinhala' ? 'පිවිසෙන්න' : language === 'tamil' ? 'உள்நுழைய' : 'Sign In', 
              icon: LogIn, 
              activeOn: [] 
            },
      ];

  const isActive = (activeOn: string[]) => activeOn.includes(currentView);

  const handleNavItemClick = (view: string) => {
    if (view === 'sign-in') {
      setShowAuthModal(true);
      return;
    }

    if (view === 'admin-panel') {
      setUserRole('admin');
      setCurrentView('admin-panel');
      return;
    }

    if (view === 'passenger-settings') {
      setCurrentView('passenger-settings');
      return;
    }

    const requiresAuth = view === 'live-tracking' || view === 'my-bookings';
    if (requiresAuth && !currentUser) {
      setCurrentView(view as any);
      setShowAuthModal(true);
      return;
    }

    if (view === 'passenger-search') {
      goToHome();
      return;
    }

    if (view === 'schedules-dashboard') {
      goToSearchSchedules();
      return;
    }

    setCurrentView(view as any);
  };

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 pt-safe ${
        scrolled
          ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl'
          : 'bg-[#090d16]/85 dark:bg-slate-950/85 backdrop-blur-xl'
      }`}>
        <nav
          ref={navRef}
          className={`w-full transition-all duration-500 border-b ${
            scrolled
              ? 'bg-white/85 dark:bg-slate-950/85 backdrop-blur-2xl border-slate-200/80 dark:border-slate-800/80 shadow-md shadow-slate-900/5 dark:shadow-black/40'
              : 'bg-slate-950/25 dark:bg-slate-950/35 backdrop-blur-xl border-white/10 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.15)]'
          }`}
        >
          {/* Subtle vibrant top accent line */}
          <div className={`h-[2px] w-full transition-opacity duration-300 ${
            scrolled
              ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 opacity-90 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
              : 'bg-gradient-to-r from-blue-400/80 via-indigo-400/80 to-cyan-400/80 opacity-70'
          }`} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center justify-between h-16 md:h-[72px]">
              
              {/* ── Brand Logo with Cinematic Animated Video-Like Badge ── */}
              <div
                onClick={() => { goToHome();  }}
                className="cursor-pointer flex items-center gap-3"
              >
                <AnimatedLogoBadge size="md" />
              </div>

              {/* ── Desktop Navigation Links ── */}
              <div className={`hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl backdrop-blur-md transition-all duration-300 ${
                scrolled
                  ? 'bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700'
                  : 'bg-white/10 dark:bg-white/10 border border-white/15 shadow-inner'
              }`}>
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
                          : scrolled
                            ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700/60 shadow-2xs'
                            : 'text-white/85 hover:text-white hover:bg-white/15'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : scrolled ? 'text-slate-500 group-hover:text-slate-900' : 'text-white/80'}`} />
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

                {/* Admin Portal Tab (Only visible to verified Admins) */}
                {(userRole === 'admin' || currentUser?.role === 'admin') && (
                  <button
                    onClick={() => { setUserRole('admin'); setCurrentView('admin-panel'); }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      currentView === 'admin-panel'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 border border-purple-400 scale-[1.02]'
                        : scrolled
                          ? 'text-purple-700 hover:text-purple-900 hover:bg-purple-50 border border-purple-200/70'
                          : 'text-amber-300 hover:text-amber-200 hover:bg-white/15 border border-amber-400/40'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t('adminPortal')}</span>
                  </button>
                )}
              </div>

              {/* ── Right side controls (iOS Glass Capsules) ── */}
              <div className="flex items-center gap-2.5">

                {/* Seat hold countdown badge */}
                {lockActive && selectedSeatIds.length > 0 && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl shadow-xs animate-pulse backdrop-blur-md ${
                    scrolled
                      ? 'bg-amber-50 border border-amber-300 text-amber-800'
                      : 'bg-amber-500/20 border border-amber-400/40 text-amber-200'
                  }`}>
                    <Clock className={`w-3.5 h-3.5 ${scrolled ? 'text-amber-600' : 'text-amber-300'}`} />
                    <span className="text-xs font-semibold hidden sm:inline">
                      {selectedSeatIds.length} {t('held')}
                    </span>
                    <span className={`font-mono font-black text-xs tabular-nums ${scrolled ? 'text-amber-900' : 'text-white'}`}>
                      {formatTimer(lockExpirySeconds)}
                    </span>
                  </div>
                )}

                {/* Theme Toggle (iOS Glass Pill) */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={`flex items-center justify-center w-9 h-9 rounded-2xl transition-all duration-200 cursor-pointer shadow-xs font-extrabold active:scale-95 ${
                    scrolled
                      ? 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                      : 'bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md'
                  }`}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>

                {/* Language Selector (iOS Glass Pill) */}
                <div className="relative" ref={langRef}>
                  <button
                    onClick={() => setLangOpen(!langOpen)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-200 cursor-pointer shadow-xs font-extrabold active:scale-95 ${
                      scrolled
                        ? 'bg-white/80 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-white/10 hover:border-slate-300 text-slate-700 dark:text-slate-200'
                        : 'bg-white/15 hover:bg-white/25 border border-white/20 text-white backdrop-blur-md'
                    }`}
                  >
                    <Globe className={`w-4 h-4 ${scrolled ? 'text-blue-600' : 'text-cyan-300'}`} />
                    <span className="text-xs uppercase hidden sm:inline">
                      {language === 'english' ? 'EN' : language === 'sinhala' ? 'සිං' : 'த'}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${langOpen ? 'rotate-180' : ''} ${scrolled ? 'text-slate-500' : 'text-white/70'}`} />
                  </button>

                  {/* Language Dropdown (iOS Liquid Glass) */}
                  {langOpen && (
                    <div className="absolute top-[calc(100%+8px)] right-0 w-40 bg-white/70 dark:bg-slate-950/75 backdrop-blur-3xl backdrop-saturate-[190%] border border-white/60 dark:border-white/15 rounded-[22px] shadow-[0_20px_48px_-8px_rgba(0,0,0,0.22),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(255,255,255,0.2)] dark:shadow-[0_24px_56px_-8px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.25)] overflow-hidden z-50 p-1.5 animate-fade-in-up">
                      {/* Specular highlight rim line */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[1.5px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/50 to-transparent pointer-events-none" />
                      
                      <div className="space-y-1">
                        <button
                          onClick={() => { setLanguage('english'); setLangOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                            language === 'english'
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_2px_10px_rgba(59,130,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.5)]'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-cyan-300'
                          }`}
                        >
                          <span>English</span>
                          {language === 'english' && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />}
                        </button>
                        <button
                          onClick={() => { setLanguage('sinhala'); setLangOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                            language === 'sinhala'
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_2px_10px_rgba(59,130,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.5)]'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-cyan-300'
                          }`}
                        >
                          <span>සිංහල</span>
                          {language === 'sinhala' && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />}
                        </button>
                        <button
                          onClick={() => { setLanguage('tamil'); setLangOpen(false); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                            language === 'tamil'
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_2px_10px_rgba(59,130,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.5)]'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-white/50 dark:hover:bg-white/10 hover:text-blue-600 dark:hover:text-cyan-300'
                          }`}
                        >
                          <span>தமிழ்</span>
                          {language === 'tamil' && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Auth / Profile Capsule (iOS Glass Pill) */}
                {currentUser ? (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-2xl transition-all duration-200 cursor-pointer shadow-xs group active:scale-95 ${
                        scrolled
                          ? 'bg-white/80 hover:bg-white dark:bg-slate-900/80 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-white/10 text-slate-800 dark:text-white'
                          : 'bg-white/15 hover:bg-white/25 border border-white/20 text-white backdrop-blur-md'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-xs">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden sm:flex flex-col items-start text-left">
                        <span className={`text-xs font-extrabold leading-tight truncate max-w-[110px] ${
                          scrolled ? 'text-slate-800 dark:text-white' : 'text-white'
                        }`}>
                          {currentUser.name}
                        </span>
                        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                          currentUser.role === 'admin' 
                            ? scrolled ? 'text-purple-600 dark:text-purple-400' : 'text-amber-300' 
                            : scrolled ? 'text-blue-600 dark:text-blue-400' : 'text-cyan-300'
                        }`}>
                          {currentUser.role}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''} ${
                        scrolled ? 'text-slate-400' : 'text-white/70'
                      }`} />
                    </button>

                    {/* Profile Dropdown (iOS Liquid Glass Popover) */}
                    {profileOpen && (
                      <div className="absolute top-[calc(100%+8px)] right-0 w-60 bg-white/70 dark:bg-slate-950/75 backdrop-blur-3xl backdrop-saturate-[190%] border border-white/60 dark:border-white/15 rounded-[24px] shadow-[0_24px_56px_-8px_rgba(0,0,0,0.22),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(255,255,255,0.2)] dark:shadow-[0_28px_64px_-8px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.25)] overflow-hidden z-50 animate-fade-in-up text-slate-800 dark:text-slate-100">
                        {/* Specular top light rim */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[1.5px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/50 to-transparent pointer-events-none" />

                        {/* Frosted User Header Plate */}
                        <div className="relative px-4 py-3 border-b border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md">
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate tracking-tight">{currentUser.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">{currentUser.phone || currentUser.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="p-1.5 space-y-1">
                          {(currentUser?.role === 'admin' || userRole === 'admin') && (
                            <button
                              onClick={() => {
                                setUserRole('admin');
                                setCurrentView('admin-panel');
                                setProfileOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-500/15 dark:hover:bg-purple-500/20 border border-transparent hover:border-purple-400/30 transition-all duration-200 cursor-pointer active:scale-95"
                            >
                              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 drop-shadow-[0_1px_4px_rgba(168,85,247,0.3)]" />
                              <span>Admin Dashboard</span>
                            </button>
                          )}
                          <button
                            onClick={() => { setCurrentView('my-bookings'); setProfileOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-blue-500/15 dark:hover:bg-blue-500/20 border border-transparent hover:border-blue-400/30 transition-all duration-200 cursor-pointer active:scale-95"
                          >
                            <Ticket className="w-4 h-4 text-blue-600 dark:text-cyan-400 drop-shadow-[0_1px_4px_rgba(59,130,246,0.3)]" />
                            <span>{t('myTickets')}</span>
                          </button>
                          {currentUser?.role !== 'admin' && userRole !== 'admin' && (
                            <button
                              onClick={() => { setCurrentView('passenger-settings'); setProfileOpen(false); }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-cyan-300 hover:bg-blue-500/15 dark:hover:bg-blue-500/20 border border-transparent hover:border-blue-400/30 transition-all duration-200 cursor-pointer active:scale-95"
                            >
                              <Settings className="w-4 h-4 text-blue-600 dark:text-cyan-400 drop-shadow-[0_1px_4px_rgba(59,130,246,0.3)]" />
                              <span>{t('passengerSettings')}</span>
                            </button>
                          )}
                          <div className="h-[1px] my-1 bg-slate-200/50 dark:bg-white/10" />
                          <button
                            onClick={() => { logout(); setProfileOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/15 dark:hover:bg-red-500/20 border border-transparent hover:border-red-400/30 transition-all duration-200 cursor-pointer active:scale-95"
                          >
                            <LogOut className="w-4 h-4 text-red-500 drop-shadow-[0_1px_4px_rgba(239,68,68,0.3)]" />
                            <span>{t('signOut')}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/30 transition-all duration-200 cursor-pointer active:scale-95 border border-white/10"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t('signIn')}</span>
                  </button>
                )}

              </div>

            </div>
          </div>
        </nav>
      </div>

      {/* ── Floating iOS Liquid Glass Mobile Navigation Bar ── */}
      <div className="md:hidden fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-6 sm:right-6 max-w-lg mx-auto z-[100] mb-[env(safe-area-inset-bottom,0px)] pointer-events-none">
        <nav
          aria-label="Mobile Navigation"
          className="pointer-events-auto relative w-full px-2.5 py-1.5 rounded-[28px] bg-white/60 dark:bg-slate-950/65 backdrop-blur-3xl backdrop-saturate-[190%] border border-white/60 dark:border-white/15 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.22),inset_0_1px_2px_rgba(255,255,255,0.8),inset_0_-1px_1px_rgba(255,255,255,0.2)] dark:shadow-[0_20px_48px_-8px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.25),inset_0_-1px_1px_rgba(255,255,255,0.05)] transition-all duration-300 overflow-hidden"
        >
          {/* Specular Liquid Glass Top Rim Reflection */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[1.5px] bg-gradient-to-r from-transparent via-white/95 dark:via-white/50 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-[35%] bg-gradient-to-b from-white/25 dark:from-white/5 to-transparent pointer-events-none rounded-t-[28px]" />

          <div className="relative z-10 flex items-center justify-around gap-1">
            {mobileNavItems.map((item: any) => {
              const Icon = item.icon;
              const active = isActive(item.activeOn);
              const isAdminItem = item.isAdminTab;
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavItemClick(item.key)}
                  className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-[20px] transition-all duration-300 cursor-pointer active:scale-90 select-none ${
                    active
                      ? isAdminItem
                        ? 'bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-indigo-600/20 text-purple-700 dark:text-purple-300 font-black border border-purple-400/40 shadow-[0_2px_12px_rgba(168,85,247,0.25),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_2px_14px_rgba(168,85,247,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                        : 'bg-gradient-to-b from-blue-500/20 via-blue-500/10 to-indigo-600/20 text-blue-700 dark:text-cyan-300 font-black border border-blue-400/40 shadow-[0_2px_12px_rgba(59,130,246,0.25),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[0_2px_14px_rgba(59,130,246,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-white/5 font-bold border border-transparent'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-all duration-300 ${
                    active 
                      ? isAdminItem 
                        ? 'text-purple-600 dark:text-purple-300 drop-shadow-[0_2px_6px_rgba(168,85,247,0.4)] scale-110' 
                        : 'text-blue-600 dark:text-cyan-300 drop-shadow-[0_2px_6px_rgba(59,130,246,0.4)] scale-110' 
                      : 'opacity-85'
                  }`} />
                  <span className="text-[10px] text-center leading-tight truncate w-full mt-0.5 font-sans tracking-tight">
                    {item.label || t(item.translationKey)}
                  </span>
                  {active && (
                    <span className={`w-1 h-1 rounded-full mt-0.5 ${
                      isAdminItem ? 'bg-purple-500 dark:bg-purple-400 shadow-[0_0_6px_#a855f7]' : 'bg-blue-600 dark:bg-cyan-400 shadow-[0_0_6px_#3b82f6]'
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};
