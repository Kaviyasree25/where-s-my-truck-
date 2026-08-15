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
      <div className="bg-slate-50/80 text-slate-900 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                Smart Dynamic Inbound Queue
              </h3>
              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                EXPLAINABLE AI ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Rule-Based Priority Score: Urgency + Dwell Time - ETA Variance &amp; Demurrage Risk
            </p>
          </div>
        </div>

        {/* Highest Priority Top Callout */}
        {topTrailer && (
          <div className="bg-white border border-slate-200 shadow-2xs rounded-xl px-4 py-2 flex items-center space-x-4">
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Highest Priority</span>
              <span className="text-sm font-bold font-mono text-blue-700">{topTrailer.trailerId}</span>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Score</span>
              <span className="text-sm font-extrabold font-mono text-slate-900">{topTrailer.priorityScore}</span>
            </div>
            <div className="h-7 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Demurrage Risk</span>
              <span className="text-xs font-bold font-mono text-rose-700 uppercase">
                {topTrailer.demurrageRisk === 'HIGH_RISK' ? 'HIGH / APPROACHING' : topTrailer.demurrageRisk}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Featured #1 Spotlight Card */}
      {topTrailer && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-slate-50 to-blue-500/10 border-b border-slate-200">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                <span className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-black font-mono text-xs shadow-sm">
                  TOP PRIORITY #1
                </span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {topTrailer.trailerId}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Carrier: <strong className="text-slate-800">{topTrailer.carrierName}</strong>
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Slot {topTrailer.currentSlotId}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                  {topTrailer.loadType}
                </span>
              </div>

              {/* Priority Score Breakdown */}
              <div className="flex items-center space-x-2 text-xs font-mono pt-1">
                <span className="text-slate-500">Priority Score:</span>
                <span className="font-extrabold text-blue-700 text-sm">{topTrailer.priorityScore}</span>
                <span className="text-slate-400">=</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold" title="Inventory Urgency">
                  Inventory Urgency: +{topTrailer.breakdown.inventoryUrgency}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold" title="Dwell Time Score">
                  Dwell Time: +{topTrailer.breakdown.dwellTimeScore}
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold" title="ETA Variance">
                  ETA Variance: {topTrailer.breakdown.etaVariance}
                </span>
              </div>

              {/* Explainable Reason */}
              <div className="bg-white/80 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 font-mono flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block">Explainable Recommendation Reason:</span>
                  <span className="italic text-slate-700">"{topTrailer.reason}"</span>
                </div>
              </div>
            </div>

            {/* Demurrage Risk Indicator Widget */}
            <div className="bg-white border border-red-200 rounded-xl p-4 min-w-[240px] space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono border-b border-slate-100 pb-2">
                <span className="text-slate-500 uppercase font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                  <span>Demurrage Risk</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-extrabold">
                  HIGH / APPROACHING
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">Dwell Time</span>
                  <span className="font-bold text-slate-900">{topTrailer.formattedDwellTime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Threshold</span>
                  <span className="font-bold text-slate-900">2h 00m</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Remaining</span>
                  <span className="font-bold text-red-600 animate-pulse">{topTrailer.formattedRemainingTime}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Risk State</span>
                  <span className="font-bold text-amber-600">HIGH RISK</span>
                </div>
              </div>

              <button
                onClick={() => onSelectAllocation(topTrailer.shipmentId)}
                className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm"
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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-500 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4">Rank / Trailer ID</th>
              <th className="py-3 px-4">Carrier / Slot</th>
              <th className="py-3 px-4">Load Type</th>
              <th className="py-3 px-4">Priority Score</th>
              <th className="py-3 px-4">Score Breakdown</th>
              <th className="py-3 px-4">Dwell / Demurrage</th>
              <th className="py-3 px-4">Demurrage Risk</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {queue.map((item, idx) => (
              <tr
                key={item.trailerId}
                className={`hover:bg-slate-50 transition ${idx === 0 ? 'bg-amber-50/50' : ''}`}
              >
                <td className="py-3 px-4 font-bold text-slate-900">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                        idx === 0
                          ? 'bg-amber-500 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span>{item.trailerId}</span>
                  </div>
                </td>

                <td className="py-3 px-4">
                  <div className="text-slate-800 font-semibold">{item.carrierName}</div>
                  <div className="text-[10px] text-slate-400">Slot {item.currentSlotId}</div>
                </td>

                <td className="py-3 px-4 text-slate-700">
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]">
                    {item.loadType}
                  </span>
                </td>

                <td className="py-3 px-4 font-extrabold text-blue-700 text-sm">
                  {item.priorityScore}
                </td>

                <td className="py-3 px-4 text-[11px]">
                  <span className="text-emerald-700 font-semibold">+{item.breakdown.inventoryUrgency} Urg</span>
                  {' | '}
                  <span className="text-amber-700 font-semibold">+{item.breakdown.dwellTimeScore} Dwell</span>
                  {' | '}
                  <span className="text-rose-700 font-semibold">{item.breakdown.etaVariance} Var</span>
                </td>

                <td className="py-3 px-4 text-slate-700">
                  <div>{item.formattedDwellTime}</div>
                  <div className="text-[10px] text-slate-400">Rem: {item.formattedRemainingTime}</div>
                </td>

                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.demurrageRisk === 'HIGH_RISK' || item.demurrageRisk === 'DEMURRAGE_RISK'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : item.demurrageRisk === 'WARNING'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {item.demurrageRisk === 'HIGH_RISK' ? 'HIGH RISK' : item.demurrageRisk}
                  </span>
                </td>

                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onSelectAllocation(item.shipmentId)}
                    className="px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-semibold transition"
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
