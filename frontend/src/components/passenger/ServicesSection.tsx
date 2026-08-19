import React from 'react';
import { Armchair, Wifi, Shield, Clock } from 'lucide-react';

interface ServiceItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
}

export const ServicesSection: React.FC = () => {
  const services: ServiceItem[] = [
    {
      icon: <Armchair className="w-6 h-6 text-blue-600" />,
      title: 'Premium Seating',
      description:
        'Enjoy extra legroom, luxury reclining seats, personal entertainment screens, and climate control on every route.',
      badge: 'Luxury Comfort',
      badgeColor: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      icon: <Wifi className="w-6 h-6 text-indigo-600" />,
      title: 'Free Wi-Fi & Charging',
      description:
        'Stay connected throughout your journey with complimentary high-speed Wi-Fi and USB power outlets at every seat.',
      badge: 'Always Connected',
      badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    },
    {
      icon: <Shield className="w-6 h-6 text-pink-600" />,
      title: 'Safe & Secure Travel',
      description:
        'Equipped with live GPS tracking, emergency exits, CCTV monitoring, and dedicated Solo Female seat reservations.',
      badge: 'Women-Friendly',
      badgeColor: 'bg-pink-50 text-pink-600 border-pink-200',
    },
    {
      icon: <Clock className="w-6 h-6 text-amber-600" />,
      title: 'Punctual Service',
      description:
        'We maintain a 95%+ on-time departure & arrival performance record with live location tracking for peace of mind.',
      badge: '95%+ On-Time',
      badgeColor: 'bg-amber-50 text-amber-600 border-amber-200',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
          Why Travel With <span className="text-blue-600">Dewmina Super Line</span>?
        </h2>
        <p className="text-slate-500 text-xs md:text-sm max-w-xl mx-auto">
          We combine cutting-edge technology with Sri Lanka’s finest hospitality to make every bus journey smooth, safe, and comfortable.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {services.map((service, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all duration-300 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  {service.icon}
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${service.badgeColor}`}>
                  {service.badge}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {service.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {service.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
