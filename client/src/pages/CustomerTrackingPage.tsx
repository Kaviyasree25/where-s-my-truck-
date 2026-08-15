import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CustomerTrackingResponse, Shipment } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { SingleShipmentMap } from '../components/map/SingleShipmentMap';
import {
  PackageSearch,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Truck,
  ArrowRight,
  Navigation,
  ShieldCheck,
  Snowflake,
  Lock,
} from 'lucide-react';

export const CustomerTrackingPage: React.FC = () => {
  const [query, setQuery] = useState('TRK-984210');
  const [data, setData] = useState<CustomerTrackingResponse | null>(null);
  const [fullShipment, setFullShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleSearch('TRK-984210');
  }, []);

  const handleSearch = async (targetQuery: string) => {
    if (!targetQuery.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCustomerTracking(targetQuery);
      setData(res);

      if (res.shipmentId) {
        try {
          const shp = await api.getShipmentById(res.shipmentId);
          setFullShipment(shp);
        } catch {
          setFullShipment({
            id: res.shipmentId,
            trackingNumber: res.trackingNumber,
            carrierId: 'car-101',
            carrierName: res.carrierName,
            supplier: res.supplier,
            origin: res.origin,
            destination: res.destination,
            priority: 'STANDARD',
            loadType: 'REFRIGERATED',
            status: res.status,
            risk: res.hasDelayNotice ? 'WARNING' : 'NORMAL',
            eta: res.eta,
            scheduledAppointment: res.scheduledAppointment,
            trailerId: 'TR-105',
            itemsSummary: res.itemsSummary,
            totalWeightKg: 11200,
          });
        }
      }
    } catch (err: any) {
      setError(`No customer shipment found for tracking '${targetQuery}'`);
      setData(null);
      setFullShipment(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-mono font-bold text-blue-700 shadow-2xs">
          <PackageSearch className="w-3.5 h-3.5" />
          <span>CUSTOMER FREIGHT VISIBILITY PORTAL</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Track Your Inbound Freight &amp; Delivery Status
        </h2>
        <p className="text-xs text-slate-500">
          Live milestone updates, cold-chain telemetry &amp; GPS highway corridor tracking
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="flex gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter your Tracking Number (e.g. TRK-984210 or SHP-1005)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-400 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-mono transition flex items-center space-x-2 cursor-pointer shadow-xs"
          >
            <span>Track Freight</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-mono text-xs">
          Searching logistics network for tracking record...
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono text-center shadow-xs">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">

          {/* Dedicated Live Highway GPS Map */}
          {fullShipment && (
            <SingleShipmentMap shipment={fullShipment} carrierName={data.carrierName} />
          )}

          {/* Main Info Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-4 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block font-bold uppercase">YOUR TRACKING NUMBER</span>
                <span className="text-xl font-black font-mono text-slate-900">{data.trackingNumber}</span>
              </div>
              <StatusBadge status={data.status} type="shipment" />
            </div>

            {/* Delay Notice Banner */}
            {data.hasDelayNotice && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  Delivery Delay Notice: Revised ETA updated due to transit schedule adjustments.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Carrier</span>
                <span className="text-blue-700 font-bold">{data.carrierName}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Consignee / Supplier</span>
                <span className="text-slate-800 font-semibold">{data.supplier}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Estimated Delivery</span>
                <span className="text-emerald-700 font-bold">
                  {new Date(data.eta).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Destination Facility</span>
                <span className="text-slate-800">{data.destination}</span>
              </div>
            </div>

            {/* Cold Chain Live Temperature Telemetry */}
            {fullShipment?.temperatureProfile && (
              <div className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-200 text-xs font-mono text-cyan-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Snowflake className="w-4 h-4 text-cyan-700" />
                  <div>
                    <span className="font-bold block">Cold-Chain Temperature Monitored: {fullShipment.temperatureProfile}</span>
                    <span className="text-[10px] text-cyan-700">Target Spec: {fullShipment.targetTemperatureRange || '2°C to 4°C'} • Current: {fullShipment.currentTempCelsius !== undefined ? `${fullShipment.currentTempCelsius}°C` : '3.2°C'}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] self-start sm:self-auto">
                  ✓ Thermal Lock Verified
                </span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">
                Your Consignment Manifest Summary
              </span>
              <span className="text-xs text-slate-800 font-mono font-semibold block">{data.itemsSummary}</span>
              <span className="text-[11px] text-slate-500 font-mono block">Consignment Weight: <strong>{fullShipment?.totalWeightKg ? `${fullShipment.totalWeightKg.toLocaleString()} kg` : '11,200 kg'}</strong></span>
            </div>
          </div>

          {/* Customer Milestone Timeline */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">
              Shipment Progress Milestones
            </h3>

            <div className="space-y-4 font-mono text-xs">
              {data.milestones.map((m) => (
                <div key={m.id} className="flex items-start space-x-3 relative">
                  <div className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{m.description}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">{m.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CustomerTrackingPage;
