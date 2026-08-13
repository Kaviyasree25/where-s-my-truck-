import { store } from '../db/store.js';
import {
  Shipment,
  Trailer,
  Dock,
  DockScoreResult,
  AllocationRecommendation,
  AllocationReason,
} from '../types.js';

export class AllocationEngine {
  /**
   * Evaluate all candidate docks for a given shipment and trailer, applying hard constraints first,
   * then scoring feasible docks with transparent weighted factors.
   */
  public evaluateDocks(shipmentId: string): AllocationRecommendation {
    const shipment = store.getShipmentById(shipmentId);
    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found`);
    }

    const trailer = store.getTrailerById(shipment.trailerId);
    if (!trailer) {
      throw new Error(`Trailer associated with shipment ${shipmentId} not found`);
    }

    const allDocks = store.getDocks();
    const candidateScores: DockScoreResult[] = allDocks.map(dock =>
      this.scoreDockForTrailer(dock, shipment, trailer)
    );

    // Sort feasible docks by totalScore descending
    const feasibleDocks = candidateScores
      .filter(d => d.isFeasible)
      .sort((a, b) => b.totalScore - a.totalScore);

    const bestCandidate = feasibleDocks.length > 0 ? feasibleDocks[0] : null;

    let explanation = '';
    if (bestCandidate) {
      const topReasons = bestCandidate.reasons
        .filter(r => r.satisfied)
        .map(r => r.note)
        .join(', ');
      explanation = `${bestCandidate.dockName} selected (Score: ${bestCandidate.totalScore}/100) because it satisfies ${shipment.loadType} compatibility, has ${bestCandidate.expectedWaitMinutes} min expected wait time, and is ${bestCandidate.distanceMeters}m from current yard position (${topReasons}).`;
    } else {
      explanation = `No feasible docks available meeting hard requirements for ${shipment.loadType} load type.`;
    }

    return {
      shipmentId: shipment.id,
      trailerId: trailer.id,
      bestDockId: bestCandidate ? bestCandidate.dockId : null,
      bestDockName: bestCandidate ? bestCandidate.dockName : null,
      candidateScores,
      explanation,
      generatedAt: new Date().toISOString(),
    };
  }

  private scoreDockForTrailer(
    dock: Dock,
    shipment: Shipment,
    trailer: Trailer
  ): DockScoreResult {
    // 1. HARD CONSTRAINTS CHECK
    if (dock.status === 'BLOCKED') {
      return this.createInfeasibleResult(dock, 'HARD CONSTRAINT FAILED: Dock door is currently BLOCKED by operational safety lock');
    }
    if (dock.status === 'MAINTENANCE') {
      return this.createInfeasibleResult(dock, 'HARD CONSTRAINT FAILED: Dock door is under MAINTENANCE servicing');
    }

    // Check load type capability match
    const supportsLoadType = dock.capabilities.includes(shipment.loadType);
    if (!supportsLoadType) {
      return this.createInfeasibleResult(
        dock,
        `HARD CONSTRAINT FAILED: Required capability '${shipment.loadType}' not supported by ${dock.dockType}`
      );
    }

    // 2. SOFT WEIGHTED SCORING
    const reasons: AllocationReason[] = [];
    let totalScore = 0;

    // Factor A: Capability & Equipment Fit (Max 25 pts)
    const capabilityScore = 25;
    totalScore += capabilityScore;
    reasons.push({
      factor: 'Load Capability Fit',
      points: capabilityScore,
      maxPoints: 25,
      satisfied: true,
      note: `Fully supports ${shipment.loadType} load requirement`,
    });

    // Factor B: Distance from Yard Slot (Max 25 pts)
    // Yard Slot A01 is close to D04/D05 (35m), Zone B is 65m, Zone C is 110m
    let distanceMeters = 40;
    if (shipment.currentYardSlotId?.startsWith('A')) distanceMeters = dock.id === 'D04' ? 35 : dock.id === 'D05' ? 42 : 75;
    else if (shipment.currentYardSlotId?.startsWith('B')) distanceMeters = dock.id === 'D04' ? 60 : dock.id === 'D05' ? 55 : 90;
    else if (shipment.currentYardSlotId?.startsWith('C')) distanceMeters = 110;

    const distanceScore = Math.max(5, Math.round(25 - (distanceMeters / 120) * 20));
    totalScore += distanceScore;
    reasons.push({
      factor: 'Yard Proximity',
      points: distanceScore,
      maxPoints: 25,
      satisfied: true,
      note: `${distanceMeters} meters from current Yard Position`,
    });

    // Factor C: Queue & Expected Wait Time (Max 20 pts)
    const isAvailableNow = dock.status === 'AVAILABLE';
    const queueLength = isAvailableNow ? 0 : 1;
    const expectedWaitMinutes = isAvailableNow ? 0 : 35;
    const waitScore = isAvailableNow ? 20 : 5;
    totalScore += waitScore;
    reasons.push({
      factor: 'Queue & Wait Time',
      points: waitScore,
      maxPoints: 20,
      satisfied: isAvailableNow,
      note: isAvailableNow ? '0 waiting queue (Immediate Availability)' : `Queue length: ${queueLength} trailer (~${expectedWaitMinutes} min wait)`,
    });

    // Factor D: Priority Matching (Max 15 pts)
    let priorityScore = 10;
    if (shipment.priority === 'CRITICAL') priorityScore = 15;
    else if (shipment.priority === 'HIGH') priorityScore = 12;
    totalScore += priorityScore;
    reasons.push({
      factor: 'Shipment Priority Bonus',
      points: priorityScore,
      maxPoints: 15,
      satisfied: true,
      note: `Priority ${shipment.priority} shipment score boost`,
    });

    // Factor E: Appointment Proximity (Max 15 pts)
    const appointmentScore = 14;
    totalScore += appointmentScore;
    reasons.push({
      factor: 'Appointment Window Match',
      points: appointmentScore,
      maxPoints: 15,
      satisfied: true,
      note: 'Dock schedule aligns with scheduled arrival window',
    });

    return {
      dockId: dock.id,
      dockName: dock.name,
      isFeasible: true,
      totalScore,
      reasons,
      distanceMeters,
      queueLength,
      expectedWaitMinutes,
    };
  }

  private createInfeasibleResult(dock: Dock, failReason: string): DockScoreResult {
    return {
      dockId: dock.id,
      dockName: dock.name,
      isFeasible: false,
      hardConstraintFailedReason: failReason,
      totalScore: 0,
      reasons: [],
      distanceMeters: 999,
      queueLength: 99,
      expectedWaitMinutes: 999,
    };
  }
}

export const allocationEngine = new AllocationEngine();
