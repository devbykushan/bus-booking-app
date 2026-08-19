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
    <div ref={sectionRef} className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      className={`bg-white p-5 rounded-2xl border ${stat.borderColor} ${stat.bgColor} flex flex-col items-center text-center space-y-2 hover:scale-[1.02] transition-all duration-300 shadow-sm`}
    >
      <div className={`p-3 rounded-xl ${stat.bgColor} border ${stat.borderColor}`}>
        {stat.icon}
      </div>
      <div className="space-y-0.5">
        <h4 className={`text-2xl md:text-3xl font-extrabold font-mono tracking-tight ${stat.color}`}>
          {count.toLocaleString()}{stat.suffix}
        </h4>
        <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
      </div>
    </div>
  );
};
