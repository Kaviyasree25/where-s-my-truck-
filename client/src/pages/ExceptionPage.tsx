import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { Exception, ExceptionSeverity } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { useSlidingIndicator } from '../hooks/useSlidingIndicator';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const ExceptionPage: React.FC = () => {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Single persistent sliding pill positioning with zero distortion
  const { containerRef, indicatorStyle } = useSlidingIndicator(severityFilter);

  useEffect(() => {
    fetchExceptions();

    const socket = getSocket();
    socket.on('DOCK_FAILURE_EVENT', fetchExceptions);
    socket.on('OPERATIONAL_STATE_CHANGED', fetchExceptions);

    return () => {
      socket.off('DOCK_FAILURE_EVENT', fetchExceptions);
      socket.off('OPERATIONAL_STATE_CHANGED', fetchExceptions);
    };
  }, []);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const list = await api.getExceptions();
      setExceptions(list);
    } catch (err) {
      console.error('Failed to fetch exceptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.resolveException(id, 'Resolved via Operator Exception Desk');
      fetchExceptions();
    } catch (err: any) {
      alert(`Error resolving exception: ${err.message}`);
    }
  };

  const filtered = exceptions.filter(e =>
    severityFilter === 'ALL' ? true : e.severity === severityFilter
  );

  return (
    <div className="space-y-4 sm:space-y-6 font-sans">
      {/* Title & Stats */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Exceptions &amp; Alert Operational Desk
            </h2>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono font-bold text-[10px] border border-rose-200 flex items-center space-x-1 whitespace-nowrap shrink-0">
              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
              <span>{exceptions.filter(e => e.status === 'ACTIVE').length} ACTIVE</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Detected Supply Chain Exceptions, Dock Failures, Congestion &amp; Resolution Workflows
          </p>
        </div>
        <button
          onClick={fetchExceptions}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
          title="Refresh Exceptions"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Severity Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-600 uppercase shrink-0">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Filter by Severity:</span>
        </div>
        <div
          ref={containerRef}
          className="relative flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 overflow-x-auto w-full sm:w-auto no-scrollbar touch-pan-x"
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

          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => {
            const isActive = severityFilter === sev;
            return (
              <button
                key={sev}
                data-active={isActive}
                onClick={() => setSeverityFilter(sev)}
                className={`relative z-10 flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 cursor-pointer text-center select-none border-0 bg-transparent transition-colors duration-150 ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exceptions List */}
      <div className="space-y-3.5 sm:space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs bg-white border border-slate-200 rounded-2xl">
            No active exceptions matching severity filter.
          </div>
        ) : (
          filtered.map(ex => {
            const isActive = ex.status === 'ACTIVE';
            return (
              <div
                key={ex.id}
                className={`p-4 sm:p-5 rounded-2xl border transition space-y-3.5 shadow-xs ${
                  isActive
                    ? ex.severity === 'CRITICAL'
                      ? 'bg-rose-50/40 border-rose-200 ring-1 ring-rose-300/30'
                      : 'bg-amber-50/40 border-amber-200 ring-1 ring-amber-300/30'
                    : 'bg-white border-slate-200 opacity-70'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1">
                    <span className="font-mono font-black text-sm text-slate-900">{ex.id}</span>
                    <StatusBadge status={ex.type} type="exception" size="sm" />
                    <StatusBadge status={ex.severity} type="risk" size="sm" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 self-start sm:self-auto">
                    Detected: {new Date(ex.detectedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono tracking-tight">{ex.title}</h3>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">{ex.description}</p>
                </div>

                {ex.recommendedAction && (
                  <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/90 text-xs text-blue-900 space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold uppercase text-[10px] text-blue-700 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Recommended Action</span>
                    </div>
                    <p className="font-mono text-xs text-blue-950 leading-relaxed font-semibold">
                      {ex.recommendedAction}
                    </p>
                  </div>
                )}

                {ex.resolutionDetails && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                    <span className="font-bold text-emerald-800 uppercase text-[10px] font-mono block">
                      Resolution Log:
                    </span>
                    <p className="font-mono text-xs text-emerald-900 leading-relaxed">
                      {ex.resolutionDetails}
                    </p>
                  </div>
                )}

                {isActive && (
                  <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                    <button
                      onClick={() => handleResolve(ex.id)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Mark Resolved</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
