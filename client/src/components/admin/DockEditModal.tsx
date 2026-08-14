import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { Dock, LoadType } from '../../types';
import {
  Building2,
  X,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface DockEditModalProps {
  dock: Dock;
  onClose: () => void;
  onUpdated: () => void;
}

export const DockEditModal: React.FC<DockEditModalProps> = ({ dock, onClose, onUpdated }) => {
  const [status, setStatus] = useState<Dock['status']>(dock.status);
  const [name, setName] = useState(dock.name);
  const [maintenanceNotes, setMaintenanceNotes] = useState(dock.maintenanceNotes || '');
  const [capabilities, setCapabilities] = useState<LoadType[]>(dock.capabilities);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const toggleCapability = (cap: LoadType) => {
    if (capabilities.includes(cap)) {
      if (capabilities.length > 1) {
        setCapabilities(capabilities.filter(c => c !== cap));
      }
    } else {
      setCapabilities([...capabilities, cap]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.createOrUpdateDock({
        id: dock.id,
        name,
        status,
        capabilities,
        maintenanceNotes: status === 'MAINTENANCE' || status === 'BLOCKED' ? maintenanceNotes : '',
      });

      onUpdated();
    } catch (err: any) {
      console.error('Failed to update dock door:', err);
      setError(err.message || 'Failed to update dock');
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
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base font-sans">
                Configure Dock Door {dock.id}
              </h3>
              <p className="text-xs text-slate-500 font-sans">
                Manage operational availability, capabilities &amp; maintenance downtime
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Dock Door Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Operational Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Dock['status'])}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="AVAILABLE">AVAILABLE (Ready for Trailer Inbound)</option>
              <option value="OCCUPIED">OCCUPIED (Active Unloading in Progress)</option>
              <option value="MAINTENANCE">MAINTENANCE (Hydraulic Plate / Sensor Service)</option>
              <option value="BLOCKED">BLOCKED (Physical Bay Obstruction)</option>
            </select>
          </div>

          {(status === 'MAINTENANCE' || status === 'BLOCKED') && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <label className="block text-amber-900 font-bold">
                Maintenance / Outage Reason Notes
              </label>
              <input
                type="text"
                value={maintenanceNotes}
                onChange={(e) => setMaintenanceNotes(e.target.value)}
                required
                placeholder="e.g. Hydraulic leveler piston inspection"
                className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-amber-700 block">
                Setting to MAINTENANCE will auto-reroute scheduled trailers and record an audit exception.
              </span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-2">Supported Freight Capabilities</label>
            <div className="grid grid-cols-2 gap-2">
              {(['DRY_VAN', 'REFRIGERATED', 'HAZMAT', 'FLATBED'] as LoadType[]).map(cap => {
                const isSelected = capabilities.includes(cap);
                return (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => toggleCapability(cap)}
                    className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cap}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
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
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{submitting ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DockEditModal;
