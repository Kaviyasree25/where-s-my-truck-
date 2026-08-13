import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Calendar, Clock, RefreshCw } from 'lucide-react';

export const AppointmentPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Inbound Appointment Management
          </h2>
          <p className="text-xs text-slate-400">
            Scheduled vs Actual Arrival Deviation Metrics & Carrier Timelines
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Appt ID</th>
                <th className="py-3 px-4">Shipment / Trailer</th>
                <th className="py-3 px-4">Carrier</th>
                <th className="py-3 px-4">Scheduled Arrival</th>
                <th className="py-3 px-4">Actual Arrival</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Deviation</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {appointments.map(apt => (
                <tr key={apt.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{apt.id}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-blue-600 block">{apt.shipmentId}</span>
                    <span className="text-[10px] text-slate-400">{apt.trailerId}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{apt.carrierName}</td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {new Date(apt.scheduledArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {apt.actualArrival
                      ? new Date(apt.actualArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Pending'}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={apt.priority} type="priority" size="sm" />
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`font-semibold ${
                        apt.deviationMinutes > 0
                          ? 'text-red-600'
                          : apt.deviationMinutes < 0
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {apt.deviationMinutes > 0
                        ? `+${apt.deviationMinutes}m (Late)`
                        : apt.deviationMinutes < 0
                        ? `${apt.deviationMinutes}m (Early)`
                        : '0m'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
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
