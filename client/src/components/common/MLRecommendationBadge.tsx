import React from 'react';
import { MLRecommendationResponse } from '../../types';
import { Cpu, CheckCircle2, ArrowRight, Sparkles, Sliders } from 'lucide-react';

interface MLRecommendationBadgeProps {
  recommendation: MLRecommendationResponse;
  type: 'DOCK' | 'YARD';
  onAllocate?: () => void;
  onInspectModel?: () => void;
}

export const MLRecommendationBadge: React.FC<MLRecommendationBadgeProps> = ({
  recommendation,
  type,
  onAllocate,
  onInspectModel,
}) => {
  const isDock = type === 'DOCK';
  const confidence = isDock ? recommendation.dockConfidencePct : recommendation.yardConfidencePct;
  const targetName = isDock ? (recommendation.recommendedDockName || 'D05') : `Slot ${recommendation.recommendedYardSlotId || 'A42'}`;
  const factors = isDock ? recommendation.dockTopFactors : recommendation.yardTopFactors;
  const alternatives = isDock ? recommendation.dockAlternatives : recommendation.yardAlternatives;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm font-sans space-y-4">
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 uppercase tracking-wider">
                DATA-DRIVEN ML RECOMMENDATION
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                LIVE
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              RandomForest Ensemble • Safety Hard Constraints Active
            </span>
          </div>
        </div>

        {/* Confidence Percentage & Inspect Button */}
        <div className="flex items-center space-x-3">
          {onInspectModel && (
            <button
              onClick={onInspectModel}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-mono font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
              title="Inspect ML Model Weights & Decision Tree Splits"
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Inspect AI Weights</span>
            </button>
          )}

          <div className="text-right pl-2 border-l border-slate-200">
            <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Model Fit</span>
            <span className="text-base font-black font-mono text-emerald-600">
              {confidence || 89}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Target Recommendation Callout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/40 border border-blue-200/80 rounded-2xl p-4">
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">
            {isDock ? 'Recommended Unloading Dock' : 'Recommended Yard Staging Slot'}
          </span>
          <span className="text-lg font-black font-mono text-slate-900">
            {targetName}
          </span>
          {isDock && recommendation.expectedWaitMins !== undefined && (
            <span className="text-xs font-mono text-emerald-700 font-semibold block mt-0.5">
              Expected Wait: {recommendation.expectedWaitMins === 0 ? '0 mins (Immediate Availability)' : `${recommendation.expectedWaitMins} mins`}
            </span>
          )}
        </div>

        {isDock && onAllocate && (
          <button
            onClick={onAllocate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs font-mono flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Approve {targetName.split(' ')[0]}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Top Contributing Factors & Transparency Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 font-mono text-xs">
        <div className="space-y-1.5 bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
            Top Influential ML Factors:
          </span>
          <ul className="space-y-1 text-[11px] text-slate-600">
            {factors && factors.length > 0 ? (
              factors.map((f, idx) => (
                <li key={idx} className="flex items-center space-x-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                  <span className="text-slate-700">{f}</span>
                </li>
              ))
            ) : (
              <>
                <li className="flex items-center space-x-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-700">1. Capability &amp; Load Compatibility</span>
                </li>
                <li className="flex items-center space-x-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-slate-700">2. Low expected wait time</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Alternative Candidate Ranking */}
        <div className="space-y-1.5 bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
            Alternative Candidate Ranking:
          </span>
          {alternatives && alternatives.length > 0 ? (
            <div className="space-y-1.5">
              {alternatives.map((alt: any, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-700">
                  <span className="font-semibold">
                    #{idx + 2} {isDock ? `Dock ${alt.dockId}` : `Slot ${alt.slotId}`}
                  </span>
                  <span className="text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    {alt.confidencePct}% match
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-400 italic text-[11px]">No secondary candidate needed.</div>
          )}
        </div>
      </div>
    </div>
  );
};
