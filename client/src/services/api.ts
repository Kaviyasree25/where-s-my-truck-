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

// Create dedicated axios instance with JWT header interceptor
export const apiClient = axios.create({
  baseURL: API_BASE,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<{ success: boolean; token: string; user: User }> => {
    const res = await apiClient.post('/auth/login', { email, password });
    if (res.data?.token) {
      localStorage.setItem('auth_token', res.data.token);
    }
    return res.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get('/users');
    return res.data;
  },

  // Machine Learning Recommendations
  getMLRecommendation: async (trailerId: string = 'TR-106'): Promise<MLRecommendationResponse> => {
    const res = await apiClient.get(`/recommendations/${trailerId}`);
    return res.data;
  },

  getMLDockRecommendation: async (trailerId: string = 'TR-106') => {
    const res = await apiClient.post('/recommendations/dock', { trailerId });
    return res.data;
  },

  getMLYardRecommendation: async (trailerId: string = 'TR-106') => {
    const res = await apiClient.post('/recommendations/yard', { trailerId });
    return res.data;
  },

  getMLModelInfo: async () => {
    const res = await apiClient.get('/ml/model-info');
    return res.data;
  },

  trainMLModel: async () => {
    const res = await apiClient.post('/ml/train');
    return res.data;
  },

  // Smart Queue
  getSmartQueue: async (): Promise<SmartQueueItem[]> => {
    const res = await apiClient.get('/smart-queue');
    return res.data;
  },

  // Shipments
  getShipments: async (params?: { status?: string; priority?: string; risk?: string }): Promise<Shipment[]> => {
    const res = await apiClient.get('/shipments', { params });
    return res.data;
  },

  getShipmentById: async (id: string): Promise<Shipment> => {
    const res = await apiClient.get(`/shipments/${id}`);
    return res.data;
  },

  createShipment: async (data: any): Promise<Shipment> => {
    const res = await apiClient.post('/shipments', data);
    return res.data;
  },

  // Customer Tracking
  getCustomerTracking: async (query: string): Promise<CustomerTrackingResponse> => {
    const res = await apiClient.get(`/tracking/${query}`);
    return res.data;
  },

  // Trailers
  getTrailers: async (): Promise<Trailer[]> => {
    const res = await apiClient.get('/trailers');
    return res.data;
  },

  getTrailerPositions: async () => {
    const res = await apiClient.get('/trailers/positions');
    return res.data;
  },

  getAllTrailerRoutes: async (): Promise<Record<string, [number, number][]>> => {
    const res = await apiClient.get('/trailers/routes/all');
    return res.data;
  },

  getTrailerRoute: async (trailerId: string) => {
    const res = await apiClient.get(`/trailers/${trailerId}/route`);
    return res.data;
  },

  checkInTrailer: async (data: any) => {
    const res = await apiClient.post('/trailers/check-in', data);
    return res.data;
  },

  // Docks
  getDocks: async (): Promise<Dock[]> => {
    const res = await apiClient.get('/docks');
    return res.data;
  },

  createOrUpdateDock: async (data: any) => {
    const payload = {
      type: 'STANDARD',
      ...data,
      supportedCapabilities: data.supportedCapabilities || data.capabilities || ['DRY_VAN'],
    };
    const res = await apiClient.post('/docks', payload);
    return res.data;
  },

  updateDockStatus: async (id: string, status: string, notes?: string): Promise<{ dock: Dock; simResult?: any }> => {
    const res = await apiClient.put(`/docks/${id}/status`, { status, notes });
    return res.data;
  },

  // Yard
  getYardState: async (): Promise<YardState> => {
    const res = await apiClient.get('/yard');
    return res.data;
  },

  moveYardTrailer: async (trailerId: string, toSlotId: string, operatorName?: string) => {
    const res = await apiClient.post('/yard/move', { trailerId, toSlotId, operatorName });
    return res.data;
  },

  // Appointments
  getAppointments: async (): Promise<Appointment[]> => {
    const res = await apiClient.get('/appointments');
    return res.data;
  },

  // Exceptions
  getExceptions: async (params?: { status?: string; severity?: string }): Promise<Exception[]> => {
    const res = await apiClient.get('/exceptions', { params });
    return res.data;
  },

  resolveException: async (id: string, notes?: string): Promise<Exception> => {
    const res = await apiClient.put(`/exceptions/${id}/resolve`, { notes });
    return res.data;
  },

  // Analytics
  getAnalyticsKPIs: async (): Promise<AnalyticsKPIs> => {
    const res = await apiClient.get('/analytics');
    return res.data;
  },

  getAnalyticsHeatmap: async () => {
    const res = await apiClient.get('/analytics/heatmap');
    return res.data;
  },

  // Allocations
  getRecommendations: async (shipmentId?: string): Promise<AllocationRecommendation[]> => {
    const res = await apiClient.get('/allocation/recommendations', {
      params: shipmentId ? { shipmentId } : undefined,
    });
    return res.data;
  },

  evaluateAllocation: async (shipmentId: string) => {
    const res = await apiClient.get('/allocation/recommendations', {
      params: { shipmentId },
    });
    return res.data?.[0] || null;
  },

  assignDock: async (shipmentId: string, dockId: string, overrides?: any, reason?: string) => {
    const res = await apiClient.post('/allocation/approve', {
      shipmentId,
      dockId,
      reason,
      ...overrides,
    });
    return res.data;
  },

  approveAllocation: async (shipmentId: string, dockId: string, overrides?: any) => {
    const res = await apiClient.post('/allocation/approve', {
      shipmentId,
      dockId,
      ...overrides,
    });
    return res.data;
  },

  reassignAllocation: async (shipmentId: string, newDockId: string, reason: string) => {
    const res = await apiClient.post('/allocation/reassign', {
      shipmentId,
      newDockId,
      reason,
    });
    return res.data;
  },

  reassignDock: async (shipmentId: string, newDockId: string, reason: string = 'Manual override', ...rest: any[]) => {
    const res = await apiClient.post('/allocation/reassign', {
      shipmentId,
      newDockId,
      reason,
    });
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await apiClient.get('/audit-logs');
    return res.data;
  },

  // Simulation
  triggerSimulation: async (scenario: string, params?: any) => {
    const res = await apiClient.post('/simulation/trigger', { scenario, params });
    return res.data;
  },

  simulateSensorMatch: async (...args: any[]) => {
    const res = await apiClient.post('/simulation/trigger', { scenario: 'SENSOR_MATCH', params: args[0] });
    return res.data;
  },

  simulateSensorMismatch: async (...args: any[]) => {
    const res = await apiClient.post('/simulation/trigger', { scenario: 'LOCATION_MISMATCH', params: args[0] });
    return res.data;
  },

  simulateDockFailure: async (dockId: string = 'D04') => {
    const res = await apiClient.post('/simulation/trigger', { scenario: 'DOCK_FAILURE', params: { dockId } });
    return res.data;
  },

  simulateETADelay: async (...args: any[]) => {
    const res = await apiClient.post('/simulation/trigger', { scenario: 'ETA_DELAY', params: { shipmentId: args[0] || 'SHP-1003', delayMinutes: args[1] || 45 } });
    return res.data;
  },

  simulateYardCongestion: async (...args: any[]) => {
    const res = await apiClient.post('/simulation/trigger', { scenario: 'YARD_CONGESTION', params: args[0] });
    return res.data;
  },

  resetSimulation: async () => {
    const res = await apiClient.post('/simulation/reset');
    return res.data;
  },

  resetDemo: async () => {
    const res = await apiClient.post('/simulation/reset');
    return res.data;
  },

  resetTrailerRoutes: async () => {
    const res = await apiClient.post('/trailers/routes/reset');
    return res.data;
  },

  resetRoutes: async () => {
    const res = await apiClient.post('/trailers/routes/reset');
    return res.data;
  },
};
