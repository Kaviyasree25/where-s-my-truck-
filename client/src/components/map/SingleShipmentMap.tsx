import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { Shipment, TrailerPosition } from '../../types';
import {
  Truck,
  Building2,
  Navigation,
  Compass,
  MapPin,
  Clock,
  Gauge,
  ShieldCheck,
  RefreshCw,
  Eye,
  RotateCw,
  Box,
  Layers,
  ZoomIn,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { MapGestureOverlay } from './MapGestureOverlay';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const WAREHOUSE_LAT = 41.7508;
const WAREHOUSE_LNG = -88.1535;

const createSingleTruckIcon = (headingDeg: number = 0, isStationary: boolean = false, carrierName: string = 'Truck') => {
  const pinBg = isStationary ? '#10B981' : '#2563EB';

  const html = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <!-- Carrier label above the circle -->
      <div style="
        position: absolute;
        bottom: 38px;
        left: 50%;
        transform: translateX(-50%);
        background: #0F172A;
        color: #FFFFFF;
        font-family: 'JetBrains Mono', monospace, ui-monospace, sans-serif;
        font-size: 9px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.2);
        letter-spacing: 0.02em;
        pointer-events: none;
      ">
        ${carrierName.split(' ')[0]}
      </div>

      <!-- Centered Circular Puck Badge -->
      <div style="
        width: 32px;
        height: 32px;
        background: ${pinBg};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2.5px solid #FFFFFF;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s ease;
      ">
        <!-- Clean Truck Vector Icon -->
        <svg style="width: 17px; height: 17px; fill: white;" viewBox="0 0 24 24">
          <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'single-truck-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
};

const createOriginIcon = () => {
  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="
        background: #047857;
        color: #FFFFFF;
        font-family: ui-sans-serif, system-ui, sans-serif;
        font-size: 9px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        margin-bottom: 2px;
        border: 1px solid rgba(255,255,255,0.3);
      ">
        ORIGIN
      </div>
      <div style="
        width: 24px;
        height: 24px;
        background: #10B981;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #FFFFFF;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">
        <svg style="width: 14px; height: 14px; fill: white;" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'origin-marker',
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -44],
  });
};

