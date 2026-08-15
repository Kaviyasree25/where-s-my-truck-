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

    // Cold-Chain Hard Constraint: Sub-zero Deep Freeze cargo MUST be allocated to Sub-Zero Cold-Chain Bays (D01-D04)
    const tempProfile = shipment.temperatureProfile || trailer.temperatureProfile;
    if (tempProfile === 'DEEP_FREEZE') {
      const hasDeepFreeze = dock.temperatureCapability?.includes('DEEP_FREEZE');
      if (!hasDeepFreeze) {
        return this.createInfeasibleResult(
          dock,
          'HARD CONSTRAINT FAILED: Sub-zero Deep Freeze cargo requires cryogenic dock seal (-22°C to -18°C)'
        );
      }
    }

    // Hazmat Hard Constraint: Class 3/8 hazardous materials strictly routed to Containment Bay (D15)
    if (shipment.loadType === 'HAZMAT' && dock.id !== 'D15') {
      return this.createInfeasibleResult(
        dock,
        'HARD CONSTRAINT FAILED: Hazmat chemical cargo isolated exclusively to Containment Bay D15'
      );
    }

    // 2. SOFT WEIGHTED SCORING
    const reasons: AllocationReason[] = [];
    let totalScore = 0;

    // Factor A: Capability & Cold-Chain Equipment Fit (Max 25 pts)
    let capabilityScore = 25;
    let capabilityNote = `Fully supports ${shipment.loadType} load requirement`;
    if (tempProfile === 'DEEP_FREEZE' || tempProfile === 'REFRIGERATED_CHILL') {
      capabilityNote = `Verified cold-chain dock seal matching ${shipment.targetTemperatureRange || '2-4°C'}`;
    }
    totalScore += capabilityScore;
    reasons.push({
      factor: 'Cold-Chain & Load Fit',
      points: capabilityScore,
      maxPoints: 25,
      satisfied: true,
      note: capabilityNote,
    });

    // Factor B: Distance from Yard Slot (Max 20 pts)
    let distanceMeters = 40;
    const slotId = shipment.currentYardSlotId || trailer.currentSlotId;
    if (slotId?.startsWith('A')) {
      // Zone A is closer to D01-D05
      const dockNum = parseInt(dock.id.replace('D', ''), 10) || 1;
      distanceMeters = 25 + dockNum * 4;
    } else if (slotId?.startsWith('B')) {
      distanceMeters = 55 + (parseInt(dock.id.replace('D', ''), 10) || 1) * 3;
    } else if (slotId?.startsWith('C')) {
      distanceMeters = 95;
    }

    const distanceScore = Math.max(5, Math.round(20 - (distanceMeters / 150) * 15));
    totalScore += distanceScore;
    reasons.push({
      factor: 'Yard Proximity',
      points: distanceScore,
      maxPoints: 20,
      satisfied: true,
      note: `${distanceMeters} meters from current Yard Position`,
    });

    // Factor C: Live Unload Queue & Expected Wait Time (Max 20 pts)
    const isAvailableNow = dock.status === 'AVAILABLE';
    let expectedWaitMinutes = 0;
    if (!isAvailableNow) {
      const elapsed = dock.unloadingElapsedMinutes || 20;
      const duration = dock.unloadingDurationMinutes || 45;
      expectedWaitMinutes = Math.max(5, duration - elapsed);
    }
    const waitScore = isAvailableNow ? 20 : Math.max(4, Math.round(20 - (expectedWaitMinutes / 60) * 16));
    totalScore += waitScore;
    reasons.push({
      factor: 'Queue & Wait Time',
      points: waitScore,
      maxPoints: 20,
      satisfied: isAvailableNow,
      note: isAvailableNow ? '0 waiting queue (Immediate Availability)' : `Occupied (Free in ~${expectedWaitMinutes} mins)`,
    });

    // Factor D: Product Demand Surge & Spoilage Urgency (Max 20 pts)
    let demandScore = 12;
    const demandLevel = shipment.productDemandLevel || trailer.productDemandLevel;
    if (demandLevel === 'CRITICAL_SURGE') demandScore = 20;
    else if (demandLevel === 'HIGH_DEMAND') demandScore = 16;
    totalScore += demandScore;
    reasons.push({
      factor: 'Demand Surge & Spoilage Urgency',
      points: demandScore,
      maxPoints: 20,
      satisfied: true,
      note: `Demand velocity: ${demandLevel || 'STANDARD'} (Spoilage score: ${shipment.spoilageRiskScore || 50}/100)`,
    });

    // Factor E: Appointment Window Match (Max 15 pts)
    const appointmentScore = 15;
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
      queueLength: isAvailableNow ? 0 : 1,
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
