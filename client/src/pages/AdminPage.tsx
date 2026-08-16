import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { Dock, YardSlot, User, Shipment, AuditLog } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { CreateShipmentModal } from '../components/admin/CreateShipmentModal';
import { RegisterTrailerModal } from '../components/admin/RegisterTrailerModal';
import { DockEditModal } from '../components/admin/DockEditModal';
import { YardMoveModal } from '../components/admin/YardMoveModal';
import { useSlidingIndicator } from '../hooks/useSlidingIndicator';
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
  const { containerRef: tabContainerRef, indicatorStyle: tabIndicatorStyle } = useSlidingIndicator(activeTab);
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
    <div className="space-y-4 sm:space-y-6 font-sans">
      {/* Title & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Master Data Administration &amp; Manual Overrides
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Facility Dock Doors, Yard Staging Zones, Inbound Freight Dispatch &amp; Operator Controls
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            onClick={() => setShowCreateShipment(true)}
            className="px-3 sm:px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs flex items-center space-x-1.5 transition shadow-sm cursor-pointer whitespace-nowrap shrink-0"
          >
            <PackagePlus className="w-4 h-4 shrink-0" />
            <span>+ Dispatch Inbound Shipment</span>
          </button>

          <button
            onClick={() => setShowRegisterTrailer(true)}
            className="px-3 sm:px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-mono font-bold text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            <Truck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>+ Gate Arrival Check-In</span>
          </button>

          <button
            onClick={fetchAdminData}
            className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition shadow-xs cursor-pointer shrink-0"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Banner Feedback */}
      {bannerMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-mono text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div
        ref={tabContainerRef}
        className="relative flex items-center space-x-1 sm:space-x-2 border-b border-slate-200 pb-0 overflow-x-auto text-xs no-scrollbar"
      >
        {/* Single persistent sliding tab indicator with zero distortion */}
        <div
          className="absolute top-0 left-0 bg-blue-50/80 rounded-t-xl border-b-2 border-blue-600 pointer-events-none transition-all duration-200 ease-[cubic-bezier(0.2,0.9,0.3,1)]"
          style={{
            transform: tabIndicatorStyle.transform,
            width: `${tabIndicatorStyle.width}px`,
            height: `${tabIndicatorStyle.height}px`,
            opacity: tabIndicatorStyle.opacity,
            willChange: 'transform, width',
          }}
        />

        {[
          { id: 'docks', label: `Dock Doors (${docks.length})`, icon: Building2 },
          { id: 'yard', label: `Yard Slots (${yardSlots.length})`, icon: Grid },
          { id: 'shipments', label: `Shipments (${shipments.length})`, icon: Truck },
          { id: 'users', label: 'Users & Audit Log', icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-active={isActive}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex items-center space-x-1.5 px-3 sm:px-4 py-2 sm:py-2.5 font-semibold shrink-0 whitespace-nowrap cursor-pointer select-none border-0 bg-transparent transition-colors duration-150 z-10 ${
                isActive
                  ? 'text-blue-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className="relative z-10 flex items-center space-x-1.5">
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Areas */}
      <div>
        {/* 1. Docks Tab */}
        {activeTab === 'docks' && (
          <div className="space-y-3">
            {/* Mobile Card View (Screens < 768px) */}
            <div className="block md:hidden space-y-3 font-mono">
              {docks.map(d => (
                <div key={d.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-slate-900">{d.id}</span>
                      <StatusBadge status={d.status} type="dock" size="sm" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {d.dockType}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{d.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className="text-[10px] text-slate-400">Caps:</span>
                      {d.capabilities.map(c => (
                        <span key={c} className="px-1.5 py-0.2 rounded bg-slate-50 text-slate-700 text-[9px] font-bold border border-slate-200 whitespace-nowrap">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {d.maintenanceNotes && (
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-800">
                      <strong>Notes:</strong> {d.maintenanceNotes}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setEditingDock(d)}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Configure Capabilities</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (Screens >= 768px) */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xs font-mono text-xs overflow-hidden w-full">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3.5 whitespace-nowrap">Dock ID</th>
                      <th className="py-3 px-3.5">Door Name</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Type</th>
                      <th className="py-3 px-3.5">Capabilities</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                      <th className="py-3 px-3.5">Notes</th>
                      <th className="py-3 px-3.5 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {docks.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3.5 font-black text-slate-900 whitespace-nowrap">{d.id}</td>
                        <td className="py-3 px-3.5 font-bold text-slate-800 text-[11px]">{d.name}</td>
                        <td className="py-3 px-3.5 text-blue-600 font-semibold text-[11px] whitespace-nowrap">{d.dockType}</td>
                        <td className="py-3 px-3.5">
                          <div className="flex flex-wrap gap-1">
                            {d.capabilities.map(c => (
                              <span key={c} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-semibold border border-slate-200 whitespace-nowrap">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <StatusBadge status={d.status} type="dock" size="sm" />
                        </td>
                        <td className="py-3 px-3.5 text-slate-500 text-[10px] truncate max-w-[120px]">
                          {d.maintenanceNotes || '—'}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditingDock(d)}
                            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[11px] inline-flex items-center space-x-1 transition cursor-pointer"
                          >
                            <Sliders className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>Configure</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. Yard Slots Tab */}
        {activeTab === 'yard' && (
          <div className="space-y-3">
            {/* Mobile Card View (Screens < 768px) */}
            <div className="block md:hidden space-y-3 font-mono">
              {yardSlots.map(s => {
                const isOccupied = s.status === 'OCCUPIED';
                return (
                  <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-slate-900">{s.id}</span>
                        <StatusBadge status={s.status} type="shipment" size="sm" />
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.locationValidationStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.locationValidationStatus || 'UNVALIDATED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Zone &amp; Slot</span>
                        <span className="font-bold text-slate-800 block mt-0.5">{s.zoneName} (#{s.slotNumber})</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Occupied Trailer</span>
                        <span className="font-black text-blue-700 block mt-0.5">{isOccupied ? s.occupiedByTrailerId : 'Vacant'}</span>
                      </div>
                    </div>

                    {isOccupied && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => setMovingSlot({ trailerId: s.occupiedByTrailerId!, slotId: s.id })}
                          className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Re-Slot Trailer</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (Screens >= 768px) */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xs font-mono text-xs overflow-hidden w-full">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3.5 whitespace-nowrap">Slot ID</th>
                      <th className="py-3 px-3.5">Zone</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Slot #</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Occupying Trailer</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">3-Way Signal</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                      <th className="py-3 px-3.5 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {yardSlots.map(s => {
                      const isOccupied = s.status === 'OCCUPIED';
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3.5 font-black text-slate-900 whitespace-nowrap">{s.id}</td>
                          <td className="py-3 px-3.5 font-semibold text-slate-700 text-[11px]">{s.zoneName}</td>
                          <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">{s.slotNumber}</td>
                          <td className="py-3 px-3.5 font-bold whitespace-nowrap">
                            {isOccupied ? (
                              <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                                {s.occupiedByTrailerId}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Vacant</span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              s.locationValidationStatus === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {s.locationValidationStatus || 'UNVALIDATED'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <StatusBadge status={s.status} type="shipment" size="sm" />
                          </td>
                          <td className="py-3 px-3.5 text-right whitespace-nowrap">
                            {isOccupied ? (
                              <button
                                onClick={() => setMovingSlot({ trailerId: s.occupiedByTrailerId!, slotId: s.id })}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] inline-flex items-center space-x-1 transition cursor-pointer"
                              >
                                <Navigation className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Re-Slot</span>
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
            </div>
          </div>
        )}

        {/* 3. Inbound Shipments Tab */}
        {activeTab === 'shipments' && (
          <div className="space-y-3">
            {/* Mobile Card View (Screens < 768px) */}
            <div className="block md:hidden space-y-3 font-mono">
              {shipments.map(s => (
                <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-sm font-black text-slate-900">{s.id}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">{s.trackingNumber}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <StatusBadge status={s.priority} type="priority" size="sm" />
                      <StatusBadge status={s.status} type="shipment" size="sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Carrier / Supplier</span>
                      <span className="font-bold text-slate-800 block mt-0.5">{s.carrierName}</span>
                      <span className="text-[10px] text-slate-500 font-sans">{s.supplier}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Trailer / Load</span>
                      <span className="font-black text-blue-700 block mt-0.5">{s.trailerId}</span>
                      <span className="text-[10px] text-slate-500">{s.loadType}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <span>Scheduled: {new Date(s.scheduledAppointment).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="font-bold text-slate-700">{(s.totalWeightKg || 12000).toLocaleString()} kg</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (Screens >= 768px) */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xs font-mono text-xs overflow-hidden w-full">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-200">
                      <th className="py-3 px-3.5 whitespace-nowrap">Shipment ID</th>
                      <th className="py-3 px-3.5">Carrier / Supplier</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Trailer Unit</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Load Type</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Weight</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Scheduled Appt</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Priority</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shipments.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3.5 font-black text-slate-900 whitespace-nowrap">
                          <div>{s.id}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{s.trackingNumber}</div>
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-800 text-[11px]">
                          <div>{s.carrierName}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{s.supplier}</div>
                        </td>
                        <td className="py-3 px-3.5 font-bold text-blue-600 whitespace-nowrap text-[11px]">{s.trailerId}</td>
                        <td className="py-3 px-3.5 font-semibold text-slate-700 whitespace-nowrap text-[11px]">{s.loadType}</td>
                        <td className="py-3 px-3.5 text-slate-700 font-semibold whitespace-nowrap text-[11px]">{(s.totalWeightKg || 12000).toLocaleString()} kg</td>
                        <td className="py-3.5 px-3.5 text-slate-700 whitespace-nowrap text-[11px]">
                          <div>{new Date(s.scheduledAppointment).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400">{new Date(s.scheduledAppointment).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <StatusBadge status={s.priority} type="priority" size="sm" />
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <StatusBadge status={s.status} type="shipment" size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. Users & Audit Log Tab */}
        {activeTab === 'users' && (
          <div className="p-4 sm:p-6 space-y-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
            {/* System Users Grid */}
            <div className="space-y-3 font-mono">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs font-sans">
                  Active Operator Accounts &amp; Permissions
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {users.map(u => (
                  <div key={u.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-blue-600 block uppercase">{u.role === 'CUSTOMER' ? 'DC MANAGER' : u.role}</span>
                    <span className="text-sm font-black text-slate-900 block mt-0.5">{u.name}</span>
                    <span className="text-[11px] text-slate-500 block truncate">{u.email}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">{u.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Trail Table */}
            <div className="space-y-3 font-mono">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs font-sans">
                  Immutable Operator Audit Trail
                </h4>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3 whitespace-nowrap">Timestamp</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Actor</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Entity Type</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Action</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {auditLogs.slice(0, 10).map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-800 whitespace-nowrap">{log.actor}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[9px] border border-blue-200">
                            {log.entityType}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">{log.action}</td>
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
