import React from 'react';

interface RealisticBusAnimationProps {
  className?: string;
}

export const RealisticBusAnimation: React.FC<RealisticBusAnimationProps> = ({
  className = '',
}) => {
  return (
    <div className={`relative flex items-center select-none pointer-events-none ${className}`}>
      {/* ── Sleek Motion Speed Trails ── */}
      <div className="flex flex-col gap-1 items-end mr-[-2px] opacity-80">
        <div className="w-14 sm:w-20 h-[1.5px] bg-gradient-to-l from-blue-400 via-cyan-400 to-transparent rounded-full shadow-[0_0_6px_#38bdf8]" />
        <div className="w-8 sm:w-12 h-[1px] bg-gradient-to-l from-red-500 to-transparent rounded-full shadow-[0_0_4px_#ef4444]" />
      </div>

      {/* ── Compact Sleek Modern Luxury Coach (56px x 22px) ── */}
      <div className="relative flex items-center">
        <svg
          width="56"
          height="22"
          viewBox="0 0 56 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="filter drop-shadow-[0_3px_8px_rgba(0,0,0,0.45)]"
        >
          <defs>
            {/* Coach Pearl White Body Gradient */}
            <linearGradient id="miniBody" x1="0" y1="0" x2="56" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e0e7ff" />
            </linearGradient>

            {/* Tinted Panoramic Glass Strip */}
            <linearGradient id="miniGlass" x1="0" y1="0" x2="0" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Dewmina Vibrant Blue Livery Stripe */}
            <linearGradient id="miniStripe" x1="0" y1="0" x2="56" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="70%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Underbody Shadow */}
          <ellipse cx="28" cy="20" rx="23" ry="1.5" fill="#000000" fillOpacity="0.4" filter="blur(1px)" />

          {/* Coach Main Body Aerodynamic Contour */}
          <path
            d="M 3 17 L 1.5 17 C 0.7 17 0 16.3 0 15.5 L 0 5 C 0 3 1.5 1.5 3.5 1.5 L 48 1.5 C 52 1.5 55 4.5 55.8 8.5 L 56 12 C 56 15 54.5 17 52 17 L 47 17 A 3.5 3.5 0 0 0 40 17 L 17 17 A 3.5 3.5 0 0 0 10 17 L 3 17 Z"
            fill="url(#miniBody)"
            stroke="#cbd5e1"
            strokeWidth="0.5"
          />

          {/* AC Unit on Roof */}
          <rect x="18" y="0.4" width="18" height="1.6" rx="0.8" fill="#e2e8f0" />

          {/* Windows Glass Strip */}
          <path
            d="M 2.5 3.2 C 2.5 2.6 3 2.2 3.5 2.2 L 46 2.2 C 49 2.2 51.5 4 52.3 7 L 53.5 11 L 2 11 L 2 3.7 C 2 3.4 2.2 3.2 2.5 3.2 Z"
            fill="url(#miniGlass)"
          />

          {/* Glass Metallic Separators */}
          <line x1="12" y1="2.2" x2="12" y2="11" stroke="#334155" strokeWidth="0.6" />
          <line x1="22" y1="2.2" x2="22" y2="11" stroke="#334155" strokeWidth="0.6" />
          <line x1="32" y1="2.2" x2="32" y2="11" stroke="#334155" strokeWidth="0.6" />
          <line x1="42" y1="2.2" x2="42" y2="11" stroke="#334155" strokeWidth="0.6" />

          {/* Windshield Reflection */}
          <path d="M 44 2.5 C 47 2.5 49.5 4.2 50.5 7 L 52.5 10.5 L 46 10.5 L 43 2.5 Z" fill="#38bdf8" fillOpacity="0.3" />

          {/* Blue Livery Wave Stripe */}
          <path
            d="M 1 13 Q 25 11.5 40 13.2 Q 50 14 55 12.5 L 55 14 Q 50 15.5 40 14.8 Q 25 13 1 14.5 Z"
            fill="url(#miniStripe)"
          />

          {/* Golden Accent Pin Line */}
          <path d="M 2 14.6 Q 25 13.4 45 15.2 L 45 15.6 Q 25 14.1 2 15.2 Z" fill="#f59e0b" />

          {/* Projector Headlight Point */}
          <circle cx="54.5" cy="12.8" r="1.1" fill="#ffffff" />
          <circle cx="54.5" cy="12.8" r="2.2" fill="#38bdf8" fillOpacity="0.4" />

          {/* Taillight (Ruby Glow) */}
          <rect x="0" y="10.5" width="1.2" height="4" rx="0.5" fill="#ef4444" />

          {/* Front Wheel */}
          <circle cx="43.5" cy="17" r="3.2" fill="#0f172a" />
          <circle cx="43.5" cy="17" r="1.8" fill="#94a3b8" />
          <circle cx="43.5" cy="17" r="0.7" fill="#0f172a" />

          {/* Rear Wheel */}
          <circle cx="13.5" cy="17" r="3.2" fill="#0f172a" />
          <circle cx="13.5" cy="17" r="1.8" fill="#94a3b8" />
          <circle cx="13.5" cy="17" r="0.7" fill="#0f172a" />
        </svg>

        {/* Subtle Mini Headlight Glow (Ahead) */}
        <div
          className="absolute left-[52px] top-1.5 w-14 h-5 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at left, rgba(254, 240, 138, 0.45) 0%, rgba(56, 189, 248, 0.15) 45%, transparent 80%)',
            clipPath: 'polygon(0% 40%, 100% 10%, 100% 90%, 0% 60%)',
            filter: 'blur(1px)',
          }}
        />
      </div>
    </div>
  );
};
