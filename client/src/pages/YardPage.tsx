import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { YardState, YardSlot, MLRecommendationResponse, TimeHorizon } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { MLRecommendationBadge } from '../components/common/MLRecommendationBadge';
import { YardMoveModal } from '../components/admin/YardMoveModal';
import { TimeHorizonFilter } from '../components/common/TimeHorizonFilter';
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
  Navigation,
  Clock,
  Snowflake,
  ArrowRight,
  Flame,
  Calendar,
  Zap,
} from 'lucide-react';

export const YardPage: React.FC = () => {
  const [yardState, setYardState] = useState<YardState | null>(null);
  const [mlRec, setMlRec] = useState<MLRecommendationResponse | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [movingSlot, setMovingSlot] = useState<{ trailerId: string; slotId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState<TimeHorizon>('NOW');

  const navigate = useNavigate();

  useEffect(() => {
    fetchYardData(horizon);

    const socket = getSocket();
    const handleUpdate = () => fetchYardData(horizon);

    const onRecsUpdated = (payload: any) => {
      if (payload?.recommendations && payload.recommendations.length > 0) {
        setMlRec(payload.recommendations[0]);
      }
      fetchYardData(horizon);
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
  }, [horizon]);

  const fetchYardData = async (targetHorizon: TimeHorizon = horizon) => {
    setLoading(true);
    try {
      const [data, recData] = await Promise.all([
        api.getYardState(targetHorizon),
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
      await fetchYardData(horizon);
      if (selectedSlot?.id === slotId) {
        setSelectedSlot((prev: any) => prev ? { ...prev, locationValidationStatus: 'VERIFIED', yardMuleTrailerId: prev.sensorTrailerId } : null);
      }
    } catch (err) {
      console.error('Failed to resolve location mismatch:', err);
    }
  };

  const isLive = horizon === 'NOW' || horizon === 'ALL';
  const mismatchedSlot = yardState?.slots.find(s => s.locationValidationStatus === 'MISMATCH');

  const renderZone = (zoneId: string, zoneTitle: string, isColdZone: boolean = false) => {
    if (!yardState) return null;
    const slots = yardState.slots.filter(s => s.zoneId === zoneId);

    return (
      <div key={zoneId} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <Grid className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{zoneTitle}</h3>
            {isColdZone && (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center space-x-1">
                <Snowflake className="w-2.5 h-2.5" />
                <span>Cold Staging Plugs Active</span>
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-slate-500 font-bold">
            {slots.filter(s => s.status === 'OCCUPIED').length} / {slots.length} Staged
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {slots.map((slot: any) => {
            const isOccupied = slot.status === 'OCCUPIED';
            const isMismatch = slot.locationValidationStatus === 'MISMATCH';
            const trailer = slot.occupiedTrailer;
            const isReefer = slot.trailerType === 'REFRIGERATED' || trailer?.temperatureProfile === 'DEEP_FREEZE' || trailer?.temperatureProfile === 'REFRIGERATED_CHILL';
            const isPreemptedHolding = !!slot.isPreemptedHolding;

            return (
              <div
                key={slot.id}
                onClick={() => setSelectedSlot(slot)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md ${
                  isMismatch
                    ? 'bg-rose-50 border-rose-500 hover:border-rose-600 text-slate-900 animate-pulse'
                    : isPreemptedHolding
                    ? 'bg-amber-50 border-amber-400 text-slate-900'
                    : isOccupied
                    ? isReefer
                      ? 'bg-cyan-50/50 border-cyan-300 hover:border-cyan-400 text-slate-900'
                      : 'bg-blue-50/50 border-blue-200 hover:border-blue-300 text-slate-900'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold font-mono text-slate-900">
                        Slot {slot.id}
                      </span>
                      {isReefer && (
                        <span className="p-0.5 rounded bg-cyan-100 text-cyan-800" title="Reefer Staging">
                          <Snowflake className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {isMismatch ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600 animate-bounce" />
                    ) : isOccupied ? (
                      <Truck className={`w-4 h-4 ${isReefer ? 'text-cyan-700' : 'text-blue-600'}`} />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  <div className="mt-2.5">
                    {isOccupied ? (
                      <div className="space-y-1.5 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 block">
                            {slot.occupiedByTrailerId}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700">
                            {isLive ? `⏱ ${slot.dwellMinutes || 15}m dwell` : `Arr: ${slot.scheduledArrival || '15:10'}`}
                          </span>
                        </div>

                        {/* Cold-Chain Telemetry Tag */}
                        {isReefer && (
                          <div className="text-[10px] font-mono text-cyan-900 font-bold flex items-center justify-between bg-cyan-100/70 px-1.5 py-0.5 rounded-md border border-cyan-200">
                            <span>❄️ {trailer?.currentTempCelsius !== undefined ? `${trailer.currentTempCelsius}°C` : '-20.0°C Cryo'}</span>
                            <span className="text-[9px] text-cyan-700">Spoilage: {trailer?.spoilageRiskScore || 85}/100</span>
                          </div>
                        )}

                        {/* Target Next Dock Tag */}
                        {slot.targetDockId && (
                          <div className="text-[10px] font-mono font-bold bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded-md flex items-center justify-between border border-blue-200">
                            <span className="flex items-center space-x-1">
                              <ArrowRight className="w-2.5 h-2.5 text-blue-600" />
                              <span>Dock {slot.targetDockId}</span>
                            </span>
                            <span className="text-[9px] text-blue-700 font-normal">
                              {isLive ? `in ~${slot.targetDockEtaMinutes || 15}m` : `Transfer ${slot.targetTransferSchedule || '15:45'}`}
                            </span>
                          </div>
                        )}

                        {/* Sensor / Validation Badge */}
                        {isLive && (
                          <div className="pt-1 border-t border-slate-200/60 mt-1">
                            {isMismatch ? (
                              <div className="bg-rose-100 border border-rose-300 text-rose-800 p-1 rounded text-[9px] font-bold flex items-center justify-between">
                                <span className="flex items-center space-x-1">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                  <span>MISMATCH</span>
                                </span>
                                <span>Mule: {slot.yardMuleTrailerId}</span>
                              </div>
                            ) : (
                              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-0.5 rounded text-[8px] flex items-center justify-between">
                                <span className="flex items-center space-x-0.5">
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>VERIFIED</span>
                                </span>
                                <span className="text-[8px] text-slate-400">IoT+RTLS+Mule</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1 py-1 font-mono">
                        <span className="text-[11px] font-bold text-emerald-700 block">AVAILABLE BUFFER</span>
                        {slot.nextIncomingTrailerId && (
                          <div className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                            Reserved: <strong className="text-slate-800">{slot.nextIncomingTrailerId}</strong> (in {slot.nextIncomingEtaMinutes || 40}m)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Visual Warehouse Yard &amp; Staging Map
            </h2>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px] border border-blue-200 flex items-center space-x-1">
              <Cpu className="w-3 h-3 text-blue-600" />
              <span>COLD-CHAIN SMART STAGING</span>
            </span>
            {isLive ? (
              <span className="px-2 py-0.5 text-[10px] font-mono font-extrabold bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300">
                LIVE TELEMETRY
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-mono font-extrabold bg-purple-100 text-purple-800 rounded-md border border-purple-300">
                +{horizon} FORECAST
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Real-Time Dwell Waiting Timers, Target Dock Scheduling &amp; 3-Way IoT/RTLS Location Validation
          </p>
        </div>
        <button
          onClick={() => fetchYardData(horizon)}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer self-start sm:self-auto flex items-center space-x-1.5 text-xs font-mono font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Yard</span>
        </button>
      </div>

      {/* Sleek Operations Timeline Navigation Bar */}
      <TimeHorizonFilter
        value={horizon}
        onChange={setHorizon}
        counts={{
          'NOW': 5,
          '1H': 10,
          '2H': 10,
          '3H': 8,
          '4H': 2,
          'ALL': 14,
        }}
      />

      {/* AUTOMATED ML YARD SLOT RECOMMENDATION BANNER */}
      {mlRec && (
        <MLRecommendationBadge
          recommendation={mlRec}
          type="YARD"
        />
      )}

      {/* Location Mismatch Exception Banner */}
      {mismatchedSlot && (
        <div className="bg-rose-500/10 border-2 border-rose-500 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-rose-900 shadow-xl animate-fade-in">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5 animate-bounce" />
            <div className="text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-rose-700 uppercase tracking-wider text-sm">
                  ⚠ YARD LOCATION MISMATCH DETECTED
                </span>
                <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  SEVERITY: HIGH
                </span>
              </div>
              <p className="mt-1 text-slate-800">
                Yard Slot <strong className="text-rose-700 font-bold">{mismatchedSlot.id}</strong> sensor discrepancy:
                IoT Sensor &amp; RTLS detect <strong className="text-slate-900">{mismatchedSlot.sensorTrailerId || 'TR-106'}</strong>, but Yard Mule telematics confirmed <strong className="text-rose-700">{mismatchedSlot.yardMuleTrailerId || 'TR-107'}</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleResolveMismatch(mismatchedSlot.id)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs font-mono flex items-center space-x-1.5 transition flex-shrink-0 shadow-md cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Resolve Mismatch (Confirm {mismatchedSlot.sensorTrailerId || 'TR-106'})</span>
          </button>
        </div>
      )}

      {/* Stats Summary Bar */}
      {yardState && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono shadow-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Total Yard Capacity</span>
            <span className="text-xl font-black text-slate-900">{yardState.totalSlots} Slots</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Staged Slots</span>
            <span className="text-xl font-black text-blue-600">{yardState.occupiedSlots} Staged</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Available Buffer</span>
            <span className="text-xl font-black text-emerald-700">{yardState.availableSlots} Slots</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 uppercase block">Total Occupancy</span>
            <span className={`text-xl font-black ${yardState.occupancyPercent >= 80 ? 'text-amber-700' : 'text-slate-900'}`}>
              {yardState.occupancyPercent}%
            </span>
          </div>
        </div>
      )}

      {/* Zones Grid */}
      <div className="space-y-6">
        {renderZone('ZONE_A', 'Zone A — Sub-Zero Cold Staging Buffer (Plug In)', true)}
        {renderZone('ZONE_B', 'Zone B — Fresh Produce Chill & Holding Buffer', true)}
        {renderZone('ZONE_C', 'Zone C — Heavy Flatbed Crane & Hazmat Containment', false)}
      </div>

      {/* Slot Trailer Detail Modal */}
      {selectedSlot && createPortal(
        <div 
          onClick={() => setSelectedSlot(null)}
          className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 font-mono text-xs shadow-2xl animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Grid className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                  Yard Slot {selectedSlot.id} Details &amp; Sensors
                </h3>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="text-slate-400 hover:text-slate-900 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedSlot.status === 'OCCUPIED' ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Parked Trailer</span>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-black text-blue-700">
                      {selectedSlot.occupiedByTrailerId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-xs">
                      {isLive ? `⏱ Waiting: ${selectedSlot.dwellMinutes || 15} mins` : `Planned Arrival: ${selectedSlot.scheduledArrival || '15:10'}`}
                    </span>
                  </div>
                  <span className="text-slate-700 block text-xs">
                    Load Type: <strong>{selectedSlot.trailerType}</strong>
                  </span>
                  {selectedSlot.targetDockId && (
                    <div className="mt-2 text-xs font-bold text-blue-900 bg-blue-100/80 p-2 rounded-lg border border-blue-200 flex justify-between items-center">
                      <span>Assigned Target: <strong>Dock {selectedSlot.targetDockId}</strong></span>
                      <span className="text-[10px] font-normal">{isLive ? `Transfer in ~${selectedSlot.targetDockEtaMinutes || 15}m` : `Transfer at ${selectedSlot.targetTransferSchedule || '15:45'}`}</span>
                    </div>
                  )}
                </div>

                {/* 3-Way Sensor Signals Comparison */}
                {isLive && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                        <Cpu className="w-4 h-4 text-blue-600" />
                        <span>3-Way Software Sensor Signals</span>
                      </span>

                      {selectedSlot.locationValidationStatus === 'MISMATCH' ? (
                        <span className="px-2.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-300 font-extrabold flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
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

                      <div className={`p-2 bg-white border rounded-lg ${selectedSlot.locationValidationStatus === 'MISMATCH' ? 'border-rose-400 bg-rose-50' : 'border-slate-200'}`}>
                        <span className="text-[10px] text-slate-400 block font-semibold">3. Yard Mule Scanner</span>
                        <span className={`font-bold ${selectedSlot.locationValidationStatus === 'MISMATCH' ? 'text-rose-700 font-extrabold' : 'text-blue-700'}`}>
                          {selectedSlot.yardMuleTrailerId || selectedSlot.occupiedByTrailerId}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (selectedSlot.occupiedByTrailerId) {
                        setMovingSlot({ trailerId: selectedSlot.occupiedByTrailerId, slotId: selectedSlot.id });
                        setSelectedSlot(null);
                      }
                    }}
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-sm"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Re-Slot Trailer</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedSlot(null);
                      navigate(`/control-tower`);
                    }}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Auto Smart Dock</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-emerald-700 font-bold font-mono">
                This yard slot is currently AVAILABLE for inbound staging.
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Yard Move Modal */}
      {movingSlot && (
        <YardMoveModal
          trailerId={movingSlot.trailerId}
          currentSlotId={movingSlot.slotId}
          onClose={() => setMovingSlot(null)}
          onMoved={() => {
            setMovingSlot(null);
            fetchYardData(horizon);
          }}
        />
      )}
    </div>
  );
};

export default YardPage;
