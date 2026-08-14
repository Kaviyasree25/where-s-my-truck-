import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { YardSlot } from '../../types';
import {
  Grid,
  X,
  Truck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Navigation
} from 'lucide-react';

interface YardMoveModalProps {
  trailerId: string;
  currentSlotId?: string;
  onClose: () => void;
  onMoved: () => void;
}

export const YardMoveModal: React.FC<YardMoveModalProps> = ({
  trailerId,
  currentSlotId,
  onClose,
  onMoved
}) => {
  const [availableSlots, setAvailableSlots] = useState<YardSlot[]>([]);
  const [targetSlotId, setTargetSlotId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getYardState().then(data => {
      const free = data.slots.filter(s => s.status === 'AVAILABLE' && s.id !== currentSlotId);
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
  }, [currentSlotId]);

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSlotId) return;

    setSubmitting(true);
    setError(null);

    try {
      await api.moveYardTrailer(trailerId, targetSlotId, 'Yard Mule Operator (Marcus)');
      onMoved();
    } catch (err: any) {
      console.error('Failed to move trailer in yard:', err);
      setError(err.message || 'Failed to dispatch yard mule move');
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden font-mono"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base font-sans">
                Yard Mule Trailer Transfer
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Re-stage trailer to an alternate yard holding slot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleMove} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Trailer Unit</span>
              <span className="text-sm font-black text-slate-900">{trailerId}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-white border border-slate-200 rounded font-bold text-slate-700">
                Slot {currentSlotId || 'A42'}
              </span>
              <ArrowRight className="w-4 h-4 text-amber-500" />
              <span className="px-2 py-1 bg-amber-50 border border-amber-200 rounded font-bold text-amber-800">
                Slot {targetSlotId || '---'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Select Destination Yard Slot</label>
            <select
              value={targetSlotId}
              onChange={(e) => setTargetSlotId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
            >
              {availableSlots.map(s => (
                <option key={s.id} value={s.id}>
                  Slot {s.id} — Zone {s.zoneId.replace('ZONE_', '')} (Available)
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Moving will update RTLS RFID telemetry, sensor status, and operator audit trail.
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
              disabled={submitting || !targetSlotId}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center space-x-2 transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              <span>{submitting ? 'Moving Trailer...' : 'Dispatch Yard Move'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default YardMoveModal;
