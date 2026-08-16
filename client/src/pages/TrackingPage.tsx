import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shipment, ShipmentStatus, Trailer } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { SingleShipmentMap } from '../components/map/SingleShipmentMap';
import { useSlidingIndicator } from '../hooks/useSlidingIndicator';
import {
  Search,
  Truck,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Package,
  Snowflake,
  ShieldCheck,
} from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const [query, setQuery] = useState('SHP-1005');
  const { containerRef: sampleContainerRef, indicatorStyle: sampleIndicatorStyle } = useSlidingIndicator(query);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [trailerData, setTrailerData] = useState<Trailer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleSearch('SHP-1005');
  }, []);

  const handleSearch = async (targetQuery: string) => {
    if (!targetQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let targetShipment: Shipment | null = null;
      try {
        targetShipment = await api.getShipmentById(targetQuery);
      } catch {
        const custData = await api.getCustomerTracking(targetQuery);
        targetShipment = await api.getShipmentById(custData.shipmentId);
      }

      setShipment(targetShipment);

      if (targetShipment?.trailerId) {
        try {
          const trailers = await api.getTrailers();
          const t = trailers.find(x => x.id === targetShipment!.trailerId);
          setTrailerData(t || null);
        } catch (e) {
          console.error('Error fetching trailer telematics:', e);
        }
      }
    } catch (err: any) {
      setError(`No shipment record found matching query '${targetQuery}'`);
      setShipment(null);
      setTrailerData(null);
    } finally {
      setLoading(false);
    }
  };

  const steps: { status: ShipmentStatus; label: string }[] = [
    { status: 'CREATED', label: 'Created' },
    { status: 'DISPATCHED', label: 'Dispatched' },
    { status: 'IN_TRANSIT', label: 'In Transit' },
    { status: 'IN_YARD', label: 'In Yard' },
    { status: 'DOCK_ASSIGNED', label: 'Dock Assigned' },
    { status: 'PROCESSING', label: 'Unloading' },
    { status: 'COMPLETED', label: 'Completed' },
  ];

  const getStepIndex = (currentStatus?: ShipmentStatus) => {
    if (!currentStatus) return 0;
    const idx = steps.findIndex(s => s.status === currentStatus);
    return idx >= 0 ? idx : 3;
  };

  const activeIndex = getStepIndex(shipment?.status);
  const isCold = shipment?.loadType === 'REFRIGERATED' || shipment?.temperatureProfile === 'DEEP_FREEZE' || shipment?.temperatureProfile === 'REFRIGERATED_CHILL';

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Shipment Operational Tracking &amp; Lifecycle
        </h2>
        <p className="text-xs text-slate-500">
          Lookup Inbound Freight by Shipment ID (SHP), Tracking Number (TRK), or Trailer License (TR)
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex flex-col sm:flex-row gap-2.5 sm:gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Shipment ID (SHP-1005), Tracking (TRK-984210), or Trailer (TR-105)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-400 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-mono transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs shrink-0"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div ref={sampleContainerRef} className="relative mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {/* Single persistent sliding indicator with zero distortion and perfect rounded corners */}
          <div
            className="absolute top-0 left-0 bg-blue-600 rounded-lg shadow-xs pointer-events-none transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.3,1)]"
            style={{
              transform: sampleIndicatorStyle.transform,
              width: `${sampleIndicatorStyle.width}px`,
              height: `${sampleIndicatorStyle.height}px`,
              opacity: sampleIndicatorStyle.opacity,
              willChange: 'transform, width',
            }}
          />

          <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0">Live Samples:</span>
          {['TR-219', 'TR-202', 'TR-211', 'TR-203', 'SHP-1009', 'TR-106', 'SHP-1001'].map(id => {
            const isActive = query === id;
            return (
              <button
                key={id}
                data-active={isActive}
                onClick={() => {
                  setQuery(id);
                  handleSearch(id);
                }}
                className={`relative px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold cursor-pointer select-none transition-colors duration-150 z-10 ${
                  isActive
                    ? 'text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-200'
                }`}
              >
                {id}
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Display */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs">
          Loading operational lifecycle details...
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono shadow-xs">
          {error}
        </div>
      ) : shipment ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Milestone Stepper Visualizer */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs overflow-x-auto no-scrollbar">
            <div className="min-w-[620px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Inbound Operations Milestone Timeline
                </h3>
                <span className="text-xs font-mono font-bold text-blue-700">
                  Current Status: {shipment.status}
                </span>
              </div>

              <div className="relative flex items-center justify-between px-2">
                <div className="absolute left-6 right-6 top-3.5 h-1 bg-slate-100 z-0" />

                {steps.map((step, idx) => {
                  const isPassed = idx <= activeIndex;
                  const isCurrent = idx === activeIndex;

                  return (
                    <div key={step.status} className="relative z-10 flex flex-col items-center flex-1 text-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition border-2 ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-400 shadow-md scale-110'
                            : isPassed
                            ? 'bg-emerald-500 text-white border-emerald-400'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}
                      >
                        {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                      </div>

                      <span
                        className={`mt-2 text-[10px] font-mono whitespace-nowrap ${
                          isCurrent
                            ? 'text-blue-700 font-bold'
                            : isPassed
                            ? 'text-slate-700 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dedicated Live Highway & Facility Map */}
          <SingleShipmentMap shipment={shipment} />

          {/* Details & Assignment Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
                <div>
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1.5">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 font-mono whitespace-nowrap">{shipment.id}</h3>
                    <StatusBadge status={shipment.status} type="shipment" />
                    <StatusBadge status={shipment.priority} type="priority" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Tracking #: <span className="font-semibold text-slate-800">{shipment.trackingNumber}</span>
                  </p>
                </div>
                <div className="text-left sm:text-right font-mono bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase whitespace-nowrap">CARRIER</span>
                  <span className="text-sm font-black text-blue-700 whitespace-nowrap">{shipment.carrierName}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs font-mono">
                <div className="bg-slate-50/70 p-2.5 sm:p-3 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold whitespace-nowrap">Supplier / Consignor</span>
                  <span className="text-slate-800 font-semibold block mt-0.5">{shipment.supplier}</span>
                </div>

                <div className="bg-slate-50/70 p-2.5 sm:p-3 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold whitespace-nowrap">Payload Weight</span>
                  <span className="text-slate-800 font-semibold block mt-0.5">
                    {shipment.loadType} ({shipment.totalWeightKg.toLocaleString()} kg)
                  </span>
                </div>

                <div className="bg-slate-50/70 p-2.5 sm:p-3 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold whitespace-nowrap">Origin Depot</span>
                  <span className="text-slate-800 block mt-0.5">{shipment.origin}</span>
                </div>

                <div className="bg-slate-50/70 p-2.5 sm:p-3 rounded-xl border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold whitespace-nowrap">Destination Facility</span>
                  <span className="text-slate-800 block mt-0.5">{shipment.destination}</span>
                </div>
              </div>

              {/* Cold Chain Live Telemetry */}
              {isCold && (
                <div className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-200 text-xs font-mono text-cyan-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Snowflake className="w-4 h-4 text-cyan-700 shrink-0" />
                    <div>
                      <span className="font-bold block">
                        Cold-Chain Temperature Monitored: {(shipment.temperatureProfile || 'REFRIGERATED_CHILL').replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-cyan-700 block mt-0.5">
                        Target Spec: {shipment.targetTemperatureRange || '2°C to 4°C'} • Current: {shipment.currentTempCelsius !== undefined ? `${shipment.currentTempCelsius}°C` : '3.2°C'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] self-start sm:self-auto whitespace-nowrap shrink-0">
                    ✓ Thermal Lock Active
                  </span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block whitespace-nowrap">
                  Cargo Manifest Summary
                </span>
                <span className="text-xs text-slate-800 font-mono">{shipment.itemsSummary}</span>
              </div>
            </div>

            {/* Sidebar */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono border-b border-slate-200 pb-3">
                Live Operations Assignment
              </h4>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 whitespace-nowrap">Loaded on Rig:</span>
                  <span className="font-black text-blue-700 whitespace-nowrap">{shipment.trailerId}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 whitespace-nowrap">Assigned Bay:</span>
                  <span className="font-bold text-emerald-700 whitespace-nowrap">
                    {shipment.currentDockId ? `Dock ${shipment.currentDockId}` : 'Unassigned'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 whitespace-nowrap">Yard Staging:</span>
                  <span className="font-bold text-amber-700 whitespace-nowrap">
                    {shipment.currentYardSlotId ? `Slot ${shipment.currentYardSlotId}` : 'None'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 whitespace-nowrap">Appt Window:</span>
                  <span className="text-slate-800 font-semibold whitespace-nowrap">
                    {new Date(shipment.scheduledAppointment).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TrackingPage;
