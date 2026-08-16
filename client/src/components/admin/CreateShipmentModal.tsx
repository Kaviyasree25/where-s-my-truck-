import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { LoadType, ShipmentPriority } from '../../types';
import {
  PackagePlus,
  X,
  Truck,
  Building2,
  Calendar,
  Layers,
  Scale,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CreateShipmentModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export const CreateShipmentModal: React.FC<CreateShipmentModalProps> = ({ onClose, onCreated }) => {
  const [carrierName, setCarrierName] = useState('Swift Transportation');
  const [supplier, setSupplier] = useState('Apex Industrial Components');
  const [origin, setOrigin] = useState('Detroit Assembly Logistics Plant');
  const [destination, setDestination] = useState('Main Facility - Bay A (Naperville DC-1)');
  const [loadType, setLoadType] = useState<LoadType>('DRY_VAN');
  const [priority, setPriority] = useState<ShipmentPriority>('STANDARD');
  const [scheduledAppointment, setScheduledAppointment] = useState('');
  const [itemsSummary, setItemsSummary] = useState('24 Pallets - Automotive Transmission Parts');
  const [totalWeightKg, setTotalWeightKg] = useState(14500);
  const [trailerId, setTrailerId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Generate default appointment 2 hours in the future
    const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const isoString = d.toISOString().slice(0, 16);
    setScheduledAppointment(isoString);

    const randTr = `TR-${Math.floor(200 + Math.random() * 200)}`;
    setTrailerId(randTr);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.createShipment({
        carrierName,
        supplier,
        origin,
        destination,
        loadType,
        priority,
        scheduledAppointment: new Date(scheduledAppointment).toISOString(),
        itemsSummary,
        totalWeightKg: Number(totalWeightKg),
        trailerId: trailerId.trim() || undefined,
        operatorName: 'Marcus Vance (Operator)',
      });

      onCreated();
    } catch (err: any) {
      console.error('Failed to create shipment:', err);
      setError(err.message || 'Failed to dispatch shipment');
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden font-mono"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base font-sans truncate">
                Dispatch New Inbound Shipment
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-sans truncate">
                Create new freight bill, assign carrier credentials &amp; schedule arrival window
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Carrier Name</label>
              <select
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="Swift Transportation">Swift Transportation</option>
                <option value="J.B. Hunt Dedicated">J.B. Hunt Dedicated</option>
                <option value="Schneider National">Schneider National</option>
                <option value="Knight-Swift Logistics">Knight-Swift Logistics</option>
                <option value="Prime Inc. Refrigerated">Prime Inc. Refrigerated</option>
                <option value="Werner Enterprises">Werner Enterprises</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Supplier / Shipper</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Apex Industrial Components"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Assigned Trailer ID</label>
              <input
                type="text"
                value={trailerId}
                onChange={(e) => setTrailerId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. TR-208"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Scheduled Appointment</label>
              <input
                type="datetime-local"
                value={scheduledAppointment}
                onChange={(e) => setScheduledAppointment(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Load / Cargo Type</label>
              <select
                value={loadType}
                onChange={(e) => setLoadType(e.target.value as LoadType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="DRY_VAN">DRY_VAN (Standard Freight)</option>
                <option value="REFRIGERATED">REFRIGERATED (Cold-Chain)</option>
                <option value="HAZMAT">HAZMAT (Hazardous Materials)</option>
                <option value="FLATBED">FLATBED (Heavy Equipment)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Shipment Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ShipmentPriority)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="STANDARD">STANDARD</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Origin Facility</label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Total Cargo Weight (kg)</label>
              <input
                type="number"
                value={totalWeightKg}
                onChange={(e) => setTotalWeightKg(Number(e.target.value))}
                required
                min={500}
                max={40000}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Manifest Cargo Items Summary</label>
            <input
              type="text"
              value={itemsSummary}
              onChange={(e) => setItemsSummary(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 24 Pallets - Automotive Transmission Parts"
            />
          </div>

          {/* Footer inside form */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center space-x-2 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{submitting ? 'Dispatching...' : 'Dispatch Shipment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CreateShipmentModal;
