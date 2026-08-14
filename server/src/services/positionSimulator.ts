import { store, WAREHOUSE_LAT, WAREHOUSE_LNG } from '../db/store.js';
import { Server as SocketIOServer } from 'socket.io';
import https from 'https';
import { IncomingMessage } from 'http';

// Road waypoints per trailer fetched from OSRM
const routeWaypoints: Record<string, [number, number][]> = {};
// Current index along waypoints
const waypointIndex: Record<string, number> = {};

// Dynamic driving state per trailer (speeds, traffic, micro-delays)
interface TrailerTelemetryState {
  currentSpeedMph: number;
  trafficStatus: string;
  distanceRemainingMiles: number;
  weatherCondition: string;
}

const telemetryStates: Record<string, TrailerTelemetryState> = {};

/**
 * Fetch road-following route from OSRM public API.
 * Falls back to a linear interpolation with 100 steps if OSRM is unreachable.
 */
function fetchOSRMRoute(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<[number, number][]> {
  return new Promise<[number, number][]>((resolve) => {
    const path = `/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
    let settled = false;

    const settle = (waypoints: [number, number][]) => {
      if (!settled) { settled = true; clearTimeout(timer); resolve(waypoints); }
    };

    // Straight-line fallback with 100 intermediate points (smooth)
    const linearFallback = (): [number, number][] => {
      const pts: [number, number][] = [];
      for (let i = 0; i <= 100; i++) {
        pts.push([fromLat + (toLat - fromLat) * (i / 100), fromLng + (toLng - fromLng) * (i / 100)]);
      }
      return pts;
    };

    const timer = setTimeout(() => {
      console.warn(`  ⚠ OSRM timeout — using fallback waypoints`);
      settle(linearFallback());
    }, 8000);

    const req = https.get(
      { hostname: 'router.project-osrm.org', path, headers: { 'User-Agent': 'WhereIsMyTruck-Demo/1.0' } },
      (res: IncomingMessage) => {
        let raw = '';
        res.on('data', (c: Buffer) => { raw += c.toString(); });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.code === 'Ok' && parsed.routes?.length > 0) {
              const all: [number, number][] = parsed.routes[0].geometry.coordinates
                .map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);
              // Keep high-resolution waypoints (~400-600 points) for realistic highway pacing
              const maxPoints = 500;
              const step = Math.max(1, Math.floor(all.length / maxPoints));
              const sampled: [number, number][] = all.filter((_, i) => i % step === 0);
              // Ensure the last waypoint connects directly into the designated dock door pin
              sampled.push([toLat, toLng]);
              settle(sampled);
            } else {
              settle(linearFallback());
            }
          } catch {
            settle(linearFallback());
          }
        });
      }
    );
    req.on('error', () => settle(linearFallback()));
  });
}

/**
 * Pre-fetch OSRM road routes for all EN_ROUTE trailers.
 */
export async function initializeRoutes(): Promise<void> {
  const trailers = store.getTrailers().filter(t => t.status === 'EN_ROUTE');
  console.log(`\n🗺  Fetching OSRM road routes for ${trailers.length} EN_ROUTE trailers...`);

  await Promise.all(trailers.map(async (t) => {
    if (t.currentLat === undefined || t.currentLng === undefined) return;
    const destLat = t.destinationLat ?? WAREHOUSE_LAT;
    const destLng = t.destinationLng ?? WAREHOUSE_LNG;
    const waypoints = await fetchOSRMRoute(t.currentLat, t.currentLng, destLat, destLng);
    routeWaypoints[t.id] = waypoints;
    waypointIndex[t.id] = 0;
    telemetryStates[t.id] = {
      currentSpeedMph: 64,
      trafficStatus: 'Clear Corridor',
      distanceRemainingMiles: Math.round(waypoints.length * 1.8),
      weatherCondition: 'Clear 72°F',
    };
    console.log(`  ✓ ${t.id}: ${waypoints.length} road waypoints loaded`);
  }));

  console.log('🚀 Route init complete — road-following active\n');
}

export function getTrailerRoute(trailerId: string): [number, number][] {
  return routeWaypoints[trailerId] || [];
}

export function getAllTrailerRoutes(): Record<string, [number, number][]> {
  return routeWaypoints;
}

export function getTrailerRouteDetails(trailerId: string) {
  const trailer = store.getTrailerById(trailerId);
  const shipment = trailer?.shipmentId ? store.getShipmentById(trailer.shipmentId) : undefined;
  const isEnRoute = trailer?.status === 'EN_ROUTE';

  if (!isEnRoute) {
    return {
      trailerId,
      isStationary: true,
      status: trailer?.status || 'IN_YARD',
      waypoints: [],
      currentIndex: 0,
      totalPoints: 0,
      origin: shipment?.origin || 'Regional Logistics Hub',
      destination: shipment?.destination || 'Naperville DC-1',
      speedMph: 0,
      trafficStatus: trailer?.status === 'AT_DOCK'
        ? `Stationed at Dock Bay ${trailer.assignedDockId || 'D01'}`
        : `Parked in Yard Slot ${trailer?.currentSlotId || 'A42'}`,
      locationLabel: trailer?.assignedDockId
        ? `Dock Bay ${trailer.assignedDockId}`
        : `Yard Slot ${trailer?.currentSlotId || 'A42'}`,
      dwellMinutes: trailer?.dwellMinutes || 0,
      distanceRemainingMiles: 0,
      etaMinutes: 0,
      weatherCondition: 'Facility Yard 72°F',
      highway: 'Facility Compound Terminal',
    };
  }

  const waypoints = routeWaypoints[trailerId] || [];
  const currentIndex = waypointIndex[trailerId] || 0;
  const telemetry = telemetryStates[trailerId] || {
    currentSpeedMph: 62,
    trafficStatus: 'Clear Highway',
    distanceRemainingMiles: 140,
    weatherCondition: 'Clear 72°F',
  };
  
  const remainingPoints = Math.max(0, waypoints.length - currentIndex);
  const distanceMiles = Math.round(remainingPoints * 0.4);
  const etaMins = Math.max(2, Math.round((distanceMiles / (telemetry.currentSpeedMph || 60)) * 60));

  return {
    trailerId,
    isStationary: false,
    status: 'EN_ROUTE',
    waypoints,
    currentIndex,
    totalPoints: waypoints.length,
    origin: shipment?.origin || 'Regional Distribution Depot',
    destination: shipment?.destination || 'Naperville Main Hub - Bay A',
    speedMph: telemetry.currentSpeedMph,
    trafficStatus: telemetry.trafficStatus,
    locationLabel: 'Interstate Highway Corridor',
    dwellMinutes: 0,
    distanceRemainingMiles: distanceMiles,
    etaMinutes: etaMins,
    weatherCondition: telemetry.weatherCondition,
    highway: trailerId === 'TR-201' ? 'I-94 E / I-294 S' : trailerId === 'TR-202' ? 'I-65 N / I-80 W' : 'I-94 W / I-88 W',
  };
}

/**
 * Resets all EN_ROUTE trailers back to the very start of their routes (index 0).
 */
export function resetTrailerPositions(io?: SocketIOServer) {
  const enRoute = store.getTrailers().filter(t => t.status === 'EN_ROUTE');

  const updated = enRoute.map(trailer => {
    waypointIndex[trailer.id] = 0;
    const waypoints = routeWaypoints[trailer.id];
    const firstPoint = waypoints?.[0];
    const secondPoint = waypoints?.[1];

    let headingDeg = 0;
    if (firstPoint && secondPoint) {
      headingDeg = (Math.atan2(secondPoint[1] - firstPoint[1], secondPoint[0] - firstPoint[0]) * 180) / Math.PI;
    }

    telemetryStates[trailer.id] = {
      currentSpeedMph: 62 + Math.floor(Math.random() * 6),
      trafficStatus: 'Dispatch Departure',
      distanceRemainingMiles: Math.round((waypoints?.length || 100) * 1.8),
      weatherCondition: 'Clear 72°F',
    };

    return {
      ...trailer,
      currentLat: firstPoint ? firstPoint[0] : trailer.currentLat,
      currentLng: firstPoint ? firstPoint[1] : trailer.currentLng,
      headingDeg,
    };
  });

  store.updateTrailerPositions(updated);

  if (io) {
    io.emit('TRAILER_POSITION_EVENT', store.getTrailerPositions());
    io.emit('OPERATIONAL_STATE_CHANGED', { reason: 'ROUTES_RESET' });
  }

  return { success: true, message: 'All trailer route positions reset to origin' };
}

/**
 * Advances truck positions along real road waypoints with realistic speed variations & traffic irregularities.
 */
export function tickTrailerPositions(io: SocketIOServer): void {
  const enRoute = store.getTrailers().filter(t => t.status === 'EN_ROUTE');

  const updated = enRoute.map(trailer => {
    const waypoints = routeWaypoints[trailer.id];
    if (!waypoints?.length) return trailer;

    const cur = waypointIndex[trailer.id] ?? 0;

    // Realistic irregular dynamics per truck:
    // Some trucks encounter traffic merges, construction slowdowns, or open cruise stretches
    const rand = Math.random();
    let stepAdvance = 1;
    let speed = 64;
    let traffic = 'Optimal Cruise';

    if (rand < 0.12) {
      // Temporary slowdown (toll booth / junction merge / ramp)
      stepAdvance = 0; // pauses for 1 tick
      speed = Math.floor(18 + Math.random() * 15);
      traffic = 'Toll Plaza / Merge Slowdown';
    } else if (rand < 0.35) {
      // Moderate highway traffic
      stepAdvance = 1;
      speed = Math.floor(48 + Math.random() * 8);
      traffic = 'Moderate Traffic Corridor';
    } else if (rand < 0.85) {
      // Open highway standard cruise
      stepAdvance = 1;
      speed = Math.floor(62 + Math.random() * 6);
      traffic = 'Clear Highway Cruise';
    } else {
      // High-speed open express segment
      stepAdvance = 2; // advances 2 steps
      speed = Math.floor(68 + Math.random() * 4);
      traffic = 'Express Fast-Lane';
    }

    const next = Math.min(cur + stepAdvance, waypoints.length - 1);
    waypointIndex[trailer.id] = next;

    // Update telemetry state
    const remainingSteps = Math.max(0, waypoints.length - next);
    telemetryStates[trailer.id] = {
      currentSpeedMph: next >= waypoints.length - 1 ? 0 : speed,
      trafficStatus: next >= waypoints.length - 1 ? 'Arrived at DC-1 Gate' : traffic,
      distanceRemainingMiles: Math.round(remainingSteps * 1.8),
      weatherCondition: 'Clear 72°F',
    };

    const [newLat, newLng] = waypoints[next];
    const [prevLat, prevLng] = waypoints[Math.max(0, next - 1)];
    const headingDeg = (Math.atan2(newLng - prevLng, newLat - prevLat) * 180) / Math.PI;

    return { ...trailer, currentLat: newLat, currentLng: newLng, headingDeg };
  });

  store.updateTrailerPositions(updated);
  io.emit('TRAILER_POSITION_EVENT', store.getTrailerPositions());
}
