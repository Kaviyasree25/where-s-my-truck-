/**
 * dockRotationSimulator.ts
 *
 * Live dock rotation engine — every 60 seconds it:
 * 1. Increments unloadingElapsedMinutes for all OCCUPIED docks
 * 2. When elapsed >= duration → completes that dock assignment (trailer → COMPLETED, dock → AVAILABLE)
 * 3. If a nextQueued trailer exists → auto-assigns it to the freed dock (simulates real shift rotation)
 * 4. Emits OPERATIONAL_STATE_CHANGED so all clients re-fetch and see the new trailer
 */

import { Server as SocketIOServer } from 'socket.io';
import { store } from '../db/store.js';

const TICK_INTERVAL_MS = 60_000; // 1 minute real-time = 1 simulated minute

let ioServer: SocketIOServer | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;

export function startDockRotationSimulator(io: SocketIOServer) {
  ioServer = io;

  if (tickTimer) clearInterval(tickTimer);

  tickTimer = setInterval(() => {
    tickDocks();
  }, TICK_INTERVAL_MS);

  console.log('[DockRotation] ⏱ Dock rotation simulator started — ticking every 60s');
}

export function stopDockRotationSimulator() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

function tickDocks() {
  const docks = store.getDocks();
  let changed = false;

  for (const dock of docks) {
    if (dock.status !== 'OCCUPIED' && dock.status !== 'RESERVED') continue;
    if (dock.unloadingDurationMinutes === undefined || dock.unloadingElapsedMinutes === undefined) continue;

    // Increment elapsed time
    dock.unloadingElapsedMinutes = Math.min(
      dock.unloadingDurationMinutes,
      dock.unloadingElapsedMinutes + 1
    );

    // Decrement queued eta counters
    if (dock.nextQueuedEtaMinutes !== undefined && dock.nextQueuedEtaMinutes > 0) {
      dock.nextQueuedEtaMinutes = Math.max(0, dock.nextQueuedEtaMinutes - 1);
    }

    changed = true;

    // Check if unloading is complete
    if (dock.unloadingElapsedMinutes >= dock.unloadingDurationMinutes) {
      console.log(`[DockRotation] ✅ Dock ${dock.id} — Unloading complete. Rotating to next queued trailer...`);
      completeDockAndRotate(dock);
    }
  }

  // Decrement dwell minutes for IN_YARD trailers (aging)
  const trailers = store.getTrailers();
  for (const t of trailers) {
    if (t.status === 'IN_YARD' && t.dwellMinutes !== undefined) {
      t.dwellMinutes += 1;
    }
    if (t.targetDockEtaMinutes !== undefined && t.targetDockEtaMinutes > 0) {
      t.targetDockEtaMinutes = Math.max(0, t.targetDockEtaMinutes - 1);
    }
  }

  // Decrement yard slot ETA counters
  const yardSlots = store.getYardSlots();
  for (const slot of yardSlots) {
    if (slot.targetDockEtaMinutes !== undefined && slot.targetDockEtaMinutes > 0) {
      slot.targetDockEtaMinutes = Math.max(0, slot.targetDockEtaMinutes - 1);
    }
    if (slot.nextIncomingEtaMinutes !== undefined && slot.nextIncomingEtaMinutes > 0) {
      slot.nextIncomingEtaMinutes = Math.max(0, slot.nextIncomingEtaMinutes - 1);
    }
    if (slot.status === 'OCCUPIED' && slot.dwellMinutes !== undefined) {
      slot.dwellMinutes += 1;
    }
  }

  if (changed && ioServer) {
    ioServer.emit('OPERATIONAL_STATE_CHANGED', {
      source: 'DOCK_ROTATION_TICK',
      timestamp: new Date().toISOString(),
    });
  }
}

function completeDockAndRotate(dock: any) {
  // Mark current trailer as completed
  if (dock.currentTrailerId) {
    const trailer = store.getTrailerById(dock.currentTrailerId);
    if (trailer) {
      (trailer as any).status = 'COMPLETED';
      (trailer as any).assignedDockId = undefined;
    }
    if (dock.currentShipmentId) {
      const shipment = store.getShipmentById(dock.currentShipmentId);
      if (shipment) {
        (shipment as any).status = 'COMPLETED';
        (shipment as any).currentDockId = undefined;
      }
    }
  }

  const nextTrailerId = dock.nextQueuedTrailerId;
  const nextShipmentId = dock.nextQueuedShipmentId;

  if (nextTrailerId) {
    // Rotate: next queued trailer moves into dock
    const nextTrailer = store.getTrailerById(nextTrailerId);
    const nextShipment = nextShipmentId ? store.getShipmentById(nextShipmentId) : undefined;

    // Determine unload duration (default 45 with variance 5)
    const baseDuration = nextShipment?.estimatedUnloadMinutes || 45;
    const variance = Math.floor(Math.random() * 11) - 5; // -5 to +5 min variance
    const newDuration = Math.max(20, baseDuration + variance);

    dock.status = 'OCCUPIED';
    dock.currentTrailerId = nextTrailerId;
    dock.currentShipmentId = nextShipmentId || undefined;
    dock.assignedTime = new Date().toISOString();
    dock.estimatedCompletionTime = new Date(Date.now() + newDuration * 60 * 1000).toISOString();
    dock.unloadingDurationMinutes = newDuration;
    dock.unloadingElapsedMinutes = 0;

    // Pick next-next from the future queue pool
    const futureQueue = store.getFutureQueue(dock.id, nextTrailerId);
    dock.nextQueuedTrailerId = futureQueue?.trailerId || undefined;
    dock.nextQueuedShipmentId = futureQueue?.shipmentId || undefined;
    dock.nextQueuedEtaMinutes = futureQueue?.etaMinutes || undefined;

    // Update trailer status
    if (nextTrailer) {
      (nextTrailer as any).status = 'AT_DOCK';
      (nextTrailer as any).assignedDockId = dock.id;

      // Remove from yard slot if was staged
      if ((nextTrailer as any).currentSlotId) {
        const slot = store.getYardSlots().find((s: any) => s.id === (nextTrailer as any).currentSlotId);
        if (slot) {
          slot.status = 'AVAILABLE';
          (slot as any).occupiedByTrailerId = undefined;
          (slot as any).dwellMinutes = 0;
        }
        (nextTrailer as any).currentSlotId = undefined;
      }
    }

    // Update shipment status
    if (nextShipment) {
      (nextShipment as any).status = 'PROCESSING';
      (nextShipment as any).currentDockId = dock.id;
      (nextShipment as any).currentYardSlotId = undefined;
    }

    console.log(`[DockRotation] 🔄 Dock ${dock.id} — Rotated: ${nextTrailerId} now unloading (${newDuration}m)`);
  } else {
    // No next queued — dock becomes available
    dock.status = 'AVAILABLE';
    dock.currentTrailerId = undefined;
    dock.currentShipmentId = undefined;
    dock.unloadingDurationMinutes = undefined;
    dock.unloadingElapsedMinutes = undefined;
    dock.nextQueuedTrailerId = undefined;
    dock.nextQueuedShipmentId = undefined;
    dock.nextQueuedEtaMinutes = undefined;

    console.log(`[DockRotation] 🟢 Dock ${dock.id} — Now available (no trailer queued)`);
  }
}
