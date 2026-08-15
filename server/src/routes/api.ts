import { Router } from 'express';
import { store } from '../db/store.js';
import { allocationEngine } from '../services/allocationEngine.js';
import { simulationService } from '../services/simulationService.js';
import { getAllTrailerRoutes, getTrailerRouteDetails, resetTrailerPositions } from '../services/positionSimulator.js';
import { mlRecommendationService } from '../services/mlRecommendationService.js';
import { schedulePredictionEngine } from '../services/schedulePredictionEngine.js';
import { authenticateUser, requireAuth, requireRole } from '../services/authService.js';

const router = Router();

// 0. Authentication Endpoints (JWT HMAC-SHA256)
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const result = authenticateUser(email, password);
  if (!result) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({
    success: true,
    token: result.token,
    user: result.user,
  });
});

router.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// 1. Users
router.get('/users', (req, res) => {
  res.json(store.getUsers());
});

// 2. Shipments
router.get('/shipments', (req, res) => {
  let shipments = store.getShipments();
  const { status, priority, risk, carrier } = req.query;

  if (status) shipments = shipments.filter(s => s.status === status);
  if (priority) shipments = shipments.filter(s => s.priority === priority);
  if (risk) shipments = shipments.filter(s => s.risk === risk);
  if (carrier) shipments = shipments.filter(s => s.carrierName.toLowerCase().includes(String(carrier).toLowerCase()));

  res.json(shipments);
});

router.get('/shipments/:id', (req, res) => {
  const query = req.params.id.trim();
  let shipment = store.getShipmentById(query);
  
  if (!shipment) {
    shipment = store.getShipments().find(s => 
      s.id.toLowerCase() === query.toLowerCase() || 
      s.trackingNumber.toLowerCase() === query.toLowerCase() || 
      s.trailerId.toLowerCase() === query.toLowerCase()
    );
  }

  // Fallback: If it's a Trailer ID or Shipment ID in our 50-trailer fleet
  if (!shipment) {
    const trailer = store.getTrailerById(query) || store.getTrailers().find(t => t.shipmentId?.toLowerCase() === query.toLowerCase() || t.id.toLowerCase() === query.toLowerCase());
    if (trailer) {
      shipment = {
        id: trailer.shipmentId || (query.startsWith('SHP-') ? query : `SHP-${trailer.id.replace('TR-', '10')}`),
        trackingNumber: `TRK-${trailer.id.replace('TR-', '99')}`,
        carrierId: trailer.carrierId,
        carrierName: trailer.carrierName,
        supplier: trailer.temperatureProfile === 'DEEP_FREEZE' ? 'Apex Retail Supplier (Pharma & Cold Goods)' : 'Verified Enterprise Freight Shipper',
        origin: 'Regional Distribution Center',
        destination: 'Naperville DC-1 Hub - Bay A',
        priority: (trailer.temperatureProfile === 'DEEP_FREEZE' || trailer.productDemandLevel === 'CRITICAL_SURGE') ? 'CRITICAL' : 'HIGH',
        loadType: trailer.trailerType as any,
        status: trailer.status === 'AT_DOCK' ? 'PROCESSING' : trailer.status === 'IN_YARD' ? 'IN_YARD' : 'IN_TRANSIT',
        risk: 'NORMAL',
        eta: new Date(Date.now() + (trailer.targetDockEtaMinutes || 45) * 60 * 1000).toISOString(),
        scheduledAppointment: new Date(Date.now() + (trailer.targetDockEtaMinutes || 60) * 60 * 1000).toISOString(),
        trailerId: trailer.id,
        currentDockId: trailer.assignedDockId,
        currentYardSlotId: trailer.currentSlotId,
        itemsSummary: trailer.trailerType === 'REFRIGERATED' ? '28 Temperature-Controlled Cold-Chain Pallets (-20°C Spec)' : '42 Pallets General Merchandise & Packaged Freight',
        totalWeightKg: 14200,
        temperatureProfile: trailer.temperatureProfile as any,
        currentTempCelsius: trailer.currentTempCelsius,
        targetTemperatureRange: trailer.targetTempCelsius !== undefined ? `${trailer.targetTempCelsius - 2}°C to ${trailer.targetTempCelsius + 2}°C` : undefined,
      };
    }
  }

  if (!shipment) return res.status(404).json({ error: `Shipment not found for query '${query}'` });

  const trailer = store.getTrailerById(shipment.trailerId);
  const dock = shipment.currentDockId ? store.getDockById(shipment.currentDockId) : undefined;
  const trackingEvents = store.getTrackingEvents(shipment.id);
  const activeException = shipment.activeExceptionId ? store.getExceptionById(shipment.activeExceptionId) : undefined;

  res.json({
    ...shipment,
    trailer,
    dock,
    trackingEvents,
    activeException,
  });
});

