import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Building2,
  UserCheck,
  ShieldCheck,
  PackageSearch,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { switchRole } = useAuth();
  const navigate = useNavigate();

  const handleRoleLogin = (role: UserRole) => {
    switchRole(role);
    if (role === 'CUSTOMER') {
      navigate('/customer-tracking');
    } else {
      navigate('/control-tower');
    }
  };

  const roles = [
    {
      role: 'OPERATOR' as UserRole,
      title: 'Warehouse Operator',
      subtitle: 'Manage arrivals, yard slots, dock doors, approve smart allocation & dynamic reassignment',
      icon: Building2,
      badgeColor: 'border-blue-200 text-blue-600 bg-blue-50',
    },
    {
      role: 'MANAGER' as UserRole,
      title: 'Control Tower Manager',
      subtitle: 'Monitor operational KPIs, warehouse risks, exceptions, dwell times, and throughput analytics',
      icon: LayoutDashboard,
      badgeColor: 'border-emerald-200 text-emerald-700 bg-emerald-50',
    },
    {
      role: 'CUSTOMER' as UserRole,
      title: 'Customer Logistics Portal',
      subtitle: 'Track shipments, view ETAs, delivery progress milestones, and delay notifications',
      icon: PackageSearch,
      badgeColor: 'border-amber-200 text-amber-700 bg-amber-50',
    },
    {
      role: 'ADMIN' as UserRole,
      title: 'Master Data Administrator',
      subtitle: 'Maintain facility master data, docks, yard zones, carriers, trailer types, and user access',
      icon: ShieldCheck,
      badgeColor: 'border-blue-200 text-blue-600 bg-blue-50',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="max-w-4xl w-full space-y-8 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono text-blue-600">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>ENTERPRISE INBOUND CONTROL TOWER MVP</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Inbound Warehouse Operations & Visibility Platform
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Select an operational role below to enter the live warehouse environment for hackathon evaluation.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map(r => {
            const Icon = r.icon;
            return (
              <div
                key={r.role}
                onClick={() => handleRoleLogin(r.role)}
                className="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 transition-all duration-200 cursor-pointer shadow-xl hover:shadow-2xl flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl border ${r.badgeColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                      {r.role}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {r.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      {r.subtitle}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Enter Platform as {r.title}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-xs text-slate-500 font-mono">
          CTS NPN Hackathon Prototype • Real-time Socket Synchronization Enabled
        </div>
      </div>
    </div>
  );
};
