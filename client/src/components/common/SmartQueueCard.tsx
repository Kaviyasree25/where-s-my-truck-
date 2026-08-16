import React from 'react';
import { SmartQueueItem } from '../../types';
import { Sparkles, Clock, AlertTriangle, ShieldAlert, ArrowUpRight, CheckCircle2, ChevronRight, Info } from 'lucide-react';

interface SmartQueueCardProps {
  queue: SmartQueueItem[];
  onSelectAllocation: (shipmentId: string) => void;
}

export const SmartQueueCard: React.FC<SmartQueueCardProps> = ({ queue, onSelectAllocation }) => {
  if (!queue || queue.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-500 text-xs font-mono">
        No trailers currently waiting in inbound queue.
      </div>
    );
  }

  const topTrailer = queue[0];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="bg-slate-50/90 text-slate-900 px-4 sm:px-6 py-3 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-200">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-[11px] font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 uppercase tracking-wider whitespace-nowrap">
                SMART DYNAMIC INBOUND QUEUE
              </span>
              <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                LIVE
              </span>
            </div>
            <span className="text-[10px] font-mono block mt-0.5">
              Priority Score: Urgency + Dwell Time − ETA Variance &amp; Demurrage Risk
            </span>
          </div>
        </div>

        {/* Highest Priority Top Callout Widget */}
        {topTrailer && (
          <div className="bg-white border border-slate-200/90 shadow-2xs rounded-xl px-3 py-1.5 flex items-center justify-between sm:justify-start space-x-3 shrink-0 font-mono">
            <div>
              <span className="text-[9px] uppercase text-slate-400 block font-bold whitespace-nowrap">Highest Priority</span>
              <span className="text-xs sm:text-sm font-black text-blue-700 whitespace-nowrap">{topTrailer.trailerId}</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[9px] uppercase text-slate-400 block font-bold whitespace-nowrap">Score</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 whitespace-nowrap">{topTrailer.priorityScore}</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[9px] uppercase text-slate-400 block font-bold whitespace-nowrap">Demurrage Risk</span>
              <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap block mt-0.5">
                {topTrailer.demurrageRisk === 'HIGH_RISK' || topTrailer.demurrageRisk === 'DEMURRAGE_RISK'
                  ? 'HIGH RISK'
                  : topTrailer.demurrageRisk === 'WARNING'
                    ? 'WARNING'
                    : 'OPTIMAL'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Featured #1 Spotlight Card */}
      {topTrailer && (
        <div className="p-3.5 sm:p-5 bg-gradient-to-br from-amber-500/10 via-slate-50 to-blue-500/10 border-b border-slate-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-2.5 flex-1 w-full">
              <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black font-mono text-[11px] sm:text-xs shadow-2xs whitespace-nowrap">
                  TOP PRIORITY #1
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono whitespace-nowrap">
                  {topTrailer.trailerId}
                </span>
                <span className="text-xs font-mono text-slate-500 whitespace-nowrap">
                  Carrier: <strong className="text-slate-800 font-bold">{topTrailer.carrierName}</strong>
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium whitespace-nowrap">
                  Slot {topTrailer.currentSlotId}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold whitespace-nowrap">
                  {topTrailer.loadType}
                </span>
              </div>

              {/* Priority Score Breakdown Formula */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs font-mono pt-1 overflow-x-auto no-scrollbar pb-0.5">
                <span className="text-slate-500 whitespace-nowrap font-medium">Priority Score:</span>
                <span className="font-black text-blue-700 text-sm whitespace-nowrap">{topTrailer.priorityScore}</span>
                <span className="text-slate-400 font-bold">=</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold whitespace-nowrap shrink-0" title="Inventory Urgency">
                  Inventory Urgency: +{topTrailer.breakdown.inventoryUrgency}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold whitespace-nowrap shrink-0" title="Dwell Time Score">
                  Dwell Time: +{topTrailer.breakdown.dwellTimeScore}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-bold whitespace-nowrap shrink-0" title="ETA Variance">
                  ETA Variance: {topTrailer.breakdown.etaVariance}
                </span>
              </div>

              {/* Explainable Reason */}
              <div className="bg-white border border-slate-200/90 rounded-xl p-3 text-xs text-slate-700 font-mono flex items-start space-x-2.5 shadow-2xs">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Explainable Recommendation Reason:</span>
                  <span className="italic text-slate-700">"{topTrailer.reason}"</span>
                </div>
              </div>
            </div>

            {/* Demurrage Risk Indicator Widget */}
            <div className="bg-white border border-red-200/90 rounded-2xl p-4 w-full lg:w-auto lg:min-w-[250px] space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-mono border-b border-slate-100 pb-2">
                <span className="text-slate-500 uppercase font-bold flex items-center space-x-1.5 whitespace-nowrap">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                  <span>Demurrage Risk</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-black text-[10px] whitespace-nowrap border border-red-200">
                  HIGH RISK
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-0.5">
                <div>
                  <span className="text-[10px] text-slate-400 block whitespace-nowrap">Dwell Time</span>
                  <span className="font-bold text-slate-900 whitespace-nowrap">{topTrailer.formattedDwellTime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block whitespace-nowrap">Threshold</span>
                  <span className="font-bold text-slate-900 whitespace-nowrap">2h 00m</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block whitespace-nowrap">Remaining</span>
                  <span className="font-bold text-red-600 animate-pulse whitespace-nowrap">{topTrailer.formattedRemainingTime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block whitespace-nowrap">Risk State</span>
                  <span className="font-bold text-rose-600 whitespace-nowrap">HIGH RISK</span>
                </div>
              </div>

              <button
                onClick={() => onSelectAllocation(topTrailer.shipmentId)}
                className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Allocate Dock Now</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Queue List Table */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[780px] text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="bg-slate-100 text-slate-500 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 whitespace-nowrap">Rank / Trailer ID</th>
              <th className="py-3 px-4 whitespace-nowrap">Carrier / Slot</th>
              <th className="py-3 px-4 whitespace-nowrap">Load Type</th>
              <th className="py-3 px-4 whitespace-nowrap">Priority Score</th>
              <th className="py-3 px-4 whitespace-nowrap">Score Breakdown</th>
              <th className="py-3 px-4 whitespace-nowrap">Dwell / Demurrage</th>
              <th className="py-3 px-4 whitespace-nowrap">Demurrage Risk</th>
              <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {queue.map((item, idx) => (
              <tr
                key={item.trailerId}
                className={`hover:bg-slate-50 transition ${idx === 0 ? 'bg-amber-50/50' : ''}`}
              >
                <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0
                          ? 'bg-amber-500 text-slate-950'
                          : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="whitespace-nowrap">{item.trailerId}</span>
                  </div>
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="text-slate-800 font-semibold whitespace-nowrap">{item.carrierName}</div>
                  <div className="text-[10px] text-slate-400 whitespace-nowrap">Slot {item.currentSlotId}</div>
                </td>

                <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] whitespace-nowrap">
                    {item.loadType}
                  </span>
                </td>

                <td className="py-3 px-4 font-extrabold text-blue-700 text-sm whitespace-nowrap">
                  {item.priorityScore}
                </td>

                <td className="py-3 px-4 text-[11px] whitespace-nowrap">
                  <span className="text-emerald-700 font-semibold whitespace-nowrap">+{item.breakdown.inventoryUrgency} Urg</span>
                  {' | '}
                  <span className="text-amber-700 font-semibold whitespace-nowrap">+{item.breakdown.dwellTimeScore} Dwell</span>
                  {' | '}
                  <span className="text-rose-700 font-semibold whitespace-nowrap">{item.breakdown.etaVariance} Var</span>
                </td>

                <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                  <div className="whitespace-nowrap">{item.formattedDwellTime}</div>
                  <div className="text-[10px] text-slate-400 whitespace-nowrap">Rem: {item.formattedRemainingTime}</div>
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${item.demurrageRisk === 'HIGH_RISK' || item.demurrageRisk === 'DEMURRAGE_RISK'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : item.demurrageRisk === 'WARNING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                  >
                    {item.demurrageRisk === 'HIGH_RISK' ? 'HIGH RISK' : item.demurrageRisk}
                  </span>
                </td>

                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <button
                    onClick={() => onSelectAllocation(item.shipmentId)}
                    className="px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-semibold transition whitespace-nowrap cursor-pointer"
                  >
                    Smart Dock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
