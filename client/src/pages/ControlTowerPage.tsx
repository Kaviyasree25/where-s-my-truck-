import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { Shipment, Dock, AnalyticsKPIs, SmartQueueItem, MLRecommendationResponse, TimeHorizon } from '../types';
import { KPICard } from '../components/common/KPICard';
import { StatusBadge } from '../components/common/StatusBadge';
import { AllocationModal } from '../components/allocation/AllocationModal';
import { ReassignmentModal } from '../components/common/ReassignmentModal';
import { SmartQueueCard } from '../components/common/SmartQueueCard';
import { MLRecommendationBadge } from '../components/common/MLRecommendationBadge';
import { MLModelModal } from '../components/common/MLModelModal';
import { TimeHorizonFilter } from '../components/common/TimeHorizonFilter';
import {
  Truck, Building2, AlertTriangle, Grid, Search,
  SlidersHorizontal, Sparkles, ArrowRight, RefreshCw, Cpu, Navigation,
  Compass, MapPin, Gauge, ShieldAlert, X, Eye, RotateCcw, Route, CheckCircle2,
  ZoomIn, Clock, Box, PackageCheck, Scale
} from 'lucide-react';

// ─── Leaflet Icon Asset Fix ──────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const WAREHOUSE_LAT = 41.7508;
const WAREHOUSE_LNG = -88.1535;

