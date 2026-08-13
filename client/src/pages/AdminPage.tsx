import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Dock, YardSlot, User } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { Settings, Building2, Grid, Truck, Users, RefreshCw } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'docks' | 'yard' | 'carriers' | 'users'>('docks');
  const [docks, setDocks] = useState<Dock[]>([]);
  const [yardSlots, setYardSlots] = useState<YardSlot[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [dockList, yardData, userList] = await Promise.all([
        api.getDocks(),
        api.getYardState(),
        api.getUsers(),
      ]);
      setDocks(dockList);
      setYardSlots(yardData.slots);
      setUsers(userList);
    } catch (err) {
      console.error('Failed to load admin master data:', err);
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
            Master Data Administration & Setup
          </h2>
          <p className="text-xs text-slate-400">
            Maintain Warehouse Facility Doors, Yard Zones, Carrier Master Data & System Users
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 font-mono text-xs">
        {[
          { id: 'docks', label: 'Dock Doors', icon: Building2 },
          { id: 'yard', label: 'Yard Slots', icon: Grid },
          { id: 'users', label: 'System Users', icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 font-semibold transition border-b-2 ${
                isActive
                  ? 'border-blue-300 text-blue-600 font-bold bg-white'
                  : 'border-transparent text-slate-400 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl font-mono text-xs">
        {activeTab === 'docks' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Dock ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Dock Type</th>
                <th className="py-3 px-4">Capabilities</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {docks.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{d.id}</td>
                  <td className="py-3.5 px-4 text-slate-800">{d.name}</td>
                  <td className="py-3.5 px-4 text-blue-600">{d.dockType}</td>
                  <td className="py-3.5 px-4 text-slate-700">{d.capabilities.join(', ')}</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={d.status} type="dock" size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'yard' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Slot ID</th>
                <th className="py-3 px-4">Zone</th>
                <th className="py-3 px-4">Slot #</th>
                <th className="py-3 px-4">Occupied Trailer</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {yardSlots.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{s.id}</td>
                  <td className="py-3.5 px-4 text-slate-800">{s.zoneName}</td>
                  <td className="py-3.5 px-4 text-slate-700">{s.slotNumber}</td>
                  <td className="py-3.5 px-4 text-blue-600 font-bold">
                    {s.occupiedByTrailerId || 'None'}
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={s.status} type="shipment" size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === 'users' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Title</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{u.id}</td>
                  <td className="py-3.5 px-4 text-slate-800">{u.name}</td>
                  <td className="py-3.5 px-4 text-slate-400">{u.email}</td>
                  <td className="py-3.5 px-4 text-blue-600 font-bold">{u.role}</td>
                  <td className="py-3.5 px-4 text-slate-700">{u.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
