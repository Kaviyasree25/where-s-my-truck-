import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Shipment, ShipmentStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { SingleShipmentMap } from '../components/map/SingleShipmentMap';
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
} from 'lucide-react';

export const TrackingPage: React.FC = () => {
  const [query, setQuery] = useState('SHP-1005');
  const [shipment, setShipment] = useState<Shipment | null>(null);
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
      const data = await api.getShipmentById(targetQuery);
      setShipment(data);
    } catch (err: any) {
      // Try searching by tracking number
      try {
        const custData = await api.getCustomerTracking(targetQuery);
        const fullData = await api.getShipmentById(custData.shipmentId);
        setShipment(fullData);
      } catch (e2) {
        setError(`No shipment found matching query '${targetQuery}'`);
        setShipment(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const steps: { status: ShipmentStatus; label: string }[] = [
    { status: 'CREATED', label: 'Created' },
    { status: 'DISPATCHED', label: 'Dispatched' },
    { status: 'IN_TRANSIT', label: 'In Transit' },
    { status: 'IN_YARD', label: 'Arrived / In Yard' },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Shipment Operational Tracking & Lifecycle
        </h2>
        <p className="text-xs text-slate-400">
          Lookup Inbound Freight by Shipment ID, Tracking Number, or Trailer License
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Shipment ID (SHP-1005), Tracking (TRK-984210), or Trailer (TR-105)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-300 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-2"
          >
            <span>Track Shipment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-3 flex items-center space-x-2 text-xs text-slate-400">
          <span className="font-mono">Quick Demo Examples:</span>
          {['SHP-1005', 'SHP-1001', 'TRK-984210', 'TR-105'].map(ex => (
            <button
              key={ex}
              onClick={() => {
                setQuery(ex);
                handleSearch(ex);
              }}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-blue-600 font-mono text-[11px] border border-slate-200"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Result Display */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs">
          Loading shipment lifecycle details...
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-mono">
          {error}
        </div>
      ) : shipment ? (
        <div className="space-y-6">
          {/* Milestone Stepper Visualizer */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
              Inbound Operations Milestone Timeline
            </h3>

            <div className="relative flex items-center justify-between">
              {/* Line connector */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0" />

              {steps.map((step, idx) => {
                const isPassed = idx <= activeIndex;
                const isCurrent = idx === activeIndex;

                return (
                  <div key={step.status} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition border-2 ${
                        isCurrent
                          ? 'bg-blue-600 text-white border-blue-300 shadow-lg shadow-slate-200 scale-110'
                          : isPassed
                            ? 'bg-emerald-500 text-white border-emerald-400'
                          : 'bg-white text-slate-500 border-slate-200'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>

                    <span
                      className={`mt-2 text-[11px] font-mono font-medium text-center ${
                        isCurrent
                          ? 'text-blue-600 font-bold'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dedicated Single-Shipment Live Highway & Facility Map */}
          <SingleShipmentMap shipment={shipment} />

          {/* Details Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-slate-900 font-mono">{shipment.id}</h3>
                    <StatusBadge status={shipment.status} type="shipment" />
                    <StatusBadge status={shipment.priority} type="priority" />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Tracking #: {shipment.trackingNumber}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono block">CARRIER</span>
                  <span className="text-sm font-bold text-blue-600">{shipment.carrierName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Supplier / Vendor</span>
                  <span className="text-slate-800 font-semibold">{shipment.supplier}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Load Type & Weight</span>
                  <span className="text-slate-800 font-semibold">
                    {shipment.loadType} ({shipment.totalWeightKg.toLocaleString()} kg)
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Origin Depot</span>
                  <span className="text-slate-800">{shipment.origin}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Destination Bay</span>
                  <span className="text-slate-800">{shipment.destination}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                  Cargo Manifest Summary
                </span>
                <span className="text-xs text-slate-700 font-mono">{shipment.itemsSummary}</span>
              </div>
            </div>

            {/* Live Operations & Dock Sidebar */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-3">
                Live Operations Assignment
              </h4>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-400">Trailer ID:</span>
                  <span className="font-bold text-blue-600">{shipment.trailerId}</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-400">Assigned Dock:</span>
                  <span className="font-bold text-emerald-700">
                    {shipment.currentDockId || 'Unassigned'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-400">Yard Position:</span>
                  <span className="font-bold text-amber-700">
                    {shipment.currentYardSlotId ? `Slot ${shipment.currentYardSlotId}` : 'None'}
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded bg-slate-50 border border-slate-200">
                  <span className="text-slate-400">Scheduled Appt:</span>
                  <span className="text-slate-800">
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
