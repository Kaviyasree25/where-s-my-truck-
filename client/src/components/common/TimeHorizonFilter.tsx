import React from 'react';
import { TimeHorizon } from '../../types';
import { Radio } from 'lucide-react';

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
      className={`flex flex-wrap items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs font-sans ${className}`}
    >
      <div className="flex items-center space-x-2 px-2 text-xs font-mono font-bold text-slate-700">
        <span className="w-2 h-2 rounded-full bg-blue-600" />
        <span className="tracking-tight uppercase">Operations Timeline:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {horizons.map(h => {
          const isSelected = value === h.id || (value === 'ALL' && h.id === 'ALL');
          const count = counts ? counts[h.id] : undefined;

          return (
            <button
              key={h.id}
              onClick={() => onChange(h.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-extrabold'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {h.id === 'NOW' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
              <span>{h.label}</span>
              {count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                    isSelected
                      ? 'bg-blue-700 text-white'
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