const createDestWarehouseIcon = () => {
  const html = `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
      <div style="
        background: #1E293B;
        color: #FFFFFF;
        font-family: ui-sans-serif, system-ui, sans-serif;
        font-size: 9px;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        margin-bottom: 2px;
        border: 1px solid rgba(255,255,255,0.2);
      ">
        DC-1 MAIN HUB
      </div>
      <div style="
        width: 26px;
        height: 26px;
        background: #0284C7;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #FFFFFF;
        box-shadow: 0 3px 10px rgba(0,0,0,0.25);
      ">
        <svg style="width: 14px; height: 14px; fill: white;" viewBox="0 0 24 24">
          <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'dest-warehouse-marker',
    iconSize: [36, 46],
    iconAnchor: [18, 46],
    popupAnchor: [0, -46],
  });
};

// Map Camera Helper
function SingleMapCameraHandler({
  truckPos,
  waypoints,
  triggerFocus,
  triggerFit,
}: {
  truckPos: [number, number] | null;
  waypoints: [number, number][];
  triggerFocus: number;
  triggerFit: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (waypoints.length > 0) {
      const bounds = L.latLngBounds(waypoints);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11, animate: true });
    } else if (truckPos) {
      map.setView(truckPos, 13, { animate: true });
    }
  }, [map]);

  useEffect(() => {
    if (triggerFocus > 0 && truckPos) {
      map.setView(truckPos, 14, { animate: true });
    }
  }, [triggerFocus, truckPos, map]);

  useEffect(() => {
    if (triggerFit > 0) {
      if (waypoints.length > 0) {
        const bounds = L.latLngBounds(waypoints);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11, animate: true });
      } else if (truckPos) {
        map.setView(truckPos, 12, { animate: true });
      }
    }
  }, [triggerFit, waypoints, truckPos, map]);

  return null;
}

interface SingleShipmentMapProps {
  shipment: Shipment;
  carrierName?: string;
}

export const SingleShipmentMap: React.FC<SingleShipmentMapProps> = ({ shipment, carrierName }) => {
  const trailerId = shipment.trailerId;
  const [routeData, setRouteData] = useState<any>(null);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [speedMph, setSpeedMph] = useState<number>(64);
  const [trafficStatus, setTrafficStatus] = useState<string>('Clear Highway Cruise');
  const [distanceRemaining, setDistanceRemaining] = useState<number>(120);
  const [etaMinutes, setEtaMinutes] = useState<number>(45);
  const [triggerFocus, setTriggerFocus] = useState(0);
  const [triggerFit, setTriggerFit] = useState(0);
  const [isHudMinimized, setIsHudMinimized] = useState(false);

  const isStationary = shipment.status === 'IN_YARD' || shipment.status === 'DOCK_ASSIGNED' || shipment.status === 'PROCESSING' || shipment.status === 'COMPLETED';

  useEffect(() => {
    if (!trailerId) return;

    // Fetch initial route waypoints & telemetry
    api.getTrailerRoute(trailerId).then(data => {
      setRouteData(data);
      if (data.waypoints && data.waypoints.length > 0) {
        const idx = data.currentIndex || 0;
        const pt = data.waypoints[idx] || data.waypoints[0];
        setCurrentPos(pt);
      } else if (isStationary) {
        setCurrentPos([WAREHOUSE_LAT, WAREHOUSE_LNG]);
      }
      setSpeedMph(data.speedMph || 0);
      setTrafficStatus(data.trafficStatus || 'Parked');
      setDistanceRemaining(data.distanceRemainingMiles || 0);
      setEtaMinutes(data.etaMinutes || 0);
    }).catch(console.error);

    // Subscribe to live socket position updates
    const socket = getSocket();
    const handlePositions = (positions: TrailerPosition[]) => {
      const match = positions.find(p => p.id === trailerId);
      if (match && match.lat !== undefined && match.lng !== undefined) {
        setCurrentPos([match.lat, match.lng]);
        if (match.heading !== undefined) setHeading(match.heading);
      }
    };

    socket.on('TRAILER_POSITION_EVENT', handlePositions);
    return () => {
      socket.off('TRAILER_POSITION_EVENT', handlePositions);
    };
  }, [trailerId, shipment.status]);

  const waypoints = routeData?.waypoints || [];
  const originPos: [number, number] | null = waypoints.length > 0 ? waypoints[0] : null;
  const destPos: [number, number] = [WAREHOUSE_LAT, WAREHOUSE_LNG];

  const truckMarkerPos: [number, number] = currentPos || (waypoints.length > 0 ? waypoints[0] : [WAREHOUSE_LAT, WAREHOUSE_LNG]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm font-sans space-y-0">
      {/* Map Header Bar */}
      {/* Map Card Header */}
      <div className="px-3.5 sm:px-5 py-3 sm:py-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-bold text-slate-900 text-xs font-mono">
                LIVE FREIGHT HIGHWAY CORRIDOR TRACKER
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold flex items-center space-x-1.5 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="whitespace-nowrap">GPS ACTIVE</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {shipment.origin || 'Origin Terminal'} ➔ {shipment.destination || 'Naperville DC-1 Hub'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 font-mono text-xs shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setTriggerFocus(prev => prev + 1)}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold flex items-center space-x-1.5 transition shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
            title="Center camera on this truck"
          >
            <ZoomIn className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="whitespace-nowrap">Focus Truck</span>
          </button>

          <button
            onClick={() => setTriggerFit(prev => prev + 1)}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold flex items-center space-x-1.5 transition shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
            title="Fit full corridor route in view"
          >
            <Layers className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="whitespace-nowrap">Fit Route</span>
          </button>
        </div>
      </div>

      {/* Map View Container */}
      <div className="relative w-full h-[380px] bg-slate-100">
        <MapContainer
          center={truckMarkerPos}
          zoom={9}
          zoomControl={false}
          className="w-full h-full z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            maxZoom={19}
          />

          {/* 2-Finger Mobile Touch Gesture Overlay */}
          <MapGestureOverlay />

          <SingleMapCameraHandler
            truckPos={currentPos}
            waypoints={waypoints}
            triggerFocus={triggerFocus}
            triggerFit={triggerFit}
          />

          {/* OSRM Route Road Polyline */}
          {waypoints.length > 1 && (
            <Polyline
              positions={waypoints}
              pathOptions={{
                color: '#2563EB',
                weight: 4.5,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            >
              <Tooltip sticky className="font-mono text-xs">
                {routeData?.highway || 'Interstate Highway Corridor'} ({distanceRemaining} mi remaining)
              </Tooltip>
            </Polyline>
          )}

          {/* Origin Marker */}
          {originPos && (
            <Marker position={originPos} icon={createOriginIcon()}>
              <Popup className="font-mono text-xs">
                <div className="p-1 space-y-1">
                  <div className="font-bold text-slate-900">{shipment.origin || 'Dispatch Origin'}</div>
                  <div className="text-slate-500 text-[10px]">Supplier: {shipment.supplier}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination DC Marker */}
          <Marker position={destPos} icon={createDestWarehouseIcon()}>
            <Popup className="font-mono text-xs">
              <div className="p-1 space-y-1">
                <div className="font-bold text-slate-900">Naperville Logistics DC-1</div>
                <div className="text-slate-500 text-[10px]">
                  {shipment.currentDockId ? `Designated Bay: ${shipment.currentDockId}` : 'Main Facility Gates'}
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Live Single Truck Marker */}
          <Marker
            position={truckMarkerPos}
            icon={createSingleTruckIcon(heading, isStationary, carrierName || shipment.carrierName)}
          >
            <Popup className="font-mono text-xs">
              <div className="p-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2 border-b pb-1">
                  <span className="font-bold text-slate-900">{trailerId}</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                    {shipment.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Carrier: <span className="font-semibold text-slate-900">{shipment.carrierName}</span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Cargo: {shipment.itemsSummary}
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Floating Telemetry HUD */}
        {isHudMinimized ? (
          <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-xl px-2.5 py-1.5 shadow-lg font-mono text-xs flex items-center space-x-2 pointer-events-auto">
            <span className="font-bold text-slate-900">{trailerId}</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold truncate max-w-[130px] sm:max-w-none">
              {isStationary ? (shipment.currentDockId ? `At ${shipment.currentDockId}` : `Yard Slot ${shipment.currentYardSlotId || 'A01'}`) : `${speedMph} mph`}
            </span>
            <button
              onClick={() => setIsHudMinimized(false)}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Expand telemetry panel"
            >
              <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
            </button>
          </div>
        ) : (
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-auto z-[400] bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-lg font-mono text-xs max-w-full sm:max-w-xs space-y-1.5 sm:space-y-2 pointer-events-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400">Unit Telemetry</span>
              <div className="flex items-center space-x-2">
                <span className="font-black text-slate-900">{trailerId}</span>
                <button
                  onClick={() => setIsHudMinimized(true)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title="Minimize telemetry panel"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700 text-[11px]">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Speed</span>
                <span className="font-bold text-slate-900 flex items-center space-x-1">
                  <Gauge className="w-3 h-3 text-blue-600" />
                  <span>{isStationary ? '0 mph' : `${speedMph} mph`}</span>
                </span>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Transit Status</span>
                <span className="font-bold text-emerald-700 truncate block">
                  {isStationary ? (shipment.currentDockId ? `At ${shipment.currentDockId}` : `In Yard Slot ${shipment.currentYardSlotId || 'A01'}`) : trafficStatus}
                </span>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Est. Arrival</span>
                <span className="font-bold text-slate-900 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>{new Date(shipment.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Load Type</span>
                <span className="font-bold text-blue-700">{shipment.loadType}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleShipmentMap;
