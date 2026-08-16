import React from 'react';
import { TimeHorizon } from '../../types';
import { useSlidingIndicator } from '../../hooks/useSlidingIndicator';

interface TimeHorizonFilterProps {
  value: TimeHorizon;
  onChange: (horizon: TimeHorizon) => void;
  counts?: Partial<Record<TimeHorizon, number>>;
  className?: string;
}

export const TimeHorizonFilter: React.FC<TimeHorizonFilterProps> = ({
  value,
  onChange,
  counts,
  className = '',
}) => {
  const { containerRef, indicatorStyle } = useSlidingIndicator(value);

  const horizons: {
    id: TimeHorizon;
    label: string;
    subLabel: string;
  }[] = [
    {
      id: 'NOW',
      label: 'LIVE NOW',
      subLabel: 'Active Bays',
    },
    {
      id: '1H',
      label: 'Next 1 Hr',
      subLabel: 'T+1h Turnover',
    },
    {
      id: '2H',
      label: 'Next 2 Hrs',
      subLabel: 'T+2h Forecast',
    },
    {
      id: '3H',
      label: 'Next 3 Hrs',
      subLabel: 'T+3h Late Shift',
    },
    {
      id: '4H',
      label: 'Next 4 Hrs',
      subLabel: 'T+4h Shift End',
    },
    {
      id: 'ALL',
      label: 'Full 24h Day',
      subLabel: '50 Trailers',
    },
  ];

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs font-sans min-w-0 max-w-full ${className}`}
    >
      <div className="flex items-center space-x-2 px-2 text-xs font-mono font-bold text-slate-700 shrink-0">
        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
        <span className="tracking-tight uppercase whitespace-nowrap">Operations Timeline:</span>
      </div>

      <div
        ref={containerRef}
        className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto min-w-0 max-w-full px-1 pb-1 sm:pb-1 shrink-0 no-scrollbar touch-pan-x relative"
      >
        {/* Single persistent sliding pill with zero distortion and perfect rounded corners */}
        <div
          className="absolute top-0 left-0 bg-blue-600 rounded-lg shadow-xs pointer-events-none transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.3,1)]"
          style={{
            transform: indicatorStyle.transform,
            width: `${indicatorStyle.width}px`,
            height: `${indicatorStyle.height}px`,
            opacity: indicatorStyle.opacity,
            willChange: 'transform, width',
          }}
        />

        {horizons.map(h => {
          const isSelected = value === h.id || (value === 'ALL' && h.id === 'ALL');
          const count = counts ? counts[h.id] : undefined;

          return (
            <button
              key={h.id}
              data-active={isSelected}
              onClick={() => onChange(h.id)}
              className={`relative flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 cursor-pointer select-none border-0 bg-transparent transition-colors duration-150 z-10 ${
                isSelected
                  ? 'text-white font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {h.id === 'NOW' && (
                <span className="relative z-10 flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
              <span className="relative z-10 whitespace-nowrap">{h.label}</span>
              {count !== undefined && (
                <span
                  className={`relative z-10 px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-blue-700/90 text-white'
                      : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TimeHorizonFilter;
