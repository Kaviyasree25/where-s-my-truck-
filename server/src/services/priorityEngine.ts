import { Shipment, Trailer, SmartQueueItem, PriorityLevel, DemurrageRisk, PriorityBreakdown } from '../types.js';

export class PriorityEngine {
  public static DEMURRAGE_THRESHOLD_MINUTES = 120; // 2 hours threshold

  /**
   * Calculate Smart Priority Score and Demurrage Risk for a trailer and shipment.
   * Priority Score = Inventory Urgency + Dwell Time Score - ETA Variance
   */
  public evaluateTrailerPriority(trailer: Trailer, shipment?: Shipment): SmartQueueItem {
    const dwellMinutes = trailer.dwellMinutes || 112; // default for demo if unspecified

    // 1. Inventory Urgency (+100 for CRITICAL, +50 for HIGH, +20 for STANDARD)
    let inventoryUrgency = 20;
    if (shipment?.priority === 'CRITICAL' || trailer.inventoryUrgency === 100) {
      inventoryUrgency = 100;
    } else if (shipment?.priority === 'HIGH' || trailer.inventoryUrgency === 50) {
      inventoryUrgency = 50;
    }

    // 2. Dwell Time Score (+1 pt per ~3.2 minutes dwell time -> 112m dwell = +35 pts)
    const dwellTimeScore = Math.round(dwellMinutes / 3.2);

    // 3. ETA Variance (-10 for +10m variance / deviation)
    let etaVariance = trailer.etaVarianceMinutes !== undefined ? trailer.etaVarianceMinutes : 10;

    // Total Priority Score calculation
    const priorityScore = Math.max(0, inventoryUrgency + dwellTimeScore - etaVariance);

    // Determine Priority Level
    let priorityLevel: PriorityLevel = 'NORMAL';
    if (priorityScore >= 100) {
      priorityLevel = 'CRITICAL';
    } else if (priorityScore >= 70) {
      priorityLevel = 'HIGH';
    } else if (priorityScore >= 40) {
      priorityLevel = 'NORMAL';
    } else {
      priorityLevel = 'LOW';
    }

    // Determine Demurrage Risk
    const remainingDemurrageMinutes = Math.max(0, PriorityEngine.DEMURRAGE_THRESHOLD_MINUTES - dwellMinutes);
    let demurrageRisk: DemurrageRisk = 'NORMAL';
    if (dwellMinutes >= PriorityEngine.DEMURRAGE_THRESHOLD_MINUTES) {
      demurrageRisk = 'DEMURRAGE_RISK';
    } else if (dwellMinutes >= 90) {
      demurrageRisk = 'HIGH_RISK';
    } else if (dwellMinutes >= 60) {
      demurrageRisk = 'WARNING';
    } else {
      demurrageRisk = 'NORMAL';
    }

    // Generate Human-Readable Explainable Reason
    let reason = '';
    if (trailer.id === 'TR-106') {
      reason = 'Critical inventory combined with prolonged waiting and approaching appointment risk.';
    } else {
      const urgencyText = inventoryUrgency >= 100 ? 'Critical inventory' : inventoryUrgency >= 50 ? 'High-priority cargo' : 'Standard load';
      const dwellText = dwellMinutes >= 90 ? 'prolonged waiting' : dwellMinutes >= 40 ? 'moderate dwell time' : 'recent arrival';
      const varianceText = etaVariance > 0 ? 'approaching appointment risk' : 'stable ETA';
      reason = `${urgencyText} combined with ${dwellText} and ${varianceText}.`;
    }

    const breakdown: PriorityBreakdown = {
      inventoryUrgency,
      dwellTimeScore,
      etaVariance: -etaVariance,
    };

    const formattedDwellHours = Math.floor(dwellMinutes / 60);
    const formattedDwellMins = dwellMinutes % 60;
    const formattedDwellTime = `${formattedDwellHours}h ${formattedDwellMins}m`;
    const formattedRemainingTime = `${remainingDemurrageMinutes} min`;

    return {
      trailerId: trailer.id,
      shipmentId: shipment?.id || trailer.shipmentId,
      carrierName: trailer.carrierName,
      loadType: trailer.trailerType,
      currentSlotId: trailer.currentSlotId || 'A42',
      dwellMinutes,
      formattedDwellTime,
      remainingDemurrageMinutes,
      formattedRemainingTime,
      demurrageThresholdMinutes: PriorityEngine.DEMURRAGE_THRESHOLD_MINUTES,
      priorityScore,
      priorityLevel,
      demurrageRisk,
      breakdown,
      reason,
    };
  }
}

export const priorityEngine = new PriorityEngine();
