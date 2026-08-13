import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'shipment' | 'dock' | 'priority' | 'risk' | 'exception';
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'shipment', size = 'md' }) => {
  const getStyles = () => {
    const norm = status.toUpperCase().replace(/\s+/g, '_');

    // Priority
    if (type === 'priority' || norm === 'CRITICAL' || norm === 'HIGH') {
      if (norm === 'CRITICAL') return 'bg-red-50 text-red-600 border-red-200';
      if (norm === 'HIGH') return 'bg-amber-50 text-amber-700 border-amber-200';
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }

    // Risk / Status
    if (norm === 'NORMAL' || norm === 'ON_TIME' || norm === 'COMPLETED' || norm === 'AVAILABLE') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (norm === 'WARNING' || norm === 'AT_RISK' || norm === 'RESERVED' || norm === 'IN_YARD') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (norm === 'DELAYED' || norm === 'PROCESSING' || norm === 'DOCK_ASSIGNED' || norm === 'OCCUPIED') {
      return 'bg-blue-50 text-blue-600 border-blue-200';
    }
    if (norm === 'BLOCKED' || norm === 'MAINTENANCE' || norm === 'MISSED' || norm === 'DOCK_FAILURE' || norm === 'ACTIVE') {
      return 'bg-red-50 text-red-600 border-red-200';
    }

    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-mono font-medium rounded-full border ${sizeClasses} ${getStyles()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      {status.replace(/_/g, ' ')}
    </span>
  );
};
