import React from 'react';
import { 
  Bus, ShieldCheck, MapPin, Award, Users, HeartHandshake, 
  Navigation, Clock, CheckCircle2 
} from 'lucide-react';

export const AboutPlatformSection: React.FC = () => {
  const stats = [
    { label: 'Happy Passengers Served', value: '50,000+', icon: Users, color: 'text-blue-600 bg-blue-50 border-blue-100', glow: 'group-hover:border-blue-300' },
    { label: 'On-Time Fleet Reliability', value: '99.2%', icon: Clock, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', glow: 'group-hover:border-emerald-300' },
    { label: 'Major Cities Connected', value: '25+', icon: MapPin, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', glow: 'group-hover:border-indigo-300' },
    { label: 'Passenger Safety Score', value: '4.9 / 5', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 border-amber-100', glow: 'group-hover:border-amber-300' },
  ];

  const features = [
    {
      title: 'Certified Luxury Fleet',
      desc: 'Our modern Ashok Leyland, Yutong, and Volvo coaches feature high-comfort reclining seats, individual charging ports, and dual-zone climate control.',
      icon: Bus,
      iconBg: 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white',
    },
    {
      title: 'Southern Expressway & Intercity Express',
      desc: 'Non-stop scheduled departures utilizing the Southern Expressway (E01) and Central corridors for fastest travel between Monaragala, Colombo, and Galle.',
      icon: Navigation,
      iconBg: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    },
    {
      title: 'Solo Female Passenger Protection',
      desc: 'Dedicated female-priority seat allocations in Rows 2 & 3 ensure comfortable, secure, and respectful travel for women commuting across Sri Lanka.',
      icon: ShieldCheck,
      iconBg: 'bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white',
    },
    {
      title: 'Live GPS Fleet Telemetry',
      desc: 'Track your coach in real-time, view live speed and current landmarks, and share live location with family members throughout your journey.',
      icon: MapPin,
      iconBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-12 select-none">
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-12 backdrop-blur-2xl bg-gradient-to-br from-white/95 via-slate-50/90 to-blue-50/70 border border-white shadow-2xl shadow-slate-200/80 transition-all">
        
        {/* ── Dynamic Animated Background Glow Blobs ── */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none animate-blob-1" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none animate-blob-2" />
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* ── Top Radiant Flowing Shimmer Bar ── */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-400 to-pink-400 bg-[length:200%_100%] animate-gradient-flow" />

        <div className="relative z-10 space-y-12">
          
          {/* Top Header Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-700 text-xs font-bold shadow-xs hover:scale-105 transition-transform cursor-default">
                <Award className="w-4 h-4 text-blue-600 animate-pulse" />
                <span>Sri Lanka's Trusted Fleet Operator & Booking Portal</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Dewmina Super Line</span>, Sri Lanka’s Premier Bus Booking Platform
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Founded with a mission to transform long-distance public transit in Sri Lanka, <strong className="text-slate-800 font-semibold">Dewmina Super Line</strong> combines state-of-the-art coaches, certified professional drivers, and cutting-edge seat reservation technology. We provide passengers with guaranteed seat allocations, instant QR e-tickets, and live GPS bus tracking from the palm of their hand.
              </p>
            </div>

            {/* Side Highlight Glass Card with Interactive Glow */}
            <div className="lg:col-span-5 backdrop-blur-xl bg-white/85 rounded-2xl p-6 border border-white shadow-lg shadow-blue-900/5 hover:shadow-xl hover:border-blue-300 transition-all duration-300 space-y-4 group">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-600/25 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Beyond the Journey: The Journey of Faith</h4>
                  <p className="text-xs text-blue-600 font-medium">Our promise of punctuality, safety & comfort</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Whether commuting between Monaragala and Colombo Fort, traveling along the Southern Highway to Galle, or heading into the Central Hills of Kandy, our dedicated operations team ensures an unparalleled travel experience.
              </p>

              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 px-3.5 py-2 rounded-xl shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 animate-pulse" />
                <span>Govt. Certified & Route Permit Compliant Fleet</span>
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

          {/* Core Features Grid with Animated Hover Glow & Icon Transitions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={idx}
                  className="p-5 rounded-2xl backdrop-blur-xl bg-white/80 hover:bg-white border border-white hover:border-blue-300/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-start gap-4 text-left group cursor-default"
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${feature.iconBg} shadow-xs group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
};
