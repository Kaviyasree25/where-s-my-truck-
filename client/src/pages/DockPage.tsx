import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { Dock, DockStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ReassignmentModal } from '../components/common/ReassignmentModal';
import {
  Building2,
  SquareStack,
  AlertOctagon,
  Wrench,
  CheckCircle2,
  Clock,
  Truck,
  RefreshCw,
} from 'lucide-react';

export const DockPage: React.FC = () => {
  const [docks, setDocks] = useState<Dock[]>([]);
  const [loading, setLoading] = useState(true);
  const [reassignmentData, setReassignmentData] = useState<any | null>(null);

  useEffect(() => {
    fetchDocks();

    const socket = getSocket();
    const onDockFailure = (payload: any) => {
      setReassignmentData(payload);
      fetchDocks();
    };

    socket.on('DOCK_FAILURE_EVENT', onDockFailure);
    socket.on('OPERATIONAL_STATE_CHANGED', fetchDocks);

    return () => {
      socket.off('DOCK_FAILURE_EVENT', onDockFailure);
      socket.off('OPERATIONAL_STATE_CHANGED', fetchDocks);
    };
  }, []);

  const fetchDocks = async () => {
    setLoading(true);
    try {
      const list = await api.getDocks();
      setDocks(list);
    } catch (err) {
      console.error('Failed to fetch docks:', err);
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
      fetchDocks();
    } catch (err: any) {
      alert(`Error updating dock status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Warehouse Dock Doors & Capability Management
          </h2>
          <p className="text-xs text-slate-400">
            Real-Time Operational Dock Status, Maintenance Locks & Inbound Unloading Bays
          </p>
        </div>
        <button
          onClick={fetchDocks}
          className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Docks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docks.map(dock => {
          const isBlocked = dock.status === 'BLOCKED';
          const isMaintenance = dock.status === 'MAINTENANCE';
          const isOccupied = dock.status === 'OCCUPIED' || dock.status === 'RESERVED';

          return (
            <div
              key={dock.id}
              className={`rounded-2xl border p-5 bg-white transition flex flex-col justify-between space-y-4 ${
                isBlocked
                  ? 'border-rose-500/50 bg-red-50'
                  : isMaintenance
                  ? 'border-amber-500/50 bg-amber-50'
                  : isOccupied
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold font-mono text-slate-900">{dock.id}</span>
                    <StatusBadge status={dock.status} type="dock" size="sm" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200">
                    {dock.dockType}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-800 mt-1">{dock.name}</h3>

                {/* Capabilities */}
                <div className="mt-3 flex items-center space-x-1.5 flex-wrap gap-y-1">
                  <span className="text-[10px] text-slate-400 font-mono">Capabilities:</span>
                  {dock.capabilities.map(cap => (
                    <span
                      key={cap}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-50 text-blue-600 border border-slate-200"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Assignment details */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
                {dock.currentTrailerId ? (
                  <>
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase">Assigned Trailer</span>
                      <span className="font-bold text-blue-600">{dock.currentTrailerId}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase">Shipment ID</span>
                      <span className="font-bold text-emerald-700">{dock.currentShipmentId}</span>
                    </div>
                  </>
                ) : isBlocked || isMaintenance ? (
                  <div className="text-red-600 text-xs">
                    {dock.maintenanceNotes || 'Dock out of operational service'}
                  </div>
                ) : (
                  <div className="text-emerald-700 text-xs text-center font-bold">
                    AVAILABLE FOR ALLOCATION
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2 text-xs">
                <span className="text-[10px] text-slate-400 font-mono">Operational Override:</span>
                <div className="flex space-x-1">
                  {dock.status !== 'AVAILABLE' && (
                    <button
                      onClick={() => handleStatusChange(dock.id, 'AVAILABLE')}
                      className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 rounded text-[11px] font-mono border border-emerald-300"
                    >
                      Set Available
                    </button>
                  )}
                  {dock.status !== 'BLOCKED' && (
                    <button
                      onClick={() => handleStatusChange(dock.id, 'BLOCKED')}
                      className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-red-600 rounded text-[11px] font-mono border border-red-300"
                    >
                      Block Dock
                    </button>
                  )}
                  {dock.status !== 'MAINTENANCE' && (
                    <button
                      onClick={() => handleStatusChange(dock.id, 'MAINTENANCE')}
                      className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 rounded text-[11px] font-mono border border-amber-300"
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

      {reassignmentData && (
        <ReassignmentModal
          data={reassignmentData}
          onClose={() => setReassignmentData(null)}
          onApproved={() => {
            setReassignmentData(null);
            fetchDocks();
          }}
        />
      )}
    </div>
  );
};
