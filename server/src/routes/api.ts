import { Router } from 'express';
import { store } from '../db/store.js';
import { allocationEngine } from '../services/allocationEngine.js';
import { simulationService } from '../services/simulationService.js';

const router = Router();

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
  const shipment = store.getShipmentById(req.params.id);
  if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

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

// 3. Customer Tracking (External Customer Safe View)
router.get('/tracking/:query', (req, res) => {
  const query = req.params.query;
  const shipment = store.getShipmentByTrackingNumber(query);
  if (!shipment) {
    return res.status(404).json({ error: 'No shipment found matching tracking query' });
  }

  const trackingEvents = store.getTrackingEvents(shipment.id);
  const activeException = shipment.activeExceptionId ? store.getExceptionById(shipment.activeExceptionId) : undefined;

  // Filter out internal operational noise (dock numbers, yard slot numbers) for customer view
  const customerSafeEvents = trackingEvents.map(e => ({
    id: e.id,
    timestamp: e.timestamp,
    status: e.status,
    location: e.location.includes('Dock') ? 'Warehouse Inbound Bay' : e.location.includes('Slot') ? 'Warehouse Yard' : e.location,
    description: e.description.replace(/Dock D\d+/g, 'Assigned Unloading Bay').replace(/Slot [A-C]\d+/g, 'Holding Zone'),
  }));

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

// 5. Docks
router.get('/docks', (req, res) => {
  res.json(store.getDocks());
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

// 6. Yard Slots
router.get('/yard', (req, res) => {
  const slots = store.getYardSlots();
  const totalSlots = slots.length;
  const occupiedSlots = slots.filter(s => s.status === 'OCCUPIED').length;
  const occupancyPercent = Math.round((occupiedSlots / totalSlots) * 100);

  res.json({
    slots,
    totalSlots,
    occupiedSlots,
    availableSlots: totalSlots - occupiedSlots,
    occupancyPercent,
    isCongested: occupancyPercent >= 80,
  });
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
router.get('/analytics/kpis', (req, res) => {
  res.json(store.getAnalyticsKPIs());
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

// 12. Simulation Controls
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

router.post('/simulation/reset', (req, res) => {
  const result = simulationService.resetDemo();
  res.json(result);
});

export default router;
