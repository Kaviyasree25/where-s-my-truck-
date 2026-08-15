import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { getSocket } from '../../services/socket';
import {
  Radio,
  UserCheck,
  ChevronDown,
  Building2,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { currentUser, currentRole, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const handleSwitch = (role: UserRole) => {
    switchRole(role);
    setDropdownOpen(false);

    if (role === 'CUSTOMER') {
      navigate('/customer-tracking');
    } else if (location.pathname === '/customer-tracking' || location.pathname === '/admin') {
      if (role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/control-tower');
      }
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 font-sans select-none">
      {/* Title & Warehouse context */}
      <div className="flex items-center space-x-4">
        <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 shadow-2xs">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">
              Inbound Operations Control Tower
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-blue-50 text-blue-700 rounded-md border border-blue-200">
              FACILITY BAY-A
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Supply Chain Operations &amp; Smart Allocation System
          </p>
        </div>
      </div>

      {/* Connection & Role Switcher */}
      <div className="flex items-center space-x-3">
        {/* Real-time Socket Indicator */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
          <span className="font-bold text-slate-700">
            {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
          </span>
        </div>

        {/* Role Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition shadow-2xs cursor-pointer"
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt="User Avatar"
              className="w-7 h-7 rounded-full object-cover border border-slate-300 shadow-2xs"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <span>{currentUser?.name || 'Operator'}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-black">
                  {currentRole}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                {currentUser?.title || 'Logistics Specialist'}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-2xl z-50 p-2 space-y-1 font-sans">
              <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Switch Operational Role
              </div>
              {roles.map(r => (
                <button
                  key={r.role}
                  onClick={() => handleSwitch(r.role)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                    currentRole === r.role
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{r.label}</span>
                  {currentRole === r.role && <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
