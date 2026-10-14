import React from 'react';

export default function Logo({ size = 'md', showText = true, lightText = false }) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Emblem SVG */}
      <div className={`relative ${iconSizes[size] || iconSizes.md} shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="pharmacyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="crossGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </linearGradient>
          </defs>

          {/* Rounded Shield Background */}
          <rect x="8" y="8" width="84" height="84" rx="24" fill="url(#pharmacyGradient)" />
          
          {/* Subtle Outer Ring */}
          <rect x="12" y="12" width="76" height="76" rx="20" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />

          {/* Medical Cross */}
          <path
            d="M42 26 H58 V42 H74 V58 H58 V74 H42 V58 H26 V42 H42 Z"
            fill="url(#crossGradient)"
          />

          {/* Mortar & Pestle / Heart Pulse Emblem Accent */}
          <path
            d="M34 50 Q50 38 66 50 Q50 62 34 50 Z"
            fill="#047857"
            opacity="0.85"
          />
          <circle cx="50" cy="50" r="5" fill="#ffffff" />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight ${textSizes[size] || textSizes.md} ${lightText ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              Aaush <span className="text-sky-500">pharmacy</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
              Rx
            </span>
          </div>
          <p className={`text-[9px] font-extrabold tracking-wider uppercase ${lightText ? 'text-sky-200' : 'text-slate-500 dark:text-slate-400'}`}>
            Grocery, Bookshop & Health Medi Care
          </p>
        </div>
      )}
    </div>
  );
}
