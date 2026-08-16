import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { LoadType, YardSlot } from '../../types';
import {
  Truck,
  X,
  Building2,
  Grid,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

interface RegisterTrailerModalProps {
  onClose: () => void;
  onRegistered: () => void;
}

export const RegisterTrailerModal: React.FC<RegisterTrailerModalProps> = ({ onClose, onRegistered }) => {
  const [trailerId, setTrailerId] = useState('');
  const [carrierName, setCarrierName] = useState('Swift Transportation');
  const [trailerType, setTrailerType] = useState<LoadType>('DRY_VAN');
  const [licensePlate, setLicensePlate] = useState('');
  const [targetSlotId, setTargetSlotId] = useState('');
  const [availableSlots, setAvailableSlots] = useState<YardSlot[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const randNum = Math.floor(120 + Math.random() * 80);
    setTrailerId(`TR-${randNum}`);
    setLicensePlate(`US-${Math.floor(2000 + Math.random() * 7000)}-TR`);

    api.getYardState().then(data => {
      const free = data.slots.filter(s => s.status === 'AVAILABLE');
      setAvailableSlots(free);
      if (free.length > 0) {
        setTargetSlotId(free[0].id);
      }
    }).catch(console.error);

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
      await api.checkInTrailer({
        trailerId: trailerId.trim(),
        carrierName,
        trailerType,
        licensePlate,
        targetSlotId: targetSlotId || undefined,
        operatorName: 'Gate Security (Operator)',
      });

      onRegistered();
    } catch (err: any) {
      console.error('Failed to register trailer:', err);
      setError(err.message || 'Failed to check in trailer');
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
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base font-sans truncate">
                Gate Arrival &amp; Yard Staging Check-In
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-sans truncate">
                Register arriving tractor-trailer at security gate and assign yard slot
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
              <label className="block text-slate-700 font-bold mb-1">Trailer Unit ID</label>
              <input
                type="text"
                value={trailerId}
                onChange={(e) => setTrailerId(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">License Plate</label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Carrier Company</label>
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
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Trailer Equipment Type</label>
            <select
              value={trailerType}
              onChange={(e) => setTrailerType(e.target.value as LoadType)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="DRY_VAN">DRY_VAN (Standard 53ft Enclosed)</option>
              <option value="REFRIGERATED">REFRIGERATED (Reefer Temperature Controlled)</option>
              <option value="HAZMAT">HAZMAT (Chemical Containment Spec)</option>
              <option value="FLATBED">FLATBED (Heavy Duty Open Flatbed)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Assigned Staging Yard Slot</label>
            <select
              value={targetSlotId}
              onChange={(e) => setTargetSlotId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
            >
              {availableSlots.map(s => (
                <option key={s.id} value={s.id}>
                  Slot {s.id} ({s.zoneId}) - Available
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {availableSlots.length} vacant parking slots available in yard staging zones.
            </span>
          </div>

          {/* Footer */}
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{submitting ? 'Checking In...' : 'Confirm Gate Check-In'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default RegisterTrailerModal;
