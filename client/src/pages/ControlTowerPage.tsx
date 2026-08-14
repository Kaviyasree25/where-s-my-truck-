import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { Shipment, AnalyticsKPIs, SmartQueueItem, MLRecommendationResponse } from '../types';
import { KPICard } from '../components/common/KPICard';
import { StatusBadge } from '../components/common/StatusBadge';
import { AllocationModal } from '../components/allocation/AllocationModal';
import { ReassignmentModal } from '../components/common/ReassignmentModal';
import { SmartQueueCard } from '../components/common/SmartQueueCard';
import { MLRecommendationBadge } from '../components/common/MLRecommendationBadge';
import {
  Truck,
  Building2,
  Clock,
  AlertTriangle,
  Grid,
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Cpu,
} from 'lucide-react';

export const ControlTowerPage: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [smartQueue, setSmartQueue] = useState<SmartQueueItem[]>([]);
  const [mlRec, setMlRec] = useState<MLRecommendationResponse | null>(null);
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [allocationTarget, setAllocationTarget] = useState<Shipment | null>(null);
  const [reassignmentData, setReassignmentData] = useState<any | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();

    // Socket.IO real-time listener
    const socket = getSocket();

    const onDockFailure = (payload: any) => {
      setReassignmentData(payload);
      fetchData();
    };

    const onOperationalChange = () => {
      fetchData();
    };

    const onRecommendationsUpdated = (payload: any) => {
      if (payload?.recommendations && payload.recommendations.length > 0) {
        setMlRec(payload.recommendations[0]);
      }
      fetchData();
    };

    socket.on('DOCK_FAILURE_EVENT', onDockFailure);
    socket.on('OPERATIONAL_STATE_CHANGED', onOperationalChange);
    socket.on('DEMO_RESET_EVENT', onOperationalChange);
    socket.on('SENSOR_MATCH_EVENT', onOperationalChange);
    socket.on('SENSOR_MISMATCH_EVENT', onOperationalChange);
    socket.on('RECOMMENDATIONS_UPDATED', onRecommendationsUpdated);

    return () => {
      socket.off('DOCK_FAILURE_EVENT', onDockFailure);
      socket.off('OPERATIONAL_STATE_CHANGED', onOperationalChange);
      socket.off('DEMO_RESET_EVENT', onOperationalChange);
      socket.off('SENSOR_MATCH_EVENT', onOperationalChange);
      socket.off('SENSOR_MISMATCH_EVENT', onOperationalChange);
      socket.off('RECOMMENDATIONS_UPDATED', onRecommendationsUpdated);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shipmentList, kpiData, queueData, mlData] = await Promise.all([
        api.getShipments(),
        api.getAnalyticsKPIs(),
        api.getSmartQueue(),
        api.getMLRecommendation('TR-106'),
      ]);
      setShipments(shipmentList);
      setKpis(kpiData);
      setSmartQueue(queueData);
      setMlRec(mlData);
    } catch (err) {
      console.error('Error fetching control tower data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllocationByShipmentId = (shipmentId: string) => {
    const target = shipments.find(s => s.id === shipmentId || s.trailerId === shipmentId);
    if (target) {
      setAllocationTarget(target);
    } else {
      api.getShipmentById(shipmentId).then(shp => {
        if (shp) setAllocationTarget(shp);
      }).catch(err => console.error('Shipment not found:', err));
    }
  };

  const filteredShipments = shipments.filter(s => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.trailerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.carrierName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk = riskFilter === 'ALL' || s.risk === riskFilter;

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Top Section Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Warehouse Inbound Control Tower
            </h2>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px] border border-blue-200 flex items-center space-x-1">
              <Cpu className="w-3 h-3 text-blue-600 animate-pulse" />
              <span>DATA-DRIVEN ML DECISION SUPPORT</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-Time Inbound Operations, Trained Machine Learning Recommendations & Active Exceptions
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Active Inbound"
            value={kpis.activeShipmentsCount}
            subtitle={`${kpis.trailersArrivingToday} Trailers Scheduled Today`}
            icon={Truck}
            highlightColor="blue"
          />
          <KPICard
            title="Dock Utilization"
            value={`${kpis.dockUtilizationPercent}%`}
            subtitle="Current Active Unloading Bays"
            icon={Building2}
            trend={{ value: 'Normal Fit', isPositive: true }}
            highlightColor="emerald"
          />
          <KPICard
            title="Yard Occupancy"
            value={`${kpis.yardOccupancyPercent}%`}
            subtitle="Total Available Slots Capacity"
            icon={Grid}
            trend={
              kpis.yardOccupancyPercent >= 80
                ? { value: 'HIGH CONGESTION', isWarning: true }
                : { value: 'Optimal', isPositive: true }
            }
            highlightColor={kpis.yardOccupancyPercent >= 80 ? 'amber' : 'blue'}
          />
          <KPICard
            title="Active Exceptions"
            value={kpis.activeExceptionsCount}
            subtitle="Requires Operator Resolution"
            icon={AlertTriangle}
            trend={
              kpis.activeExceptionsCount > 0
                ? { value: `${kpis.activeExceptionsCount} ACTION REQ`, isWarning: true }
                : { value: 'Clear', isPositive: true }
            }
            highlightColor={kpis.activeExceptionsCount > 0 ? 'rose' : 'emerald'}
          />
        </div>
      )}

      {/* AUTOMATED ML RECOMMENDATION BANNER */}
      {mlRec && (
        <MLRecommendationBadge
          recommendation={mlRec}
          type="DOCK"
          onAllocate={() => handleSelectAllocationByShipmentId(mlRec.shipmentId)}
        />
      )}

      {/* FEATURE 1 & 2: Smart Dynamic Trailer Priority Queue Component */}
      <SmartQueueCard
        queue={smartQueue}
        onSelectAllocation={handleSelectAllocationByShipmentId}
      />

      {/* Table Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Shipment ID, Trailer, Carrier..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-300 font-mono"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Risk Filter:</span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            {['ALL', 'NORMAL', 'WARNING', 'DELAYED', 'CRITICAL'].map(risk => (
              <button
                key={risk}
                onClick={() => setRiskFilter(risk)}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
                  riskFilter === risk
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Operational Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Live Inbound Shipment Table
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Showing {filteredShipments.length} Active Shipments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Shipment ID</th>
                <th className="py-3 px-4">Trailer / Carrier</th>
                <th className="py-3 px-4">Priority / Type</th>
                <th className="py-3 px-4">ETA / Appt</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Operational Status</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Assigned Dock</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {filteredShipments.map(s => (
                <tr
                  key={s.id}
                  className="hover:bg-slate-50 transition group cursor-pointer"
                  onClick={() => navigate(`/shipments/${s.id}`)}
                >
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>{s.id}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{s.trackingNumber}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{s.trailerId}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{s.carrierName}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={s.priority} type="priority" size="sm" />
                    <div className="text-[10px] text-slate-400 font-normal mt-1">
                      {s.loadType}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700">
                    <div>{new Date(s.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-[10px] text-slate-400">
                      Appt: {new Date(s.scheduledAppointment).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700">
                    {s.currentDockId ? (
                      <span className="text-emerald-700 font-semibold">{s.currentDockId}</span>
                    ) : s.currentYardSlotId ? (
                      <span className="text-amber-700 font-semibold">Slot {s.currentYardSlotId}</span>
                    ) : (
                      <span className="text-slate-400">In Transit</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={s.status} type="shipment" size="sm" />
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={s.risk} type="risk" size="sm" />
                  </td>

                  <td className="py-3.5 px-4 font-bold">
                    {s.currentDockId ? (
                      <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.currentDockId}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-normal italic">
                        Unassigned
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setAllocationTarget(s)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-semibold flex items-center space-x-1.5 ml-auto transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Smart Dock</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Smart Allocation Modal */}
      {allocationTarget && (
        <AllocationModal
          shipment={allocationTarget}
          onClose={() => setAllocationTarget(null)}
          onAssigned={() => {
            setAllocationTarget(null);
            fetchData();
          }}
        />
      )}

      {/* Reassignment Modal (Triggered by Socket Dock Failure) */}
      {reassignmentData && (
        <ReassignmentModal
          data={reassignmentData}
          onClose={() => setReassignmentData(null)}
          onApproved={() => {
            setReassignmentData(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};
