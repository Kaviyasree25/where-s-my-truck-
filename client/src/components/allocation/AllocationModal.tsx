import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { AllocationRecommendation, Shipment, DockScoreResult } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  X,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface AllocationModalProps {
  shipment: Shipment;
  onClose: () => void;
  onAssigned: () => void;
}

export const AllocationModal: React.FC<AllocationModalProps> = ({
  shipment,
  onClose,
  onAssigned,
}) => {
  const [recommendation, setRecommendation] = useState<AllocationRecommendation | null>(null);
  const [selectedDockId, setSelectedDockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvaluation();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [shipment.id]);

  const fetchEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.evaluateAllocation(shipment.id);
      setRecommendation(data);
      if (data.bestDockId) setSelectedDockId(data.bestDockId);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate dock allocation');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedDockId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.assignDock(shipment.id, shipment.trailerId, selectedDockId, 'Marcus Vance (Operator)');
      onAssigned();
    } catch (err: any) {
      setError(err.message || 'Failed to assign dock');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCandidate = recommendation?.candidateScores.find(c => c.dockId === selectedDockId);

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-wide truncate">
                SMART DOCK ALLOCATION RECOMMENDATION ENGINE
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 font-mono truncate">
                Shipment {shipment.id} | Trailer {shipment.trailerId} ({shipment.loadType})
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

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span className="text-xs font-mono text-slate-400">
                Evaluating candidate docks against cold-chain, turnaround, and queue constraints...
              </span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-mono">
              {error}
            </div>
          ) : (
            recommendation && (
              <>
                {/* AI Explanation Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 via-slate-50 to-indigo-500/10 border border-blue-200/50 space-y-1.5">
                  <div className="flex items-center space-x-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Algorithmic Recommendation Summary</span>
                  </div>
                  <p className="text-xs text-slate-700 font-mono leading-relaxed">
                    {recommendation.explanation}
                  </p>
                </div>

                {/* Candidate Doors List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 uppercase font-bold">Candidate Dock Doors</span>
                    <span className="text-slate-500">Ranked by Total Weighted Score (0-100)</span>
                  </div>

                  <div className="space-y-2">
                    {recommendation.candidateScores.map((candidate) => {
                      const isSelected = candidate.dockId === selectedDockId;
                      return (
                        <div
                          key={candidate.dockId}
                          onClick={() => {
                            if (candidate.isFeasible) setSelectedDockId(candidate.dockId);
                          }}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl border transition cursor-pointer gap-2 sm:gap-4 ${
                            !candidate.isFeasible
                              ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                              : isSelected
                              ? 'bg-blue-50 border-blue-300 text-slate-900 shadow-md'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-3 sm:space-x-4">
                            <div
                              className={`p-2.5 rounded-lg font-mono font-bold text-sm shrink-0 ${
                                !candidate.isFeasible
                                  ? 'bg-red-50 text-red-600 border border-red-200'
                                  : isSelected
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {candidate.dockId}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="font-bold text-sm text-slate-900">
                                  {candidate.dockName}
                                </span>
                                {candidate.isFeasible ? (
                                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-700 border border-emerald-200">
                                    Feasible Fit
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-500/20 text-red-600 border border-red-200">
                                    Constraint Failed
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-mono mt-0.5">
                                {candidate.isFeasible
                                  ? `${candidate.distanceMeters}m from Yard Slot • Queue: ${candidate.queueLength} trailers (${candidate.expectedWaitMinutes}m wait)`
                                  : candidate.hardConstraintFailedReason}
                              </p>
                            </div>
                          </div>

                          {candidate.isFeasible ? (
                            <div className="text-left sm:text-right shrink-0">
                              <div className="text-lg font-bold font-mono text-emerald-700">
                                {candidate.totalScore}{' '}
                                <span className="text-xs text-slate-400">/ 100</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Weighted Score
                              </span>
                            </div>
                          ) : (
                            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Dock Detailed Reason Card */}
                {selectedCandidate && selectedCandidate.isFeasible && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                      Detailed Scoring Breakdown for Dock {selectedCandidate.dockId}
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {selectedCandidate.reasons.map((r, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded bg-white border border-slate-200 text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <CheckCircle2
                              className={`w-4 h-4 ${r.satisfied ? 'text-emerald-700' : 'text-slate-400'}`}
                            />
                            <div>
                              <span className="font-semibold text-slate-800 block">{r.factor}</span>
                              <span className="text-[10px] text-slate-400">{r.note}</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-blue-600">
                            +{r.points} / {r.maxPoints} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleAssign}
            disabled={submitting || !selectedDockId}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Approve Dock Assignment ({selectedDockId})</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
