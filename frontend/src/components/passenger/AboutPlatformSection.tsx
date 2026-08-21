import React from 'react';
import { 
  Bus, ShieldCheck, MapPin, Award, Users, HeartHandshake, 
  Navigation, Clock, CheckCircle2 
} from 'lucide-react';

export const AboutPlatformSection: React.FC = () => {
  const stats = [
    { label: 'Happy Passengers Served', value: '50,000+', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'On-Time Fleet Reliability', value: '99.2%', icon: Clock, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Major Cities Connected', value: '25+', icon: MapPin, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Passenger Safety Score', value: '4.9 / 5', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50' },
  ];

  const features = [
    {
      title: 'Certified Luxury Fleet',
      desc: 'Our modern Ashok Leyland, Yutong, and Volvo coaches feature high-comfort reclining seats, individual charging ports, and dual-zone climate control.',
      icon: Bus,
    },
    {
      title: 'Southern Expressway & Intercity Express',
      desc: 'Non-stop scheduled departures utilizing the Southern Expressway (E01) and Central corridors for fastest travel between Monaragala, Colombo, and Galle.',
      icon: Navigation,
    },
    {
      title: 'Solo Female Passenger Protection',
      desc: 'Dedicated female-priority seat allocations in Rows 2 & 3 ensure comfortable, secure, and respectful travel for women commuting across Sri Lanka.',
      icon: ShieldCheck,
    },
    {
      title: 'Live GPS Fleet Telemetry',
      desc: 'Track your coach in real-time, view live speed and current landmarks, and share live location with family members throughout your journey.',
      icon: MapPin,
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-12 relative overflow-hidden shadow-xl border border-slate-800">
        
        {/* Subtle Background Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-12">
          
          {/* Top Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
                <Award className="w-3.5 h-3.5 text-blue-400" />
                <span>Sri Lanka's Trusted Fleet Operator & Booking Portal</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Dewmina Super Line</span>, Sri Lanka’s Premier Bus Booking Platform
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Founded with a mission to transform long-distance public transit in Sri Lanka, <strong>Dewmina Super Line</strong> combines state-of-the-art coaches, certified professional drivers, and cutting-edge seat reservation technology. We provide passengers with guaranteed seat allocations, instant QR e-tickets, and live GPS bus tracking from the palm of their hand.
              </p>
            </div>

            {/* Side Highlight Card */}
            <div className="lg:col-span-5 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Beyond the Journey: The Journey of Faith</h4>
                  <p className="text-xs text-blue-200">Our promise of punctuality, safety & comfort</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Whether commuting between Monaragala and Colombo Fort, traveling along the Southern Highway to Galle, or heading into the Central Hills of Kandy, our dedicated operations team ensures an unparalleled travel experience.
              </p>

              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Govt. Certified & Route Permit Compliant Fleet</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center space-y-1">
                  <div className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center ${stat.color} mb-2`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-white font-mono">{stat.value}</span>
                  <p className="text-[11px] text-slate-400 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 transition-all duration-300 flex items-start gap-4"
                >
                  <div className="p-3 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/20 flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{feat.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
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