router.post('/shipments', (req, res) => {
  try {
    const shipment = store.createShipment(req.body);
    res.status(201).json(shipment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Customer Tracking (External Customer Safe View)
router.get('/tracking/:query', (req, res) => {
  const query = req.params.query.trim();
  let shipment = store.getShipmentByTrackingNumber(query);
  if (!shipment) {
    shipment = store.getShipments().find(s => 
      s.id.toLowerCase() === query.toLowerCase() || 
      s.trackingNumber.toLowerCase() === query.toLowerCase() || 
      s.trailerId.toLowerCase() === query.toLowerCase()
    );
  }

  if (!shipment) {
    const trailer = store.getTrailerById(query) || store.getTrailers().find(t => t.shipmentId?.toLowerCase() === query.toLowerCase() || t.id.toLowerCase() === query.toLowerCase());
    if (trailer) {
      shipment = {
        id: trailer.shipmentId || (query.startsWith('SHP-') ? query : `SHP-${trailer.id.replace('TR-', '10')}`),
        trackingNumber: `TRK-${trailer.id.replace('TR-', '99')}`,
        carrierId: trailer.carrierId,
        carrierName: trailer.carrierName,
        supplier: trailer.temperatureProfile === 'DEEP_FREEZE' ? 'Apex Retail Supplier (Pharma & Cold Goods)' : 'Verified Enterprise Freight Shipper',
        origin: 'Regional Distribution Center',
        destination: 'Naperville DC-1 Hub - Bay A',
        priority: (trailer.temperatureProfile === 'DEEP_FREEZE' || trailer.productDemandLevel === 'CRITICAL_SURGE') ? 'CRITICAL' : 'HIGH',
        loadType: trailer.trailerType as any,
        status: trailer.status === 'AT_DOCK' ? 'PROCESSING' : trailer.status === 'IN_YARD' ? 'IN_YARD' : 'IN_TRANSIT',
        risk: 'NORMAL',
        eta: new Date(Date.now() + (trailer.targetDockEtaMinutes || 45) * 60 * 1000).toISOString(),
        scheduledAppointment: new Date(Date.now() + (trailer.targetDockEtaMinutes || 60) * 60 * 1000).toISOString(),
        trailerId: trailer.id,
        currentDockId: trailer.assignedDockId,
        currentYardSlotId: trailer.currentSlotId,
        itemsSummary: trailer.trailerType === 'REFRIGERATED' ? '28 Temperature-Controlled Cold-Chain Pallets (-20°C Spec)' : '42 Pallets General Merchandise & Packaged Freight',
        totalWeightKg: 14200,
        temperatureProfile: trailer.temperatureProfile as any,
        currentTempCelsius: trailer.currentTempCelsius,
        targetTemperatureRange: trailer.targetTempCelsius !== undefined ? `${trailer.targetTempCelsius - 2}°C to ${trailer.targetTempCelsius + 2}°C` : undefined,
      };
    }
  }

  if (!shipment) {
    return res.status(404).json({ error: 'No shipment found matching tracking query' });
  }

  const trackingEvents = store.getTrackingEvents(shipment.id);
  const activeException = shipment.activeExceptionId ? store.getExceptionById(shipment.activeExceptionId) : undefined;

  // Filter out internal operational noise for customer view
  const customerSafeEvents = trackingEvents.length > 0 ? trackingEvents.map(e => ({
    id: e.id,
    timestamp: e.timestamp,
    status: e.status,
    location: e.location.includes('Dock') ? 'Warehouse Inbound Bay' : e.location.includes('Slot') ? 'Warehouse Yard' : e.location,
    description: e.description.replace(/Dock D\d+/g, 'Assigned Unloading Bay').replace(/Slot [A-C]\d+/g, 'Holding Zone'),
  })) : [
    { id: 'EV-1', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'DISPATCHED', location: 'Origin Depot', description: 'Freight dispatched on line-haul trailer' },
    { id: 'EV-2', timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'IN_TRANSIT', location: 'Interstate Highway Corridor', description: 'GPS automated waypoint verified' },
    { id: 'EV-3', timestamp: new Date().toISOString(), status: shipment.status, location: 'Naperville DC-1', description: 'Inbound milestone logged' },
  ];

  res.json({
    shipmentId: shipment.id,
    trackingNumber: shipment.trackingNumber,
    carrierName: shipment.carrierName,
    supplier: shipment.supplier,
    origin: shipment.origin,
    destination: shipment.destination,
    status: shipment.status,
    eta: shipment.eta,
    scheduledAppointment: shipment.scheduledAppointment,
    itemsSummary: shipment.itemsSummary,
    hasDelayNotice: shipment.risk === 'DELAYED' || shipment.risk === 'WARNING',
    delayNote: activeException ? activeException.description : undefined,
    milestones: customerSafeEvents,
  });
});

// 4. Trailers
router.get('/trailers', (req, res) => {
  res.json(store.getTrailers());
});

// 4b. Trailer positions — minimal snapshot for map initial load
router.get('/trailers/positions', (req, res) => {
  res.json(store.getTrailerPositions());
});

// 4c. Trailer Road Route Geometries (OSRM Waypoints for live tracking)
router.get('/trailers/routes/all', (req, res) => {
  res.json(getAllTrailerRoutes());
});

router.get('/trailers/:id/route', (req, res) => {
  res.json(getTrailerRouteDetails(req.params.id));
});

router.post('/trailers/check-in', (req, res) => {
  try {
    const result = store.checkInTrailer(req.body);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Docks & Live Unloading Schedule
router.get('/docks', (req, res) => {
  res.json(store.getDocks());
});

router.get('/docks/schedule', (req, res) => {
  const horizon = (req.query.horizon as string) || 'NOW';
  const snapshot = schedulePredictionEngine.getSnapshotForHorizon(horizon as any);
  res.json(snapshot.docks);
});

router.get('/schedule/horizon/:horizon', (req, res) => {
  try {
    const horizon = (req.params.horizon as string) || '1H';
    const snapshot = schedulePredictionEngine.getSnapshotForHorizon(horizon as any);
    res.json(snapshot);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/trailers/auto-schedule', (req, res) => {
  try {
    const { trailerId } = req.body;
    const rec = mlRecommendationService.getRecommendationForTrailer(trailerId || 'TR-106');
    res.json({ success: true, recommendation: rec });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/docks', (req, res) => {
  try {
    const dock = store.createOrUpdateDock(req.body);
    res.json(dock);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/docks/:id/status', (req, res) => {
  const { status, notes } = req.body;
  const dock = store.updateDockStatus(req.params.id, status, notes);
  if (!dock) return res.status(404).json({ error: 'Dock not found' });

  // If dock toggled to BLOCKED or MAINTENANCE and had an assigned trailer -> auto trigger failure simulation logic
  if ((status === 'BLOCKED' || status === 'MAINTENANCE') && (req.params.id === 'D04' || dock.currentTrailerId)) {
    const simResult = simulationService.simulateDockFailure(req.params.id);
    return res.json({ dock, simResult });
  }

  res.json(dock);
});

// 6. Yard Slots & Live Staging State (supports ?horizon=1H etc.)
router.get('/yard', (req, res) => {
  const horizon = (req.query.horizon as string) || 'NOW';
  const snapshot = schedulePredictionEngine.getSnapshotForHorizon(horizon as any);
  const slots = snapshot.yardSlots;
  const totalSlots = slots.length;
  const occupiedSlots = slots.filter((s: any) => s.status === 'OCCUPIED').length;
  const occupancyPercent = Math.round((occupiedSlots / totalSlots) * 100);

  res.json({
    slots,
    totalSlots,
    occupiedSlots,
    availableSlots: totalSlots - occupiedSlots,
    occupancyPercent,
    isCongested: occupancyPercent >= 80,
    horizon: snapshot.horizon,
    horizonLabel: snapshot.horizonLabel,
  });
});

router.post('/yard/move', (req, res) => {
  try {
    const { trailerId, toSlotId, operatorName } = req.body;
    const result = store.moveTrailerYardSlot(trailerId, toSlotId, operatorName);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6.1 Multi-Hour Time Horizon Predictive Analytics (1H, 2H, 3H, 4H, ALL/NOW)
router.get('/schedule/horizon/:horizon', (req, res) => {
  const horizon = (req.params.horizon || 'NOW').toUpperCase();
  const snapshot = schedulePredictionEngine.getSnapshotForHorizon(horizon as any);
  res.json(snapshot);
});

// 6.2 Automated Real-Time ML Dispatch & Prediction
router.post('/trailers/auto-schedule', (req, res) => {
  try {
    const { trailerId } = req.body;
    const trailers = store.getTrailers();
    const targetTrailer = trailerId ? trailers.find(t => t.id === trailerId) : trailers.find(t => t.status === 'IN_YARD' && !t.assignedDockId);

    if (!targetTrailer) {
      return res.status(404).json({ error: 'No unassigned trailer found for auto-scheduling' });
    }

    const rec = mlRecommendationService.getRecommendationForTrailer(targetTrailer.id);
    res.json({
      success: true,
      message: `Automated ML schedule generated for ${targetTrailer.id}`,
      trailer: targetTrailer,
      recommendation: rec,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Appointments
router.get('/appointments', (req, res) => {
  res.json(store.getAppointments());
});

// 8. Exceptions
router.get('/exceptions', (req, res) => {
  let exceptions = store.getExceptions();
  const { status, severity } = req.query;
  if (status) exceptions = exceptions.filter(e => e.status === status);
  if (severity) exceptions = exceptions.filter(e => e.severity === severity);
  res.json(exceptions);
});

router.put('/exceptions/:id/resolve', (req, res) => {
  const { resolutionDetails } = req.body;
  const ex = store.resolveException(req.params.id, resolutionDetails || 'Resolved by operator');
  if (!ex) return res.status(404).json({ error: 'Exception not found' });
  res.json(ex);
});

// 9. Audit Logs
router.get('/audit-logs', (req, res) => {
  res.json(store.getAuditLogs());
});

// 10. Analytics
router.get(['/analytics', '/analytics/kpis'], (req, res) => {
  res.json(store.getAnalyticsKPIs());
});

router.get('/analytics/heatmap', (req, res) => {
  res.json(store.getHeatmapData());
});

// 11. Allocation Engine & Assignment Endpoints
router.post('/allocation/evaluate', (req, res) => {
  const { shipmentId } = req.body;
  if (!shipmentId) return res.status(400).json({ error: 'shipmentId is required' });

  try {
    const recommendation = allocationEngine.evaluateDocks(shipmentId);
    res.json(recommendation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/allocation/assign', (req, res) => {
  const { shipmentId, trailerId, dockId, operatorName } = req.body;
  try {
    const result = store.assignDock(shipmentId, trailerId, dockId, operatorName);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/allocation/reassign', (req, res) => {
  const { shipmentId, trailerId, oldDockId, newDockId, reason, operatorName } = req.body;
  try {
    const result = store.reassignDock(shipmentId, trailerId, oldDockId, newDockId, reason, operatorName);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 11b. Smart Priority Queue & Machine Learning Recommendations
router.get('/smart-queue', (req, res) => {
  try {
    const queue = store.getSmartQueue();
    res.json(queue);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/queue', (req, res) => {
  try {
    const queue = store.getSmartQueue();
    res.json(queue);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations/:trailerId', (req, res) => {
  try {
    const trailerId = req.params.trailerId || 'TR-106';
    const rec = mlRecommendationService.getRecommendationForTrailer(trailerId);
    res.json(rec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/recommendations/dock/:trailerId', (req, res) => {
  try {
    const trailerId = req.params.trailerId || 'TR-106';
    const rec = mlRecommendationService.getRecommendationForTrailer(trailerId);
    res.json(rec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recommendations/dock', (req, res) => {
  try {
    const { trailerId } = req.body;
    const rec = mlRecommendationService.getRecommendationForTrailer(trailerId || 'TR-106');
    res.json(rec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recommendations/yard', (req, res) => {
  try {
    const { trailerId } = req.body;
    const rec = mlRecommendationService.getRecommendationForTrailer(trailerId || 'TR-106');
    res.json(rec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ml/model-info', (req, res) => {
  try {
    const telemetry = mlRecommendationService.getModelTelemetry();
    res.json(telemetry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ml/telemetry', (req, res) => {
  try {
    const telemetry = mlRecommendationService.getModelTelemetry();
    res.json(telemetry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ml/train', (req, res) => {
  try {
    const telemetry = mlRecommendationService.trainModel();
    res.json({ success: true, telemetry });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Simulation Controls
router.post('/simulation/trigger', (req, res) => {
  try {
    const { scenario, params } = req.body;
    let result: any;
    switch (scenario) {
      case 'DOCK_FAILURE':
        result = simulationService.simulateDockFailure(params?.dockId || 'D04');
        break;
      case 'ETA_DELAY':
        result = simulationService.simulateETADelay(params?.shipmentId || 'SHP-1005', params?.delayMinutes || 45);
        break;
      case 'YARD_CONGESTION':
        result = simulationService.simulateYardCongestion();
        break;
      case 'SENSOR_MATCH':
        result = simulationService.simulateSensorMatch(params?.slotId || params || 'A42');
        break;
      case 'LOCATION_MISMATCH':
        result = simulationService.simulateSensorMismatch(params?.slotId || params || 'A42');
        break;
      case 'START_UNLOADING':
        result = simulationService.simulateStartUnloading(params?.shipmentId || 'SHP-1005');
        break;
      case 'COMPLETE_UNLOADING':
        result = simulationService.simulateCompleteUnloading(params?.shipmentId || 'SHP-1005');
        break;
      default:
        throw new Error(`Unknown simulation scenario: ${scenario}`);
    }
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulation/dock-failure', (req, res) => {
  try {
    const { dockId } = req.body;
    const result = simulationService.simulateDockFailure(dockId || 'D04');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulation/eta-delay', (req, res) => {
  try {
    const { shipmentId, delayMinutes } = req.body;
    const result = simulationService.simulateETADelay(shipmentId || 'SHP-1005', delayMinutes || 45);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulation/yard-congestion', (req, res) => {
  try {
    const result = simulationService.simulateYardCongestion();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulation/start-unloading', (req, res) => {
  try {
    const { shipmentId } = req.body;
    const result = simulationService.simulateStartUnloading(shipmentId || 'SHP-1005');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulation/complete-unloading', (req, res) => {
  try {
    const { shipmentId } = req.body;
    const result = simulationService.simulateCompleteUnloading(shipmentId || 'SHP-1005');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/smart-queue', (req, res) => {
  try {
    const queue = store.getSmartPriorityQueue();
    res.json(queue);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulation/sensor-match', (req, res) => {
  try {
    const { slotId } = req.body;
    const result = simulationService.simulateSensorMatch(slotId || 'A42');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulation/sensor-mismatch', (req, res) => {
  try {
    const { slotId } = req.body;
    const result = simulationService.simulateSensorMismatch(slotId || 'A42');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulation/sensor-reset', (req, res) => {
  try {
    const result = simulationService.resetSensors();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 12.1 Emergency Cold-Chain Priority Preemption / Bump Simulator
router.post('/schedule/simulate-preemption', (req, res) => {
  try {
    const result = schedulePredictionEngine.triggerEmergencyPreemption();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/schedule/clear-preemption', (req, res) => {
  try {
    const result = schedulePredictionEngine.clearPreemption();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulation/reset-routes', (req, res) => {
  try {
    const result = resetTrailerPositions(simulationService.getSocketServer?.());
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/trailers/routes/reset', (req, res) => {
  try {
    const result = resetTrailerPositions(simulationService.getSocketServer?.());
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulation/reset', (req, res) => {
  try {
    store.resetToDefaults();
    resetTrailerPositions(simulationService.getSocketServer?.());
    simulationService.broadcastStateChange({ reason: 'FULL_DEMO_RESET' });
    res.json({ success: true, message: 'Full demo and trailer route positions reset' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ML Recommendation APIs
router.get('/recommendations/:trailerId', (req, res) => {
  try {
    const rec = mlRecommendationService.getRecommendationForTrailer(req.params.trailerId);
    res.json(rec);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recommendations/yard', (req, res) => {
  try {
    const { trailerId } = req.body;
    const rec = mlRecommendationService.getRecommendationForTrailer(trailerId || 'TR-106');
    res.json({
      trailerId: rec.trailerId,
      recommendedYardSlotId: rec.recommendedYardSlotId,
      confidencePct: rec.yardConfidencePct,
      topFactors: rec.yardTopFactors,
      alternatives: rec.yardAlternatives,
      source: rec.source,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recommendations/dock', (req, res) => {
  try {
    const { trailerId } = req.body;
    const rec = mlRecommendationService.getRecommendationForTrailer(trailerId || 'TR-106');
    res.json({
      trailerId: rec.trailerId,
      shipmentId: rec.shipmentId,
      recommendedDockId: rec.recommendedDockId,
      recommendedDockName: rec.recommendedDockName,
      confidencePct: rec.dockConfidencePct,
      expectedWaitMins: rec.expectedWaitMins,
      topFactors: rec.dockTopFactors,
      alternatives: rec.dockAlternatives,
      source: rec.source,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/recommendations/priority', (req, res) => {
  try {
    const { trailerId } = req.body;
    const rec = mlRecommendationService.getRecommendationForTrailer(trailerId || 'TR-106');
    res.json({
      trailerId: rec.trailerId,
      priorityScore: rec.priorityScore,
      priorityLevel: rec.priorityLevel,
      demurrageRisk: rec.demurrageRisk,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ml/model-info', (req, res) => {
  try {
    const info = mlRecommendationService.getModelTelemetry();
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ml/train', async (req, res) => {
  try {
    const updatedTelemetry = await mlRecommendationService.trainModel();
    res.json({
      success: true,
      message: `RandomForestClassifier (${updatedTelemetry.ensembleSize} Trees) trained on ${updatedTelemetry.trainingSamplesCount} historical feature vectors`,
      telemetry: updatedTelemetry,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/simulation/reset', (req, res) => {
  const result = simulationService.resetDemo();
  res.json(result);
});

export default router;
