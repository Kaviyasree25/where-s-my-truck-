import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Appointment } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { AnimatedCounter } from '../components/common/AnimatedCounter';
import { Calendar, Clock, RefreshCw, Truck, ArrowUpRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AppointmentPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const list = await api.getAppointments();
      setAppointments(list);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const onTimeCount = appointments.filter(a => a.status === 'ON_TIME').length;
  const delayedCount = appointments.filter(a => a.status === 'DELAYED' || a.status === 'AT_RISK').length;

  return (
    <div className="space-y-4 sm:space-y-6 font-sans">
      {/* Title & Stats */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Inbound Appointment Management
            </h2>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[10px] border border-blue-200 flex items-center space-x-1 whitespace-nowrap shrink-0">
              <Calendar className="w-3 h-3 text-blue-600 shrink-0" />
              <span>{appointments.length} SCHEDULED</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Scheduled vs Actual Arrival Deviation Metrics &amp; Carrier Timelines
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
          title="Refresh Appointments"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quick Summary KPIs with Animated Counters */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 font-mono text-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold block truncate">Total Windows</span>
          <span className="text-base sm:text-xl font-black text-slate-900 block mt-0.5">
            <AnimatedCounter value={appointments.length} />
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <span className="text-[9px] sm:text-[10px] text-emerald-600 uppercase font-bold block truncate">On Time</span>
          <span className="text-base sm:text-xl font-black text-emerald-700 block mt-0.5">
            <AnimatedCounter value={onTimeCount} />
          </span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs">
          <span className="text-[9px] sm:text-[10px] text-rose-600 uppercase font-bold block truncate">At Risk / Delay</span>
          <span className="text-base sm:text-xl font-black text-rose-700 block mt-0.5">
            <AnimatedCounter value={delayedCount} />
          </span>
        </div>
      </div>

      {/* Mobile Card View (Screens < 768px) */}
      <div className="block md:hidden space-y-3">
        {appointments.map(apt => {
          const isLate = apt.deviationMinutes > 0;
          const isEarly = apt.deviationMinutes < 0;
          return (
            <div
              key={apt.id}
              className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs font-mono"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-black text-slate-900">{apt.id}</span>
                  <StatusBadge status={apt.priority} type="priority" size="sm" />
                </div>
                <StatusBadge status={apt.status} type="risk" size="sm" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => navigate('/tracking')}
                      className="font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-0.5 cursor-pointer"
                    >
                      <span>{apt.shipmentId}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                    <span className="text-slate-400 font-sans">•</span>
                    <span className="text-slate-500 font-bold">{apt.trailerId}</span>
                  </div>
                  <span className="text-slate-700 text-xs block font-sans font-medium">{apt.carrierName}</span>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                      isLate
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : isEarly
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {isLate ? `+${apt.deviationMinutes}m Late` : isEarly ? `${apt.deviationMinutes}m Early` : 'On Time (0m)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Scheduled Arrival</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {new Date(apt.scheduledArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Actual / ETA</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {apt.actualArrival
                      ? new Date(apt.actualArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'In Transit'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (Screens >= 768px) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs font-mono">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4 whitespace-nowrap">Appt ID</th>
                <th className="py-3 px-4 whitespace-nowrap">Shipment / Trailer</th>
                <th className="py-3 px-4 whitespace-nowrap">Carrier</th>
                <th className="py-3 px-4 whitespace-nowrap">Scheduled Arrival</th>
                <th className="py-3 px-4 whitespace-nowrap">Actual / ETA</th>
                <th className="py-3 px-4 whitespace-nowrap">Priority</th>
                <th className="py-3 px-4 whitespace-nowrap">Deviation</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {appointments.map(apt => (
                <tr key={apt.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">{apt.id}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      onClick={() => navigate('/tracking')}
                      className="font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-0.5 cursor-pointer"
                    >
                      <span>{apt.shipmentId}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] text-slate-400 block">{apt.trailerId}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-sans font-medium">{apt.carrierName}</td>
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                    {new Date(apt.scheduledArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                    {apt.actualArrival
                      ? new Date(apt.actualArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'In Transit'}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={apt.priority} type="priority" size="sm" />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        apt.deviationMinutes > 0
                          ? 'text-red-600 font-bold'
                          : apt.deviationMinutes < 0
                          ? 'text-emerald-700 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      {apt.deviationMinutes > 0
                        ? `+${apt.deviationMinutes}m (Late)`
                        : apt.deviationMinutes < 0
                        ? `${apt.deviationMinutes}m (Early)`
                        : '0m (On Time)'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={apt.status} type="risk" size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
