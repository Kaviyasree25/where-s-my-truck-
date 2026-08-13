import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { getSocket } from '../../services/socket';
import {
  ShieldAlert,
  Radio,
  UserCheck,
  ChevronDown,
  Building2,
  Bell,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, currentRole, switchRole } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    setIsConnected(socket.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const roles: { role: UserRole; label: string }[] = [
    { role: 'OPERATOR', label: 'Warehouse Operator' },
    { role: 'MANAGER', label: 'Control Tower Manager' },
    { role: 'CUSTOMER', label: 'Customer Portal' },
    { role: 'ADMIN', label: 'System Admin' },
  ];

  return (
    <header className="h-16 border-b border-slate-200 bg-white backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Title & Warehouse context */}
      <div className="flex items-center space-x-4">
        <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
              Inbound Operations Control Tower
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-50 text-blue-600 rounded border border-blue-200">
              FACILITY BAY-A
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Supply Chain Operations & Smart Allocation System
          </p>
        </div>
      </div>

      {/* Connection & Role Switcher */}
      <div className="flex items-center space-x-4">
        {/* Real-time Socket Indicator */}
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-700 animate-pulse' : 'text-slate-500'}`} />
          <span className="font-mono text-slate-700">
            {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
          </span>
        </div>

        {/* Role Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-100 transition"
          >
            <img
              src={currentUser?.avatar}
              alt="User"
              className="w-7 h-7 rounded-full object-cover border border-slate-300"
            />
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-900">{currentUser?.name}</div>
              <div className="text-[10px] text-blue-600 font-mono">{currentUser?.title}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-2xl z-50 p-2">
              <div className="px-3 py-2 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Operational Role
              </div>
              {roles.map(r => (
                <button
                  key={r.role}
                  onClick={() => {
                    switchRole(r.role);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                    currentRole === r.role
                      ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{r.label}</span>
                  {currentRole === r.role && <UserCheck className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
