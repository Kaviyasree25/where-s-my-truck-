import React, { useState } from 'react';
import { api } from '../../services/api';
import { Play, AlertOctagon, Clock, AlertTriangle, CheckCircle2, RotateCcw, Loader2, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

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
    <div className="bg-white border-b border-slate-200 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
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
        {/* Feature 3: Sensor Match Simulation */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate Sensor Match', () => api.simulateSensorMatch('A42'))}
          className="flex items-center space-x-1.5 px-3 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition disabled:opacity-50 font-medium"
        >
          {loadingAction === 'Simulate Sensor Match' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span>Simulate Sensor Match</span>
        </button>

        {/* Feature 3: Location Mismatch Simulation */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate Location Mismatch', () => api.simulateSensorMismatch('A42'))}
          className="flex items-center space-x-1.5 px-3 py-1 rounded bg-red-500/20 text-red-700 border border-red-400 hover:bg-red-500/30 transition disabled:opacity-50 font-extrabold animate-pulse"
        >
          {loadingAction === 'Simulate Location Mismatch' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
          )}
          <span>Simulate Location Mismatch</span>
        </button>

        {/* Fail D04 */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate Dock Failure D04', () => api.simulateDockFailure('D04'))}
          className="flex items-center space-x-1.5 px-3 py-1 rounded bg-rose-500/20 text-red-600 border border-red-300 hover:bg-rose-500/30 transition disabled:opacity-50 font-medium"
        >
          {loadingAction === 'Simulate Dock Failure D04' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
          )}
          <span>Simulate Dock Failure (D04)</span>
        </button>

        {/* ETA Delay */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate ETA Delay', () => api.simulateETADelay('SHP-1005', 45))}
          className="flex items-center space-x-1.5 px-3 py-1 rounded bg-amber-500/20 text-amber-700 border border-amber-300 hover:bg-amber-500/30 transition disabled:opacity-50 font-medium"
        >
          {loadingAction === 'Simulate ETA Delay' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-700" />
          )}
          <span>Simulate ETA Delay (+45m)</span>
        </button>

        {/* Yard Congestion */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Simulate Yard Congestion', () => api.simulateYardCongestion())}
          className="flex items-center space-x-1.5 px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition disabled:opacity-50 font-medium"
        >
          {loadingAction === 'Simulate Yard Congestion' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span>Simulate Congestion (&gt;80%)</span>
        </button>

        {/* Reset Highway Routes */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Replay Truck Routes', () => api.resetRoutes())}
          className="flex items-center space-x-1.5 px-3 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition disabled:opacity-50 font-medium"
        >
          {loadingAction === 'Replay Truck Routes' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
          )}
          <span>Replay Truck Routes</span>
        </button>

        {/* Reset Demo State */}
        <button
          disabled={!!loadingAction}
          onClick={() => handleAction('Reset Demo State', () => api.resetDemo())}
          className="flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-100 transition disabled:opacity-50 font-medium"
        >
          {loadingAction === 'Reset Demo State' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>Reset Demo</span>
        </button>
      </div>
    </div>
  );
};
