import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  sublabel?: string;
  variant?: 'primary' | 'white' | 'slate' | 'gradient';
  fullScreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label,
  sublabel,
  variant = 'primary',
  fullScreen = false,
  className = ''
}) => {
  const sizeMap = {
    xs: { dim: 16, stroke: 2.5, text: 'text-[11px]', gap: 'gap-1.5' },
    sm: { dim: 24, stroke: 3, text: 'text-xs', gap: 'gap-2' },
    md: { dim: 36, stroke: 3.5, text: 'text-sm', gap: 'gap-3' },
    lg: { dim: 48, stroke: 4, text: 'text-base', gap: 'gap-3.5' },
    xl: { dim: 64, stroke: 4.5, text: 'text-lg', gap: 'gap-4' },
  };

  const currentSize = sizeMap[size];

  const variantColors = {
    primary: {
      track: 'rgba(12, 102, 228, 0.12)',
      ring: '#0c66e4',
      gradientId: 'spinner-grad-primary',
      stop1: '#0c66e4',
      stop2: '#38bdf8',
      text: 'text-gray-800',
      subtext: 'text-gray-500'
    },
    white: {
      track: 'rgba(255, 255, 255, 0.2)',
      ring: '#ffffff',
      gradientId: 'spinner-grad-white',
      stop1: '#ffffff',
      stop2: '#e0f2fe',
      text: 'text-white',
      subtext: 'text-white/80'
    },
    slate: {
      track: 'rgba(100, 116, 139, 0.15)',
      ring: '#475569',
      gradientId: 'spinner-grad-slate',
      stop1: '#475569',
      stop2: '#94a3b8',
      text: 'text-slate-700',
      subtext: 'text-slate-400'
    },
    gradient: {
      track: 'rgba(99, 102, 241, 0.12)',
      ring: '#6366f1',
      gradientId: 'spinner-grad-gradient',
      stop1: '#6366f1',
      stop2: '#ec4899',
      text: 'text-gray-900',
      subtext: 'text-gray-500'
    }
  };

  const colors = variantColors[variant];
  const radius = (currentSize.dim - currentSize.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * 0.3; // 70% arc

  const spinnerSvg = (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={currentSize.dim}
        height={currentSize.dim}
        viewBox={`0 0 ${currentSize.dim} ${currentSize.dim}`}
        className="animate-spin"
        style={{ animationDuration: '0.85s', animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <defs>
          <linearGradient id={colors.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.stop1} />
            <stop offset="100%" stopColor={colors.stop2} />
          </linearGradient>
        </defs>

        {/* Background Track Ring */}
        <circle
          cx={currentSize.dim / 2}
          cy={currentSize.dim / 2}
          r={radius}
          fill="none"
          stroke={colors.track}
          strokeWidth={currentSize.stroke}
        />

        {/* Animated Active Arc */}
        <circle
          cx={currentSize.dim / 2}
          cy={currentSize.dim / 2}
          r={radius}
          fill="none"
          stroke={`url(#${colors.gradientId})`}
          strokeWidth={currentSize.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Inner pulsating dot for medium, large and xl sizes */}
      {(size === 'lg' || size === 'xl') && (
        <div 
          className="absolute rounded-full animate-ping opacity-40"
          style={{
            width: currentSize.dim * 0.25,
            height: currentSize.dim * 0.25,
            backgroundColor: colors.stop1,
            animationDuration: '1.6s'
          }}
        />
      )}
    </div>
  );

  const content = (
    <div className={`inline-flex flex-col items-center justify-center ${currentSize.gap} ${className}`}>
      {spinnerSvg}
      {label && (
        <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
          <span className={`font-semibold ${currentSize.text} ${colors.text} tracking-tight`}>
            {label}
          </span>
          {sublabel && (
            <span className={`text-[11px] ${colors.subtext} mt-0.5 font-normal`}>
              {sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f4f5f7]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white/95 rounded-2xl shadow-xl border border-gray-200/80 p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4 text-center">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
