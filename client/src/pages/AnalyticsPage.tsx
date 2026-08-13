import React from 'react';
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
} from 'recharts';
import { BarChart3, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const dockData = [
    { name: 'D01 (Standard)', utilization: 92 },
    { name: 'D02 (Standard)', utilization: 45 },
    { name: 'D03 (Heavy)', utilization: 88 },
    { name: 'D04 (Refrig)', utilization: 95 },
    { name: 'D05 (Refrig)', utilization: 60 },
    { name: 'D06 (Hazmat)', utilization: 10 },
  ];

  const waitTrendData = [
    { time: '08:00', waitMinutes: 12 },
    { time: '10:00', waitMinutes: 18 },
    { time: '12:00', waitMinutes: 32 },
    { time: '14:00', waitMinutes: 28 },
    { time: '16:00', waitMinutes: 24 },
  ];

  const yardTrendData = [
    { time: '08:00', occupancy: 42 },
    { time: '10:00', occupancy: 58 },
    { time: '12:00', occupancy: 74 },
    { time: '14:00', occupancy: 85 },
    { time: '16:00', occupancy: 68 },
  ];

  const exceptionPieData = [
    { name: 'Dock Failure', value: 35, color: '#DC2626' },
    { name: 'Yard Dwell', value: 25, color: '#B45309' },
    { name: 'ETA Delay', value: 25, color: '#2563EB' },
    { name: 'Appointment Miss', value: 15, color: '#64748B' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Control Tower Operations Analytics
        </h2>
        <p className="text-xs text-slate-400">
          Inbound Performance Metrics, Utilization Rates, Dwell Velocity & Exception Distribution
        </p>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dock Utilization Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Dock Door Utilization % by Capability
            </h3>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#94A3B8" tick={{ fill: '#64748B', fontSize: 10 }} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#64748B' }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A' }}
                />
                <Bar dataKey="utilization" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Yard Occupancy Trend Area Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Hourly Yard Occupancy % Trend
            </h3>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yardTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" stroke="#94A3B8" tick={{ fill: '#64748B' }} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#64748B' }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A' }}
                />
                <Area type="monotone" dataKey="occupancy" stroke="#2563EB" fill="#DBEAFE" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Average Wait Time Line Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Average Trailer Wait Time (Minutes)
            </h3>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waitTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" stroke="#94A3B8" tick={{ fill: '#64748B' }} />
                <YAxis stroke="#94A3B8" tick={{ fill: '#64748B' }} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A' }}
                />
                <Line type="monotone" dataKey="waitMinutes" stroke="#2563EB" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Exception Breakdown Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Exception Distribution by Category
            </h3>
          </div>
          <div className="h-64 w-full text-xs flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={exceptionPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {exceptionPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#0F172A' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
