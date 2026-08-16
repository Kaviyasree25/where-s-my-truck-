import React, { useState } from 'react';
import { api } from '../../services/api';
import {
  RotateCcw,
  AlertOctagon,
  Clock,
  AlertTriangle,
  Loader2,
  Snowflake,
} from 'lucide-react';

interface DemoBarProps {
  onSimulationTriggered?: () => void;
}

export const DemoBar: React.FC<DemoBarProps> = ({ onSimulationTriggered }) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAction = async (name: string, fn: () => Promise<any>) => {
    setLoadingAction(name);
    setMessage(null);
    try {
      await fn();
      setMessage(`Action executed: ${name}`);
      if (onSimulationTriggered) onSimulationTriggered();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoadingAction(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="mb-2 sm:mb-3 rounded-2xl bg-white border border-slate-200/90 px-3 sm:px-5 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs shadow-2xs overflow-hidden">
      <div className="flex items-center space-x-2 shrink-0">
        <span className="font-mono text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 shrink-0">
          DEMO SIMULATION
        </span>
        {message && (
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-fade-in truncate max-w-[200px] sm:max-w-none">
            {message}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 shrink-0 no-scrollbar">
        {/* 1. Replay Truck Routes */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Replay Truck Routes', () => api.resetRoutes())}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition disabled:opacity-50 font-semibold cursor-pointer shrink-0 text-[11px] sm:text-xs"
        >
          {loadingAction === 'Replay Truck Routes' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
          )}
          <span>Replay Routes</span>
        </button>

        {/* 2. Simulate Dock Failure */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate Dock Failure', () => api.simulateDockFailure('D04'))}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50 font-semibold cursor-pointer shrink-0 text-[11px] sm:text-xs"
        >
          {loadingAction === 'Simulate Dock Failure' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
          )}
          <span>Dock Failure</span>
        </button>

        {/* 3. Simulate ETA Delay */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate ETA Delay', () => api.simulateETADelay('SHP-1005', 45))}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-50 font-semibold cursor-pointer shrink-0 text-[11px] sm:text-xs"
        >
          {loadingAction === 'Simulate ETA Delay' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-700" />
          )}
          <span>ETA Delay</span>
        </button>

        {/* 4. Simulate Congestion */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate Congestion', () => api.simulateYardCongestion())}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50 font-semibold cursor-pointer shrink-0 text-[11px] sm:text-xs"
        >
          {loadingAction === 'Simulate Congestion' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span>Yard Congestion</span>
        </button>

        {/* 5. Simulate Cryo Preemption */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate Cryo Preemption', () => api.simulatePreemption())}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100 transition disabled:opacity-50 font-bold cursor-pointer shrink-0 text-[11px] sm:text-xs"
        >
          {loadingAction === 'Simulate Cryo Preemption' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Snowflake className="w-3.5 h-3.5 text-cyan-600" />
          )}
          <span>Cryo Preempt</span>
        </button>

        {/* Reset Demo State */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Reset Demo State', () => api.resetDemo())}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition disabled:opacity-50 font-medium cursor-pointer shrink-0 text-[11px] sm:text-xs"
        >
          {loadingAction === 'Reset Demo State' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          )}
          <span>Reset Demo</span>
        </button>
      </div>
    </div>
  );
};
