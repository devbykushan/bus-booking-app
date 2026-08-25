import React, { useRef, useEffect, useState } from 'react';

interface AnimatedLogoBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedLogoBadge: React.FC<AnimatedLogoBadgeProps> = ({
  className = '',
  size = 'md',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const heightClass = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-12 md:h-14' : 'h-9 md:h-11';

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let animId: number;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Target dimensions for high resolution 16:9
    canvas.width = 640;
    canvas.height = 360;

    const render = () => {
      if (video.readyState >= 2 && ctx && !video.paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const width = canvas.width;
        const height = canvas.height;
        const len = data.length;

        // Force transparent perimeter margins (prevents any box borders)
        const marginX = width * 0.06;
        const marginY = height * 0.06;

        for (let i = 0; i < len; i += 4) {
          const pixelIndex = i / 4;
          const x = pixelIndex % width;
          const y = (pixelIndex / width) | 0;

          // Always clear outer edges to guarantee zero rectangular bounding box
          if (x < marginX || x > width - marginX || y < marginY || y > height - marginY) {
            data[i + 3] = 0;
            continue;
          }

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Chromatic difference: neutral studio grey vs colorful logo
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          const diff = maxC - minC;

          // Completely eliminate neutral grey/white/dark background
          if (diff < 22) {
            data[i + 3] = 0; // 100% transparent
          } else if (diff < 34) {
            // Soft antialiased feathering on edges
            const alphaFactor = (diff - 22) / 12;
            data[i + 3] = Math.round(data[i + 3] * Math.max(0, Math.min(1, alphaFactor)));
          }
        }

        ctx.putImageData(imgData, 0, 0);
        if (!isLoaded) setIsLoaded(true);
      }
      animId = requestAnimationFrame(render);
    };

    const handlePlay = () => {
      animId = requestAnimationFrame(render);
    };

    video.addEventListener('play', handlePlay);
    video.play().catch(() => {});
    animId = requestAnimationFrame(render);

    return () => {
      video.removeEventListener('play', handlePlay);
      cancelAnimationFrame(animId);
    };
  }, [isLoaded]);

  return (
    <div
      className={`relative inline-flex items-center justify-center transition-transform duration-300 group cursor-pointer select-none bg-transparent ${className}`}
    >
      {/* Hidden Source Video */}
      <video
        ref={videoRef}
        src="/dewmina-logo-anim.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="hidden"
      />

      {/* Fallback Static Logo during initial buffer */}
      {!isLoaded && (
        <img
          src="/dewmina-logo.png?v=3"
          alt="Dewmina Super Line"
          className={`${heightClass} w-auto object-contain transition-transform duration-300 group-hover:scale-105 mix-blend-multiply`}
        />
      )}

      {/* ── 100% Transparent Real-Time Keyed Canvas (No Box, No Border) ── */}
      <canvas
        ref={canvasRef}
        className={`${heightClass} w-auto object-contain transition-opacity duration-300 group-hover:scale-105 ${
          isLoaded ? 'opacity-100' : 'opacity-0 absolute'
        }`}
      />
    </div>
  );
};
