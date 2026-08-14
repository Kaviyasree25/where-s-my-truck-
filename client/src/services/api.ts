import axios from 'axios';
import {
  Shipment,
  Dock,
  YardState,
  Appointment,
  Exception,
  AuditLog,
  AnalyticsKPIs,
  AllocationRecommendation,
  CustomerTrackingResponse,
  User,
  Trailer,
  SmartQueueItem,
  MLRecommendationResponse,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await axios.get(`${API_BASE}/users`);
    return res.data;
  },

  // Machine Learning Recommendations
  getMLRecommendation: async (trailerId: string = 'TR-106'): Promise<MLRecommendationResponse> => {
    const res = await axios.get(`${API_BASE}/recommendations/${trailerId}`);
    return res.data;
  },

  getMLDockRecommendation: async (trailerId: string = 'TR-106') => {
    const res = await axios.post(`${API_BASE}/recommendations/dock`, { trailerId });
    return res.data;
  },

  getMLYardRecommendation: async (trailerId: string = 'TR-106') => {
    const res = await axios.post(`${API_BASE}/recommendations/yard`, { trailerId });
    return res.data;
  },

  trainMLModel: async () => {
    const res = await axios.post(`${API_BASE}/ml/train`);
    return res.data;
  },

  // Smart Queue
  getSmartQueue: async (): Promise<SmartQueueItem[]> => {
    const res = await axios.get(`${API_BASE}/smart-queue`);
    return res.data;
  },

  // Shipments
  getShipments: async (params?: { status?: string; priority?: string; risk?: string }): Promise<Shipment[]> => {
    const res = await axios.get(`${API_BASE}/shipments`, { params });
    return res.data;
  },

  getShipmentById: async (id: string): Promise<Shipment> => {
    const res = await axios.get(`${API_BASE}/shipments/${id}`);
    return res.data;
  },

  // Customer Tracking
  getCustomerTracking: async (query: string): Promise<CustomerTrackingResponse> => {
    const res = await axios.get(`${API_BASE}/tracking/${query}`);
    return res.data;
  },

  // Trailers
  getTrailers: async (): Promise<Trailer[]> => {
    const res = await axios.get(`${API_BASE}/trailers`);
    return res.data;
  },

  // Docks
  getDocks: async (): Promise<Dock[]> => {
    const res = await axios.get(`${API_BASE}/docks`);
    return res.data;
  },

  updateDockStatus: async (dockId: string, status: string, notes?: string) => {
    const res = await axios.put(`${API_BASE}/docks/${dockId}/status`, { status, notes });
    return res.data;
  },

  // Yard
  getYardState: async (): Promise<YardState> => {
    const res = await axios.get(`${API_BASE}/yard`);
    return res.data;
  },

  // Appointments
  getAppointments: async (): Promise<Appointment[]> => {
    const res = await axios.get(`${API_BASE}/appointments`);
    return res.data;
  },

  // Exceptions
  getExceptions: async (): Promise<Exception[]> => {
    const res = await axios.get(`${API_BASE}/exceptions`);
    return res.data;
  },

  resolveException: async (id: string, resolutionDetails: string) => {
    const res = await axios.put(`${API_BASE}/exceptions/${id}/resolve`, { resolutionDetails });
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await axios.get(`${API_BASE}/audit-logs`);
    return res.data;
  },

  // Analytics
  getAnalyticsKPIs: async (): Promise<AnalyticsKPIs> => {
    const res = await axios.get(`${API_BASE}/analytics/kpis`);
    return res.data;
  },

  // Allocation
  evaluateAllocation: async (shipmentId: string): Promise<AllocationRecommendation> => {
    const res = await axios.post(`${API_BASE}/allocation/evaluate`, { shipmentId });
    return res.data;
  },

  assignDock: async (shipmentId: string, trailerId: string, dockId: string, operatorName?: string) => {
    const res = await axios.post(`${API_BASE}/allocation/assign`, { shipmentId, trailerId, dockId, operatorName });
    return res.data;
  },

  reassignDock: async (shipmentId: string, trailerId: string, oldDockId: string, newDockId: string, reason: string, operatorName?: string) => {
    const res = await axios.post(`${API_BASE}/allocation/reassign`, {
      shipmentId,
      trailerId,
      oldDockId,
      newDockId,
      reason,
      operatorName,
    });
    return res.data;
  },

  // Simulations
  simulateDockFailure: async (dockId: string = 'D04') => {
    const res = await axios.post(`${API_BASE}/simulation/dock-failure`, { dockId });
    return res.data;
  },

  simulateETADelay: async (shipmentId: string = 'SHP-1005', delayMinutes: number = 45) => {
    const res = await axios.post(`${API_BASE}/simulation/eta-delay`, { shipmentId, delayMinutes });
    return res.data;
  },

  simulateYardCongestion: async () => {
    const res = await axios.post(`${API_BASE}/simulation/yard-congestion`);
    return res.data;
  },

  simulateStartUnloading: async (shipmentId: string = 'SHP-1005') => {
    const res = await axios.post(`${API_BASE}/simulation/start-unloading`, { shipmentId });
    return res.data;
  },

  simulateCompleteUnloading: async (shipmentId: string = 'SHP-1005') => {
    const res = await axios.post(`${API_BASE}/simulation/complete-unloading`, { shipmentId });
    return res.data;
  },

  simulateSensorMatch: async (slotId: string = 'A42') => {
    const res = await axios.post(`${API_BASE}/simulation/sensor-match`, { slotId });
    return res.data;
  },

  simulateSensorMismatch: async (slotId: string = 'A42') => {
    const res = await axios.post(`${API_BASE}/simulation/sensor-mismatch`, { slotId });
    return res.data;
  },

  resetSensors: async () => {
    const res = await axios.post(`${API_BASE}/simulation/sensor-reset`);
    return res.data;
  },

  resetDemo: async () => {
    const res = await axios.post(`${API_BASE}/simulation/reset`);
    return res.data;
  },
};
