import React, { useState } from 'react';
import { 
  Bus, 
  ShieldCheck, 
  MapPin, 
  Award, 
  Users, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  Compass, 
  Shield, 
  Star
} from 'lucide-react';

export const AboutPlatformSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'safety' | 'expressway'>('overview');

  const stats = [
    { label: 'Happy Passengers Served', value: '50,000+', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100', glow: 'group-hover:border-blue-300' },
    { label: 'On-Time Fleet Reliability', value: '99.2%', icon: Clock, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', glow: 'group-hover:border-emerald-300' },
    { label: 'Major Cities Connected', value: '25+', icon: MapPin, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', glow: 'group-hover:border-indigo-300' },
    { label: 'Passenger Safety Score', value: '4.9 / 5', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 border-amber-100', glow: 'group-hover:border-amber-300' },
  ];

  const tabContents = {
    overview: {
      badge: 'About Our Platform',
      title: 'Sri Lanka’s Next-Generation Smart Bus Reservation Network',
      description: 'Founded with a dedication to elevating public transit across Sri Lanka, Dewmina Super Line combines state-of-the-art coaches, GPS telematics, and real-time seat lock technology to deliver seamless journey booking between Monaragala, Colombo, Galle, Kandy, and beyond.',
      highlights: [
        'Real-time live seat inventory with 10-minute temporary checkout hold',
        'Direct Southern Expressway (E01) & Central highway express schedules',
        'Instant digital SMS ticket pass & downloadable PDF boarding tickets',
        '24/7 dedicated telephone passenger support & bus terminal dispatch desk'
      ]
    },
    fleet: {
      badge: 'Luxury Fleet Specifications',
      title: 'Ashok Leyland 54 & Yutong Luxury Coaches',
      description: 'Travel in unmatched comfort. Every bus in our fleet is equipped with ergonomic high-back reclining chairs, individual USB high-speed charging outlets, dual-zone climate-controlled air conditioning, and generous luggage compartments.',
      highlights: [
        'Custom 2x2 luxury seating with extra legroom & footrests',
        'Individual fast USB phone charging ports at every seat',
        'Dual-zone A/C with personalized overhead airflow controls',
        'Certified routine mechanical checks prior to every expressway departure'
      ]
    },
    safety: {
      badge: 'Passenger Safety Standards',
      title: 'Solo Female Protection & Certified Professional Drivers',
      description: 'Passenger safety is our highest priority. We mandate certified background-checked drivers, real-time speed monitoring via GPS telematics, and dedicated female-priority seating in Rows 2 & 3 to protect solo female travelers.',
      highlights: [
        'Dedicated solo female seat allocation rules for peace of mind',
        'Live fleet speed telemetry with automated alert thresholds',
        'Fully insured passenger coverage on all scheduled intercity trips',
        'Emergency SOS contact line directly linked to fleet dispatchers'
      ]
    },
    expressway: {
      badge: 'Fast Route Network',
      title: 'Southern Expressway E01 & Central Highway Corridors',
      description: 'Skip congested traffic jams with our scheduled non-stop expressway coaches. Enjoy direct non-stop transit between Monaragala, Colombo Fort, Makumbura Multimodal Center, Galle, and Matara.',
      highlights: [
        'Non-stop Southern Expressway (E01) express departures daily',
        'Direct connection to Makumbura Multimodal Center (Kottawa)',
        'Scheduled punctuality with 99.2% on-time departure record',
        'Interactive route maps with live bus stop GPS previews'
      ]
    }
  };

  const currentTabInfo = tabContents[activeTab];

  return (
    <section id="about" className="max-w-7xl mx-auto px-4 py-12 select-none">
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-12 backdrop-blur-2xl bg-gradient-to-br from-white/95 via-slate-50/90 to-blue-50/70 border border-white shadow-2xl shadow-slate-200/80 transition-all">
        
        {/* ── Dynamic Animated Background Glow Blobs ── */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-cyan-300/15 rounded-full blur-3xl pointer-events-none" />

        {/* ── Top Radiant Flowing Shimmer Bar ── */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-400 to-pink-400 bg-[length:200%_100%] animate-gradient-flow" />

        <div className="relative z-10 space-y-10">
          
          {/* Top Header Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-xs hover:scale-105 transition-transform cursor-default">
                <Award className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>Sri Lanka's Trusted Fleet Operator & Booking Portal</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Dewmina Super Line</span>
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Connecting Sri Lanka’s major cities with modern luxury coaches, certified professional chauffeurs, and instant online seat reservations. Experience a smarter, safer, and more comfortable journey every time you travel.
              </p>

              {/* Interactive Navigation Pills */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { id: 'overview', label: 'Company Overview', icon: Compass },
                  { id: 'fleet', label: 'Luxury Fleet', icon: Bus },
                  { id: 'safety', label: 'Safety & Female Priority', icon: Shield },
                  { id: 'expressway', label: 'Expressway Corridors', icon: Navigation },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id as any)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                          : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 hover:border-blue-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Side Highlight Glass Card with Tab Details */}
            <div className="lg:col-span-5 backdrop-blur-xl bg-white/90 rounded-2xl p-6 border border-white shadow-lg shadow-blue-900/5 hover:shadow-xl hover:border-blue-300 transition-all duration-300 space-y-4 group">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                  {currentTabInfo.badge}
                </span>
                <span className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>4.9 / 5 Rating</span>
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {currentTabInfo.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {currentTabInfo.description}
                </p>
              </div>

              {/* Highlights List */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {currentTabInfo.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Glass Bar with Smooth Card Lift & Hover Effects */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200/80">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={idx} 
                  className="p-5 rounded-2xl backdrop-blur-xl bg-white/85 border border-white shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-blue-300 transition-all duration-300 text-center space-y-1.5 group cursor-default"
                >
                  <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center ${stat.color} mb-2 shadow-xs border group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight group-hover:text-blue-600 transition-colors">{stat.value}</span>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};
