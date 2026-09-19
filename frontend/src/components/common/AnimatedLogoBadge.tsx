import React from 'react';

interface AnimatedLogoBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedLogoBadge: React.FC<AnimatedLogoBadgeProps> = ({
  className = '',
  size = 'md',
}) => {
  const heightClass = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-12 md:h-14' : 'h-9 md:h-11';

  return (
    <div
      className={`relative inline-flex items-center justify-center transition-all duration-300 group cursor-pointer select-none bg-transparent ${className}`}
    >
      <img
        src="/dewmina-logo.png?v=3"
        alt="Dewmina Super Line"
        loading="eager"
        decoding="async"
        className={`${heightClass} w-auto object-contain transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]`}
      />
    </div>
  );
};

