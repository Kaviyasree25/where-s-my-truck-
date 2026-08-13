import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { Exception, ExceptionSeverity } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
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
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Exceptions & Alert Operational Desk
          </h2>
          <p className="text-xs text-slate-400">
            Detected Supply Chain Exceptions, Dock Failures, Congestion & Resolution Workflows
          </p>
        </div>
        <button
          onClick={fetchExceptions}
          className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Severity Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <span className="text-xs font-mono font-bold text-slate-400 uppercase">
          Filter by Severity:
        </span>
        <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
                severityFilter === sev
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Exceptions List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-mono text-xs bg-white border border-slate-200 rounded-xl">
            No active exceptions matching severity filter.
          </div>
        ) : (
          filtered.map(ex => {
            const isActive = ex.status === 'ACTIVE';
            return (
              <div
                key={ex.id}
                className={`p-5 rounded-2xl border transition space-y-3 ${
                  isActive
                    ? ex.severity === 'CRITICAL'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                    : 'bg-white border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-sm text-slate-900">{ex.id}</span>
                    <StatusBadge status={ex.type} type="exception" size="sm" />
                    <StatusBadge status={ex.severity} type="risk" size="sm" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Detected: {new Date(ex.detectedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">{ex.title}</h3>
                  <p className="text-xs text-slate-700 font-mono mt-1">{ex.description}</p>
                </div>

                {ex.recommendedAction && (
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-blue-600 font-mono">
                    <span className="font-bold text-blue-600 uppercase text-[10px] block">
                      Recommended Action:
                    </span>
                    {ex.recommendedAction}
                  </div>
                )}

                {ex.resolutionDetails && (
                  <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-mono">
                    <span className="font-bold text-emerald-700 uppercase text-[10px] block">
                      Resolution Log:
                    </span>
                    {ex.resolutionDetails}
                  </div>
                )}

                {isActive && (
                  <div className="pt-2 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() => handleResolve(ex.id)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-mono transition flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
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
