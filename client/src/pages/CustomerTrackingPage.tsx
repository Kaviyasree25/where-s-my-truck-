import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CustomerTrackingResponse } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  PackageSearch,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Truck,
  ArrowRight,
} from 'lucide-react';

export const CustomerTrackingPage: React.FC = () => {
  const [query, setQuery] = useState('TRK-984210');
  const [data, setData] = useState<CustomerTrackingResponse | null>(null);
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
    } catch (err: any) {
      setError(`No customer shipment found for tracking '${targetQuery}'`);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono text-blue-600">
          <PackageSearch className="w-4 h-4" />
          <span>CUSTOMER FREIGHT VISIBILITY PORTAL</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Track Your Inbound Freight & Delivery Status
        </h2>
        <p className="text-xs text-slate-400">
          Live milestone updates, estimated arrival, and cargo status tracking
        </p>
      </div>

      {/* Search Input */}
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
              placeholder="Enter your Tracking Number (e.g. TRK-984210 or SHP-1005)..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-300 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-2"
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
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-mono text-center">
          {error}
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-4 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">TRACKING NUMBER</span>
                <span className="text-xl font-bold font-mono text-slate-900">{data.trackingNumber}</span>
              </div>
              <StatusBadge status={data.status} type="shipment" />
            </div>

            {/* Delay Notice Banner */}
            {data.hasDelayNotice && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span>
                  Delivery Delay Notice: Revised ETA updated due to transit schedule adjustments.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-2">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Carrier</span>
                <span className="text-blue-600 font-bold">{data.carrierName}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Supplier</span>
                <span className="text-slate-800 font-semibold">{data.supplier}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Estimated Arrival</span>
                <span className="text-emerald-700 font-bold">
                  {new Date(data.eta).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Destination</span>
                <span className="text-slate-800">{data.destination}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                Cargo Manifest Summary
              </span>
              <span className="text-xs text-slate-700 font-mono">{data.itemsSummary}</span>
            </div>
          </div>

          {/* Customer Milestone Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Shipment Progress Milestones
            </h3>

            <div className="space-y-4 font-mono text-xs">
              {data.milestones.map((m, idx) => (
                <div key={m.id} className="flex items-start space-x-3 relative">
                  <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-200 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{m.description}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({new Date(m.timestamp).toLocaleTimeString()})
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 block mt-0.5">{m.location}</span>
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
