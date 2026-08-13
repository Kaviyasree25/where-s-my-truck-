import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { YardState, YardSlot } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Grid,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Building2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const YardPage: React.FC = () => {
  const [yardState, setYardState] = useState<YardState | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<YardSlot | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchYardData();
  }, []);

  const fetchYardData = async () => {
    setLoading(true);
    try {
      const data = await api.getYardState();
      setYardState(data);
    } catch (err) {
      console.error('Failed to load yard state:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderZone = (zoneId: string, zoneTitle: string) => {
    if (!yardState) return null;
    const slots = yardState.slots.filter(s => s.zoneId === zoneId);

    return (
      <div key={zoneId} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <Grid className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{zoneTitle}</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {slots.filter(s => s.status === 'OCCUPIED').length} / {slots.length} Occupied
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {slots.map(slot => {
            const isOccupied = slot.status === 'OCCUPIED';
            return (
              <div
                key={slot.id}
                onClick={() => setSelectedSlot(slot)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isOccupied
                    ? slot.occupiedByTrailerId === 'TR-105'
                      ? 'bg-amber-50 border-amber-500/50 hover:border-amber-400 text-slate-900 shadow-lg'
                      : 'bg-blue-50 border-blue-200 hover:border-blue-300 text-slate-900'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700">
                    Slot {slot.id}
                  </span>
                  {isOccupied ? (
                    <Truck className={`w-4 h-4 ${slot.occupiedByTrailerId === 'TR-105' ? 'text-amber-700 animate-pulse' : 'text-blue-600'}`} />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
                  )}
                </div>

                <div className="mt-3">
                  {isOccupied ? (
                    <div>
                      <span className="text-xs font-bold font-mono text-blue-600 block">
                        {slot.occupiedByTrailerId}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {slot.trailerType} ({slot.dwellMinutes}m dwell)
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono text-emerald-700">AVAILABLE</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Visual Warehouse Yard Management
          </h2>
          <p className="text-xs text-slate-400">
            Real-Time Yard Zone Slots, Occupancy Threshold Monitoring & Staging Queue
          </p>
        </div>
        <button
          onClick={fetchYardData}
          className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Congestion Banner */}
      {yardState?.isCongested && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center space-x-3 text-amber-800">
          <AlertTriangle className="w-6 h-6 text-amber-700 animate-pulse flex-shrink-0" />
          <div className="text-xs font-mono">
            <span className="font-bold text-amber-700 uppercase block">
              WARNING: YARD CONGESTION THRESHOLD EXCEEDED ({yardState.occupancyPercent}%)
            </span>
            Occupancy capacity has crossed the 80% operational limit. Accelerate dock assignments and unloading velocity.
          </div>
        </div>
      )}

      {/* Stats Summary Bar */}
      {yardState && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Total Yard Capacity</span>
            <span className="text-xl font-bold text-slate-900">{yardState.totalSlots} Slots</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Occupied Slots</span>
            <span className="text-xl font-bold text-blue-600">{yardState.occupiedSlots} Occupied</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Available Buffer</span>
            <span className="text-xl font-bold text-emerald-700">{yardState.availableSlots} Slots</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Total Occupancy</span>
            <span className={`text-xl font-bold ${yardState.occupancyPercent >= 80 ? 'text-amber-700' : 'text-slate-900'}`}>
              {yardState.occupancyPercent}%
            </span>
          </div>
        </div>
      )}

      {/* Zones Grid */}
      <div className="space-y-6">
        {renderZone('ZONE_A', 'Zone A — Inbound Dry & High Volume Staging')}
        {renderZone('ZONE_B', 'Zone B — Refrigerated & Cold-Chain Buffer')}
        {renderZone('ZONE_C', 'Zone C — Overflow & Hazmat Staging')}
      </div>

      {/* Slot Trailer Detail Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-white/30 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Yard Slot {selectedSlot.id} Details
              </h3>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-slate-400 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            {selectedSlot.status === 'OCCUPIED' ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase">Parked Trailer</span>
                  <span className="text-base font-bold text-blue-600">
                    {selectedSlot.occupiedByTrailerId}
                  </span>
                  <span className="text-slate-700 block mt-1">
                    Load Type: {selectedSlot.trailerType} | Dwell: {selectedSlot.dwellMinutes} mins
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedSlot(null);
                      navigate(`/tracking`);
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-center"
                  >
                    Track Shipment
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSlot(null);
                      navigate(`/control-tower`);
                    }}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold flex items-center justify-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Smart Allocation</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-emerald-700">
                This yard slot is currently AVAILABLE.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
