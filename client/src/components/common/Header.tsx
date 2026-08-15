import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { getSocket } from '../../services/socket';
import { AddAccountModal } from './AddAccountModal';
import {
  Radio,
  UserCheck,
  ChevronDown,
  Building2,
  UserPlus,
  LogOut,
  Shield,
  Layers,
  Check
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    currentRole,
    activeSessionsList,
    switchAccount,
    logoutAccount,
    logoutAll,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSwitchAccount = (email: string, role: UserRole) => {
    switchAccount(email);
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

  const handleAddSuccess = (role: UserRole) => {
    setShowAddModal(false);
    setDropdownOpen(false);
    if (role === 'CUSTOMER') {
      navigate('/customer-tracking');
    } else {
      navigate('/control-tower');
    }
  };

  const roleColorMap: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    OPERATOR: 'bg-blue-100 text-blue-800 border-blue-200',
    MANAGER: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CUSTOMER: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  const roleDisplayMap: Record<string, string> = {
    ADMIN: 'ADMIN',
    OPERATOR: 'OPERATOR',
    MANAGER: 'MANAGER',
    CUSTOMER: 'DC MANAGER',
  };

  return (
    <header className="m-3 mb-0 rounded-2xl border border-slate-200/90 bg-white shadow-2xs px-6 py-2.5 flex items-center justify-between font-sans select-none shrink-0">
      {/* Facility Hub Context */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-bold text-slate-900">Naperville DC-1 Logistics Hub</span>
          <span className="text-slate-300">|</span>
          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
            Facility Bay-A Active
          </span>
        </div>
      </div>

      {/* Connection & Account Switcher */}
      <div className="flex items-center space-x-3">
        {/* Real-time Socket Indicator */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono">
          <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
          <span className="font-bold text-slate-700">
            {isConnected ? 'LIVE SYNC' : 'OFFLINE'}
          </span>
        </div>

        {/* Multi-Account Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
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
                <span>{currentUser?.name || 'Authorized User'}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-black border ${roleColorMap[currentRole] || 'bg-slate-100'}`}>
                  {roleDisplayMap[currentRole] || currentRole}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                {currentUser?.email}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl z-[2001] p-2 space-y-1.5 font-sans animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Active Account Sessions</span>
                <span className="text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                  {activeSessionsList.length} Active
                </span>
              </div>

              {/* List of active signed-in accounts */}
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {activeSessionsList.map(session => {
                  const isCurrent = currentUser?.email === session.user.email;
                  return (
                    <div
                      key={session.user.email}
                      onClick={() => handleSwitchAccount(session.user.email, session.role)}
                      className={`w-full p-2 rounded-xl text-xs flex items-center justify-between transition cursor-pointer border ${
                        isCurrent
                          ? 'bg-blue-50/80 text-blue-900 border-blue-200 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={session.user.avatar}
                          alt={session.user.name}
                          className="w-6 h-6 rounded-full object-cover border border-slate-300 shrink-0"
                        />
                        <div className="truncate">
                          <div className="font-bold text-slate-900 text-[11px] truncate">{session.user.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">{session.user.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${roleColorMap[session.role]}`}>
                          {roleDisplayMap[session.role] || session.role}
                        </span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add / Authenticate Another Account */}
              <div className="border-t border-slate-100 pt-1.5 space-y-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowAddModal(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 transition flex items-center space-x-2 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Sign In to Another Account</span>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logoutAll();
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center space-x-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of All Accounts</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <AddAccountModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </header>
  );
};

export default Header;
