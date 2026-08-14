import { store } from '../db/store.js';
import { allocationEngine } from './allocationEngine.js';
import { mlRecommendationService } from './mlRecommendationService.js';
import { Server as SocketIOServer } from 'socket.io';

export class SimulationService {
  private io?: SocketIOServer;

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  public getSocketServer(): SocketIOServer | undefined {
    return this.io;
  }

  public broadcastStateChange(payload: any) {
    this.broadcastUpdate('DEMO_RESET_EVENT', payload);
  }

  private broadcastUpdate(eventType: string, payload: any) {
    if (this.io) {
      this.io.emit(eventType, payload);
      this.io.emit('OPERATIONAL_STATE_CHANGED', {
        timestamp: new Date().toISOString(),
        kpis: store.getAnalyticsKPIs(),
      });

      // Automatically recalculate ML recommendations for all trailers when operational conditions change
      mlRecommendationService.recalculateAndBroadcast(this.io);
    }
  }

  /**
   * Hackathon Main Demonstration: Simulate Dock D04 Failure!
   */
  public simulateDockFailure(dockId: string = 'D04') {
    // 1. Mark Dock as BLOCKED
    const dock = store.updateDockStatus(
      dockId,
      'BLOCKED',
      'Hydraulic ramp actuator failure detected on Dock Door D04'
    );

    if (!dock) throw new Error(`Dock ${dockId} not found`);

    // 2. Identify affected trailer & shipment
    // Look for trailer assigned to D04, or if none, fallback to TR-105/SHP-1005 for demo continuity
    let shipment = store.getShipments().find(s => s.currentDockId === dockId);
    let trailer = store.getTrailers().find(t => t.assignedDockId === dockId);

    if (!shipment || !trailer) {
      // Fallback demo target: SHP-1005 / TR-105
      shipment = store.getShipmentById('SHP-1005');
      trailer = store.getTrailerById('TR-105');
      if (shipment && trailer) {
        shipment.currentDockId = dockId;
        trailer.assignedDockId = dockId;
      }
    }

    if (!shipment || !trailer) {
      throw new Error('No target shipment/trailer found for failure simulation');
    }

    // 3. Create Dock Failure Exception
    const exception = store.createException({
      shipmentId: shipment.id,
      trailerId: trailer.id,
      dockId: dock.id,
      type: 'DOCK_FAILURE',
      severity: 'CRITICAL',
      title: `Critical Failure on ${dock.name} (Impacts ${trailer.id})`,
      description: `Dock ${dock.name} experienced immediate actuator failure while assigned to high-priority trailer ${trailer.id} (${shipment.itemsSummary}). Emergency reassignment required.`,
      recommendedAction: 'Trigger Dynamic Dock Reassignment to candidate dock D05.',
    });

    // 4. Run Smart Dock Allocation to evaluate alternative docks
    const recommendation = allocationEngine.evaluateDocks(shipment.id);

    // 5. Broadcast Socket.IO event for real-time UI modal popup
    const eventPayload = {
      failedDock: dock,
      impactedShipment: shipment,
      impactedTrailer: trailer,
      exception,
      recommendation,
      timestamp: new Date().toISOString(),
    };

    this.broadcastUpdate('DOCK_FAILURE_EVENT', eventPayload);
    return eventPayload;
  }

  public simulateETADelay(shipmentId: string = 'SHP-1005', delayMinutes: number = 45) {
    const shipment = store.getShipmentById(shipmentId);
    if (!shipment) throw new Error(`Shipment ${shipmentId} not found`);

    const newEta = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
    shipment.eta = newEta;
    shipment.risk = 'DELAYED';

    store.createException({
      shipmentId: shipment.id,
      trailerId: shipment.trailerId,
      type: 'SHIPMENT_DELAY',
      severity: 'HIGH',
      title: `Inbound Highway Congestion (+${delayMinutes}m delay)`,
      description: `Trailer ${shipment.trailerId} delayed by traffic on I-80. Revised ETA: ${newEta}.`,
      recommendedAction: 'Adjust yard appointment window and inform receiver team.',
    });

    store.addTrackingEvent(shipment.id, 'IN_TRANSIT', 'I-80 Milepost 110', `Traffic delay reported (+${delayMinutes} mins)`, 'Automated GPS');

    const payload = { shipmentId, newEta, delayMinutes };
    this.broadcastUpdate('ETA_DELAY_EVENT', payload);
    return payload;
  }

