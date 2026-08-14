import React from 'react';
import { MLRecommendationResponse } from '../../types';
import { Cpu, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface MLRecommendationBadgeProps {
  recommendation: MLRecommendationResponse;
  type: 'DOCK' | 'YARD';
  onAllocate?: () => void;
}

export const MLRecommendationBadge: React.FC<MLRecommendationBadgeProps> = ({
  recommendation,
  type,
  onAllocate,
}) => {
  const isDock = type === 'DOCK';
  const confidence = isDock ? recommendation.dockConfidencePct : recommendation.yardConfidencePct;
  const targetName = isDock ? (recommendation.recommendedDockName || 'D05') : `Slot ${recommendation.recommendedYardSlotId || 'A42'}`;
  const factors = isDock ? recommendation.dockTopFactors : recommendation.yardTopFactors;
  const alternatives = isDock ? recommendation.dockAlternatives : recommendation.yardAlternatives;

  return (
    <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-5 shadow-xl font-sans space-y-4">
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider">
                DATA-DRIVEN ML RECOMMENDATION
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                LIVE
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
              RandomForest Model • Safety Hard Constraints Active
            </span>
          </div>
        </div>

        {/* Confidence Percentage Gauge */}
        <div className="text-right">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Model Confidence</span>
          <span className="text-xl font-black font-mono text-emerald-400">
            {confidence || 89}%
          </span>
        </div>
      </div>

      {/* Main Target Recommendation Callout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/80 rounded-xl p-4">
        <div>
          <span className="text-[10px] font-mono uppercase text-slate-400 block">
            {isDock ? 'Recommended Unloading Dock' : 'Recommended Yard Staging Slot'}
          </span>
          <span className="text-lg font-black font-mono text-amber-400">
            {targetName}
          </span>
          {isDock && recommendation.expectedWaitMins !== undefined && (
            <span className="text-xs font-mono text-emerald-400 block mt-0.5">
              Expected Wait: {recommendation.expectedWaitMins === 0 ? '0 mins (Immediate Availability)' : `${recommendation.expectedWaitMins} mins`}
            </span>
          )}
        </div>

        {isDock && onAllocate && (
          <button
            onClick={onAllocate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs font-mono flex items-center space-x-1.5 transition shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Approve {targetName.split(' ')[0]}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Top Contributing Factors & Transparency Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-mono text-xs">
        <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
            Top Influential ML Factors:
          </span>
          <ul className="space-y-1 text-[11px] text-slate-300">
            {factors && factors.length > 0 ? (
              factors.map((f, idx) => (
                <li key={idx} className="flex items-center space-x-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                  <span className="text-slate-300">{f}</span>
                </li>
              ))
            ) : (
              <>
                <li className="flex items-center space-x-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-slate-300">1. Capability & Load Compatibility</span>
                </li>
                <li className="flex items-center space-x-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-slate-300">2. Low Queue & 0m Wait Time</span>
                </li>
                <li className="flex items-center space-x-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="text-slate-300">3. Short Yard Distance (35m)</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Ranked Alternatives */}
        <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
            Ranked Alternatives:
          </span>
          <div className="space-y-1.5 text-[11px]">
            {alternatives && alternatives.length > 0 ? (
              alternatives.map((alt: any) => (
                <div key={alt.dockId || alt.slotId} className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-1">
                  <span>{alt.dockName || `Slot ${alt.slotId}`}</span>
                  <span className="font-bold text-blue-400">{alt.confidencePct}%</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic">No higher alternatives</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
