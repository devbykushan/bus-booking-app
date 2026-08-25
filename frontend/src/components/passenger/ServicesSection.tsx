import React, { useEffect, useState, useRef } from 'react';
import { Armchair, Wifi, Shield, Clock, Sparkles } from 'lucide-react';

interface ServiceItem {
  icon: React.ReactNode;
  iconAnimClass: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  beaconColor: string;
  glowColor: string;
  accentBorder: string;
  iconBg: string;
  highlightText: string;
}

export const ServicesSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const services: ServiceItem[] = [
    {
      icon: <Armchair className="w-6 h-6 text-blue-600 transition-transform duration-300" />,
      iconAnimClass: 'service-anim-armchair',
      title: 'Premium Seating',
      description:
        'Enjoy extra legroom, luxury reclining seats, personal entertainment screens, and climate control on every route.',
      badge: 'Luxury Comfort',
      badgeColor: 'bg-blue-50/90 text-blue-700 border-blue-200 shadow-sm shadow-blue-500/10',
      beaconColor: 'bg-blue-500',
      glowColor: 'from-blue-500/15 via-blue-400/5 to-transparent',
      accentBorder: 'hover:border-blue-400/80 hover:shadow-blue-500/10',
      iconBg: 'bg-blue-50/80 border-blue-100 group-hover:bg-blue-600/10 group-hover:border-blue-300',
      highlightText: 'Ergonomic 160° Recline',
    },
    {
      icon: <Wifi className="w-6 h-6 text-indigo-600 transition-transform duration-300" />,
      iconAnimClass: 'service-anim-wifi',
      title: 'Free Wi-Fi & Charging',
      description:
        'Stay connected throughout your journey with complimentary high-speed Wi-Fi and USB power outlets at every seat.',
      badge: 'Always Connected',
      badgeColor: 'bg-indigo-50/90 text-indigo-700 border-indigo-200 shadow-sm shadow-indigo-500/10',
      beaconColor: 'bg-indigo-500',
      glowColor: 'from-indigo-500/15 via-indigo-400/5 to-transparent',
      accentBorder: 'hover:border-indigo-400/80 hover:shadow-indigo-500/10',
      iconBg: 'bg-indigo-50/80 border-indigo-100 group-hover:bg-indigo-600/10 group-hover:border-indigo-300',
      highlightText: 'Fast 5G Bandwidth',
    },
    {
      icon: <Shield className="w-6 h-6 text-pink-600 transition-transform duration-300" />,
      iconAnimClass: 'service-anim-shield',
      title: 'Safe & Secure Travel',
      description:
        'Equipped with live GPS tracking, emergency exits, and 24/7 CCTV monitoring for total passenger safety.',
      badge: 'Women-Friendly',
      badgeColor: 'bg-pink-50/90 text-pink-700 border-pink-200 shadow-sm shadow-pink-500/10',
      beaconColor: 'bg-pink-500',
      glowColor: 'from-pink-500/15 via-pink-400/5 to-transparent',
      accentBorder: 'hover:border-pink-400/80 hover:shadow-pink-500/10',
      iconBg: 'bg-pink-50/80 border-pink-100 group-hover:bg-pink-600/10 group-hover:border-pink-300',
      highlightText: '24/7 Monitored Rides',
    },
    {
      icon: <Clock className="w-6 h-6 text-amber-600 transition-transform duration-300" />,
      iconAnimClass: 'service-anim-clock',
      title: 'Punctual Service',
      description:
        'We maintain a 95%+ on-time departure & arrival performance record with live location tracking for peace of mind.',
      badge: '95%+ On-Time',
      badgeColor: 'bg-amber-50/90 text-amber-700 border-amber-200 shadow-sm shadow-amber-500/10',
      beaconColor: 'bg-amber-500',
      glowColor: 'from-amber-500/15 via-amber-400/5 to-transparent',
      accentBorder: 'hover:border-amber-400/80 hover:shadow-amber-500/10',
      iconBg: 'bg-amber-50/80 border-amber-100 group-hover:bg-amber-600/10 group-hover:border-amber-300',
      highlightText: 'Guaranteed Schedules',
    },
  ];

  return (
    <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 relative">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl" />
      </div>

      {/* Header section with left-alignment */}
      <div
        className="text-left space-y-2.5 transition-all duration-700 max-w-3xl"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>FIRST-CLASS EXPERIENCE</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          Why Travel With <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Dewmina Super Line</span>?
        </h2>
        <p className="text-slate-500 text-xs md:text-sm leading-relaxed">
          We combine cutting-edge technology with Sri Lanka’s finest hospitality to make every bus journey smooth, safe, and comfortable.
        </p>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {services.map((service, idx) => (
          <div
            key={idx}
            className="service-card-wrapper group rounded-2xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
              transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 120}ms`,
            }}
          >
            {/* Ambient colored backlight glow on hover */}
            <div
              className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-b ${service.glowColor} opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500 pointer-events-none -z-10`}
            />

            {/* Main Card */}
            <div
              className={`relative h-full bg-white p-6 rounded-2xl border border-slate-200/90 ${service.accentBorder} transition-all duration-300 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-xl overflow-hidden`}
            >
              {/* Shine beam sweep effect */}
              <div className="service-card-shine" />

              <div className="space-y-3.5">
                {/* Icon and Badge Header */}
                <div className="flex items-center justify-between">
                  <div
                    className={`p-3 rounded-xl border transition-all duration-300 ${service.iconBg} group-hover:scale-110 group-hover:shadow-sm`}
                  >
                    <div className={service.iconAnimClass}>
                      {service.icon}
                    </div>
                  </div>

                  {/* Pulsing Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${service.badgeColor} transition-transform duration-300 group-hover:scale-105`}
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className={`service-badge-beacon absolute inline-flex h-full w-full rounded-full ${service.beaconColor} opacity-75`} />
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${service.beaconColor}`} />
                    </span>
                    {service.badge}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors duration-200">
                  {service.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Bottom Micro Highlight Bar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-400 group-hover:text-slate-600 transition-colors">
                <span className="inline-block">{service.highlightText}</span>
                <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0">
                  →
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