// ─── Pixel-Perfect Compact Truck Pointer Pins ────────────────────────────────
function createTruckPointerIcon(
  trailerId: string,
  status: string,
  risk: string = 'NORMAL',
  isSelected: boolean = false,
  heading: number = 0
) {
  // Theme status colors
  let pinColor = '#10b981'; // Emerald (En route / on time)

  if (status === 'EN_ROUTE') {
    if (risk === 'CRITICAL') {
      pinColor = '#ef4444';
    } else if (risk === 'DELAYED' || risk === 'WARNING') {
      pinColor = '#f59e0b';
    }
  } else if (status === 'IN_YARD') {
    pinColor = '#2563eb';
  } else if (status === 'AT_DOCK') {
    pinColor = '#7c3aed';
  } else {
    pinColor = '#64748b';
  }

  const ringEffect = isSelected
    ? 'filter: drop-shadow(0 0 8px rgba(37,99,235,0.7)); transform: scale(1.15);'
    : 'filter: drop-shadow(0 2px 4px rgba(0,0,0,0.18));';

  const html = `
    <div style="width:28px; height:36px; position:relative; ${ringEffect} transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);" class="cursor-pointer">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Pointer Needle Pin Shape -->
        <path d="M14 0C6.268 0 0 6.268 0 14C0 22.5 14 36 14 36C14 36 28 22.5 28 14C28 6.268 21.732 0 14 0Z" fill="${pinColor}" stroke="#ffffff" stroke-width="2"/>
        <!-- Inner White Disc -->
        <circle cx="14" cy="14" r="9" fill="#ffffff"/>
        <!-- Clean Truck Silhouette -->
        <path d="M9.5 16.5C8.95 16.5 8.5 16.05 8.5 15.5V11C8.5 10.45 8.95 10 9.5 10H14.5V16.5H9.5ZM15.5 16.5V11.5H17.2C17.45 11.5 17.7 11.65 17.85 11.85L19.2 13.65C19.4 13.9 19.5 14.2 19.5 14.5V15.5C19.5 16.05 19.05 16.5 18.5 16.5H15.5ZM10.5 18C9.67 18 9 17.33 9 16.5C9 15.67 9.67 15 10.5 15C11.33 15 12 15.67 12 16.5C12 17.33 11.33 18 10.5 18ZM17.5 18C16.67 18 16 17.33 16 16.5C16 15.67 16.67 15 17.5 15C18.33 15 19 15.67 19 16.5C19 17.33 18.33 18 17.5 18Z" fill="${pinColor}"/>
      </svg>
      <!-- Tiny Compact Pill Label (Non-wrapping, tight hit-box) -->
      <div style="position:absolute; top:36px; left:50%; transform:translateX(-50%); pointer-events:none; white-space:nowrap;" class="bg-slate-900/90 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded shadow-md border border-slate-700">
        ${trailerId}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'clean-truck-pin',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -38],
  });
}

const WAREHOUSE_POINTER_ICON = L.divIcon({
  html: `
    <div style="width:34px; height:42px; position:relative; filter:drop-shadow(0 3px 6px rgba(0,0,0,0.25));" class="cursor-pointer">
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.611 0 0 7.611 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.611 26.389 0 17 0Z" fill="#0f172a" stroke="#3b82f6" stroke-width="2.2"/>
        <circle cx="17" cy="17" r="11" fill="#3b82f6"/>
        <!-- Building Icon -->
        <path d="M12.5 21.5V13H21.5V21.5M14.5 15H15.5M18.5 15H19.5M14.5 18.5H15.5M18.5 18.5H19.5" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <div style="position:absolute; top:42px; left:50%; transform:translateX(-50%); pointer-events:none; white-space:nowrap;" class="bg-blue-950 text-blue-200 font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-lg border border-blue-500">
        🏢 DC-1 HUB
      </div>
    </div>
  `,
  className: 'clean-warehouse-pin',
  iconSize: [34, 42],
  iconAnchor: [17, 42],
  popupAnchor: [0, -44],
});

function createOriginPinIcon(city: string = 'Origin') {
  return L.divIcon({
    html: `
      <div style="position:relative; transform:translate(-50%, -50%);" class="pointer-events-none">
        <div class="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-[10px] shadow-lg border-2 border-white ring-2 ring-slate-400">
          A
        </div>
        <div class="absolute top-7 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm text-slate-800 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow border border-slate-200 whitespace-nowrap">
          ${city}
        </div>
      </div>
    `,
    className: 'clean-origin-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

interface TrailerPosition {
  id: string;
  lat?: number;
  lng?: number;
  heading?: number;
  status: string;
  trailerType?: string;
  shipmentId?: string;
  carrierName?: string;
  priority?: string;
  risk?: string;
  eta?: string;
  demurrageRisk?: string;
  hasActiveException?: boolean;
}

// ─── Map Background Click Handler (Deselect when clicking empty space) ────────
function MapClickHandler({ onDeselect }: { onDeselect: () => void }) {
  useMapEvents({
    click: () => {
      onDeselect();
    },
  });
  return null;
}

// ─── Camera Controller (Smooth, Jitter-Free Pan/Zoom) ─────────────────────────
function MapCameraHandler({
  selectedTrailer,
  positions,
}: {
  selectedTrailer: string | null;
  positions: TrailerPosition[];
}) {
  const map = useMap();
  const prevTrailerRef = useRef<string | null>(null);

  useEffect(() => {
    // Only animate camera when selected trailer ID actually changes (not on continuous socket ticks)
    if (selectedTrailer && selectedTrailer !== prevTrailerRef.current) {
      prevTrailerRef.current = selectedTrailer;
      const pos = positions.find(p => p.id === selectedTrailer);

      if (pos?.lat && pos?.lng) {
        if (pos.status === 'EN_ROUTE') {
          // Gentle zoom in on en-route highway truck
          map.flyTo([pos.lat, pos.lng], 8.5, { duration: 1.2 });
        } else {
          // Deep zoom into facility yard bay / dock slot
          map.flyTo([pos.lat, pos.lng], 16, { duration: 1.2 });
        }
      }
    } else if (!selectedTrailer && prevTrailerRef.current) {
      prevTrailerRef.current = null;
    }
  }, [selectedTrailer]);

  return null;
}

// ─── Full-Width Interactive Control Tower Map ────────────────────────────────
function FullWidthControlTowerMap({
  positions,
  selectedTrailer,
  onSelectTrailer,
  allRoutes,
  shipments,
}: {
  positions: TrailerPosition[];
  selectedTrailer: string | null;
  onSelectTrailer: (id: string | null) => void;
  allRoutes: Record<string, [number, number][]>;
  shipments: Shipment[];
}) {
  const mapRef = useRef<L.Map | null>(null);
  const [mapFilter, setMapFilter] = useState<'ALL' | 'EN_ROUTE' | 'IN_YARD' | 'AT_DOCK'>('ALL');
  const [telemetryInfo, setTelemetryInfo] = useState<any>(null);

  // When trailer is selected, fetch dynamic live telemetry
  useEffect(() => {
    if (selectedTrailer) {
      api.getTrailerRoute(selectedTrailer)
        .then(setTelemetryInfo)
        .catch(() => setTelemetryInfo(null));
    } else {
      setTelemetryInfo(null);
    }
  }, [selectedTrailer]);

  // Compute active route and accurate matching shipment data
  const activeRoute = useMemo(() => {
    if (!selectedTrailer) return null;
    const currentPos = positions.find(p => p.id === selectedTrailer);
    const shipment = shipments.find(s => s.trailerId === selectedTrailer);
    const isEnRoute = currentPos?.status === 'EN_ROUTE';

    // Only EN_ROUTE trailers have active highway road lines
    const waypoints = isEnRoute ? (allRoutes[selectedTrailer] || []) : [];

    return {
      trailerId: selectedTrailer,
      isEnRoute,
      waypoints,
      currentPos,
      shipment,
      originPoint: isEnRoute && waypoints.length > 0 ? waypoints[0] : null,
      originName: shipment?.origin?.split(',')[0] || 'Origin Depot',
    };
  }, [selectedTrailer, allRoutes, positions, shipments]);

  const filteredPositions = positions.filter(p => {
    if (mapFilter === 'ALL') return true;
    return p.status === mapFilter;
  });

  const handleResetCamera = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([41.7, -86.2], 6.5, { duration: 1 });
      onSelectTrailer(null);
    }
  };

  const handleZoomToFacility = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([WAREHOUSE_LAT, WAREHOUSE_LNG], 15.5, { duration: 1.2 });
    }
  };

  const enRouteCount = positions.filter(p => p.status === 'EN_ROUTE').length;
  const inYardCount = positions.filter(p => p.status === 'IN_YARD').length;
  const atDockCount = positions.filter(p => p.status === 'AT_DOCK').length;

  const stationedAtFacility = useMemo(() => {
    return positions.filter(p => p.status === 'IN_YARD' || p.status === 'AT_DOCK');
  }, [positions]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* ─── Map Header & Live Corridor Toolbar ─── */}
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-blue-600 animate-pulse" />
            <h3 className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">
              LIVE INBOUND CORRIDOR MAP
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Midwest Highway Corridors • Naperville DC-1 Hub
          </span>
        </div>

        {/* Quick Filter Tabs & Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs font-mono text-xs">
            <button
              onClick={() => setMapFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${mapFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              All ({positions.length})
            </button>
            <button
              onClick={() => setMapFilter('EN_ROUTE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${mapFilter === 'EN_ROUTE'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>En Route ({enRouteCount})</span>
            </button>
            <button
              onClick={() => setMapFilter('IN_YARD')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${mapFilter === 'IN_YARD'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>Yard ({inYardCount})</span>
            </button>
            <button
              onClick={() => setMapFilter('AT_DOCK')}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${mapFilter === 'AT_DOCK'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span>Docks ({atDockCount})</span>
            </button>
          </div>

          {/* Focus DC-1 Facility (Solves overlapping issue) */}
          <button
            onClick={handleZoomToFacility}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-mono text-xs font-bold shadow-xs transition"
            title="Zoom directly into DC-1 facility bays and yard slots"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Focus Facility</span>
          </button>

          <button
            onClick={handleResetCamera}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 font-mono text-xs font-bold shadow-xs hover:bg-slate-50 transition"
            title="Reset Regional Map Bounds"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Reset View</span>
          </button>
        </div>
      </div>

      {/* ─── Map Canvas (Height 520px) ─── */}
      <div className="relative w-full h-[520px] bg-slate-100">
        <MapContainer
          center={[41.7, -86.2]}
          zoom={6.5}
          ref={mapRef}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          {/* CartoDB Voyager Light Basemap */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            maxZoom={18}
          />

          <ZoomControl position="bottomright" />

          {/* Deselect trailer when clicking on empty map background */}
          <MapClickHandler onDeselect={() => onSelectTrailer(null)} />

          <MapCameraHandler
            selectedTrailer={selectedTrailer}
            positions={positions}
          />

          {/* Highway Road Route Polylines (ONLY for EN_ROUTE trailers) */}
          {activeRoute && activeRoute.isEnRoute && activeRoute.waypoints.length > 0 && (
            <>
              {/* Outer Route Glow Casing */}
              <Polyline
                positions={activeRoute.waypoints}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 7,
                  opacity: 0.25,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Inner Road Route Polyline */}
              <Polyline
                positions={activeRoute.waypoints}
                pathOptions={{
                  color: '#2563eb',
                  weight: 3.5,
                  opacity: 0.95,
                  dashArray: '6, 6',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />

              {/* Origin City Pin */}
              {activeRoute.originPoint && (
                <Marker
                  position={activeRoute.originPoint}
                  icon={createOriginPinIcon(activeRoute.originName)}
                />
              )}
            </>
          )}

          {/* Warehouse Facility Marker with Stationed Asset Menu */}
          <Marker position={[WAREHOUSE_LAT, WAREHOUSE_LNG]} icon={WAREHOUSE_POINTER_ICON} zIndexOffset={200}>
            <Popup className="clean-leaflet-popup">
              <div className="p-2.5 font-mono text-xs min-w-[240px] max-w-[280px]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Naperville Hub DC-1</span>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
                    MAIN FACILITY
                  </span>
                </div>

                <div className="text-slate-500 text-[11px] mb-2.5">
                  Central Inbound Distribution &amp; Dock Terminal
                </div>

                {/* Stationed Trailers Quick Inspector */}
                <div className="space-y-1.5 mb-2.5 max-h-44 overflow-y-auto pr-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Stationed Trailers ({stationedAtFacility.length})
                  </div>
                  {stationedAtFacility.map(t => (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrailer(t.id);
                      }}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200 flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${t.status === 'AT_DOCK' ? 'bg-purple-600' : 'bg-blue-600'}`}></span>
                        <span className="font-bold text-slate-900">{t.id}</span>
                        <span className="text-[10px] text-slate-500">({t.carrierName?.split(' ')[0]})</span>
                      </div>
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        {t.status === 'AT_DOCK' ? 'DOCK' : 'YARD'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Direct Zoom In Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomToFacility();
                  }}
                  className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-mono text-[11px] font-bold flex items-center justify-center space-x-1.5 transition"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Zoom In Facility Bay Layout</span>
                </button>
              </div>
            </Popup>
          </Marker>

          {/* Trailer Markers */}
          {filteredPositions
            .filter(p => p.lat != null && p.lng != null)
            .map(pos => {
              const isSelected = selectedTrailer === pos.id;
              return (
                <Marker
                  key={pos.id}
                  position={[pos.lat!, pos.lng!]}
                  icon={createTruckPointerIcon(
                    pos.id,
                    pos.status,
                    pos.risk,
                    isSelected,
                    pos.heading || 0
                  )}
                  zIndexOffset={isSelected ? 1000 : 500}
                  eventHandlers={{
                    click: (e) => {
                      L.DomEvent.stopPropagation(e);
                      onSelectTrailer(isSelected ? null : pos.id);
                    },
                  }}
                >
                  <Tooltip direction="top" offset={[0, -38]} opacity={1}>
                    <div className="font-mono text-xs">
                      <div className="font-bold text-slate-900 flex items-center space-x-1">
                        <span>{pos.id}</span>
                        <span className="text-slate-400 font-normal">({pos.carrierName})</span>
                      </div>
                      <div className="text-[10px] text-blue-600 font-medium">
                        {pos.status === 'EN_ROUTE' ? 'Click to track road corridor' : 'Click to view stationed bay telemetry'}
                      </div>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}
        </MapContainer>

        {/* ─── Floating Google Maps Telemetry HUD (Selected Truck) ─── */}
        {activeRoute && activeRoute.currentPos && (
          <div className="absolute bottom-4 left-4 z-[400] w-[420px] max-w-[calc(100%-2rem)] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-4 font-mono transition-all animate-in fade-in slide-in-from-bottom-2">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-slate-900 text-sm">{activeRoute.trailerId}</span>
                    <StatusBadge status={activeRoute.currentPos.status} type="shipment" size="sm" />
                    {activeRoute.shipment && (
                      <span className="text-[10px] font-mono text-slate-400 font-normal">
                        ({activeRoute.shipment.id})
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                    {activeRoute.shipment?.carrierName || activeRoute.currentPos.carrierName}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onSelectTrailer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title="Dismiss Route"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* IF EN_ROUTE: Show Highway Corridor & Speed Telemetry */}
            {activeRoute.isEnRoute ? (
              <>
                <div className="py-2.5 text-[11px] text-slate-700 space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="text-slate-400 text-[10px]">ORIGIN</span>
                    <span className="font-semibold text-right truncate max-w-[220px]">
                      {activeRoute.shipment?.origin || 'Midwest Dispatch Hub'}
                    </span>
                  </div>
                  <div className="flex items-center justify-center py-0.5">
                    <span className="w-full border-t border-dashed border-slate-200 flex-1"></span>
                    <span className="px-2 text-[10px] text-blue-600 font-bold bg-blue-50 rounded-full py-0.5 mx-1 flex items-center space-x-1">
                      <Route className="w-3 h-3" />
                      <span>{telemetryInfo?.highway || 'OSRM Highway Corridor'}</span>
                    </span>
                    <span className="w-full border-t border-dashed border-slate-200 flex-1"></span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-slate-400 text-[10px]">DESTINATION</span>
                    <span className="font-semibold text-right text-blue-700">
                      {activeRoute.shipment?.destination || 'Naperville DC-1 (Inbound Bay)'}
                    </span>
                  </div>
                </div>

                {/* Live Speed & Remaining Distance */}
                <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50/80 rounded-xl p-2 border border-slate-200/70 text-center mb-2.5">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-sans uppercase">Speed</span>
                    <span className="font-extrabold text-slate-800 text-xs flex items-center justify-center space-x-0.5">
                      <Gauge className="w-3 h-3 text-blue-500 mr-0.5" />
                      <span>{telemetryInfo?.speedMph ? `${telemetryInfo.speedMph} mph` : '62 mph'}</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-sans uppercase">Remaining</span>
                    <span className="font-extrabold text-emerald-600 text-xs">
                      {telemetryInfo?.distanceRemainingMiles ? `~${telemetryInfo.distanceRemainingMiles} mi` : '~85 mi'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-sans uppercase">Traffic Flow</span>
                    <span className="font-bold text-slate-700 text-[10px] truncate block">
                      {telemetryInfo?.trafficStatus || 'Clear Cruise'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* IF IN_YARD / AT_DOCK: Show Stationed Location & Dwell Metrics */
              <>
                <div className="py-2.5 text-[11px] text-slate-700 space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="text-slate-400 text-[10px]">CURRENT LOCATION</span>
                    <span className="font-bold text-blue-700 text-right">
                      {activeRoute.currentPos.status === 'AT_DOCK'
                        ? `Dock Bay ${activeRoute.shipment?.currentDockId || 'D01'} (Unloading Bay)`
                        : `Yard Slot ${activeRoute.shipment?.currentYardSlotId || 'A42'} (Staging Area)`}
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-slate-400 text-[10px]">SUPPLIER</span>
                    <span className="font-semibold text-right text-slate-800 truncate max-w-[220px]">
                      {activeRoute.shipment?.supplier || 'Supplier Network'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-slate-400 text-[10px]">CARGO TYPE</span>
                    <span className="font-semibold text-right text-slate-800">
                      {activeRoute.shipment?.loadType || activeRoute.currentPos.trailerType || 'DRY_VAN'} • {activeRoute.shipment?.totalWeightKg ? `${activeRoute.shipment.totalWeightKg.toLocaleString()} kg` : 'Standard'}
                    </span>
                  </div>
                </div>

                {/* Stationed Status & Dwell Time */}
                <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50/80 rounded-xl p-2 border border-slate-200/70 text-center mb-2.5">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-sans uppercase">Motion</span>
                    <span className="font-extrabold text-slate-600 text-xs flex items-center justify-center space-x-0.5">
                      <span>0 mph (Parked)</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-sans uppercase">Dwell Time</span>
                    <span className="font-extrabold text-amber-600 text-xs flex items-center justify-center space-x-0.5">
                      <Clock className="w-3 h-3 text-amber-500 mr-0.5" />
                      <span>{telemetryInfo?.dwellMinutes || 45} mins</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-sans uppercase">Status</span>
                    <span className="font-bold text-slate-800 text-[10px] truncate block">
                      {activeRoute.currentPos.status === 'AT_DOCK' ? 'Unloading' : 'Staged in Yard'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Manifest Items Summary Banner */}
            {activeRoute.shipment?.itemsSummary && (
              <div className="mb-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-700">
                <div className="flex items-center space-x-1.5 text-slate-500 font-bold mb-0.5 uppercase tracking-wider text-[9px]">
                  <Box className="w-3 h-3 text-blue-500" />
                  <span>Manifest Cargo</span>
                </div>
                <div className="font-semibold text-slate-900 truncate">
                  {activeRoute.shipment.itemsSummary}
                </div>
              </div>
            )}

            {/* Demurrage Risk */}
            {activeRoute.currentPos.demurrageRisk && activeRoute.currentPos.demurrageRisk !== 'NORMAL' && (
              <div className="mb-2.5 p-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center space-x-2 text-[10px] text-amber-800 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Demurrage Alert: {activeRoute.currentPos.demurrageRisk.replace('_', ' ')}</span>
              </div>
            )}

            {/* Manifest Button */}
            {activeRoute.currentPos.shipmentId && (
              <button
                onClick={() => window.location.assign(`/shipments/${activeRoute.currentPos?.shipmentId}`)}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Full Manifest ({activeRoute.currentPos.shipmentId})</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Control Tower Page ───────────────────────────────────────────────────
export const ControlTowerPage: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [smartQueue, setSmartQueue] = useState<SmartQueueItem[]>([]);
  const [mlRec, setMlRec] = useState<MLRecommendationResponse | null>(null);
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [trailerPositions, setTrailerPositions] = useState<TrailerPosition[]>([]);
  const [allRoutes, setAllRoutes] = useState<Record<string, [number, number][]>>({});
  const [selectedTrailerId, setSelectedTrailerId] = useState<string | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Modals
  const [allocationTarget, setAllocationTarget] = useState<Shipment | null>(null);
  const [reassignmentData, setReassignmentData] = useState<any | null>(null);
  const [showMLModal, setShowMLModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();

    // Seed map markers and preloaded routes
    api.getTrailerPositions().then(setTrailerPositions).catch(console.error);
    api.getAllTrailerRoutes().then(setAllRoutes).catch(console.error);

    const socket = getSocket();
    const onDockFailure = (payload: any) => { setReassignmentData(payload); fetchData(); };
    const onOpsChange = () => fetchData();
    const onRecsUpdated = (payload: any) => {
      if (payload?.recommendations?.length > 0) setMlRec(payload.recommendations[0]);
      fetchData();
    };
    const onPositions = (positions: TrailerPosition[]) => {
      setTrailerPositions(positions);
    };

    socket.on('DOCK_FAILURE_EVENT', onDockFailure);
    socket.on('OPERATIONAL_STATE_CHANGED', onOpsChange);
    socket.on('DEMO_RESET_EVENT', onOpsChange);
    socket.on('SENSOR_MATCH_EVENT', onOpsChange);
    socket.on('SENSOR_MISMATCH_EVENT', onOpsChange);
    socket.on('DOCK_ROTATION_EVENT', onOpsChange);
    socket.on('DOCK_ROTATION_TICK', onOpsChange);
    socket.on('SCHEDULE_PREEMPTION_EVENT', onOpsChange);
    socket.on('CLEAR_PREEMPTION_EVENT', onOpsChange);
    socket.on('RECOMMENDATIONS_UPDATED', onRecsUpdated);
    socket.on('TRAILER_POSITION_EVENT', onPositions);

    return () => {
      socket.off('DOCK_FAILURE_EVENT', onDockFailure);
      socket.off('OPERATIONAL_STATE_CHANGED', onOpsChange);
      socket.off('DEMO_RESET_EVENT', onOpsChange);
      socket.off('SENSOR_MATCH_EVENT', onOpsChange);
      socket.off('SENSOR_MISMATCH_EVENT', onOpsChange);
      socket.off('DOCK_ROTATION_EVENT', onOpsChange);
      socket.off('DOCK_ROTATION_TICK', onOpsChange);
      socket.off('SCHEDULE_PREEMPTION_EVENT', onOpsChange);
      socket.off('CLEAR_PREEMPTION_EVENT', onOpsChange);
      socket.off('RECOMMENDATIONS_UPDATED', onRecsUpdated);
      socket.off('TRAILER_POSITION_EVENT', onPositions);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shipmentList, dockList, kpiData, queueData, mlData] = await Promise.all([
        api.getShipments().catch(() => []),
        api.getDocks().catch(() => []),
        api.getAnalyticsKPIs().catch(() => null),
        api.getSmartQueue().catch(() => []),
        api.getMLRecommendation('TR-106').catch(() => null),
      ]);
      if (shipmentList && shipmentList.length > 0) setShipments(shipmentList);
      if (dockList && dockList.length > 0) setDocks(dockList);
      if (kpiData) setKpis(kpiData);
      if (queueData && queueData.length > 0) setSmartQueue(queueData);
      if (mlData) setMlRec(mlData);
    } catch (err) {
      console.error('Error fetching control tower data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplayRoutes = async () => {
    setIsReplaying(true);
    try {
      await api.resetRoutes();
      const updatedPositions = await api.getTrailerPositions();
      setTrailerPositions(updatedPositions);
      setBannerMessage('Truck route simulation restarted from origin dispatch points!');
      setTimeout(() => setBannerMessage(null), 4000);
    } catch (err: any) {
      console.error('Error resetting routes:', err);
    } finally {
      setIsReplaying(false);
    }
  };

  const handleSelectAllocationByShipmentId = (shipmentId: string) => {
    const target = shipments.find(s => s.id === shipmentId || s.trailerId === shipmentId);
    if (target) {
      setAllocationTarget(target);
    } else {
      api.getShipmentById(shipmentId).then(shp => {
        if (shp) setAllocationTarget(shp);
      }).catch(console.error);
    }
  };

  const handleFocusTruckFromRow = (trailerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrailerId(trailerId);
  };

  const filteredShipments = shipments.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      s.id.toLowerCase().includes(q) ||
      s.trackingNumber.toLowerCase().includes(q) ||
      s.trailerId.toLowerCase().includes(q) ||
      s.carrierName.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (riskFilter !== 'ALL' && s.risk !== riskFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Warehouse Inbound Control Tower
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Live Highway Corridors, Machine Learning Allocations &amp; Real-Time Yard Telemetry
          </p>
        </div>
      </div>

      {/* Banner Feedback if replayed */}
      {bannerMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Active Inbound"
            value={kpis.activeShipmentsCount}
            subtitle={`${kpis.trailersArrivingToday} Trailers Scheduled Today`}
            icon={Truck}
            highlightColor="blue"
          />
          <KPICard
            title="Dock Utilization"
            value={`${kpis.dockUtilizationPercent}%`}
            subtitle="Current Active Unloading Bays"
            icon={Building2}
            trend={{ value: 'Normal Fit', isPositive: true }}
            highlightColor="emerald"
          />
          <KPICard
            title="Yard Occupancy"
            value={`${kpis.yardOccupancyPercent}%`}
            subtitle="Total Available Slots Capacity"
            icon={Grid}
            trend={
              kpis.yardOccupancyPercent >= 80
                ? { value: 'HIGH CONGESTION', isWarning: true }
                : { value: 'Optimal', isPositive: true }
            }
            highlightColor={kpis.yardOccupancyPercent >= 80 ? 'amber' : 'blue'}
          />
          <KPICard
            title="Active Exceptions"
            value={kpis.activeExceptionsCount}
            subtitle="Requires Operator Resolution"
            icon={AlertTriangle}
            trend={
              kpis.activeExceptionsCount > 0
                ? { value: `${kpis.activeExceptionsCount} ACTION REQ`, isWarning: true }
                : { value: 'Clear', isPositive: true }
            }
            highlightColor={kpis.activeExceptionsCount > 0 ? 'rose' : 'emerald'}
          />
        </div>
      )}

      {/* ─── FULL-WIDTH DEDICATED LIVE INBOUND CORRIDOR MAP ─── */}
      <FullWidthControlTowerMap
        positions={trailerPositions}
        selectedTrailer={selectedTrailerId}
        onSelectTrailer={setSelectedTrailerId}
        allRoutes={allRoutes}
        shipments={shipments}
      />

      {/* ─── LIVE DOCK DOORS STRIP ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Live Dock Bay Status Matrix
            </h3>
          </div>
          <button
            onClick={() => navigate('/docks')}
            className="text-xs font-mono text-blue-600 hover:text-blue-800 font-bold transition flex items-center space-x-1"
          >
            <span>Manage All Dock Doors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {['D01', 'D02', 'D03', 'D04', 'D05', 'D06'].map(dockId => {
            const dock = docks.find(d => d.id === dockId);
            const isOccupied = dock?.status === 'OCCUPIED';
            const isMaint = dock?.status === 'MAINTENANCE';
            const activeShipment = shipments.find(s => s.id === dock?.currentShipmentId || s.trailerId === dock?.currentTrailerId || s.currentDockId === dockId);
            const trailerId = dock?.currentTrailerId || activeShipment?.trailerId;
            const carrierName = activeShipment?.carrierName || (trailerId ? 'Line-Haul Freight' : '');

            return (
              <div
                key={dockId}
                onClick={() => {
                  if (trailerId) {
                    setSelectedTrailerId(trailerId);
                  } else {
                    navigate('/docks');
                  }
                }}
                className={`p-3 rounded-xl border transition cursor-pointer font-mono ${isOccupied
                    ? 'border-blue-200 bg-blue-50/70 hover:bg-blue-100/70'
                    : isMaint
                      ? 'border-amber-200 bg-amber-50/70 hover:bg-amber-100/70'
                      : 'border-dashed border-slate-200 bg-slate-50/40 hover:bg-slate-100/60'
                  }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-sm text-slate-900">{dockId}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isOccupied
                        ? 'bg-blue-100 text-blue-700'
                        : isMaint
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                  >
                    {isOccupied ? 'OCCUPIED' : isMaint ? 'MAINT.' : 'AVAILABLE'}
                  </span>
                </div>

                {isOccupied && trailerId ? (
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-blue-900 truncate">{trailerId}</div>
                    <div className="text-[10px] text-slate-500 truncate">{carrierName}</div>
                  </div>
                ) : isMaint ? (
                  <div className="text-[10px] text-amber-700 italic">Sanitization / Maint</div>
                ) : (
                  <div className="text-[10px] text-slate-400 italic">Available buffer</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ML Recommendation Banner */}
      {mlRec && (
        <MLRecommendationBadge
          recommendation={mlRec}
          type="DOCK"
          onAllocate={() => handleSelectAllocationByShipmentId(mlRec.shipmentId)}
          onInspectModel={() => setShowMLModal(true)}
        />
      )}

      {/* Smart Dynamic Priority Queue */}
      <SmartQueueCard
        queue={smartQueue}
        onSelectAllocation={handleSelectAllocationByShipmentId}
      />

      {/* Table Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Shipment, Trailer, Carrier..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-blue-300 font-mono"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <SlidersHorizontal className="w-4 h-4" />
            <span>Risk Filter:</span>
          </div>
          <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            {['ALL', 'NORMAL', 'WARNING', 'DELAYED', 'CRITICAL'].map(risk => (
              <button
                key={risk}
                onClick={() => setRiskFilter(risk)}
                className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${riskFilter === risk
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-900'
                  }`}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Inbound Shipment Manifest Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
            Live Inbound Shipment Manifest
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Showing {filteredShipments.length} Active Shipments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Shipment ID</th>
                <th className="py-3 px-4">Trailer / Carrier</th>
                <th className="py-3 px-4">Priority / Type</th>
                <th className="py-3 px-4">ETA / Appt</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Dock Bay</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {filteredShipments.map(s => {
                const isSelectedOnMap = selectedTrailerId === s.trailerId;
                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-blue-50/40 transition group cursor-pointer ${isSelectedOnMap ? 'bg-blue-50/70 border-l-4 border-l-blue-600' : ''
                      }`}
                    onClick={() => navigate(`/shipments/${s.id}`)}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{s.id}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{s.trackingNumber}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-slate-800">{s.trailerId}</span>
                        <button
                          onClick={e => handleFocusTruckFromRow(s.trailerId, e)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 transition font-mono"
                          title="Track on live map"
                        >
                          🗺️ Track
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400">{s.carrierName}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={s.priority} type="priority" size="sm" />
                      <div className="text-[10px] text-slate-400 mt-1">{s.loadType}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {(() => {
                        const etaDate = new Date(s.eta);
                        const apptDate = new Date(s.scheduledAppointment);
                        const diffMins = Math.round((etaDate.getTime() - apptDate.getTime()) / 60000);

                        return (
                          <div>
                            <div className="font-bold text-slate-900">
                              {etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Appt: {apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {diffMins <= 0 ? (
                              <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1">
                                <span>🟢 ON TIME ({diffMins === 0 ? '±0m' : `${diffMins}m`})</span>
                              </span>
                            ) : diffMins <= 20 ? (
                              <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1">
                                <span>🟡 DRIFTING (+{diffMins}m)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 mt-1">
                                <span>🔴 DELAYED (+{diffMins}m • AT RISK)</span>
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {s.currentDockId ? (
                        <span className="text-emerald-700 font-semibold">{s.currentDockId}</span>
                      ) : s.currentYardSlotId ? (
                        <span className="text-amber-700 font-semibold">Slot {s.currentYardSlotId}</span>
                      ) : (
                        <span className="text-blue-600 font-semibold flex items-center space-x-1">
                          <Navigation className="w-3 h-3 animate-pulse" />
                          <span>Highway En Route</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={s.status} type="shipment" size="sm" />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={s.risk} type="risk" size="sm" />
                    </td>

                    <td className="py-3.5 px-4 font-bold">
                      {s.currentDockId ? (
                        <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {s.currentDockId}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-normal italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setAllocationTarget(s)}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-semibold flex items-center space-x-1.5 ml-auto transition shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Smart Dock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation Modal */}
      {allocationTarget && (
        <AllocationModal
          shipment={allocationTarget}
          onClose={() => setAllocationTarget(null)}
          onAssigned={() => {
            setAllocationTarget(null);
            fetchData();
          }}
        />
      )}

      {/* Reassignment Modal */}
      {reassignmentData && (
        <ReassignmentModal
          data={reassignmentData}
          onClose={() => setReassignmentData(null)}
          onApproved={() => {
            setReassignmentData(null);
            fetchData();
          }}
        />
      )}

      {/* ML Architecture & Explainability Modal */}
      {showMLModal && (
        <MLModelModal
          onClose={() => setShowMLModal(false)}
          onRetrained={fetchData}
        />
      )}
    </div>
  );
};

export default ControlTowerPage;
