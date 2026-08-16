import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { Dock, DockStatus, TimeHorizon } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ReassignmentModal } from '../components/common/ReassignmentModal';
import { DockEditModal } from '../components/admin/DockEditModal';
import { TimeHorizonFilter } from '../components/common/TimeHorizonFilter';
import {
  Building2,
  Clock,
  Truck,
  RefreshCw,
  Sliders,
  Snowflake,
  Flame,
  Zap,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Calendar,
  AlertTriangle,
  Radio,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';

export const DockPage: React.FC = () => {
  const [docks, setDocks] = useState<any[]>([]);
  const [editingDock, setEditingDock] = useState<Dock | null>(null);
  const [loading, setLoading] = useState(true);
  const [reassignmentData, setReassignmentData] = useState<any | null>(null);
  const [horizon, setHorizon] = useState<TimeHorizon>('NOW');
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchDocks(horizon);

    const socket = getSocket();
    const onDockFailure = (payload: any) => {
      setReassignmentData(payload);
      fetchDocks(horizon);
    };

    socket.on('DOCK_FAILURE_EVENT', onDockFailure);
    socket.on('OPERATIONAL_STATE_CHANGED', () => fetchDocks(horizon));

    return () => {
      socket.off('DOCK_FAILURE_EVENT', onDockFailure);
      socket.off('OPERATIONAL_STATE_CHANGED', () => fetchDocks(horizon));
    };
  }, [horizon]);

  const fetchDocks = async (targetHorizon: TimeHorizon = horizon) => {
    setLoading(true);
    try {
      const list = await api.getDockSchedule(targetHorizon);
      setDocks(list);
    } catch (err) {
      console.error('Failed to fetch docks schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (dockId: string, newStatus: DockStatus) => {
    try {
      const res = await api.updateDockStatus(
        dockId,
        newStatus,
        newStatus === 'BLOCKED' ? 'Operator manually locked dock door' : 'Scheduled maintenance'
      );
      if (res.simResult) {
        setReassignmentData(res.simResult);
      }
      fetchDocks(horizon);
    } catch (err: any) {
      alert(`Error updating dock status: ${err.message}`);
    }
  };

  const handleTriggerPreemption = async () => {
    try {
      const res = await api.simulatePreemption();
      setSimulationNotice(res.message);
      fetchDocks(horizon);
      setTimeout(() => setSimulationNotice(null), 6000);
    } catch (err: any) {
      alert(`Error triggering preemption: ${err.message}`);
    }
  };

  const handleClearPreemption = async () => {
    try {
      await api.clearPreemption();
      setSimulationNotice('Preemption cleared. Returned to standard FIFO priority queue.');
      fetchDocks(horizon);
      setTimeout(() => setSimulationNotice(null), 4000);
    } catch (err: any) {
      alert(`Error clearing preemption: ${err.message}`);
    }
  };

  const handleTriggerDelay = async () => {
    try {
      await api.simulateETADelay('SHP-1003', 45);
      setSimulationNotice('Highway Delay (+45m) simulated on Interstate corridor. Dock schedule automatically rebalanced.');
      fetchDocks(horizon);
      setTimeout(() => setSimulationNotice(null), 5000);
    } catch (err: any) {
      console.error(err);
    }
  };

  const isLive = horizon === 'NOW' || horizon === 'ALL';
  const occupiedCount = docks.filter(d => d.status === 'OCCUPIED').length;

  return (
    <div className="space-y-5 font-sans">
      {/* Title & Edge Case Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Warehouse Dock Doors &amp; Cold-Chain Schedule
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200 whitespace-nowrap shrink-0">
              15 BAYS TOTAL
            </span>
            {isLive ? (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 flex items-center space-x-1 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-0.5 shrink-0" />
                <span className="whitespace-nowrap">LIVE TELEMETRY</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-200 flex items-center space-x-1 whitespace-nowrap shrink-0">
                <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
                <span className="whitespace-nowrap">+{horizon} FORECAST</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated Inbound Allocation, Multi-Horizon Shift Projections &amp; Dynamic Cold-Chain Preemption
          </p>
        </div>

        {/* Clean Light Edge Case Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTriggerPreemption}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-mono font-bold text-xs border border-amber-200 flex items-center space-x-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
            title="Simulate sub-zero cryo emergency preemption (bumps lower priority dry van to yard buffer)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="whitespace-nowrap">Simulate Cryo Preemption</span>
          </button>

          <button
            onClick={handleTriggerDelay}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-mono font-bold text-xs border border-slate-200 flex items-center space-x-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
            title="Simulate highway delay (+45m)"
          >
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="whitespace-nowrap">Simulate Delay (+45m)</span>
          </button>

          <button
            onClick={() => fetchDocks(horizon)}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer shadow-2xs shrink-0"
            title="Refresh Schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Simulation Feedback Notice */}
      {simulationNotice && (
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs font-mono text-amber-900 flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{simulationNotice}</span>
          </div>
          <button
            onClick={handleClearPreemption}
            className="text-[11px] font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer"
          >
            Reset Preemption
          </button>
        </div>
      )}

      {/* Clean Light Operations Timeline Navigation Bar */}
      <TimeHorizonFilter
        value={horizon}
        onChange={setHorizon}
        counts={{
          'NOW': 4,
          '1H': 9,
          '2H': 12,
          '3H': 11,
          '4H': 9,
          'ALL': 50,
        }}
      />

      {/* Clean Mode Banner */}
      {!isLive ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-blue-50/70 border border-blue-200/80 text-blue-950 rounded-2xl text-xs font-mono gap-2 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[11px]">+{horizon}</span>
            <div>
              <strong className="text-blue-900">FUTURE SHIFT PROJECTION (+{horizon}):</strong>{' '}
              <span className="text-slate-600">
                Displaying predicted dock door allocations and scheduled appointment windows for <strong>+{horizon === '1H' ? '1 Hour' : horizon === '2H' ? '2 Hours' : horizon === '3H' ? '3 Hours' : '4 Hours'}</strong>. Prior trucks have departed; upcoming scheduled arrivals are shown with their planned duration.
              </span>
            </div>
          </div>
          <button
            onClick={() => setHorizon('NOW')}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-3 py-1 rounded-lg border border-blue-200 cursor-pointer shadow-2xs self-start sm:self-auto shrink-0 transition"
          >
            ← Back to Live Real-Time
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-mono text-slate-700 shadow-2xs">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>
              <strong>LIVE REAL-TIME STREAM:</strong> Showing physical sensor telemetry across all 15 dock doors ({occupiedCount} active bays unloading).
            </span>
          </div>
        </div>
      )}

      {/* Docks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {docks.map(dock => {
          const isBlocked = dock.status === 'BLOCKED';
          const isMaintenance = dock.status === 'MAINTENANCE';
          const isOccupied = dock.status === 'OCCUPIED' || dock.status === 'RESERVED';
          const duration = dock.unloadingDurationMinutes || 45;
          const elapsed = dock.unloadingElapsedMinutes || 0;
          const percent = Math.min(100, Math.round((elapsed / duration) * 100));
          const freeIn = dock.freeInMinutes !== undefined ? dock.freeInMinutes : Math.max(0, duration - elapsed);

          const isCold = dock.dockType === 'REFRIGERATED';
          const hasDeepFreeze = dock.temperatureCapability?.includes('DEEP_FREEZE');
          const isPreempted = !!dock.isPreempted;

          return (
            <div
              key={dock.id}
              className={`rounded-2xl border p-4 bg-white transition flex flex-col justify-between space-y-3.5 shadow-xs hover:shadow-sm ${
                isPreempted
                  ? 'border-amber-300 bg-amber-50/30 ring-1 ring-amber-400/20'
                  : isBlocked
                  ? 'border-rose-300 bg-rose-50/30'
                  : isMaintenance
                  ? 'border-amber-300 bg-amber-50/30'
                  : isOccupied
                  ? !isLive
                    ? 'border-blue-200/80 bg-slate-50/30'
                    : isCold ? 'border-cyan-200 bg-cyan-50/20' : 'border-blue-200 bg-blue-50/20'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div>
                {/* Clean Responsive Header */}
                <div className="flex items-center justify-between gap-1.5 pb-1.5">
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="text-base font-black font-mono text-slate-900 shrink-0">{dock.id}</span>
                    <StatusBadge status={dock.status} type="dock" size="sm" />
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    {isCold && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center space-x-0.5 whitespace-nowrap shrink-0">
                        <Snowflake className="w-2.5 h-2.5 shrink-0" />
                        <span className="whitespace-nowrap">{hasDeepFreeze ? '-20°C Cryo' : '2-4°C Chill'}</span>
                      </span>
                    )}
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold uppercase whitespace-nowrap shrink-0">
                      {dock.dockType === 'REFRIGERATED' ? 'REEFER' : dock.dockType}
                    </span>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-slate-800 mt-0.5 line-clamp-1">{dock.name}</h3>

                {/* Capabilities */}
                <div className="mt-1.5 flex items-center space-x-1 flex-wrap gap-y-1">
                  <span className="text-[10px] text-slate-400 font-mono">Caps:</span>
                  {dock.capabilities.map((cap: string) => (
                    <span
                      key={cap}
                      className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-50 text-slate-700 border border-slate-200 font-bold whitespace-nowrap shrink-0"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Middle Section: LIVE ELAPSED vs FUTURE FORECAST SCHEDULE */}
              {isOccupied && dock.currentTrailerId ? (
                isLive ? (
                  /* ─── LIVE REAL-TIME: Progress Bar & Elapsed Timer ─── */
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between items-center text-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-black text-blue-700 whitespace-nowrap">{dock.currentTrailerId}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white text-slate-700 border-slate-200 shadow-2xs whitespace-nowrap shrink-0">
                        ⏱ Free in: {freeIn}m
                      </span>
                    </div>

                    {isPreempted && (
                      <div className="text-[10px] font-mono text-amber-800 bg-amber-100/70 p-1.5 rounded-md border border-amber-200 flex items-center space-x-1">
                        <Zap className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Prioritized over {dock.bumpedTrailerId} (bumped to {dock.bumpedToSlotId})</span>
                      </div>
                    )}

                    {/* Unloading Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Unloading: {elapsed}m / {duration}m</span>
                        <span className="font-bold text-blue-600">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-600 pt-0.5 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-400">Shipment:</span>
                      <span className="font-bold text-slate-700 truncate max-w-[150px]">{dock.currentShipmentId}</span>
                    </div>
                  </div>
                ) : (
                  /* ─── FUTURE HORIZON: Clean Scheduled Window Card ─── */
                  <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/80 space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1.5">
                        <Truck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span className="font-black text-slate-900 text-xs whitespace-nowrap">{dock.currentTrailerId}</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap shrink-0">
                        {dock.forecastStatus || 'SCHEDULED_UNLOAD'}
                      </span>
                    </div>

                    {/* Scheduled Window */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-y border-blue-200/60 text-slate-700">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Window</span>
                        <span className="font-bold text-blue-950 block">{dock.scheduledWindowStart || '15:00'}–{dock.scheduledWindowEnd || '15:45'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Duration</span>
                        <span className="font-bold text-slate-800 block">~{dock.unloadingDurationMinutes || 45} mins</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Carrier / Manifest:</span>
                      <span className="font-bold text-slate-700 truncate max-w-[130px]">{dock.currentShipment?.supplier || dock.currentTrailer?.carrierName || 'Scheduled Freight'}</span>
                    </div>
                  </div>
                )
              ) : isBlocked || isMaintenance ? (
                <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 text-rose-700 text-xs font-semibold py-2 flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{dock.maintenanceNotes || 'Dock out of operational service'}</span>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs text-center font-mono font-bold py-3">
                  ✨ AVAILABLE BUFFER IN THIS WINDOW
                </div>
              )}

              {/* Next Queued Trailer */}
              {dock.nextQueuedTrailerId && (
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold uppercase">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>Next In Line</span>
                    </span>
                    <span className="bg-white border border-slate-200 px-1.5 py-0.2 rounded text-slate-700 whitespace-nowrap shrink-0">
                      {isLive ? `in ~${dock.nextQueuedEtaMinutes || 25}m` : `Starts ${dock.nextQueuedScheduledStart || 'Next Shift'}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-800 text-[11px]">
                    <span className="font-black text-slate-900 whitespace-nowrap">{dock.nextQueuedTrailerId}</span>
                    <span className="text-[10px] text-slate-500 font-sans truncate max-w-[120px]">
                      {dock.nextQueuedShipment?.supplier || 'Next Inbound'}
                    </span>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => setEditingDock(dock)}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-mono border border-slate-200 font-bold flex items-center space-x-1.5 cursor-pointer transition shrink-0"
                  title="Configure capabilities"
                >
                  <Sliders className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="whitespace-nowrap">Configure</span>
                </button>

                <div className="flex space-x-1 shrink-0">
                  {dock.status !== 'AVAILABLE' && (
                    <button
                      onClick={() => handleStatusChange(dock.id, 'AVAILABLE')}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-mono border border-emerald-200 font-bold cursor-pointer transition whitespace-nowrap shrink-0"
                    >
                      Available
                    </button>
                  )}
                  {dock.status !== 'BLOCKED' && (
                    <button
                      onClick={() => handleStatusChange(dock.id, 'BLOCKED')}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-mono border border-rose-200 font-bold cursor-pointer transition whitespace-nowrap shrink-0"
                    >
                      Block
                    </button>
                  )}
                  {dock.status !== 'MAINTENANCE' && (
                    <button
                      onClick={() => handleStatusChange(dock.id, 'MAINTENANCE')}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-mono border border-amber-200 font-bold cursor-pointer transition whitespace-nowrap shrink-0"
                    >
                      Maint.
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dock Edit Modal */}
      {editingDock && (
        <DockEditModal
          dock={editingDock}
          onClose={() => setEditingDock(null)}
          onUpdated={() => {
            setEditingDock(null);
            fetchDocks(horizon);
          }}
        />
      )}

      {reassignmentData && (
        <ReassignmentModal
          data={reassignmentData}
          onClose={() => setReassignmentData(null)}
          onApproved={() => {
            setReassignmentData(null);
            fetchDocks(horizon);
          }}
        />
      )}
    </div>
  );
};

export default DockPage;
