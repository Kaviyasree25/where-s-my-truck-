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
 * Helper to interpolate smooth points between key highway control waypoints
 */
function interpolatePoints(controlPoints: [number, number][], totalPoints: number = 100): [number, number][] {
  if (controlPoints.length < 2) return controlPoints;
  const result: [number, number][] = [];
  const segments = controlPoints.length - 1;
  const pointsPerSegment = Math.max(1, Math.floor(totalPoints / segments));

  for (let i = 0; i < segments; i++) {
    const [lat1, lng1] = controlPoints[i];
    const [lat2, lng2] = controlPoints[i + 1];
    const isLastSegment = i === segments - 1;
    const count = isLastSegment ? (totalPoints - result.length) : pointsPerSegment;

    for (let j = 0; j < count; j++) {
      const t = j / count;
      result.push([
        Number((lat1 + (lat2 - lat1) * t).toFixed(5)),
        Number((lng1 + (lng2 - lng1) * t).toFixed(5)),
      ]);
    }
  }
  result.push(controlPoints[controlPoints.length - 1]);
  return result;
}

/**
 * Generate a realistic highway corridor route that strictly stays on land and routes around Lake Michigan.
 */
export function generateLandHighwayRoute(
  fromLat: number, fromLng: number,
  toLat: number = WAREHOUSE_LAT, toLng: number = WAREHOUSE_LNG
): [number, number][] {
  const controlPoints: [number, number][] = [[fromLat, fromLng]];

  // 1. Michigan Corridor (East of Lake Michigan, north of Indiana border)
  // e.g. TR-219 (Muskegon 43.0, -85.88), TR-206 (Kalamazoo 42.15, -86.45), TR-203 (Detroit 42.33, -83.04)
  if (fromLng > -87.2 && fromLat > 41.7) {
    if (fromLat > 42.5) {
      // Muskegon / Grand Rapids -> I-196 S / US-31 S
      controlPoints.push([42.78, -86.10]); // Holland, MI
      controlPoints.push([42.25, -86.30]); // South Haven, MI
    }
    if (fromLng > -84.5) {
      // Detroit / Ann Arbor -> I-94 W
      controlPoints.push([42.28, -83.74]); // Ann Arbor
      controlPoints.push([42.24, -84.40]); // Jackson
      controlPoints.push([42.28, -85.58]); // Kalamazoo
    }
    // Around southern tip of Lake Michigan via Indiana highway corridor (avoids all water)
    controlPoints.push([41.95, -86.55]); // Benton Harbor / St Joseph
    controlPoints.push([41.71, -86.75]); // Michigan City / I-94
    controlPoints.push([41.59, -87.18]); // Portage / Gary, IN (South of Lake Michigan)
    controlPoints.push([41.58, -87.52]); // Hammond / Lansing IL border
    controlPoints.push([41.58, -87.82]); // I-80 / Tinley Park
    controlPoints.push([41.68, -88.08]); // I-355 / Lemont
    controlPoints.push([toLat, toLng]);   // Naperville DC-1
    return interpolatePoints(controlPoints, 120);
  }

  // 2. Wisconsin / North Corridor (e.g. TR-201, TR-204, TR-215)
  if (fromLat > 42.1 && fromLng <= -87.5 && fromLng >= -89.5) {
    controlPoints.push([42.58, -87.95]); // Kenosha I-94
    controlPoints.push([42.25, -87.90]); // Libertyville I-94
    controlPoints.push([41.98, -87.88]); // O'Hare / I-294
    controlPoints.push([41.85, -87.98]); // Oak Brook I-88
    controlPoints.push([toLat, toLng]);   // Naperville DC-1
    return interpolatePoints(controlPoints, 90);
  }

  // 3. West / Iowa / Nebraska Corridor (e.g. TR-211, TR-217, TR-221, TR-225, TR-229, TR-230)
  if (fromLng < -89.0 && fromLat >= 41.0) {
    if (fromLng < -93.0) {
      controlPoints.push([41.60, -93.60]); // Des Moines
    }
    controlPoints.push([41.52, -90.57]); // Quad Cities / Moline I-80
    controlPoints.push([41.65, -89.45]); // Princeton / I-80
    controlPoints.push([41.76, -88.75]); // DeKalb / I-88
    controlPoints.push([toLat, toLng]);   // Naperville DC-1
    return interpolatePoints(controlPoints, 100);
  }

  // 4. South / Missouri / St Louis / Downstate Corridor (e.g. TR-216, TR-218, TR-224, TR-226)
  if (fromLat < 41.5 && fromLng < -88.5) {
    if (fromLat < 39.0) {
      controlPoints.push([38.62, -90.19]); // St Louis I-55
    }
    controlPoints.push([39.78, -89.65]); // Springfield I-55
    controlPoints.push([40.48, -88.99]); // Bloomington I-55
    controlPoints.push([41.52, -88.08]); // Joliet I-55
    controlPoints.push([41.68, -88.15]); // Bolingbrook / Route 59
    controlPoints.push([toLat, toLng]);   // Naperville DC-1
    return interpolatePoints(controlPoints, 100);
  }

  // 5. Southeast / Ohio / Indiana / Florida / Atlanta Corridor (e.g. TR-202, TR-207, TR-208, TR-210, TR-212, TR-214, TR-220, TR-222, TR-227, TR-228)
  if (fromLng > -87.5 && fromLat <= 41.7) {
    if (fromLat < 39.5) {
      controlPoints.push([39.76, -86.15]); // Indianapolis I-65
    }
    controlPoints.push([40.41, -86.87]); // Lafayette I-65
    controlPoints.push([41.45, -87.33]); // Merrillville I-65
    controlPoints.push([41.58, -87.52]); // Hammond / I-80 W
    controlPoints.push([41.58, -87.82]); // I-80 W
    controlPoints.push([41.68, -88.08]); // I-355
    controlPoints.push([toLat, toLng]);   // Naperville DC-1
    return interpolatePoints(controlPoints, 100);
  }

  // General land interpolation
  controlPoints.push([toLat, toLng]);
  return interpolatePoints(controlPoints, 80);
}

/**
 * Fetch road-following route from OSRM public API.
 * Falls back to land-based interstate highway route if OSRM is unreachable.
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

    const timer = setTimeout(() => {
      console.warn(`  ℹ Using land highway corridor for ${fromLat},${fromLng}`);
      settle(generateLandHighwayRoute(fromLat, fromLng, toLat, toLng));
    }, 2500);

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
              // Keep high-resolution waypoints (~300-500 points) for realistic highway pacing
              const maxPoints = 400;
              const step = Math.max(1, Math.floor(all.length / maxPoints));
              const sampled: [number, number][] = all.filter((_, i) => i % step === 0);
              // Ensure the last waypoint connects directly into the designated dock door pin
              sampled.push([toLat, toLng]);
              settle(sampled);
            } else {
              settle(generateLandHighwayRoute(fromLat, fromLng, toLat, toLng));
            }
          } catch {
            settle(generateLandHighwayRoute(fromLat, fromLng, toLat, toLng));
          }
        });
      }
    );
    req.on('error', () => settle(generateLandHighwayRoute(fromLat, fromLng, toLat, toLng)));
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
