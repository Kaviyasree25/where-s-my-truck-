import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { StatusBadge } from './StatusBadge';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  X,
  Building2,
  Truck,
  ShieldAlert,
  Loader2,
  FileCheck,
} from 'lucide-react';

interface ReassignmentModalProps {
  data: {
    failedDock: any;
    impactedShipment: any;
    impactedTrailer: any;
    exception: any;
    recommendation: any;
  };
  onClose: () => void;
  onApproved: () => void;
}

export const ReassignmentModal: React.FC<ReassignmentModalProps> = ({
  data,
  onClose,
  onApproved,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const { failedDock, impactedShipment, impactedTrailer, exception, recommendation } = data;
  const bestCandidate = recommendation?.candidateScores?.find(
    (c: any) => c.dockId === recommendation.bestDockId
  );

  const handleApprove = async () => {
    if (!recommendation?.bestDockId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.reassignDock(
        impactedShipment.id,
        impactedTrailer.id,
        failedDock.id,
        recommendation.bestDockId,
        `Dock ${failedDock.id} failure emergency dynamic reassignment`,
        'Marcus Vance (Operator)'
      );
      onApproved();
    } catch (err: any) {
      setError(err.message || 'Failed to reassign dock');
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-red-300 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-rose-500/20 text-red-600 border border-red-300 shrink-0">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-wide truncate">
                  CRITICAL OPERATIONAL EXCEPTION DETECTED
                </h3>
                <StatusBadge status="CRITICAL" type="risk" size="sm" />
              </div>
              <p className="text-[11px] sm:text-xs text-red-600 font-mono truncate">
                Dock Door {failedDock.id} Failure — Emergency Reassignment Required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Affected Entity Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Impacted Trailer
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold font-mono text-slate-900">
                  {impactedTrailer.id}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({impactedTrailer.trailerType})
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Shipment ID &amp; Customer
              </span>
              <div className="mt-1">
                <span className="text-sm font-bold font-mono text-slate-900 block">
                  {impactedShipment.id}
                </span>
                <span className="text-xs text-slate-700 truncate block">
                  {impactedShipment.supplier}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Shipment Priority
              </span>
              <div className="mt-1">
                <StatusBadge status={impactedShipment.priority} type="priority" />
              </div>
            </div>
          </div>

          {/* Side by side comparison: OLD vs NEW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Old Assignment */}
            <div className="p-4 rounded-xl bg-slate-50 border border-red-200 relative">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block mb-2">
                OLD DOCK ASSIGNMENT (FAILED)
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold font-mono text-slate-900">
                    {failedDock.name}
                  </div>
                  <div className="text-xs text-red-600 font-mono mt-0.5">
                    Status: BLOCKED (Hydraulic Lift Failure)
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* New Recommendation */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 relative">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-2">
                RECOMMENDED ALTERNATIVE DOCK
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold font-mono text-emerald-700 flex items-center space-x-2">
                    <span>{recommendation.bestDockName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-200">
                      Score: {bestCandidate?.totalScore}/100
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 font-mono mt-0.5">
                    Immediate Available Refrigerated Dock
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Explainable Decision Support Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-blue-600">
              <FileCheck className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Transparent Allocation Reasoning &amp; Impact Analysis
              </h4>
            </div>

            <p className="text-xs text-slate-700 font-mono leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
              {recommendation.explanation}
            </p>

            {bestCandidate && bestCandidate.reasons && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Scoring Criteria Breakdown:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {bestCandidate.reasons.map((r: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 text-xs"
                    >
                      <span className="text-slate-700">{r.factor}:</span>
                      <span className="font-mono text-emerald-700 font-semibold">
                        +{r.points} / {r.maxPoints} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="text-xs text-slate-400 font-mono">
            Actor: <span className="text-slate-800 font-semibold">Marcus Vance (Operator)</span>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition cursor-pointer flex-1 sm:flex-initial text-center"
            >
              Dismiss
            </button>
            <button
              onClick={handleApprove}
              disabled={submitting || !recommendation?.bestDockId}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition disabled:opacity-50 shadow-sm cursor-pointer flex-1 sm:flex-initial"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Approve Emergency Reassignment to {recommendation.bestDockId}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
