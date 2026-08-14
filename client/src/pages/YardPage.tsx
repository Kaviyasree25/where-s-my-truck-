import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { YardState, YardSlot, MLRecommendationResponse } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { MLRecommendationBadge } from '../components/common/MLRecommendationBadge';
import {
  Grid,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Building2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Cpu,
} from 'lucide-react';

export const YardPage: React.FC = () => {
  const [yardState, setYardState] = useState<YardState | null>(null);
  const [mlRec, setMlRec] = useState<MLRecommendationResponse | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<YardSlot | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchYardData();

    const socket = getSocket();
    const handleUpdate = () => fetchYardData();

    const onRecsUpdated = (payload: any) => {
      if (payload?.recommendations && payload.recommendations.length > 0) {
        setMlRec(payload.recommendations[0]);
      }
      fetchYardData();
    };

    socket.on('OPERATIONAL_STATE_CHANGED', handleUpdate);
    socket.on('DEMO_RESET_EVENT', handleUpdate);
    socket.on('SENSOR_MATCH_EVENT', handleUpdate);
    socket.on('SENSOR_MISMATCH_EVENT', handleUpdate);
    socket.on('RECOMMENDATIONS_UPDATED', onRecsUpdated);

    return () => {
      socket.off('OPERATIONAL_STATE_CHANGED', handleUpdate);
      socket.off('DEMO_RESET_EVENT', handleUpdate);
      socket.off('SENSOR_MATCH_EVENT', handleUpdate);
      socket.off('SENSOR_MISMATCH_EVENT', handleUpdate);
      socket.off('RECOMMENDATIONS_UPDATED', onRecsUpdated);
    };
  }, []);

  const fetchYardData = async () => {
    setLoading(true);
    try {
      const [data, recData] = await Promise.all([
        api.getYardState(),
        api.getMLRecommendation('TR-106'),
      ]);
      setYardState(data);
      setMlRec(recData);
    } catch (err) {
      console.error('Failed to load yard state:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveMismatch = async (slotId: string) => {
    try {
      await api.simulateSensorMatch(slotId);
      await fetchYardData();
      if (selectedSlot?.id === slotId) {
        setSelectedSlot(prev => prev ? { ...prev, locationValidationStatus: 'VERIFIED', yardMuleTrailerId: prev.sensorTrailerId } : null);
      }
    } catch (err) {
      console.error('Failed to resolve location mismatch:', err);
    }
  };

  const mismatchedSlot = yardState?.slots.find(s => s.locationValidationStatus === 'MISMATCH');

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
            const isMismatch = slot.locationValidationStatus === 'MISMATCH';

            return (
              <div
                key={slot.id}
                onClick={() => setSelectedSlot(slot)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                  isMismatch
                    ? 'bg-red-50 border-red-500/80 hover:border-red-600 text-slate-900 shadow-xl animate-pulse'
                    : isOccupied
                    ? slot.occupiedByTrailerId === 'TR-106'
                      ? 'bg-amber-50 border-amber-500/50 hover:border-amber-400 text-slate-900 shadow-lg'
                      : 'bg-blue-50 border-blue-200 hover:border-blue-300 text-slate-900'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-700">
                    Slot {slot.id}
                  </span>
                  {isMismatch ? (
                    <ShieldAlert className="w-4 h-4 text-red-600 animate-bounce" />
                  ) : isOccupied ? (
                    <Truck className={`w-4 h-4 ${slot.occupiedByTrailerId === 'TR-106' ? 'text-amber-700 animate-pulse' : 'text-blue-600'}`} />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
                  )}
                </div>

                <div className="mt-3">
                  {isOccupied ? (
                    <div className="space-y-1">
                      <span className="text-xs font-bold font-mono text-blue-600 block">
                        {slot.occupiedByTrailerId}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {slot.trailerType} ({slot.dwellMinutes || 112}m dwell)
                      </span>

                      {/* Feature 3 Sensor Signals Badge */}
                      <div className="pt-1.5 border-t border-slate-200/60 mt-1">
                        {isMismatch ? (
                          <div className="bg-red-100 border border-red-300 text-red-800 p-1 rounded text-[9px] font-mono font-bold flex items-center justify-between">
                            <span className="flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              <span>MISMATCH</span>
                            </span>
                            <span>Mule: {slot.yardMuleTrailerId}</span>
                          </div>
                        ) : (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-1 rounded text-[9px] font-mono flex items-center justify-between">
                            <span className="flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>VERIFIED</span>
                            </span>
                            <span className="text-[8px] text-slate-400">IoT+RTLS+Mule</span>
                          </div>
                        )}
                      </div>
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
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Visual Warehouse Yard Management
            </h2>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px] border border-blue-200 flex items-center space-x-1">
              <Cpu className="w-3 h-3 text-blue-600 animate-pulse" />
              <span>AUTOMATED YARD MODEL</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-Time Yard Zone Slots, ML Slot Recommendations & IoT/RTLS Location Validation
          </p>
        </div>
        <button
          onClick={fetchYardData}
          className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* AUTOMATED ML YARD SLOT RECOMMENDATION BANNER */}
      {mlRec && (
        <MLRecommendationBadge
          recommendation={mlRec}
          type="YARD"
        />
      )}

      {/* FEATURE 3: Location Mismatch Exception Banner */}
      {mismatchedSlot && (
        <div className="bg-red-500/10 border-2 border-red-500 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-red-900 shadow-xl animate-fade-in">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5 animate-bounce" />
            <div className="text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-red-700 uppercase tracking-wider text-sm">
                  ⚠ YARD LOCATION MISMATCH DETECTED
                </span>
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  SEVERITY: HIGH
                </span>
              </div>
              <p className="mt-1 text-slate-800">
                Yard Slot <strong className="text-red-700 font-bold">{mismatchedSlot.id}</strong> sensor discrepancy:
                IoT Sensor & RTLS detect <strong className="text-slate-900">{mismatchedSlot.sensorTrailerId || 'TR-106'}</strong>, but Yard Mule telematics confirmed <strong className="text-red-700">{mismatchedSlot.yardMuleTrailerId || 'TR-107'}</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleResolveMismatch(mismatchedSlot.id)}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs font-mono flex items-center space-x-1.5 transition flex-shrink-0 shadow-md"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Resolve Mismatch (Confirm {mismatchedSlot.sensorTrailerId || 'TR-106'})</span>
          </button>
        </div>
      )}

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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Grid className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                  Yard Slot {selectedSlot.id} Details & Sensors
                </h3>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-slate-400 hover:text-slate-900 text-base"
              >
                ✕
              </button>
            </div>

            {selectedSlot.status === 'OCCUPIED' ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Parked Trailer</span>
                  <span className="text-lg font-black text-blue-700">
                    {selectedSlot.occupiedByTrailerId}
                  </span>
                  <span className="text-slate-700 block text-xs">
                    Load Type: {selectedSlot.trailerType} | Dwell Time: {selectedSlot.dwellMinutes || 112} mins
                  </span>
                </div>

                {/* Feature 3: Software-Simulated 3-Way Sensor Signals Comparison */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      <span>3-Way Software Sensor Signals</span>
                    </span>

                    {selectedSlot.locationValidationStatus === 'MISMATCH' ? (
                      <span className="px-2.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-300 font-extrabold flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>⚠ LOCATION MISMATCH</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>✓ LOCATION VERIFIED</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white border border-slate-200 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-semibold">1. IoT Ground Sensor</span>
                      <span className="font-bold text-blue-700">{selectedSlot.sensorTrailerId || selectedSlot.occupiedByTrailerId}</span>
                    </div>

                    <div className="p-2 bg-white border border-slate-200 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-semibold">2. RTLS Telematics</span>
                      <span className="font-bold text-blue-700">{selectedSlot.rtlsTrailerId || selectedSlot.occupiedByTrailerId}</span>
                    </div>

                    <div className={`p-2 bg-white border rounded-lg ${selectedSlot.locationValidationStatus === 'MISMATCH' ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}>
                      <span className="text-[10px] text-slate-400 block font-semibold">3. Yard Mule Scanner</span>
                      <span className={`font-bold ${selectedSlot.locationValidationStatus === 'MISMATCH' ? 'text-red-700 font-extrabold' : 'text-blue-700'}`}>
                        {selectedSlot.yardMuleTrailerId || selectedSlot.occupiedByTrailerId}
                      </span>
                    </div>
                  </div>

                  {selectedSlot.locationValidationStatus === 'MISMATCH' && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleResolveMismatch(selectedSlot.id)}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center justify-center space-x-1.5 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolve Mismatch (Confirm {selectedSlot.sensorTrailerId || 'TR-106'})</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSelectedSlot(null);
                      navigate(`/tracking`);
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-center"
                  >
                    Track Shipment
                  </button>
                  <button
                    onClick={() => {
                      setSelectedSlot(null);
                      navigate(`/control-tower`);
                    }}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Smart Allocation</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-emerald-700 font-bold">
                This yard slot is currently AVAILABLE.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

