import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Building2,
  Grid,
  ShieldCheck,
  Zap,
  Activity,
  Flame,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
} from 'lucide-react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { AnalyticsKPIs, Dock, YardState, Exception, Shipment } from '../types';
import { KPICard } from '../components/common/KPICard';
import { AnimatedCounter } from '../components/common/AnimatedCounter';
import { useSlidingIndicator } from '../hooks/useSlidingIndicator';

export const AnalyticsPage: React.FC = () => {
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [yardData, setYardData] = useState<YardState | null>(null);
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'TODAY' | 'WEEK' | 'MONTH'>('TODAY');
  const [heatmapFilter, setHeatmapFilter] = useState<'ALL' | 'DOCKS' | 'YARD'>('ALL');
  const [hoveredCell, setHoveredCell] = useState<{ label: string; hour: string; value: number } | null>(null);

  const { containerRef: timeRangeContainerRef, indicatorStyle: timeRangeIndicatorStyle } = useSlidingIndicator(timeRange);
  const { containerRef: heatmapFilterContainerRef, indicatorStyle: heatmapFilterIndicatorStyle } = useSlidingIndicator(heatmapFilter);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [kpiRes, docksRes, yardRes, exceptionsRes, shipmentsRes, heatmapRes] = await Promise.all([
        api.getAnalyticsKPIs(),
        api.getDocks(),
        api.getYardState(),
        api.getExceptions(),
        api.getShipments(),
        api.getAnalyticsHeatmap(),
      ]);

      setKpis(kpiRes);
      setDocks(docksRes);
      setYardData(yardRes);
      setExceptions(exceptionsRes);
      setShipments(shipmentsRes);
      setHeatmapData(heatmapRes);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();

    const socket = getSocket();
    const onOpsChange = () => fetchAnalyticsData();

    socket.on('OPERATIONAL_STATE_CHANGED', onOpsChange);
    socket.on('DOCK_FAILURE_EVENT', onOpsChange);
    socket.on('DEMO_RESET_EVENT', onOpsChange);
    socket.on('SENSOR_MATCH_EVENT', onOpsChange);
    socket.on('SENSOR_MISMATCH_EVENT', onOpsChange);

    return () => {
      socket.off('OPERATIONAL_STATE_CHANGED', onOpsChange);
      socket.off('DOCK_FAILURE_EVENT', onOpsChange);
      socket.off('DEMO_RESET_EVENT', onOpsChange);
      socket.off('SENSOR_MATCH_EVENT', onOpsChange);
      socket.off('SENSOR_MISMATCH_EVENT', onOpsChange);
    };
  }, []);

  // ─── 1. Live Dock Utilization Data (Computed from active state) ────────────
  const liveDockData = useMemo(() => {
    if (!docks || docks.length === 0) {
      return [
        { name: 'D01', fullName: 'D01 (Dry)', utilization: 85, type: 'DRY_VAN', status: 'OCCUPIED' },
        { name: 'D02', fullName: 'D02 (Dry)', utilization: 40, type: 'DRY_VAN', status: 'AVAILABLE' },
        { name: 'D03', fullName: 'D03 (Flatbed)', utilization: 90, type: 'FLATBED', status: 'OCCUPIED' },
        { name: 'D04', fullName: 'D04 (Reefer)', utilization: 95, type: 'REFRIGERATED', status: 'MAINTENANCE' },
        { name: 'D05', fullName: 'D05 (Reefer)', utilization: 60, type: 'REFRIGERATED', status: 'AVAILABLE' },
        { name: 'D06', fullName: 'D06 (Hazmat)', utilization: 25, type: 'HAZMAT', status: 'AVAILABLE' },
      ];
    }

    return docks.map(d => {
      let util = 25;
      if (d.status === 'OCCUPIED' || d.status === 'RESERVED') util = 92;
      else if (d.status === 'MAINTENANCE' || d.status === 'BLOCKED') util = 0;
      else if (d.dockType === 'REFRIGERATED') util = 65;
      else if (d.dockType === 'HEAVY_DUTY') util = 75;
      else util = 50;

      const typeShort = d.dockType === 'REFRIGERATED' ? 'Reefer' : d.dockType === 'HEAVY_DUTY' ? 'Heavy' : 'Standard';

      return {
        name: d.id,
        fullName: `${d.id} (${typeShort})`,
        utilization: util,
        status: d.status,
        dockType: d.dockType,
      };
    });
  }, [docks]);

  // ─── 2. Hourly Wait & Turnaround Trends ────────────────────────────────────
  const waitTrendData = useMemo(() => [
    { time: '06:00', waitMinutes: 10, turnaround: 32, target: 45 },
    { time: '08:00', waitMinutes: 16, turnaround: 36, target: 45 },
    { time: '10:00', waitMinutes: 28, turnaround: 42, target: 45 },
    { time: '12:00', waitMinutes: 34, turnaround: 48, target: 45 },
    { time: '14:00', waitMinutes: 26, turnaround: 39, target: 45 },
    { time: '16:00', waitMinutes: 20, turnaround: 35, target: 45 },
    { time: '18:00', waitMinutes: 12, turnaround: 30, target: 45 },
  ], []);

  // ─── 3. Hourly Yard Occupancy Trend ─────────────────────────────────────────
  const yardTrendData = useMemo(() => {
    const currentOcc = yardData?.occupancyPercent || 38;
    return [
      { time: '06:00', occupancy: 28, safeLimit: 80 },
      { time: '08:00', occupancy: 45, safeLimit: 80 },
      { time: '10:00', occupancy: 62, safeLimit: 80 },
      { time: '12:00', occupancy: 76, safeLimit: 80 },
      { time: '14:00', occupancy: currentOcc, safeLimit: 80 },
      { time: '16:00', occupancy: Math.max(30, currentOcc - 8), safeLimit: 80 },
      { time: '18:00', occupancy: Math.max(20, currentOcc - 15), safeLimit: 80 },
    ];
  }, [yardData]);

  // ─── 4. Live Exception Distribution ─────────────────────────────────────────
  const exceptionPieData = useMemo(() => {
    const counts: { [key: string]: number } = {
      'Demurrage Dwell': 0,
      'Shipment Delay': 0,
      'Dock Failure': 0,
      'Location Mismatch': 0,
    };

    if (exceptions && exceptions.length > 0) {
      exceptions.forEach(ex => {
        if (ex.type === 'EXTENDED_PROCESSING' || ex.type === 'YARD_CONGESTION') counts['Demurrage Dwell']++;
        else if (ex.type === 'SHIPMENT_DELAY' || ex.type === 'MISSED_APPOINTMENT') counts['Shipment Delay']++;
        else if (ex.type === 'DOCK_FAILURE') counts['Dock Failure']++;
        else if (ex.type === 'YARD_LOCATION_MISMATCH') counts['Location Mismatch']++;
        else counts['Demurrage Dwell']++;
      });
    } else {
      counts['Demurrage Dwell'] = 1;
    }

    const colors: { [key: string]: string } = {
      'Demurrage Dwell': '#EF4444',
      'Shipment Delay': '#06B6D4',
      'Dock Failure': '#F59E0B',
      'Location Mismatch': '#8B5CF6',
    };

    return Object.keys(counts)
      .filter(k => counts[k] > 0)
      .map(k => ({
        name: k,
        value: counts[k],
        color: colors[k],
      }));
  }, [exceptions]);

  // ─── 5. Heatmap Cell Intensity Color Helper ─────────────────────────────────
  const getCellColor = (val: number, isMaint: boolean) => {
    if (isMaint) return 'bg-rose-100/70 border-rose-300 text-rose-800';
    if (val === 0) return 'bg-slate-50 text-slate-300 border-slate-100';
    if (val < 35) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (val < 65) return 'bg-blue-50 text-blue-800 border-blue-200';
    if (val < 85) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-500 text-white border-rose-600 font-bold';
  };

  const heatmapRows = useMemo(() => {
    if (!heatmapData) return [];
    const rows: any[] = [];

    if (heatmapFilter === 'ALL' || heatmapFilter === 'DOCKS') {
      heatmapData.docks?.forEach((d: any) => {
        rows.push({
          id: d.id,
          label: `Dock ${d.id}`,
          subLabel: d.type || 'Standard',
          type: 'DOCK',
          status: d.status,
          hourly: d.hourly,
        });
      });
    }

    if (heatmapFilter === 'ALL' || heatmapFilter === 'YARD') {
      heatmapData.yardZones?.forEach((z: any) => {
        rows.push({
          id: z.id,
          label: z.name.split(' - ')[0],
          subLabel: z.name.split(' - ')[1] || 'Yard Zone',
          type: 'YARD',
          status: z.currentOccupancyPercent >= 80 ? 'CONGESTED' : 'NORMAL',
          hourly: z.hourly,
        });
      });
    }

    return rows;
  }, [heatmapData, heatmapFilter]);

  return (
    <div className="space-y-5 font-mono">
      {/* ─── Page Title & Executive Controls ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight font-sans">
              Warehouse Inbound Analytics &amp; Heatmap
            </h2>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center space-x-1 whitespace-nowrap shrink-0 font-mono">
              <Activity className="w-3 h-3 text-emerald-600 animate-pulse shrink-0" />
              <span>LIVE TELEMETRY SYNC</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Real-time dock utilization, 24-hour congestion heatmaps &amp; automated demurrage savings
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Time range selector */}
          <div
            ref={timeRangeContainerRef}
            className="relative flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs shrink-0 overflow-x-auto no-scrollbar"
          >
            {/* Single persistent sliding pill with zero distortion and perfect rounded corners */}
            <div
              className="absolute top-0 left-0 bg-white rounded-lg shadow-xs pointer-events-none transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.3,1)]"
              style={{
                transform: timeRangeIndicatorStyle.transform,
                width: `${timeRangeIndicatorStyle.width}px`,
                height: `${timeRangeIndicatorStyle.height}px`,
                opacity: timeRangeIndicatorStyle.opacity,
                willChange: 'transform, width',
              }}
            />

            {(['TODAY', 'WEEK', 'MONTH'] as const).map(range => {
              const isActive = timeRange === range;
              return (
                <button
                  key={range}
                  data-active={isActive}
                  onClick={() => setTimeRange(range)}
                  className={`relative px-2.5 sm:px-3 py-1 rounded-lg font-bold whitespace-nowrap cursor-pointer select-none border-0 bg-transparent transition-colors duration-150 z-10 ${
                    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {range === 'TODAY' ? 'Today (Live)' : range === 'WEEK' ? '7 Days' : '30 Days'}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchAnalyticsData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer shadow-2xs shrink-0"
            title="Refresh Live Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Executive KPI Cards with Animated Numbers ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        <KPICard
          title="Avg Turnaround Time"
          value={<AnimatedCounter value={heatmapData?.metrics?.avgTurnaroundMins || 38} suffix=" min" />}
          subtitle="Target: ≤ 45 min (-31% vs Baseline)"
          icon={Clock}
          trend={{ value: '31% Faster', isPositive: true }}
          highlightColor="emerald"
        />
        <KPICard
          title="Demurrage Avoided"
          value={<AnimatedCounter value={heatmapData?.metrics?.demurrageSavedDollars || 18450} prefix="$" />}
          subtitle="Detention Fees Saved This Mo."
          icon={DollarSign}
          trend={{ value: '+$4.2k vs Last Mo', isPositive: true }}
          highlightColor="blue"
        />
        <KPICard
          title="Live Dock Utilization"
          value={<AnimatedCounter value={kpis?.dockUtilizationPercent || 33} suffix="%" />}
          subtitle="6 Active Heavy / Cold / Dry Bays"
          icon={Building2}
          trend={{ value: 'Optimal Balance', isPositive: true }}
          highlightColor="emerald"
        />
        <KPICard
          title="Active Exception Resolution"
          value={<AnimatedCounter value={94.2} decimals={1} suffix="%" />}
          subtitle={`${kpis?.activeExceptionsCount || 1} Pending Resolution`}
          icon={ShieldCheck}
          trend={{ value: 'Above SLA (90%)', isPositive: true }}
          highlightColor={kpis && kpis.activeExceptionsCount > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* ─── 24-Hour Inbound Congestion Heatmap Matrix ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase font-sans">
                24-Hour Dock &amp; Yard Congestion Heatmap Matrix
              </h3>
              <p className="text-[11px] text-slate-500 font-sans">
                Hourly throughput density across all 6 Dock Doors and 3 Yard Staging Zones
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <div
              ref={heatmapFilterContainerRef}
              className="relative flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shrink-0"
            >
              {/* Single persistent sliding pill with zero distortion and perfect rounded corners */}
              <div
                className="absolute top-0 left-0 bg-white rounded-lg shadow-xs pointer-events-none transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.3,1)]"
                style={{
                  transform: heatmapFilterIndicatorStyle.transform,
                  width: `${heatmapFilterIndicatorStyle.width}px`,
                  height: `${heatmapFilterIndicatorStyle.height}px`,
                  opacity: heatmapFilterIndicatorStyle.opacity,
                  willChange: 'transform, width',
                }}
              />

              {[
                { id: 'ALL', label: `All (${heatmapData?.docks?.length + (heatmapData?.yardZones?.length || 0) || 9})` },
                { id: 'DOCKS', label: 'Docks (6)' },
                { id: 'YARD', label: 'Yard Zones (3)' },
              ].map(tab => {
                const isActive = heatmapFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    data-active={isActive}
                    onClick={() => setHeatmapFilter(tab.id as any)}
                    className={`relative px-2.5 py-1 rounded-lg font-bold shrink-0 cursor-pointer select-none border-0 bg-transparent transition-colors duration-150 z-10 ${
                      isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Heatmap Grid Table */}
        <div className="overflow-x-auto pb-2 no-scrollbar">
          <div className="min-w-[780px]">
            {/* Hour Header */}
            <div
              style={{ display: 'grid', gridTemplateColumns: '140px repeat(24, minmax(22px, 1fr))', gap: '4px' }}
              className="text-center text-[10px] text-slate-400 font-bold mb-2 pb-1 border-b border-slate-100 items-center"
            >
              <div className="text-left font-bold text-slate-700 pl-1 uppercase sticky left-0 bg-white z-10 font-sans">Asset / Door</div>
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="font-mono">
                  {i % 3 === 0 ? `${String(i).padStart(2, '0')}` : '•'}
                </div>
              ))}
            </div>

            {/* Matrix Rows */}
            <div className="space-y-1.5">
              {heatmapRows.map((row) => (
                <div
                  key={row.id}
                  style={{ display: 'grid', gridTemplateColumns: '140px repeat(24, minmax(22px, 1fr))', gap: '4px' }}
                  className="items-center"
                >
                  <div className="text-left pr-2 truncate sticky left-0 bg-white z-10 shadow-2xs">
                    <div className="font-bold text-xs text-slate-900 flex items-center space-x-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.type === 'DOCK' ? 'bg-blue-600' : 'bg-amber-600'}`}></span>
                      <span className="truncate">{row.label}</span>
                    </div>
                    <div className="text-[9px] text-slate-400 truncate">{row.subLabel}</div>
                  </div>

                  {row.hourly?.map((h: any, idx: number) => {
                    const isMaint = row.status === 'MAINTENANCE' || row.status === 'BLOCKED';
                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredCell({ label: row.label, hour: h.hour, value: h.value })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`h-7 rounded flex items-center justify-center text-[9px] font-bold border transition-transform cursor-pointer hover:scale-115 hover:z-20 ${getCellColor(
                          h.value,
                          isMaint
                        )}`}
                        title={`${row.label} @ ${h.hour}: ${h.value}% Occupancy`}
                      >
                        {h.value > 80 ? h.value : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Heatmap Legend & Tooltip Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="text-[11px] text-slate-400 font-bold uppercase font-sans">Intensity:</span>
            <div className="flex items-center space-x-1.5 text-[10px] flex-wrap gap-y-1">
              <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200">Idle (0%)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Light (&lt;35%)</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">Normal (35-65%)</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">Heavy (65-85%)</span>
              <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-bold">Peak (&gt;85%)</span>
            </div>
          </div>

          {hoveredCell ? (
            <div className="text-[11px] bg-blue-50 text-blue-900 px-3 py-1 rounded-lg border border-blue-200 font-bold">
              📍 {hoveredCell.label} @ {hoveredCell.hour} ➔ <span className="text-blue-700 font-black">{hoveredCell.value}% Projected Load</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 italic font-sans">
              Hover over any matrix block to view exact hourly load projection
            </div>
          )}
        </div>
      </div>

      {/* ─── Live Connected Analytics Charts Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. Live Dock Utilization by Capability Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 min-w-0">
              <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans truncate whitespace-nowrap">
                Dock Door Utilization
              </h3>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded font-mono whitespace-nowrap shrink-0">
              Active Matrix
            </span>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={liveDockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#64748B' }} unit="%" domain={[0, 100]} />
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [`${value}% Utilization`, item?.payload?.fullName || `Dock ${item?.payload?.name}`]}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 8, fontSize: 11 }}
                />
                <Bar dataKey="utilization" fill="#2563EB" radius={[6, 6, 0, 0]}>
                  {liveDockData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.status === 'MAINTENANCE' || entry.status === 'BLOCKED'
                          ? '#ef4444'
                          : entry.status === 'OCCUPIED'
                          ? '#2563eb'
                          : '#10b981'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Hourly Yard Occupancy Trend Area Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 min-w-0">
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans truncate whitespace-nowrap">
                Hourly Yard Occupancy
              </h3>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded font-mono whitespace-nowrap shrink-0">
              Limit: 80%
            </span>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yardTrendData}>
                <defs>
                  <linearGradient id="yardColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#94A3B8" tick={{ fill: '#64748B' }} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#64748B' }} unit="%" domain={[0, 100]} />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Occupancy']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 8, fontSize: 11 }}
                />
                <Area type="monotone" dataKey="occupancy" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#yardColor)" />
                <Line type="monotone" dataKey="safeLimit" stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Turnaround Velocity & Average Wait Time Line Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 min-w-0">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans truncate whitespace-nowrap">
                Turnaround vs Wait Time
              </h3>
            </div>
            <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded font-mono whitespace-nowrap shrink-0">
              SLA: 45 min
            </span>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waitTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#94A3B8" tick={{ fill: '#64748B' }} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#64748B' }} unit="m" />
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} mins`, name]}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 8, fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="turnaround" stroke="#2563EB" strokeWidth={2.5} name="Turnaround Time" />
                <Line type="monotone" dataKey="waitMinutes" stroke="#F59E0B" strokeWidth={2} strokeDasharray="3 3" name="Yard Wait Time" />
                <Line type="monotone" dataKey="target" stroke="#94A3B8" strokeDasharray="5 5" strokeWidth={1.5} name="SLA Ceiling (45m)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Live Exception Breakdown Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 min-w-0">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-sans truncate whitespace-nowrap">
                Exception Distribution
              </h3>
            </div>
            <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded font-mono whitespace-nowrap shrink-0">
              {exceptions.length} Active Events
            </span>
          </div>

          <div className="h-64 w-full text-xs flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={exceptionPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {exceptionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} Incidents`, 'Count']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 8, fontSize: 11 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
