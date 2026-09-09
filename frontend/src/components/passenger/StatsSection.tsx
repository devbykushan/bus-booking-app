import React, { useEffect, useState, useRef } from 'react';
import { Bus, Users, MapPin, ShieldCheck } from 'lucide-react';

interface StatItem {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const StatsSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const stats: StatItem[] = [
    {
      icon: <Bus className="w-6 h-6 text-blue-500" />,
      value: 150,
      suffix: '+',
      label: 'Daily Intercity Trips',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      icon: <Users className="w-6 h-6 text-indigo-500" />,
      value: 12500,
      suffix: '+',
      label: 'Happy Travelers',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
    {
      icon: <MapPin className="w-6 h-6 text-amber-500" />,
      value: 25,
      suffix: '+',
      label: 'Cities & Towns Covered',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-pink-500" />,
      value: 50,
      suffix: '+',
      label: 'Modern Luxury Buses',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
    },
  ];

  return (
    <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} stat={stat} isVisible={isVisible} />
        ))}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ stat: StatItem; isVisible: boolean }> = ({ stat, isVisible }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const end = stat.value;
    const duration = 1500;
    const stepTime = Math.max(Math.floor(duration / (end || 1)), 16);

    const timer = setInterval(() => {
      start += Math.ceil(end / 40);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isVisible, stat.value]);

  return (
    <div
      className={`relative bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-2xl p-5 
                  flex flex-col items-center justify-center text-center shadow-xs hover:shadow-md 
                  transition-all duration-500 ease-out transform group
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-slate-50/50 dark:from-slate-800 dark:to-slate-900/50 rounded-2xl pointer-events-none" />
      
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 ${stat.bgColor} ${stat.color} dark:bg-slate-700/50 shadow-sm border ${stat.borderColor} dark:border-slate-600 relative`}>
        <div className="absolute inset-0 rounded-2xl bg-white/40 dark:bg-black/20" />
        <div className="relative z-10">{stat.icon}</div>
      </div>
      
      <div className="flex items-baseline gap-0.5 mb-1 relative z-10">
        <span className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tight ${stat.color} dark:text-white drop-shadow-sm`}>
          {count.toLocaleString()}
        </span>
        <span className={`text-xl sm:text-2xl font-bold ${stat.color} dark:text-slate-300`}>{stat.suffix}</span>
      </div>
      
      <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 relative z-10">{stat.label}</span>
    </div>
  );
};
