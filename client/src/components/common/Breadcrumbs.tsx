import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home, Building2, Truck, Grid, SquareStack, AlertTriangle, Calendar, BarChart3, Settings, UserCheck } from 'lucide-react';

const ROUTE_LABELS: Record<string, { label: string; parentPath?: string; parentLabel?: string }> = {
  '/control-tower': { label: 'Control Tower' },
  '/tracking': { label: 'Shipment Tracking' },
  '/yard': { label: 'Yard Staging Management' },
  '/docks': { label: 'Facility Dock Doors' },
  '/exceptions': { label: 'Exceptions & System Alerts' },
  '/appointments': { label: 'Carrier Appointments' },
  '/analytics': { label: 'Live Analytics & Heatmap Matrix' },
  '/admin': { label: 'Master Data & Manual Overrides' },
  '/customer-tracking': { label: 'DC Tracking Portal' },
};

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  // Handle dynamic routes like /shipments/:id
  let currentLabel = 'Operations';
  let parentItem: { path: string; label: string } | null = null;

  if (ROUTE_LABELS[path]) {
    currentLabel = ROUTE_LABELS[path].label;
    if (ROUTE_LABELS[path].parentPath) {
      parentItem = {
        path: ROUTE_LABELS[path].parentPath!,
        label: ROUTE_LABELS[path].parentLabel || 'Overview',
      };
    }
  } else if (path.startsWith('/shipments/')) {
    const shipmentId = path.split('/')[2];
    parentItem = { path: '/tracking', label: 'Shipment Tracking' };
    currentLabel = `Shipment ${shipmentId}`;
  }

  return (
    <nav className="flex items-center space-x-2 text-xs font-mono mb-4 text-slate-400 select-none">
      {/* Root Facility Link */}
      <Link
        to="/control-tower"
        className="flex items-center space-x-1.5 hover:text-blue-600 transition group font-medium"
      >
        <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
        <span>Naperville DC-1</span>
      </Link>

      <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

      {/* Parent link if applicable */}
      {parentItem && (
        <>
          <Link
            to={parentItem.path}
            className="hover:text-blue-600 transition font-medium"
          >
            {parentItem.label}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        </>
      )}

      {/* Current Page Active Label */}
      <span className="font-bold text-slate-800 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
        {currentLabel}
      </span>
    </nav>
  );
};

export default Breadcrumbs;
