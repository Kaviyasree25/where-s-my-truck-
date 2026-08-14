import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { Dock, YardSlot, User, Shipment, AuditLog } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { CreateShipmentModal } from '../components/admin/CreateShipmentModal';
import { RegisterTrailerModal } from '../components/admin/RegisterTrailerModal';
import { DockEditModal } from '../components/admin/DockEditModal';
import { YardMoveModal } from '../components/admin/YardMoveModal';
import {
  Settings,
  Building2,
  Grid,
  Truck,
  Users,
  RefreshCw,
  Plus,
  PackagePlus,
  Wrench,
  Navigation,
  FileText,
  CheckCircle2,
  Sliders,
  History,
  ShieldCheck
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'docks' | 'yard' | 'shipments' | 'users'>('docks');
  const [docks, setDocks] = useState<Dock[]>([]);
  const [yardSlots, setYardSlots] = useState<YardSlot[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Modals
  const [showCreateShipment, setShowCreateShipment] = useState(false);
  const [showRegisterTrailer, setShowRegisterTrailer] = useState(false);
  const [editingDock, setEditingDock] = useState<Dock | null>(null);
  const [movingSlot, setMovingSlot] = useState<{ trailerId: string; slotId: string } | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [dockList, yardData, shipmentList, userList, logList] = await Promise.all([
        api.getDocks(),
        api.getYardState(),
        api.getShipments(),
        api.getUsers(),
        api.getAuditLogs ? api.getAuditLogs() : Promise.resolve([]),
      ]);
      setDocks(dockList);
      setYardSlots(yardData.slots);
      setShipments(shipmentList);
      setUsers(userList);
      setAuditLogs(logList);
    } catch (err) {
      console.error('Failed to load admin master data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const socket = getSocket();
    const onStateChange = () => fetchAdminData();

    socket.on('OPERATIONAL_STATE_CHANGED', onStateChange);
    socket.on('DOCK_FAILURE_EVENT', onStateChange);
    socket.on('DEMO_RESET_EVENT', onStateChange);

    return () => {
      socket.off('OPERATIONAL_STATE_CHANGED', onStateChange);
      socket.off('DOCK_FAILURE_EVENT', onStateChange);
      socket.off('DEMO_RESET_EVENT', onStateChange);
    };
  }, []);

  const triggerSuccess = (msg: string) => {
    setBannerMessage(msg);
    fetchAdminData();
    setTimeout(() => setBannerMessage(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Master Data Administration &amp; Manual Overrides
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Facility Dock Doors, Yard Staging Zones, Inbound Freight Dispatch &amp; Operator Controls
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2.5 flex-wrap gap-2">
          <button
            onClick={() => setShowCreateShipment(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs flex items-center space-x-2 transition shadow-sm cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Dispatch Inbound Shipment</span>
          </button>

          <button
            onClick={() => setShowRegisterTrailer(true)}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-mono font-bold text-xs flex items-center space-x-2 transition shadow-xs cursor-pointer"
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>+ Gate Arrival Check-In</span>
          </button>

          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition shadow-xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Banner Feedback */}
      {bannerMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 font-mono text-xs overflow-x-auto">
        {[
          { id: 'docks', label: `Dock Doors (${docks.length})`, icon: Building2 },
          { id: 'yard', label: `Yard Slots (${yardSlots.length})`, icon: Grid },
          { id: 'shipments', label: `Shipment Manifest (${shipments.length})`, icon: Truck },
          { id: 'users', label: 'Users & Audit Log', icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 font-semibold transition border-b-2 cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Tables */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs font-mono text-xs">
        {/* 1. Docks Tab */}
        {activeTab === 'docks' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Dock ID</th>
                  <th className="py-3 px-4">Door Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Supported Capabilities</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Maintenance Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docks.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-black text-slate-900">{d.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{d.name}</td>
                    <td className="py-3.5 px-4 text-blue-600 font-semibold">{d.dockType}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {d.capabilities.map(c => (
                          <span key={c} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={d.status} type="dock" size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {d.maintenanceNotes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setEditingDock(d)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center space-x-1.5 ml-auto transition cursor-pointer"
                      >
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        <span>Configure</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Yard Slots Tab */}
        {activeTab === 'yard' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Slot ID</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Slot Number</th>
                  <th className="py-3 px-4">Occupied Trailer</th>
                  <th className="py-3 px-4">RFID Validation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {yardSlots.map(s => {
                  const isOccupied = s.status === 'OCCUPIED' && s.occupiedByTrailerId;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-black text-slate-900">{s.id}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{s.zoneName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{s.slotNumber}</td>
                      <td className="py-3.5 px-4 font-bold">
                        {isOccupied ? (
                          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {s.occupiedByTrailerId}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Vacant</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.locationValidationStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.locationValidationStatus || 'UNVALIDATED'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={s.status} type="shipment" size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isOccupied ? (
                          <button
                            onClick={() => setMovingSlot({ trailerId: s.occupiedByTrailerId!, slotId: s.id })}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center space-x-1.5 ml-auto transition cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5 text-amber-600" />
                            <span>Re-Slot Trailer</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[10px] italic">Available</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Inbound Shipments Tab */}
        {activeTab === 'shipments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Shipment ID</th>
                  <th className="py-3 px-4">Carrier / Supplier</th>
                  <th className="py-3 px-4">Trailer Unit</th>
                  <th className="py-3 px-4">Load Type</th>
                  <th className="py-3 px-4">Weight (kg)</th>
                  <th className="py-3 px-4">Scheduled Appt</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      <div>{s.id}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{s.trackingNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div>{s.carrierName}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{s.supplier}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{s.trailerId}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{s.loadType}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{(s.totalWeightKg || 12000).toLocaleString()} kg</td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{new Date(s.scheduledAppointment).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">{new Date(s.scheduledAppointment).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={s.priority} type="priority" size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={s.status} type="shipment" size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Users & Audit Log Tab */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-6">
            {/* System Users Grid */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Active Operator Accounts &amp; Permissions
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {users.map(u => (
                  <div key={u.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-blue-600 block uppercase">{u.role}</span>
                    <span className="text-sm font-black text-slate-900 block mt-0.5">{u.name}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{u.email}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">{u.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Trail Table */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                  Immutable Operator Audit Trail
                </h4>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Actor</th>
                      <th className="py-2.5 px-3">Entity Type</th>
                      <th className="py-2.5 px-3">Action</th>
                      <th className="py-2.5 px-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {auditLogs.slice(0, 10).map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-800">{log.actor}</td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[9px] border border-blue-200">
                            {log.entityType}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900">{log.action}</td>
                        <td className="py-2 px-3 text-slate-600">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateShipment && (
        <CreateShipmentModal
          onClose={() => setShowCreateShipment(false)}
          onCreated={() => {
            setShowCreateShipment(false);
            triggerSuccess('New inbound freight shipment dispatched into network successfully!');
          }}
        />
      )}

      {showRegisterTrailer && (
        <RegisterTrailerModal
          onClose={() => setShowRegisterTrailer(false)}
          onRegistered={() => {
            setShowRegisterTrailer(false);
            triggerSuccess('Arriving trailer checked in at gate and staged in yard slot!');
          }}
        />
      )}

      {editingDock && (
        <DockEditModal
          dock={editingDock}
          onClose={() => setEditingDock(null)}
          onUpdated={() => {
            setEditingDock(null);
            triggerSuccess(`Dock door ${editingDock.id} configuration updated successfully!`);
          }}
        />
      )}

      {movingSlot && (
        <YardMoveModal
          trailerId={movingSlot.trailerId}
          currentSlotId={movingSlot.slotId}
          onClose={() => setMovingSlot(null)}
          onMoved={() => {
            setMovingSlot(null);
            triggerSuccess(`Trailer ${movingSlot.trailerId} transferred by Yard Mule successfully!`);
          }}
        />
      )}
    </div>
  );
};

export default AdminPage;
