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
    <div className="mx-3 mt-2 rounded-2xl bg-white border border-slate-200/90 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs shrink-0">
      <div className="flex items-center space-x-2">
        <span className="font-mono text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          DEMO SIMULATION TOOLBAR
        </span>
        {message && (
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 animate-fade-in">
            {message}
          </span>
        )}
      </div>

      <div className="flex items-center space-x-2 flex-wrap gap-y-2">
        {/* 1. Replay Truck Routes */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Replay Truck Routes', () => api.resetRoutes())}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition disabled:opacity-50 font-semibold cursor-pointer"
        >
          {loadingAction === 'Replay Truck Routes' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
          )}
          <span>Replay Truck Routes</span>
        </button>

        {/* 2. Simulate Dock Failure */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate Dock Failure', () => api.simulateDockFailure('D04'))}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50 font-semibold cursor-pointer"
        >
          {loadingAction === 'Simulate Dock Failure' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
          )}
          <span>Simulate Dock Failure</span>
        </button>

        {/* 3. Simulate ETA Delay */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate ETA Delay', () => api.simulateETADelay('SHP-1005', 45))}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition disabled:opacity-50 font-semibold cursor-pointer"
        >
          {loadingAction === 'Simulate ETA Delay' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-700" />
          )}
          <span>Simulate ETA Delay</span>
        </button>

        {/* 4. Simulate Congestion */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate Congestion', () => api.simulateYardCongestion())}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50 font-semibold cursor-pointer"
        >
          {loadingAction === 'Simulate Congestion' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span>Simulate Congestion</span>
        </button>

        {/* 5. Simulate Cryo Preemption */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate Cryo Preemption', () => api.simulatePreemption())}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100 transition disabled:opacity-50 font-bold cursor-pointer"
        >
          {loadingAction === 'Simulate Cryo Preemption' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Snowflake className="w-3.5 h-3.5 text-cyan-600" />
          )}
          <span>Simulate Cryo</span>
        </button>

        {/* Reset Demo State */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Reset Demo State', () => api.resetDemo())}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition disabled:opacity-50 font-medium cursor-pointer"
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
