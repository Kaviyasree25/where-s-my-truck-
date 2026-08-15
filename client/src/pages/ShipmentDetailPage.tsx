import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Shipment, AuditLog } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { AllocationModal } from '../components/allocation/AllocationModal';
import { SingleShipmentMap } from '../components/map/SingleShipmentMap';
import {
  ArrowLeft,
  Truck,
  Building2,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  History,
  CheckCircle2,
} from 'lucide-react';

export const ShipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllocationModal, setShowAllocationModal] = useState(false);

  useEffect(() => {
    if (id) fetchShipmentDetails(id);
  }, [id]);

  const fetchShipmentDetails = async (shipmentId: string) => {
    setLoading(true);
    try {
      const data = await api.getShipmentById(shipmentId);
      setShipment(data);

      const logs = await api.getAuditLogs();
      const filtered = logs.filter(
        l => l.entityId === shipmentId || l.entityId === data.trailerId || l.details.includes(shipmentId)
      );
      setAuditLogs(filtered);
    } catch (err) {
      console.error('Failed to load shipment details:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-400 font-mono text-xs">Loading shipment operational file...</div>;
  }

  if (!shipment) {
    return <div className="py-12 text-center text-red-600 font-mono text-xs">Shipment not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/control-tower')}
          className="flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-900 transition font-mono"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Control Tower</span>
        </button>

        <button
          onClick={() => setShowAllocationModal(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-slate-200"
        >
          <Sparkles className="w-4 h-4" />
          <span>Smart Dock Allocation</span>
        </button>
      </div>

      {/* Title Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-extrabold text-slate-900 font-mono">{shipment.id}</h2>
            <StatusBadge status={shipment.status} type="shipment" />
            <StatusBadge status={shipment.risk} type="risk" />
            <StatusBadge status={shipment.priority} type="priority" />
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Tracking #: {shipment.trackingNumber} | Load: {shipment.loadType} | Carrier: {shipment.carrierName}
          </p>
        </div>

        <div className="flex items-center space-x-4 font-mono text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 block">TRAILER</span>
            <span className="text-sm font-bold text-blue-600">{shipment.trailerId}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 block">ASSIGNED DOCK</span>
            <span className="text-sm font-bold text-emerald-700">
              {shipment.currentDockId || 'Unassigned'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Single Shipment Route & Facility Map */}
      <SingleShipmentMap shipment={shipment} />

      {/* Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Shipment & Trailer Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-3">
              Shipment Manifest & Logistics Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Supplier / Shipper</span>
                <span className="text-slate-900 font-semibold">{shipment.supplier}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Carrier</span>
                <span className="text-blue-600 font-semibold">{shipment.carrierName}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Origin Depot</span>
                <span className="text-slate-700">{shipment.origin}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Destination Bay</span>
                <span className="text-slate-700">{shipment.destination}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">ETA</span>
                <span className="text-slate-700">
                  {new Date(shipment.eta).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Scheduled Appointment</span>
                <span className="text-slate-700">
                  {new Date(shipment.scheduledAppointment).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                Items Summary & Specifications
              </span>
              <p className="text-xs text-slate-700 font-mono">{shipment.itemsSummary}</p>
            </div>
          </div>

          {/* Active Exceptions section */}
          {shipment.activeException && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-6 space-y-3">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Active Exception Alert
                </h3>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-bold text-slate-900 font-mono">
                  {shipment.activeException.title}
                </div>
                <p className="text-xs text-rose-200 font-mono">
                  {shipment.activeException.description}
                </p>
                <div className="mt-2 text-xs text-blue-600 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                  Recommended Action: {shipment.activeException.recommendedAction}
                </div>
              </div>
            </div>
          )}

          {/* Audit History Trail */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center space-x-2 text-slate-400">
              <History className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Operational Audit Trail History
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {auditLogs.length === 0 ? (
                <span className="text-slate-500 italic">No audit records logged yet.</span>
              ) : (
                auditLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1"
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="font-bold text-blue-600">{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-slate-800">{log.details}</div>
                    <div className="text-[10px] text-slate-500">Actor: {log.actor}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-3">
              Location & Dock State
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Yard Position</span>
                <span className="font-bold text-amber-700 text-sm">
                  {shipment.currentYardSlotId ? `Slot ${shipment.currentYardSlotId}` : 'Not in Yard'}
                </span>
              </div>

              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block uppercase">Assigned Dock</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {shipment.currentDockId || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAllocationModal && (
        <AllocationModal
          shipment={shipment}
          onClose={() => setShowAllocationModal(false)}
          onAssigned={() => {
            setShowAllocationModal(false);
            if (id) fetchShipmentDetails(id);
          }}
        />
      )}
    </div>
  );
};