  public simulateYardCongestion() {
    const slots = store.getYardSlots();
    let updatedCount = 0;
    for (const slot of slots) {
      if (slot.status === 'AVAILABLE' && updatedCount < 4) {
        slot.status = 'OCCUPIED';
        slot.occupiedByTrailerId = `TR-STAGE-${Math.floor(200 + Math.random() * 800)}`;
        slot.dwellMinutes = 95;
        updatedCount++;
      }
    }

    store.createException({
      type: 'YARD_CONGESTION',
      severity: 'HIGH',
      title: 'Yard Capacity Threshold Exceeded (>80%)',
      description: 'Inbound trailer volume exceeds normal buffer capacity. Unloading velocity must be accelerated.',
      recommendedAction: 'Open secondary staging lanes in Zone C.',
    });

    const payload = { yardSlots: slots };
    this.broadcastUpdate('YARD_CONGESTION_EVENT', payload);
    return payload;
  }

  public simulateStartUnloading(shipmentId: string = 'SHP-1005') {
    const shipment = store.getShipmentById(shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const trailer = store.getTrailerById(shipment.trailerId);
    if (trailer) trailer.status = 'AT_DOCK';

    if (shipment.currentDockId) {
      const dock = store.getDockById(shipment.currentDockId);
      if (dock) dock.status = 'OCCUPIED';
    }

    shipment.status = 'PROCESSING';
    store.addTrackingEvent(shipment.id, 'PROCESSING', `Dock ${shipment.currentDockId}`, 'Inbound unloading and pallet scan started', 'Warehouse Operator');

    const payload = { shipmentId, status: 'PROCESSING' };
    this.broadcastUpdate('STATUS_UPDATE_EVENT', payload);
    return payload;
  }

  public simulateCompleteUnloading(shipmentId: string = 'SHP-1005') {
    const shipment = store.getShipmentById(shipmentId);
    if (!shipment) throw new Error('Shipment not found');

    const trailer = store.getTrailerById(shipment.trailerId);
    if (trailer) trailer.status = 'DEPARTED';

    if (shipment.currentDockId) {
      const dock = store.getDockById(shipment.currentDockId);
      if (dock) {
        dock.status = 'AVAILABLE';
        dock.currentTrailerId = undefined;
        dock.currentShipmentId = undefined;
      }
      shipment.currentDockId = undefined;
    }

    const payload = { shipmentId, status: 'COMPLETED' };
    this.broadcastUpdate('STATUS_UPDATE_EVENT', payload);
    return payload;
  }

  public simulateSensorMatch(slotId: string = 'A42') {
    const result = store.simulateSensorMatch(slotId);
    this.broadcastUpdate('SENSOR_MATCH_EVENT', { slotId, ...result });
    return result;
  }

  public simulateSensorMismatch(slotId: string = 'A42') {
    const result = store.simulateSensorMismatch(slotId);
    this.broadcastUpdate('SENSOR_MISMATCH_EVENT', { slotId, ...result });
    return result;
  }

  public resetSensors() {
    const result = store.resetSensors();
    this.broadcastUpdate('SENSOR_RESET_EVENT', result);
    return result;
  }

  public resetDemo() {
    store.resetToDefaults();
    this.broadcastUpdate('DEMO_RESET_EVENT', { timestamp: new Date().toISOString() });
    return { success: true, message: 'Demo state restored to seed defaults' };
  }
}

export const simulationService = new SimulationService();
