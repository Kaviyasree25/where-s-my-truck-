import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  Grid,
  SquareStack,
  AlertTriangle,
  Calendar,
  BarChart3,
  UserCheck,
  Settings,
  LogOut,
  ShieldCheck,
  User
} from 'lucide-react';

interface SidebarProps {
  activeExceptionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeExceptionsCount = 0 }) => {
  const { currentRole, currentUser, logout } = useAuth();

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
      roles: ['MANAGER', 'ADMIN'], // Restricted from OPERATOR & CUSTOMER
    },
    {
      name: 'Master Data & Admin',
      path: '/admin',
      icon: Settings,
      roles: ['ADMIN'], // Restricted to ADMIN only
    },
    {
      name: 'Customer Portal',
      path: '/customer-tracking',
      icon: UserCheck,
      roles: ['CUSTOMER', 'OPERATOR', 'MANAGER', 'ADMIN'],
    },
  ];

  const visibleItems = navigationItems.filter(item => item.roles.includes(currentRole));

  const roleColorMap: Record<string, string> = {
    ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
    OPERATOR: 'bg-blue-50 text-blue-700 border-blue-200',
    MANAGER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CUSTOMER: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex flex-col justify-between p-4 h-full overflow-y-auto font-sans select-none">
      <div className="space-y-4">
        <div>
          <span className="px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            {currentRole === 'CUSTOMER' ? 'Customer Portal' : 'Operations Menu'}
          </span>
          <nav className="mt-2 space-y-1">
            {visibleItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${isActive
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-500 text-white rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4 mt-auto shrink-0 space-y-2">
        <button
          onClick={logout}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer border border-transparent hover:border-rose-200"
          title="Sign out to Login Page"
        >
          <div className="flex items-center space-x-2.5">
            <LogOut className="w-4 h-4" />
            <span>Exit Session</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
