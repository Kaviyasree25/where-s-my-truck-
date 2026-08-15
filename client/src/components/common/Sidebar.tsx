import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  Grid,
  SquareStack,
  AlertTriangle,
  Calendar,
  BarChart3,
  Building2,
  Settings,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeExceptionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeExceptionsCount = 0 }) => {
  const { currentRole, logout } = useAuth();
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Control Tower',
      path: '/control-tower',
      icon: LayoutDashboard,
      roles: ['OPERATOR', 'MANAGER', 'ADMIN'],
    },
    {
      name: 'Shipment Tracking',
      path: '/tracking',
      icon: Search,
      roles: ['OPERATOR', 'MANAGER', 'ADMIN'],
    },
    {
      name: 'Yard Management',
      path: '/yard',
      icon: Grid,
      roles: ['OPERATOR', 'MANAGER', 'ADMIN'],
    },
    {
      name: 'Dock Doors',
      path: '/docks',
      icon: SquareStack,
      roles: ['OPERATOR', 'MANAGER', 'ADMIN'],
    },
    {
      name: 'Exceptions & Alerts',
      path: '/exceptions',
      icon: AlertTriangle,
      roles: ['OPERATOR', 'MANAGER', 'ADMIN'],
      badge: activeExceptionsCount > 0 ? activeExceptionsCount : undefined,
    },
    {
      name: 'Appointments',
      path: '/appointments',
      icon: Calendar,
      roles: ['OPERATOR', 'MANAGER', 'ADMIN'],
    },
    {
      name: 'Live Analytics',
      path: '/analytics',
      icon: BarChart3,
      roles: ['MANAGER', 'ADMIN'],
    },
    {
      name: 'Master Data & Admin',
      path: '/admin',
      icon: Settings,
      roles: ['ADMIN'],
    },
    {
      name: 'DC Portal',
      path: '/customer-tracking',
      icon: Building2,
      roles: ['CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN'],
    },
  ];

  const visibleItems = navigationItems.filter(item => item.roles.includes(currentRole));

  const isItemActive = (itemPath: string) => {
    if (itemPath === '/tracking') {
      return location.pathname === '/tracking' || location.pathname.startsWith('/shipments');
    }
    if (itemPath === '/customer-tracking') {
      return location.pathname === '/customer-tracking' || location.pathname === '/customer';
    }
    return location.pathname === itemPath;
  };

  return (
    <aside className="w-64 shrink-0 m-3 mr-0 rounded-3xl bg-[#14161f] border border-slate-800/80 shadow-2xl flex flex-col justify-between p-3.5 h-[calc(100vh-1.5rem)] font-sans select-none overflow-hidden">
      <div className="space-y-4 overflow-y-auto pr-0.5 custom-scrollbar">
        {/* Top Brand Header */}
        <div className="px-1.5 py-1 border-b border-slate-800/70 pb-3 space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-900/40 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-black text-white tracking-wide uppercase leading-tight">
                Inbound &amp; Outbound
              </h1>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-slate-300 font-mono">Control Tower</span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-blue-900/60 text-blue-300 rounded border border-blue-700/50">
                  BAY-A
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-mono leading-tight">
            Supply Chain &amp; Facility Allocation
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const active = isItemActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs transition-all duration-150 cursor-pointer ${
                  active
                    ? 'bg-[#292c37] text-white font-bold shadow-sm border border-white/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 font-medium'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500 text-white rounded-full shrink-0 shadow-xs">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Session Controls */}
      <div className="pt-3 mt-auto shrink-0 space-y-2 border-t border-slate-800/70">
        <button
          onClick={logout}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-950/20 transition cursor-pointer border border-transparent hover:border-rose-900/40"
          title="Sign out of current session"
        >
          <div className="flex items-center space-x-2.5">
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Exit Session</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
