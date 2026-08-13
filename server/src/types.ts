export type UserRole = 'OPERATOR' | 'MANAGER' | 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatar: string;
}

export type ShipmentPriority = 'STANDARD' | 'HIGH' | 'CRITICAL';
export type LoadType = 'DRY_VAN' | 'REFRIGERATED' | 'HAZMAT' | 'FLATBED';
export type ShipmentStatus =
  | 'CREATED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'IN_YARD'
  | 'DOCK_ASSIGNED'
  | 'PROCESSING'
  | 'COMPLETED';

export type ShipmentRisk = 'NORMAL' | 'WARNING' | 'DELAYED' | 'CRITICAL';

export interface Shipment {
  id: string; // e.g. SHP-1005
  trackingNumber: string; // e.g. TRK-984210
  carrierId: string;
  carrierName: string;
  supplier: string;
  origin: string;
  destination: string;
  priority: ShipmentPriority;
  loadType: LoadType;
  status: ShipmentStatus;
  risk: ShipmentRisk;
  eta: string; // ISO string
  scheduledAppointment: string; // ISO string
  trailerId: string;
  currentDockId?: string;
  currentYardSlotId?: string;
  itemsSummary: string;
  totalWeightKg: number;
  activeExceptionId?: string;
}

export type TrailerStatus = 'EN_ROUTE' | 'IN_YARD' | 'AT_DOCK' | 'DEPARTED';

export interface Trailer {
  id: string; // e.g. TR-105
  licensePlate: string;
  carrierId: string;
  carrierName: string;
  trailerType: LoadType;
  status: TrailerStatus;
  currentSlotId?: string;
  assignedDockId?: string;
  shipmentId: string;
  arrivedAt?: string;
}

export interface Carrier {
  id: string;
  name: string;
  code: string;
  contactPhone: string;
  driverName: string;
  rating: number;
}

export type AppointmentStatus = 'ON_TIME' | 'AT_RISK' | 'DELAYED' | 'MISSED';

export interface Appointment {
  id: string;
  shipmentId: string;
  trailerId: string;
  carrierName: string;
  scheduledArrival: string;
  actualArrival?: string;
  priority: ShipmentPriority;
  status: AppointmentStatus;
  deviationMinutes: number;
}

export type YardZoneId = 'ZONE_A' | 'ZONE_B' | 'ZONE_C';
export type YardSlotStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export interface YardSlot {
  id: string; // e.g. A01
  zoneId: YardZoneId;
  zoneName: string;
  slotNumber: string;
  status: YardSlotStatus;
  occupiedByTrailerId?: string;
  trailerType?: LoadType;
  dwellMinutes?: number;
}

export type DockType = 'STANDARD' | 'REFRIGERATED' | 'HEAVY_DUTY';
export type DockStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED';

export interface Dock {
  id: string; // e.g. D04
  name: string;
  dockType: DockType;
  status: DockStatus;
  capabilities: LoadType[];
  currentTrailerId?: string;
  currentShipmentId?: string;
  assignedTime?: string;
  estimatedCompletionTime?: string;
  maintenanceNotes?: string;
}

export interface DockAssignment {
  id: string;
  dockId: string;
  trailerId: string;
  shipmentId: string;
  assignedAt: string;
  startedAt?: string;
  completedAt?: string;
  status: 'ACTIVE' | 'REASSIGNED' | 'COMPLETED' | 'CANCELLED';
  assignedBy: string;
  reason?: string;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  timestamp: string;
  status: ShipmentStatus;
  location: string;
  description: string;
  updatedBy: string;
}

export type ExceptionType =
  | 'DOCK_FAILURE'
  | 'SHIPMENT_DELAY'
  | 'YARD_CONGESTION'
  | 'LONG_WAITING'
  | 'MISSED_APPOINTMENT'
  | 'EXTENDED_PROCESSING';

export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExceptionStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface Exception {
  id: string;
  shipmentId?: string;
  trailerId?: string;
  dockId?: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  title: string;
  description: string;
  detectedAt: string;
  status: ExceptionStatus;
  recommendedAction?: string;
  resolutionDetails?: string;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  details: string;
  timestamp: string;
}

export interface AllocationReason {
  factor: string;
  points: number;
  maxPoints: number;
  satisfied: boolean;
  note: string;
}

export interface DockScoreResult {
  dockId: string;
  dockName: string;
  isFeasible: boolean;
  hardConstraintFailedReason?: string;
  totalScore: number;
  reasons: AllocationReason[];
  distanceMeters: number;
  queueLength: number;
  expectedWaitMinutes: number;
}

export interface AllocationRecommendation {
  shipmentId: string;
  trailerId: string;
  bestDockId: string | null;
  bestDockName: string | null;
  candidateScores: DockScoreResult[];
  explanation: string;
  generatedAt: string;
}

export interface AnalyticsKPIs {
  activeShipmentsCount: number;
  trailersArrivingToday: number;
  highPriorityCount: number;
  yardOccupancyPercent: number;
  dockUtilizationPercent: number;
  avgWaitTimeMinutes: number;
  avgDwellTimeMinutes: number;
  onTimeArrivalRatePercent: number;
  activeExceptionsCount: number;
}
