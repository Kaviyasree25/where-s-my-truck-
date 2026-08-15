import {
  User,
  Carrier,
  Dock,
  YardSlot,
  Trailer,
  Shipment,
  ShipmentStatus,
  Appointment,
  Exception,
  AuditLog,
  TrackingEvent,
  AnalyticsKPIs,
  SmartQueueItem,
  LoadType,
  ShipmentPriority,
} from '../types.js';
import { priorityEngine } from '../services/priorityEngine.js';


// Warehouse location: Naperville, IL (Chicago logistics hub)
export const WAREHOUSE_LAT = 41.7508;
export const WAREHOUSE_LNG = -88.1535;

// Seed Users
const INITIAL_USERS: User[] = [
  {
    id: 'usr-op1',
    name: 'Kaviya',
    email: 'kaviya@warehouse.logistics',
    role: 'OPERATOR',
    title: 'Senior Inbound Operations Specialist',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  {
    id: 'usr-mgr1',
    name: 'Sri',
    email: 'sri@controltower.logistics',
    role: 'MANAGER',
    title: 'Supply Chain Control Tower Director',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  },
  {
    id: 'usr-cust1',
    name: 'Abi',
    email: 'abi@apexretail.com',
    role: 'CUSTOMER',
    title: 'Customer Logistics Lead',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
  },
  {
    id: 'usr-adm1',
    name: 'Maya',
    email: 'maya@warehouse.logistics',
    role: 'ADMIN',
    title: 'System & Master Data Administrator',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  },
];

// Seed Carriers
const INITIAL_CARRIERS: Carrier[] = [
  { id: 'car-101', name: 'BlueLine Logistics', code: 'BLL', contactPhone: '+1-800-555-0192', driverName: 'John Miller', rating: 4.8 },
  { id: 'car-102', name: 'SwiftHaul Freight', code: 'SWF', contactPhone: '+1-800-555-0144', driverName: 'Sarah Jenkins', rating: 4.6 },
  { id: 'car-103', name: 'TransRoute Express', code: 'TRE', contactPhone: '+1-800-555-0188', driverName: 'Robert Vance', rating: 4.9 },
  { id: 'car-104', name: 'Prime ColdChain Inc', code: 'PCC', contactPhone: '+1-800-555-0120', driverName: 'Alex Carter', rating: 4.7 },
];

// Seed Docks
// Seed Docks (15 Docks with Cold Storage, Chill, Dry, Flatbed & Hazmat capabilities)
const INITIAL_DOCKS: Dock[] = [
  // --- Deep Freeze & Sub-Zero Refrigerated Bays (-22°C to -18°C)
  { id: 'D01', name: 'Dock D01 (Deep Freeze Reefer)', dockType: 'REFRIGERATED', status: 'OCCUPIED', capabilities: ['REFRIGERATED', 'DRY_VAN'], currentTrailerId: 'TR-101', currentShipmentId: 'SHP-1001', assignedTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(), estimatedCompletionTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), unloadingDurationMinutes: 50, unloadingElapsedMinutes: 35, nextQueuedTrailerId: 'TR-106', nextQueuedShipmentId: 'SHP-1006', nextQueuedEtaMinutes: 15, temperatureCapability: ['DEEP_FREEZE', 'REFRIGERATED_CHILL'] },
  { id: 'D02', name: 'Dock D02 (Deep Freeze Reefer)', dockType: 'REFRIGERATED', status: 'AVAILABLE', capabilities: ['REFRIGERATED', 'DRY_VAN'], nextQueuedTrailerId: 'TR-202', nextQueuedShipmentId: 'SHP-1009', nextQueuedEtaMinutes: 25, temperatureCapability: ['DEEP_FREEZE', 'REFRIGERATED_CHILL'] },
  { id: 'D03', name: 'Dock D03 (Deep Freeze Express)', dockType: 'REFRIGERATED', status: 'OCCUPIED', capabilities: ['REFRIGERATED', 'DRY_VAN', 'FLATBED'], currentTrailerId: 'TR-102', currentShipmentId: 'SHP-1002', assignedTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(), estimatedCompletionTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), unloadingDurationMinutes: 60, unloadingElapsedMinutes: 45, nextQueuedTrailerId: 'TR-105', nextQueuedShipmentId: 'SHP-1005', nextQueuedEtaMinutes: 15, temperatureCapability: ['DEEP_FREEZE', 'REFRIGERATED_CHILL'] },
  { id: 'D04', name: 'Dock D04 (Bio-Pharma & Vaccine Cryo)', dockType: 'REFRIGERATED', status: 'AVAILABLE', capabilities: ['REFRIGERATED', 'DRY_VAN'], temperatureCapability: ['DEEP_FREEZE', 'REFRIGERATED_CHILL'] },
  
  // --- Fresh Chill & Dairy Cold-Chain Bays (2°C to 4°C)
  { id: 'D05', name: 'Dock D05 (Fresh Dairy & Produce)', dockType: 'REFRIGERATED', status: 'OCCUPIED', capabilities: ['REFRIGERATED', 'DRY_VAN'], currentTrailerId: 'TR-108', currentShipmentId: 'SHP-1003', assignedTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(), estimatedCompletionTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), unloadingDurationMinutes: 35, unloadingElapsedMinutes: 20, nextQueuedTrailerId: 'TR-204', nextQueuedShipmentId: 'SHP-1011', nextQueuedEtaMinutes: 40, temperatureCapability: ['REFRIGERATED_CHILL', 'CONTROLLED_AMBIENT'] },
  { id: 'D06', name: 'Dock D06 (Cold Storage Buffer)', dockType: 'REFRIGERATED', status: 'MAINTENANCE', capabilities: ['REFRIGERATED', 'DRY_VAN'], maintenanceNotes: 'Scheduled refrigeration evaporator sanitization until 18:00', temperatureCapability: ['REFRIGERATED_CHILL'] },
  { id: 'D07', name: 'Dock D07 (High-Velocity Chill Cross-Dock)', dockType: 'REFRIGERATED', status: 'AVAILABLE', capabilities: ['REFRIGERATED', 'DRY_VAN'], temperatureCapability: ['REFRIGERATED_CHILL', 'CONTROLLED_AMBIENT'] },
  { id: 'D08', name: 'Dock D08 (Controlled Ambient Cleanroom)', dockType: 'REFRIGERATED', status: 'AVAILABLE', capabilities: ['REFRIGERATED', 'DRY_VAN'], temperatureCapability: ['CONTROLLED_AMBIENT', 'DRY_STANDARD'] },

  // --- Ambient Dry Van & High-Velocity E-Commerce Cross-Docks
  { id: 'D09', name: 'Dock D09 (High-Speed Dry Parcel)', dockType: 'STANDARD', status: 'AVAILABLE', capabilities: ['DRY_VAN'], nextQueuedTrailerId: 'TR-201', nextQueuedShipmentId: 'SHP-1008', nextQueuedEtaMinutes: 75, temperatureCapability: ['DRY_STANDARD'] },
  { id: 'D10', name: 'Dock D10 (Standard Dry Inbound)', dockType: 'STANDARD', status: 'AVAILABLE', capabilities: ['DRY_VAN'], temperatureCapability: ['DRY_STANDARD'] },
  { id: 'D11', name: 'Dock D11 (Standard Dry Inbound)', dockType: 'STANDARD', status: 'AVAILABLE', capabilities: ['DRY_VAN'], temperatureCapability: ['DRY_STANDARD'] },
  { id: 'D12', name: 'Dock D12 (Dry Cross-Dock Transfer)', dockType: 'STANDARD', status: 'AVAILABLE', capabilities: ['DRY_VAN'], temperatureCapability: ['DRY_STANDARD'] },

  // --- Heavy Industrial, Flatbed & Hazmat Containment
  { id: 'D13', name: 'Dock D13 (Heavy Duty Flatbed Crane)', dockType: 'HEAVY_DUTY', status: 'AVAILABLE', capabilities: ['FLATBED', 'DRY_VAN'], nextQueuedTrailerId: 'TR-203', nextQueuedShipmentId: 'SHP-1010', nextQueuedEtaMinutes: 135, temperatureCapability: ['DRY_STANDARD'] },
  { id: 'D14', name: 'Dock D14 (Heavy Industrial Crane Bay)', dockType: 'HEAVY_DUTY', status: 'AVAILABLE', capabilities: ['FLATBED', 'DRY_VAN'], temperatureCapability: ['DRY_STANDARD'] },
  { id: 'D15', name: 'Dock D15 (Hazmat Containment Isolated)', dockType: 'HEAVY_DUTY', status: 'AVAILABLE', capabilities: ['HAZMAT'], nextQueuedTrailerId: 'TR-112', nextQueuedShipmentId: 'SHP-1007', nextQueuedEtaMinutes: 25, temperatureCapability: ['HAZMAT'] },
];

// Seed Yard Slots (14 Staging Slots with Zone A Cold Plugs, Zone B Dry Buffer, Zone C Heavy & Hazmat)
const INITIAL_YARD_SLOTS: YardSlot[] = [
  { id: 'A01', zoneId: 'ZONE_A', zoneName: 'Zone A - Cold Staging Buffer', slotNumber: '01', status: 'OCCUPIED', occupiedByTrailerId: 'TR-105', trailerType: 'REFRIGERATED', dwellMinutes: 45, sensorTrailerId: 'TR-105', rtlsTrailerId: 'TR-105', yardMuleTrailerId: 'TR-105', locationValidationStatus: 'VERIFIED', targetDockId: 'D03', targetDockEtaMinutes: 15, nextIncomingTrailerId: 'TR-204', nextIncomingEtaMinutes: 40, temperatureControlled: true },
  { id: 'A02', zoneId: 'ZONE_A', zoneName: 'Zone A - Cold Staging Buffer', slotNumber: '02', status: 'AVAILABLE', locationValidationStatus: 'UNVALIDATED', nextIncomingTrailerId: 'TR-205', nextIncomingEtaMinutes: 50, temperatureControlled: true },
  { id: 'A03', zoneId: 'ZONE_A', zoneName: 'Zone A - Cold Staging Buffer', slotNumber: '03', status: 'OCCUPIED', occupiedByTrailerId: 'TR-108', trailerType: 'DRY_VAN', dwellMinutes: 20, sensorTrailerId: 'TR-108', rtlsTrailerId: 'TR-108', yardMuleTrailerId: 'TR-108', locationValidationStatus: 'VERIFIED', targetDockId: 'D05', targetDockEtaMinutes: 15, temperatureControlled: true },
  { id: 'A04', zoneId: 'ZONE_A', zoneName: 'Zone A - Cold Staging Buffer', slotNumber: '04', status: 'AVAILABLE', locationValidationStatus: 'UNVALIDATED', temperatureControlled: true },
  { id: 'A05', zoneId: 'ZONE_A', zoneName: 'Zone A - Cold Staging Buffer', slotNumber: '05', status: 'AVAILABLE', locationValidationStatus: 'UNVALIDATED', nextIncomingTrailerId: 'TR-207', nextIncomingEtaMinutes: 110, temperatureControlled: true },
  { id: 'A42', zoneId: 'ZONE_A', zoneName: 'Zone A - Cold Staging Buffer (Express)', slotNumber: '42', status: 'OCCUPIED', occupiedByTrailerId: 'TR-106', trailerType: 'REFRIGERATED', dwellMinutes: 112, sensorTrailerId: 'TR-106', rtlsTrailerId: 'TR-106', yardMuleTrailerId: 'TR-106', locationValidationStatus: 'VERIFIED', targetDockId: 'D01', targetDockEtaMinutes: 15, temperatureControlled: true },
  
  { id: 'B01', zoneId: 'ZONE_B', zoneName: 'Zone B - Fresh & Chill Buffer', slotNumber: '01', status: 'OCCUPIED', occupiedByTrailerId: 'TR-110', trailerType: 'REFRIGERATED', dwellMinutes: 110, sensorTrailerId: 'TR-110', rtlsTrailerId: 'TR-110', yardMuleTrailerId: 'TR-110', locationValidationStatus: 'VERIFIED', targetDockId: 'D01', targetDockEtaMinutes: 15, nextIncomingTrailerId: 'TR-208', nextIncomingEtaMinutes: 155, temperatureControlled: true },
  { id: 'B02', zoneId: 'ZONE_B', zoneName: 'Zone B - Fresh & Chill Buffer', slotNumber: '02', status: 'AVAILABLE', locationValidationStatus: 'UNVALIDATED', temperatureControlled: true },
  { id: 'B03', zoneId: 'ZONE_B', zoneName: 'Zone B - Dry Holding Buffer', slotNumber: '03', status: 'AVAILABLE', locationValidationStatus: 'UNVALIDATED', nextIncomingTrailerId: 'TR-206', nextIncomingEtaMinutes: 90 },
  { id: 'B04', zoneId: 'ZONE_B', zoneName: 'Zone B - Dry Holding Buffer', slotNumber: '04', status: 'AVAILABLE', locationValidationStatus: 'UNVALIDATED' },

  { id: 'C01', zoneId: 'ZONE_C', zoneName: 'Zone C - Hazmat & Overflow', slotNumber: '01', status: 'OCCUPIED', occupiedByTrailerId: 'TR-112', trailerType: 'HAZMAT', dwellMinutes: 15, sensorTrailerId: 'TR-112', rtlsTrailerId: 'TR-112', yardMuleTrailerId: 'TR-112', locationValidationStatus: 'VERIFIED', targetDockId: 'D15', targetDockEtaMinutes: 25, nextIncomingTrailerId: 'TR-210', nextIncomingEtaMinutes: 195 },
  { id: 'C02', zoneId: 'ZONE_C', zoneName: 'Zone C - Heavy & Overflow', slotNumber: '02', status: 'AVAILABLE', locationValidationStatus: 'UNVALIDATED' },
  { id: 'C03', zoneId: 'ZONE_C', zoneName: 'Zone C - Heavy Crane Staging', slotNumber: '03', status: 'AVAILABLE', locationValidationStatus: 'UNVALIDATED', nextIncomingTrailerId: 'TR-203', nextIncomingEtaMinutes: 135 },
  { id: 'C04', zoneId: 'ZONE_C', zoneName: 'Zone C - Overflow Buffer', slotNumber: '04', status: 'AVAILABLE', locationValidationStatus: 'UNVALIDATED' },
];

// ─── Trailer & Shipment Pool (50 trucks across all horizons) ─────────────────
// Future queue pool used by dock rotation simulator to auto-assign next-next trailer
const FUTURE_QUEUE_POOL: Record<string, Array<{ trailerId: string; shipmentId: string; etaMinutes: number }>> = {
  'D01': [{ trailerId: 'TR-301', shipmentId: 'SHP-2001', etaMinutes: 65 }, { trailerId: 'TR-302', shipmentId: 'SHP-2002', etaMinutes: 125 }],
  'D02': [{ trailerId: 'TR-303', shipmentId: 'SHP-2003', etaMinutes: 70 }, { trailerId: 'TR-304', shipmentId: 'SHP-2004', etaMinutes: 130 }],
  'D03': [{ trailerId: 'TR-305', shipmentId: 'SHP-2005', etaMinutes: 80 }, { trailerId: 'TR-306', shipmentId: 'SHP-2006', etaMinutes: 140 }],
  'D05': [{ trailerId: 'TR-307', shipmentId: 'SHP-2007', etaMinutes: 55 }, { trailerId: 'TR-308', shipmentId: 'SHP-2008', etaMinutes: 115 }],
  'D07': [{ trailerId: 'TR-309', shipmentId: 'SHP-2009', etaMinutes: 95 }],
  'D09': [{ trailerId: 'TR-310', shipmentId: 'SHP-2010', etaMinutes: 100 }],
  'D13': [{ trailerId: 'TR-311', shipmentId: 'SHP-2011', etaMinutes: 145 }],
  'D15': [{ trailerId: 'TR-312', shipmentId: 'SHP-2012', etaMinutes: 200 }],
};

const INITIAL_TRAILERS: Trailer[] = [
  // ═══ AT_DOCK — Currently unloading at bays ═══
  { id: 'TR-101', licensePlate: 'IL-9812-TX', carrierId: 'car-101', carrierName: 'BlueLine Logistics', trailerType: 'DRY_VAN', status: 'AT_DOCK', assignedDockId: 'D01', shipmentId: 'SHP-1001', arrivedAt: new Date(Date.now() - 35 * 60000).toISOString(), dwellMinutes: 35, currentLat: 41.7516, currentLng: -88.1500, destinationLat: 41.7516, destinationLng: -88.1500, headingDeg: 90, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'HIGH_DEMAND', unloadingDurationMinutes: 50, unloadingElapsedMinutes: 35 },
  { id: 'TR-102', licensePlate: 'OH-4412-FL', carrierId: 'car-102', carrierName: 'SwiftHaul Freight', trailerType: 'FLATBED', status: 'AT_DOCK', assignedDockId: 'D03', shipmentId: 'SHP-1002', arrivedAt: new Date(Date.now() - 45 * 60000).toISOString(), dwellMinutes: 45, currentLat: 41.7498, currentLng: -88.1500, destinationLat: 41.7498, destinationLng: -88.1500, headingDeg: 90, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', unloadingDurationMinutes: 60, unloadingElapsedMinutes: 45 },
  { id: 'TR-103', licensePlate: 'TX-1154-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'AT_DOCK', assignedDockId: 'D05', shipmentId: 'SHP-1003', arrivedAt: new Date(Date.now() - 20 * 60000).toISOString(), dwellMinutes: 20, currentLat: 41.7505, currentLng: -88.1510, destinationLat: 41.7505, destinationLng: -88.1510, headingDeg: 90, temperatureProfile: 'REFRIGERATED_CHILL', currentTempCelsius: 3.1, targetTempCelsius: 3.0, spoilageRiskScore: 72, productDemandLevel: 'HIGH_DEMAND', unloadingDurationMinutes: 35, unloadingElapsedMinutes: 20 },
  { id: 'TR-104', licensePlate: 'GA-2287-DV', carrierId: 'car-102', carrierName: 'SwiftHaul Freight', trailerType: 'DRY_VAN', status: 'AT_DOCK', assignedDockId: 'D09', shipmentId: 'SHP-1020', arrivedAt: new Date(Date.now() - 15 * 60000).toISOString(), dwellMinutes: 15, currentLat: 41.7520, currentLng: -88.1490, destinationLat: 41.7520, destinationLng: -88.1490, headingDeg: 90, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', unloadingDurationMinutes: 30, unloadingElapsedMinutes: 15 },

  // ═══ IN_YARD — Staged waiting for dock assignment ═══
  { id: 'TR-105', licensePlate: 'CA-7789-RF', carrierId: 'car-101', carrierName: 'BlueLine Logistics', trailerType: 'REFRIGERATED', status: 'IN_YARD', currentSlotId: 'A01', shipmentId: 'SHP-1005', arrivedAt: new Date(Date.now() - 45 * 60000).toISOString(), dwellMinutes: 45, inventoryUrgency: 80, etaVarianceMinutes: 5, currentLat: 41.7540, currentLng: -88.1545, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 0, temperatureProfile: 'REFRIGERATED_CHILL', currentTempCelsius: 3.2, targetTempCelsius: 4.0, spoilageRiskScore: 78, productDemandLevel: 'CRITICAL_SURGE', targetDockId: 'D03', targetDockEtaMinutes: 15 },
  { id: 'TR-106', licensePlate: 'CA-9921-RF', carrierId: 'car-101', carrierName: 'BlueLine Logistics', trailerType: 'REFRIGERATED', status: 'IN_YARD', currentSlotId: 'A42', shipmentId: 'SHP-1006', arrivedAt: new Date(Date.now() - 112 * 60000).toISOString(), dwellMinutes: 112, inventoryUrgency: 100, etaVarianceMinutes: 10, currentLat: 41.7532, currentLng: -88.1520, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 0, temperatureProfile: 'DEEP_FREEZE', currentTempCelsius: -19.4, targetTempCelsius: -20.0, spoilageRiskScore: 92, productDemandLevel: 'CRITICAL_SURGE', targetDockId: 'D01', targetDockEtaMinutes: 15 },
  { id: 'TR-108', licensePlate: 'TX-3311-DV', carrierId: 'car-103', carrierName: 'TransRoute Express', trailerType: 'DRY_VAN', status: 'IN_YARD', currentSlotId: 'A03', shipmentId: 'SHP-1004', arrivedAt: new Date(Date.now() - 20 * 60000).toISOString(), dwellMinutes: 20, inventoryUrgency: 20, etaVarianceMinutes: 0, currentLat: 41.7475, currentLng: -88.1545, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 180, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', targetDockId: 'D09', targetDockEtaMinutes: 20 },
  { id: 'TR-110', licensePlate: 'WA-5544-CC', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'IN_YARD', currentSlotId: 'B01', shipmentId: 'SHP-1004B', arrivedAt: new Date(Date.now() - 110 * 60000).toISOString(), dwellMinutes: 110, inventoryUrgency: 85, etaVarianceMinutes: 15, currentLat: 41.7482, currentLng: -88.1570, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 270, temperatureProfile: 'REFRIGERATED_CHILL', currentTempCelsius: 4.1, targetTempCelsius: 3.0, spoilageRiskScore: 84, productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D07', targetDockEtaMinutes: 18 },
  { id: 'TR-112', licensePlate: 'NJ-9012-HZ', carrierId: 'car-103', carrierName: 'TransRoute Express', trailerType: 'HAZMAT', status: 'IN_YARD', currentSlotId: 'C01', shipmentId: 'SHP-1007', arrivedAt: new Date(Date.now() - 15 * 60000).toISOString(), dwellMinutes: 15, inventoryUrgency: 50, etaVarianceMinutes: 0, currentLat: 41.7538, currentLng: -88.1575, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 315, temperatureProfile: 'HAZMAT', productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D15', targetDockEtaMinutes: 25 },
  { id: 'TR-113', licensePlate: 'MO-6612-RF', carrierId: 'car-101', carrierName: 'BlueLine Logistics', trailerType: 'REFRIGERATED', status: 'IN_YARD', currentSlotId: 'A04', shipmentId: 'SHP-1021', arrivedAt: new Date(Date.now() - 30 * 60000).toISOString(), dwellMinutes: 30, inventoryUrgency: 75, etaVarianceMinutes: 5, currentLat: 41.7548, currentLng: -88.1548, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 0, temperatureProfile: 'DEEP_FREEZE', currentTempCelsius: -20.5, targetTempCelsius: -20.0, spoilageRiskScore: 80, productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D02', targetDockEtaMinutes: 30 },
  { id: 'TR-114', licensePlate: 'KY-5521-DV', carrierId: 'car-102', carrierName: 'SwiftHaul Freight', trailerType: 'DRY_VAN', status: 'IN_YARD', currentSlotId: 'B03', shipmentId: 'SHP-1022', arrivedAt: new Date(Date.now() - 55 * 60000).toISOString(), dwellMinutes: 55, inventoryUrgency: 35, etaVarianceMinutes: 0, currentLat: 41.7465, currentLng: -88.1578, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 90, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', targetDockId: 'D10', targetDockEtaMinutes: 10 },

  // ═══ EN_ROUTE — Horizon 1 (<60m ETA) ═══
  { id: 'TR-202', licensePlate: 'IN-7744-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1009', dwellMinutes: 0, inventoryUrgency: 100, etaVarianceMinutes: 15, currentLat: 41.5200, currentLng: -87.8500, destinationLat: 41.7498, destinationLng: -88.1500, headingDeg: 315, temperatureProfile: 'DEEP_FREEZE', currentTempCelsius: -20.1, targetTempCelsius: -20.0, spoilageRiskScore: 88, productDemandLevel: 'CRITICAL_SURGE', targetDockId: 'D02', targetDockEtaMinutes: 25 },
  { id: 'TR-204', licensePlate: 'WI-1188-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1011', dwellMinutes: 0, inventoryUrgency: 90, etaVarianceMinutes: 5, currentLat: 42.4500, currentLng: -87.9500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 180, temperatureProfile: 'DEEP_FREEZE', currentTempCelsius: -18.2, targetTempCelsius: -18.0, spoilageRiskScore: 75, productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D05', targetDockEtaMinutes: 40 },
  { id: 'TR-205', licensePlate: 'IL-3399-RF', carrierId: 'car-101', carrierName: 'BlueLine Logistics', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1012', dwellMinutes: 0, inventoryUrgency: 85, etaVarianceMinutes: 0, currentLat: 41.9500, currentLng: -87.7500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 240, temperatureProfile: 'REFRIGERATED_CHILL', currentTempCelsius: 2.8, targetTempCelsius: 3.0, spoilageRiskScore: 82, productDemandLevel: 'CRITICAL_SURGE', targetDockId: 'D07', targetDockEtaMinutes: 50 },
  { id: 'TR-213', licensePlate: 'IL-7722-DV', carrierId: 'car-103', carrierName: 'TransRoute Express', trailerType: 'DRY_VAN', status: 'EN_ROUTE', shipmentId: 'SHP-1023', dwellMinutes: 0, inventoryUrgency: 40, etaVarianceMinutes: 0, currentLat: 41.7200, currentLng: -88.5500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 90, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', targetDockId: 'D10', targetDockEtaMinutes: 35 },
  { id: 'TR-214', licensePlate: 'IN-8803-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1024', dwellMinutes: 0, inventoryUrgency: 92, etaVarianceMinutes: 5, currentLat: 41.6100, currentLng: -87.5500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 315, temperatureProfile: 'DEEP_FREEZE', currentTempCelsius: -19.8, targetTempCelsius: -20.0, spoilageRiskScore: 86, productDemandLevel: 'CRITICAL_SURGE', targetDockId: 'D04', targetDockEtaMinutes: 45 },
  { id: 'TR-215', licensePlate: 'WI-4411-RF', carrierId: 'car-101', carrierName: 'BlueLine Logistics', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1025', dwellMinutes: 0, inventoryUrgency: 78, etaVarianceMinutes: 3, currentLat: 42.5800, currentLng: -88.1000, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 180, temperatureProfile: 'REFRIGERATED_CHILL', currentTempCelsius: 2.5, targetTempCelsius: 3.0, spoilageRiskScore: 70, productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D08', targetDockEtaMinutes: 55 },

  // ═══ EN_ROUTE — Horizon 2 (60–120m) ═══
  { id: 'TR-201', licensePlate: 'MN-3310-DV', carrierId: 'car-103', carrierName: 'TransRoute Express', trailerType: 'DRY_VAN', status: 'EN_ROUTE', shipmentId: 'SHP-1008', dwellMinutes: 0, inventoryUrgency: 20, etaVarianceMinutes: 0, currentLat: 42.8500, currentLng: -88.0100, destinationLat: 41.7516, destinationLng: -88.1500, headingDeg: 180, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', targetDockId: 'D09', targetDockEtaMinutes: 75 },
  { id: 'TR-206', licensePlate: 'MI-6622-RF', carrierId: 'car-103', carrierName: 'TransRoute Express', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1013', dwellMinutes: 0, inventoryUrgency: 70, etaVarianceMinutes: 5, currentLat: 42.1500, currentLng: -86.4500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 270, temperatureProfile: 'REFRIGERATED_CHILL', currentTempCelsius: 3.5, targetTempCelsius: 4.0, spoilageRiskScore: 65, productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D07', targetDockEtaMinutes: 90 },
  { id: 'TR-207', licensePlate: 'IN-4455-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1014', dwellMinutes: 0, inventoryUrgency: 75, etaVarianceMinutes: 0, currentLat: 40.5500, currentLng: -86.8500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 330, temperatureProfile: 'DEEP_FREEZE', currentTempCelsius: -21.5, targetTempCelsius: -22.0, spoilageRiskScore: 70, productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D02', targetDockEtaMinutes: 110 },
  { id: 'TR-216', licensePlate: 'KS-3344-DV', carrierId: 'car-102', carrierName: 'SwiftHaul Freight', trailerType: 'DRY_VAN', status: 'EN_ROUTE', shipmentId: 'SHP-1026', dwellMinutes: 0, inventoryUrgency: 25, etaVarianceMinutes: 0, currentLat: 39.8200, currentLng: -90.2200, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 45, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', targetDockId: 'D11', targetDockEtaMinutes: 80 },
  { id: 'TR-217', licensePlate: 'IA-5566-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1027', dwellMinutes: 0, inventoryUrgency: 68, etaVarianceMinutes: 8, currentLat: 41.8000, currentLng: -90.7000, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 90, temperatureProfile: 'REFRIGERATED_CHILL', currentTempCelsius: 3.8, targetTempCelsius: 4.0, spoilageRiskScore: 60, productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D08', targetDockEtaMinutes: 95 },
  { id: 'TR-218', licensePlate: 'MO-9977-DV', carrierId: 'car-103', carrierName: 'TransRoute Express', trailerType: 'DRY_VAN', status: 'EN_ROUTE', shipmentId: 'SHP-1028', dwellMinutes: 0, inventoryUrgency: 30, etaVarianceMinutes: 0, currentLat: 38.6500, currentLng: -90.4200, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 10, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', targetDockId: 'D12', targetDockEtaMinutes: 115 },
  { id: 'TR-219', licensePlate: 'MI-2211-FB', carrierId: 'car-102', carrierName: 'SwiftHaul Freight', trailerType: 'FLATBED', status: 'EN_ROUTE', shipmentId: 'SHP-1029', dwellMinutes: 0, inventoryUrgency: 50, etaVarianceMinutes: 5, currentLat: 43.0000, currentLng: -85.8800, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 230, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D14', targetDockEtaMinutes: 100 },

  // ═══ EN_ROUTE — Horizon 3 (120–180m) ═══
  { id: 'TR-203', licensePlate: 'MI-5512-FB', carrierId: 'car-102', carrierName: 'SwiftHaul Freight', trailerType: 'FLATBED', status: 'EN_ROUTE', shipmentId: 'SHP-1010', dwellMinutes: 0, inventoryUrgency: 50, etaVarianceMinutes: 5, currentLat: 42.3314, currentLng: -83.0460, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 270, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D13', targetDockEtaMinutes: 135 },
  { id: 'TR-208', licensePlate: 'OH-8822-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1015', dwellMinutes: 0, inventoryUrgency: 65, etaVarianceMinutes: 0, currentLat: 41.4500, currentLng: -84.5500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 270, temperatureProfile: 'REFRIGERATED_CHILL', currentTempCelsius: 2.1, targetTempCelsius: 2.0, spoilageRiskScore: 58, productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D08', targetDockEtaMinutes: 155 },
  { id: 'TR-209', licensePlate: 'IL-9911-DV', carrierId: 'car-101', carrierName: 'BlueLine Logistics', trailerType: 'DRY_VAN', status: 'EN_ROUTE', shipmentId: 'SHP-1016', dwellMinutes: 0, inventoryUrgency: 40, etaVarianceMinutes: 0, currentLat: 40.7500, currentLng: -89.6500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 45, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', targetDockId: 'D10', targetDockEtaMinutes: 170 },
  { id: 'TR-220', licensePlate: 'TN-6633-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1030', dwellMinutes: 0, inventoryUrgency: 72, etaVarianceMinutes: 10, currentLat: 36.1700, currentLng: -86.8100, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 350, temperatureProfile: 'REFRIGERATED_CHILL', currentTempCelsius: 3.3, targetTempCelsius: 3.0, spoilageRiskScore: 62, productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D07', targetDockEtaMinutes: 145 },
  { id: 'TR-221', licensePlate: 'NE-4488-DV', carrierId: 'car-103', carrierName: 'TransRoute Express', trailerType: 'DRY_VAN', status: 'EN_ROUTE', shipmentId: 'SHP-1031', dwellMinutes: 0, inventoryUrgency: 22, etaVarianceMinutes: 0, currentLat: 41.2500, currentLng: -96.2200, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 90, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', targetDockId: 'D11', targetDockEtaMinutes: 160 },
  { id: 'TR-222', licensePlate: 'OH-3319-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1032', dwellMinutes: 0, inventoryUrgency: 88, etaVarianceMinutes: 5, currentLat: 40.8300, currentLng: -81.5500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 280, temperatureProfile: 'DEEP_FREEZE', currentTempCelsius: -19.9, targetTempCelsius: -20.0, spoilageRiskScore: 82, productDemandLevel: 'CRITICAL_SURGE', targetDockId: 'D04', targetDockEtaMinutes: 175 },
  { id: 'TR-223', licensePlate: 'PA-8811-HZ', carrierId: 'car-103', carrierName: 'TransRoute Express', trailerType: 'HAZMAT', status: 'EN_ROUTE', shipmentId: 'SHP-1033', dwellMinutes: 0, inventoryUrgency: 55, etaVarianceMinutes: 5, currentLat: 41.9500, currentLng: -79.0500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 270, temperatureProfile: 'HAZMAT', productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D15', targetDockEtaMinutes: 130 },

  // ═══ EN_ROUTE — Horizon 4 (180–240m+) ═══
  { id: 'TR-210', licensePlate: 'OH-7733-HZ', carrierId: 'car-103', carrierName: 'TransRoute Express', trailerType: 'HAZMAT', status: 'EN_ROUTE', shipmentId: 'SHP-1017', dwellMinutes: 0, inventoryUrgency: 60, etaVarianceMinutes: 0, currentLat: 40.0500, currentLng: -83.0500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 300, temperatureProfile: 'HAZMAT', productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D15', targetDockEtaMinutes: 195 },
  { id: 'TR-211', licensePlate: 'CA-1100-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1018', dwellMinutes: 0, inventoryUrgency: 100, etaVarianceMinutes: 10, currentLat: 41.6500, currentLng: -91.5500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 90, temperatureProfile: 'DEEP_FREEZE', currentTempCelsius: -20.2, targetTempCelsius: -20.0, spoilageRiskScore: 95, productDemandLevel: 'CRITICAL_SURGE', targetDockId: 'D04', targetDockEtaMinutes: 210 },
  { id: 'TR-212', licensePlate: 'PA-2244-DV', carrierId: 'car-102', carrierName: 'SwiftHaul Freight', trailerType: 'DRY_VAN', status: 'EN_ROUTE', shipmentId: 'SHP-1019', dwellMinutes: 0, inventoryUrgency: 30, etaVarianceMinutes: 0, currentLat: 41.2500, currentLng: -80.8500, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 270, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', targetDockId: 'D11', targetDockEtaMinutes: 230 },
  { id: 'TR-224', licensePlate: 'TX-9944-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1034', dwellMinutes: 0, inventoryUrgency: 88, etaVarianceMinutes: 15, currentLat: 35.2271, currentLng: -101.8313, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 20, temperatureProfile: 'DEEP_FREEZE', currentTempCelsius: -20.0, targetTempCelsius: -20.0, spoilageRiskScore: 90, productDemandLevel: 'CRITICAL_SURGE', targetDockId: 'D01', targetDockEtaMinutes: 245 },
  { id: 'TR-225', licensePlate: 'CO-5577-DV', carrierId: 'car-101', carrierName: 'BlueLine Logistics', trailerType: 'DRY_VAN', status: 'EN_ROUTE', shipmentId: 'SHP-1035', dwellMinutes: 0, inventoryUrgency: 18, etaVarianceMinutes: 0, currentLat: 39.7392, currentLng: -104.9903, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 60, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', targetDockId: 'D12', targetDockEtaMinutes: 260 },
  { id: 'TR-226', licensePlate: 'AZ-3355-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1036', dwellMinutes: 0, inventoryUrgency: 76, etaVarianceMinutes: 8, currentLat: 33.4484, currentLng: -112.0740, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 50, temperatureProfile: 'REFRIGERATED_CHILL', currentTempCelsius: 3.0, targetTempCelsius: 3.0, spoilageRiskScore: 55, productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D07', targetDockEtaMinutes: 280 },
  { id: 'TR-227', licensePlate: 'GA-7788-FB', carrierId: 'car-102', carrierName: 'SwiftHaul Freight', trailerType: 'FLATBED', status: 'EN_ROUTE', shipmentId: 'SHP-1037', dwellMinutes: 0, inventoryUrgency: 45, etaVarianceMinutes: 10, currentLat: 33.7490, currentLng: -84.3880, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 330, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'HIGH_DEMAND', targetDockId: 'D13', targetDockEtaMinutes: 235 },
  { id: 'TR-228', licensePlate: 'FL-2299-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1038', dwellMinutes: 0, inventoryUrgency: 82, etaVarianceMinutes: 20, currentLat: 25.7617, currentLng: -80.1918, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 340, temperatureProfile: 'DEEP_FREEZE', currentTempCelsius: -21.0, targetTempCelsius: -20.0, spoilageRiskScore: 78, productDemandLevel: 'CRITICAL_SURGE', targetDockId: 'D03', targetDockEtaMinutes: 290 },
  { id: 'TR-229', licensePlate: 'OR-4466-DV', carrierId: 'car-103', carrierName: 'TransRoute Express', trailerType: 'DRY_VAN', status: 'EN_ROUTE', shipmentId: 'SHP-1039', dwellMinutes: 0, inventoryUrgency: 28, etaVarianceMinutes: 0, currentLat: 45.5051, currentLng: -122.6750, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 110, temperatureProfile: 'DRY_STANDARD', productDemandLevel: 'STANDARD', targetDockId: 'D11', targetDockEtaMinutes: 320 },
  { id: 'TR-230', licensePlate: 'WA-8810-RF', carrierId: 'car-104', carrierName: 'Prime ColdChain Inc', trailerType: 'REFRIGERATED', status: 'EN_ROUTE', shipmentId: 'SHP-1040', dwellMinutes: 0, inventoryUrgency: 91, etaVarianceMinutes: 12, currentLat: 47.6062, currentLng: -122.3321, destinationLat: 41.7508, destinationLng: -88.1535, headingDeg: 120, temperatureProfile: 'DEEP_FREEZE', currentTempCelsius: -20.4, targetTempCelsius: -20.0, spoilageRiskScore: 93, productDemandLevel: 'CRITICAL_SURGE', targetDockId: 'D02', targetDockEtaMinutes: 335 },
];

// Seed Shipments (25+ Enterprise Shipments)
const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'SHP-1001',
    trackingNumber: 'TRK-100192',
    carrierId: 'car-101',
    carrierName: 'BlueLine Logistics',
    supplier: 'Global Electronics Corp',
    origin: 'Chicago Distribution Center, IL',
    destination: 'Main Facility - Bay A',
    priority: 'HIGH',
    loadType: 'DRY_VAN',
    status: 'PROCESSING',
    risk: 'NORMAL',
    eta: '2026-08-13T14:15:00Z',
    scheduledAppointment: '2026-08-13T14:30:00Z',
    trailerId: 'TR-101',
    currentDockId: 'D01',
    itemsSummary: '42 Pallets Consumer Electronics & Displays',
    totalWeightKg: 14500,
    temperatureProfile: 'DRY_STANDARD',
    productDemandLevel: 'HIGH_DEMAND',
    estimatedUnloadMinutes: 50,
  },
  {
    id: 'SHP-1002',
    trackingNumber: 'TRK-200481',
    carrierId: 'car-102',
    carrierName: 'SwiftHaul Freight',
    supplier: 'Industrial Machinery Corp',
    origin: 'Columbus Plant, OH',
    destination: 'Main Facility - Bay A',
    priority: 'STANDARD',
    loadType: 'FLATBED',
    status: 'PROCESSING',
    risk: 'NORMAL',
    eta: '2026-08-13T14:45:00Z',
    scheduledAppointment: '2026-08-13T15:00:00Z',
    trailerId: 'TR-102',
    currentDockId: 'D03',
    itemsSummary: '6 Heavy Conveyor Frame Assemblies',
    totalWeightKg: 22800,
    temperatureProfile: 'DRY_STANDARD',
    productDemandLevel: 'STANDARD',
    estimatedUnloadMinutes: 60,
  },
  {
    id: 'SHP-1006',
    trackingNumber: 'TRK-992106',
    carrierId: 'car-101',
    carrierName: 'BlueLine Logistics',
    supplier: 'Apex Retail Supplier (Pharma & Cold Goods)',
    origin: 'Sacramento Logistics Hub, CA',
    destination: 'Main Facility - Bay A',
    priority: 'CRITICAL',
    loadType: 'REFRIGERATED',
    status: 'IN_YARD',
    risk: 'WARNING',
    eta: '2026-08-13T15:15:00Z',
    scheduledAppointment: '2026-08-13T15:30:00Z',
    trailerId: 'TR-106',
    currentYardSlotId: 'A42',
    itemsSummary: '24 Pallets Critical Perishable / Frozen Goods (-20°C Required)',
    totalWeightKg: 12400,
    temperatureProfile: 'DEEP_FREEZE',
    targetTemperatureRange: '-22°C to -18°C',
    currentTempCelsius: -19.4,
    spoilageRiskScore: 92,
    productDemandLevel: 'CRITICAL_SURGE',
    estimatedUnloadMinutes: 45,
  },
  {
    id: 'SHP-1005',
    trackingNumber: 'TRK-984210',
    carrierId: 'car-101',
    carrierName: 'BlueLine Logistics',
    supplier: 'Apex Retail Supplier (Pharma & Cold Goods)',
    origin: 'Sacramento Logistics Hub, CA',
    destination: 'Main Facility - Bay A',
    priority: 'HIGH',
    loadType: 'REFRIGERATED',
    status: 'IN_YARD',
    risk: 'NORMAL',
    eta: '2026-08-13T15:15:00Z',
    scheduledAppointment: '2026-08-13T15:30:00Z',
    trailerId: 'TR-105',
    currentYardSlotId: 'A01',
    itemsSummary: '28 Temperature-Controlled Pharma & Dairy Pallets (2-8°C Required)',
    totalWeightKg: 11200,
    temperatureProfile: 'REFRIGERATED_CHILL',
    targetTemperatureRange: '2°C to 4°C',
    currentTempCelsius: 3.2,
    spoilageRiskScore: 78,
    productDemandLevel: 'CRITICAL_SURGE',
    estimatedUnloadMinutes: 40,
  },
  {
    id: 'SHP-1003',
    trackingNumber: 'TRK-300912',
    carrierId: 'car-103',
    carrierName: 'TransRoute Express',
    supplier: 'Midwest Consumer Goods',
    origin: 'St. Louis Hub, MO',
    destination: 'Main Facility - Bay A',
    priority: 'STANDARD',
    loadType: 'DRY_VAN',
    status: 'IN_YARD',
    risk: 'NORMAL',
    eta: '2026-08-13T15:35:00Z',
    scheduledAppointment: '2026-08-13T16:00:00Z',
    trailerId: 'TR-108',
    currentYardSlotId: 'A03',
    itemsSummary: '50 Pallets Paper & Packaging Materials',
    totalWeightKg: 13400,
    temperatureProfile: 'DRY_STANDARD',
    productDemandLevel: 'STANDARD',
    estimatedUnloadMinutes: 35,
  },
  {
    id: 'SHP-1004',
    trackingNumber: 'TRK-400118',
    carrierId: 'car-104',
    carrierName: 'Prime ColdChain Inc',
    supplier: 'Fresh Produce Wholesale',
    origin: 'Yakima Valley Depot, WA',
    destination: 'Main Facility - Bay A',
    priority: 'HIGH',
    loadType: 'REFRIGERATED',
    status: 'IN_YARD',
    risk: 'DELAYED',
    eta: '2026-08-13T14:00:00Z',
    scheduledAppointment: '2026-08-13T13:30:00Z',
    trailerId: 'TR-110',
    currentYardSlotId: 'B01',
    itemsSummary: '32 Pallets Fresh Organics',
    totalWeightKg: 16800,
    activeExceptionId: 'EX-101',
    temperatureProfile: 'REFRIGERATED_CHILL',
    targetTemperatureRange: '2°C to 4°C',
    currentTempCelsius: 4.1,
    spoilageRiskScore: 84,
    productDemandLevel: 'HIGH_DEMAND',
    estimatedUnloadMinutes: 45,
  },
  {
    id: 'SHP-1007',
    trackingNumber: 'TRK-600774',
    carrierId: 'car-103',
    carrierName: 'TransRoute Express',
    supplier: 'ChemTech Specialties',
    origin: 'Edison Logistics Depot, NJ',
    destination: 'Main Facility - Bay A',
    priority: 'HIGH',
    loadType: 'HAZMAT',
    status: 'IN_YARD',
    risk: 'NORMAL',
    eta: '2026-08-13T15:45:00Z',
    scheduledAppointment: '2026-08-13T16:30:00Z',
    trailerId: 'TR-112',
    currentYardSlotId: 'C01',
    itemsSummary: '16 Drums Industrial Cleaning Solvents (Class 3 Flammable)',
    totalWeightKg: 8900,
    temperatureProfile: 'HAZMAT',
    productDemandLevel: 'HIGH_DEMAND',
    estimatedUnloadMinutes: 50,
  },

  // --- 1H Horizon En-Route (< 60m)
  {
    id: 'SHP-1009',
    trackingNumber: 'TRK-810952',
    carrierId: 'car-104',
    carrierName: 'Prime ColdChain Inc',
    supplier: 'Apex Retail Supplier (Pharma & Cold Goods)',
    origin: 'Indianapolis Cold Hub, IN',
    destination: 'Main Facility - Bay A',
    priority: 'CRITICAL',
    loadType: 'REFRIGERATED',
    status: 'IN_TRANSIT',
    risk: 'WARNING',
    eta: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    scheduledAppointment: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    trailerId: 'TR-202',
    itemsSummary: '20 Pallets Frozen Pharmaceuticals (-20°C Required)',
    totalWeightKg: 9800,
    temperatureProfile: 'DEEP_FREEZE',
    targetTemperatureRange: '-22°C to -18°C',
    currentTempCelsius: -20.1,
    spoilageRiskScore: 88,
    productDemandLevel: 'CRITICAL_SURGE',
    estimatedUnloadMinutes: 45,
  },
  {
    id: 'SHP-1011',
    trackingNumber: 'TRK-882201',
    carrierId: 'car-104',
    carrierName: 'Prime ColdChain Inc',
    supplier: 'Northwoods Dairy & Frozen',
    origin: 'Milwaukee Cold Hub, WI',
    destination: 'Main Facility - Bay A',
    priority: 'HIGH',
    loadType: 'REFRIGERATED',
    status: 'IN_TRANSIT',
    risk: 'NORMAL',
    eta: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
    scheduledAppointment: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    trailerId: 'TR-204',
    itemsSummary: '30 Pallets Premium Frozen Dairy & Ice Cream',
    totalWeightKg: 13500,
    temperatureProfile: 'DEEP_FREEZE',
    targetTemperatureRange: '-20°C to -18°C',
    currentTempCelsius: -18.2,
    spoilageRiskScore: 75,
    productDemandLevel: 'HIGH_DEMAND',
    estimatedUnloadMinutes: 40,
  },
  {
    id: 'SHP-1012',
    trackingNumber: 'TRK-883302',
    carrierId: 'car-101',
    carrierName: 'BlueLine Logistics',
    supplier: 'Heartland Organic Dairies',
    origin: 'Rockford Processing Plant, IL',
    destination: 'Main Facility - Bay A',
    priority: 'CRITICAL',
    loadType: 'REFRIGERATED',
    status: 'IN_TRANSIT',
    risk: 'NORMAL',
    eta: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
    scheduledAppointment: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    trailerId: 'TR-205',
    itemsSummary: '36 Pallets Grade-A Fresh Organic Milk',
    totalWeightKg: 15200,
    temperatureProfile: 'REFRIGERATED_CHILL',
    targetTemperatureRange: '2°C to 4°C',
    currentTempCelsius: 2.8,
    spoilageRiskScore: 82,
    productDemandLevel: 'CRITICAL_SURGE',
    estimatedUnloadMinutes: 35,
  },

  // --- 2H Horizon En-Route (60m - 120m)
  {
    id: 'SHP-1008',
    trackingNumber: 'TRK-700341',
    carrierId: 'car-103',
    carrierName: 'TransRoute Express',
    supplier: 'Midwest Consumer Goods',
    origin: 'Minneapolis Distribution Center, MN',
    destination: 'Main Facility - Bay A',
    priority: 'STANDARD',
    loadType: 'DRY_VAN',
    status: 'IN_TRANSIT',
    risk: 'NORMAL',
    eta: new Date(Date.now() + 75 * 60 * 1000).toISOString(),
    scheduledAppointment: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    trailerId: 'TR-201',
    itemsSummary: '48 Pallets Consumer Packaged Goods',
    totalWeightKg: 18200,
    temperatureProfile: 'DRY_STANDARD',
    productDemandLevel: 'STANDARD',
    estimatedUnloadMinutes: 30,
  },
  {
    id: 'SHP-1013',
    trackingNumber: 'TRK-994403',
    carrierId: 'car-103',
    carrierName: 'TransRoute Express',
    supplier: 'Michigan Fresh Orchards',
    origin: 'Benton Harbor Depot, MI',
    destination: 'Main Facility - Bay A',
    priority: 'HIGH',
    loadType: 'REFRIGERATED',
    status: 'IN_TRANSIT',
    risk: 'NORMAL',
    eta: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    scheduledAppointment: new Date(Date.now() + 105 * 60 * 1000).toISOString(),
    trailerId: 'TR-206',
    itemsSummary: '26 Pallets Chilled Fresh Berries & Cherries',
    totalWeightKg: 10400,
    temperatureProfile: 'REFRIGERATED_CHILL',
    targetTemperatureRange: '2°C to 4°C',
    currentTempCelsius: 3.5,
    spoilageRiskScore: 65,
    productDemandLevel: 'HIGH_DEMAND',
    estimatedUnloadMinutes: 35,
  },
  {
    id: 'SHP-1014',
    trackingNumber: 'TRK-995504',
    carrierId: 'car-104',
    carrierName: 'Prime ColdChain Inc',
    supplier: 'Great Lakes Seafood Hub',
    origin: 'Gary Cold Terminal, IN',
    destination: 'Main Facility - Bay A',
    priority: 'HIGH',
    loadType: 'REFRIGERATED',
    status: 'IN_TRANSIT',
    risk: 'NORMAL',
    eta: new Date(Date.now() + 110 * 60 * 1000).toISOString(),
    scheduledAppointment: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
    trailerId: 'TR-207',
    itemsSummary: '22 Pallets Deep Freeze Atlantic Salmon & Halibut',
    totalWeightKg: 11800,
    temperatureProfile: 'DEEP_FREEZE',
    targetTemperatureRange: '-22°C to -18°C',
    currentTempCelsius: -21.5,
    spoilageRiskScore: 70,
    productDemandLevel: 'HIGH_DEMAND',
    estimatedUnloadMinutes: 45,
  },

  // --- 3H Horizon En-Route (120m - 180m)
  {
    id: 'SHP-1010',
    trackingNumber: 'TRK-920115',
    carrierId: 'car-102',
    carrierName: 'SwiftHaul Freight',
    supplier: 'Industrial Machinery Corp',
    origin: 'Detroit Plant, MI',
    destination: 'Main Facility - Bay A',
    priority: 'HIGH',
    loadType: 'FLATBED',
    status: 'IN_TRANSIT',
    risk: 'NORMAL',
    eta: new Date(Date.now() + 135 * 60 * 1000).toISOString(),
    scheduledAppointment: new Date(Date.now() + 145 * 60 * 1000).toISOString(),
    trailerId: 'TR-203',
    itemsSummary: '4 Heavy Press Machine Frames',
    totalWeightKg: 31000,
    temperatureProfile: 'DRY_STANDARD',
    productDemandLevel: 'HIGH_DEMAND',
    estimatedUnloadMinutes: 65,
  },
  {
    id: 'SHP-1015',
    trackingNumber: 'TRK-996605',
    carrierId: 'car-104',
    carrierName: 'Prime ColdChain Inc',
    supplier: 'Midwest Cattle & Meat Packers',
    origin: 'Toledo Cold Staging, OH',
    destination: 'Main Facility - Bay A',
    priority: 'HIGH',
    loadType: 'REFRIGERATED',
    status: 'IN_TRANSIT',
    risk: 'NORMAL',
    eta: new Date(Date.now() + 155 * 60 * 1000).toISOString(),
    scheduledAppointment: new Date(Date.now() + 170 * 60 * 1000).toISOString(),
    trailerId: 'TR-208',
    itemsSummary: '28 Pallets Vacuum-Sealed Chilled Prime Beef',
    totalWeightKg: 14200,
    temperatureProfile: 'REFRIGERATED_CHILL',
    targetTemperatureRange: '1°C to 3°C',
    currentTempCelsius: 2.1,
    spoilageRiskScore: 58,
    productDemandLevel: 'HIGH_DEMAND',
    estimatedUnloadMinutes: 40,
  },
  {
    id: 'SHP-1016',
    trackingNumber: 'TRK-997706',
    carrierId: 'car-101',
    carrierName: 'BlueLine Logistics',
    supplier: 'Apex Electronics Logistics',
    origin: 'Peoria Regional Depot, IL',
    destination: 'Main Facility - Bay A',
    priority: 'STANDARD',
    loadType: 'DRY_VAN',
    status: 'IN_TRANSIT',
    risk: 'NORMAL',
    eta: new Date(Date.now() + 170 * 60 * 1000).toISOString(),
    scheduledAppointment: new Date(Date.now() + 180 * 60 * 1000).toISOString(),
    trailerId: 'TR-209',
    itemsSummary: '40 Pallets Consumer Smart Displays & Peripherals',
    totalWeightKg: 12600,
    temperatureProfile: 'DRY_STANDARD',
    productDemandLevel: 'STANDARD',
    estimatedUnloadMinutes: 30,
  },

  // --- 4H Horizon En-Route (180m - 240m)
  {
    id: 'SHP-1017',
    trackingNumber: 'TRK-998807',
    carrierId: 'car-103',
    carrierName: 'TransRoute Express',
    supplier: 'Buckeye Specialty Chemicals',
    origin: 'Columbus Chemical Hub, OH',
    destination: 'Main Facility - Bay A',
    priority: 'HIGH',
    loadType: 'HAZMAT',
    status: 'IN_TRANSIT',
    risk: 'NORMAL',
    eta: new Date(Date.now() + 195 * 60 * 1000).toISOString(),
    scheduledAppointment: new Date(Date.now() + 210 * 60 * 1000).toISOString(),
    trailerId: 'TR-210',
    itemsSummary: '18 Poly-Drums Class 3 Flammable Processing Agents',
    totalWeightKg: 10500,
    temperatureProfile: 'HAZMAT',
    productDemandLevel: 'HIGH_DEMAND',
    estimatedUnloadMinutes: 50,
  },
  {
    id: 'SHP-1018',
    trackingNumber: 'TRK-999908',
    carrierId: 'car-104',
    carrierName: 'Prime ColdChain Inc',
    supplier: 'BioGuard Pharmaceuticals Inc',
    origin: 'Cedar Rapids Cryo Hub, IA',
    destination: 'Main Facility - Bay A',
    priority: 'CRITICAL',
    loadType: 'REFRIGERATED',
    status: 'IN_TRANSIT',
    risk: 'WARNING',
    eta: new Date(Date.now() + 210 * 60 * 1000).toISOString(),
    scheduledAppointment: new Date(Date.now() + 225 * 60 * 1000).toISOString(),
    trailerId: 'TR-211',
    itemsSummary: '14 Cryo-Tanks Critical mRNA Vaccines & Reagents (-20°C)',
    totalWeightKg: 6200,
    temperatureProfile: 'DEEP_FREEZE',
    targetTemperatureRange: '-22°C to -18°C',
    currentTempCelsius: -20.2,
    spoilageRiskScore: 95,
    productDemandLevel: 'CRITICAL_SURGE',
    estimatedUnloadMinutes: 40,
  },
  {
    id: 'SHP-1019',
    trackingNumber: 'TRK-990009',
    carrierId: 'car-102',
    carrierName: 'SwiftHaul Freight',
    supplier: 'Allegheny Beverage & Dry Groceries',
    origin: 'Youngstown Logistics Terminal, PA',
    destination: 'Main Facility - Bay A',
    priority: 'STANDARD',
    loadType: 'DRY_VAN',
    status: 'IN_TRANSIT',
    risk: 'NORMAL',
    eta: new Date(Date.now() + 230 * 60 * 1000).toISOString(),
    scheduledAppointment: new Date(Date.now() + 240 * 60 * 1000).toISOString(),
    trailerId: 'TR-212',
    itemsSummary: '44 Pallets Canned Goods & Dry Beverages',
    totalWeightKg: 19800,
    temperatureProfile: 'DRY_STANDARD',
    productDemandLevel: 'STANDARD',
    estimatedUnloadMinutes: 35,
  },
];

// Seed Appointments
const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 'APT-1001', shipmentId: 'SHP-1001', trailerId: 'TR-101', carrierName: 'BlueLine Logistics', scheduledArrival: '2026-08-13T14:30:00Z', actualArrival: '2026-08-13T14:15:00Z', priority: 'HIGH', status: 'ON_TIME', deviationMinutes: -15 },
  { id: 'APT-1002', shipmentId: 'SHP-1002', trailerId: 'TR-102', carrierName: 'SwiftHaul Freight', scheduledArrival: '2026-08-13T15:00:00Z', actualArrival: '2026-08-13T14:50:00Z', priority: 'STANDARD', status: 'ON_TIME', deviationMinutes: -10 },
  { id: 'APT-1005', shipmentId: 'SHP-1005', trailerId: 'TR-105', carrierName: 'BlueLine Logistics', scheduledArrival: '2026-08-13T15:30:00Z', actualArrival: '2026-08-13T15:15:00Z', priority: 'CRITICAL', status: 'AT_RISK', deviationMinutes: -15 },
  { id: 'APT-1003', shipmentId: 'SHP-1003', trailerId: 'TR-108', carrierName: 'TransRoute Express', scheduledArrival: '2026-08-13T16:00:00Z', actualArrival: '2026-08-13T15:40:00Z', priority: 'STANDARD', status: 'ON_TIME', deviationMinutes: -20 },
  { id: 'APT-1004', shipmentId: 'SHP-1004', trailerId: 'TR-110', carrierName: 'Prime ColdChain Inc', scheduledArrival: '2026-08-13T13:30:00Z', actualArrival: '2026-08-13T14:00:00Z', priority: 'HIGH', status: 'DELAYED', deviationMinutes: 30 },
  { id: 'APT-1006', shipmentId: 'SHP-1006', trailerId: 'TR-112', carrierName: 'TransRoute Express', scheduledArrival: '2026-08-13T16:30:00Z', actualArrival: '2026-08-13T15:45:00Z', priority: 'HIGH', status: 'ON_TIME', deviationMinutes: -45 },
];

// Seed Exceptions
const INITIAL_EXCEPTIONS: Exception[] = [
  {
    id: 'EX-101',
    shipmentId: 'SHP-1004',
    trailerId: 'TR-110',
    type: 'LONG_WAITING',
    severity: 'HIGH',
    title: 'Excessive Yard Dwell Time (110 mins)',
    description: 'TR-110 (Refrigerated) has been parked in Zone B01 for 110 minutes awaiting cold-storage dock assignment.',
    detectedAt: '2026-08-13T15:30:00Z',
    status: 'ACTIVE',
    recommendedAction: 'Prioritize allocation to Dock D04 or D05 immediately to prevent thermal deviation.',
  },
];

// Seed Audit Logs
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'LOG-001', entityType: 'TRAILER', entityId: 'TR-105', action: 'YARD_CHECK_IN', actor: 'Kaviya (Operator)', details: 'Trailer TR-105 arrived at gate and checked into Yard Slot A01', timestamp: '2026-08-13T15:15:00Z' },
  { id: 'LOG-002', entityType: 'SHIPMENT', entityId: 'SHP-1001', action: 'DOCK_ASSIGNMENT', actor: 'Kaviya (Operator)', details: 'Assigned TR-101 / SHP-1001 to Dock D01', timestamp: '2026-08-13T14:30:00Z' },
  { id: 'LOG-003', entityType: 'SHIPMENT', entityId: 'SHP-1002', action: 'DOCK_ASSIGNMENT', actor: 'Kaviya (Operator)', details: 'Assigned TR-102 / SHP-1002 to Dock D03', timestamp: '2026-08-13T15:00:00Z' },
];

// Seed Tracking Events
const INITIAL_TRACKING_EVENTS: TrackingEvent[] = [
  { id: 'TRK-EVT-101', shipmentId: 'SHP-1005', timestamp: '2026-08-13T08:00:00Z', status: 'CREATED', location: 'Sacramento Logistics Hub', description: 'Shipment created & manifest generated', updatedBy: 'System' },
  { id: 'TRK-EVT-102', shipmentId: 'SHP-1005', timestamp: '2026-08-13T09:30:00Z', status: 'DISPATCHED', location: 'Sacramento Logistics Hub', description: 'Trailer TR-105 dispatched under BlueLine Logistics', updatedBy: 'Carrier Integration' },
  { id: 'TRK-EVT-103', shipmentId: 'SHP-1005', timestamp: '2026-08-13T14:45:00Z', status: 'IN_TRANSIT', location: 'Interstate 80 East, Mile 142', description: 'Approaching warehouse geo-fence', updatedBy: 'GPS Telematics' },
  { id: 'TRK-EVT-104', shipmentId: 'SHP-1005', timestamp: '2026-08-13T15:15:00Z', status: 'IN_YARD', location: 'Warehouse Yard Zone A, Slot A01', description: 'Checked in at security gate, parked at Slot A01', updatedBy: 'Kaviya (Operator)' },
];

// State container
class DataStore {
  private users: User[] = [];
  private carriers: Carrier[] = [];
  private docks: Dock[] = [];
  private yardSlots: YardSlot[] = [];
  private trailers: Trailer[] = [];
  private shipments: Shipment[] = [];
  private appointments: Appointment[] = [];
  private exceptions: Exception[] = [];
  private auditLogs: AuditLog[] = [];
  private trackingEvents: TrackingEvent[] = [];

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults() {
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.carriers = JSON.parse(JSON.stringify(INITIAL_CARRIERS));
    this.docks = JSON.parse(JSON.stringify(INITIAL_DOCKS));
    this.yardSlots = JSON.parse(JSON.stringify(INITIAL_YARD_SLOTS));
    this.trailers = JSON.parse(JSON.stringify(INITIAL_TRAILERS));
    this.shipments = JSON.parse(JSON.stringify(INITIAL_SHIPMENTS));
    this.appointments = JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS));
    this.exceptions = JSON.parse(JSON.stringify(INITIAL_EXCEPTIONS));
    this.auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
    this.trackingEvents = JSON.parse(JSON.stringify(INITIAL_TRACKING_EVENTS));
  }

  // Users
  public getUsers(): User[] { return this.users; }

  // Carriers
  public getCarriers(): Carrier[] { return this.carriers; }

  // Docks
  public getDocks(): Dock[] { return this.docks; }
  public getDockById(id: string): Dock | undefined { return this.docks.find(d => d.id === id); }
  public updateDockStatus(id: string, status: Dock['status'], notes?: string): Dock | undefined {
    const dock = this.getDockById(id);
    if (!dock) return undefined;
    
    const prevStatus = dock.status;
    dock.status = status;
    if (notes) dock.maintenanceNotes = notes;

    this.addAuditLog('DOCK', id, 'STATUS_UPDATE', 'System / Operator', `Dock ${id} status changed from ${prevStatus} to ${status}`);
    return dock;
  }

  // Yard Slots
  public getYardSlots(): YardSlot[] { return this.yardSlots; } // returns live ref — mutations are reflected immediately

  // Trailers
  public getTrailers(): Trailer[] { return this.trailers; } // returns live ref
  public getTrailerById(id: string): Trailer | undefined { return this.trailers.find(t => t.id === id); }

  // Future queue pool for dock rotation simulator (next-next trailer after next queued)
  public getFutureQueue(dockId: string, justAssignedTrailerId: string): { trailerId: string; shipmentId: string; etaMinutes: number } | undefined {
    const pool = FUTURE_QUEUE_POOL[dockId];
    if (!pool) return undefined;
    const idx = pool.findIndex(p => p.trailerId === justAssignedTrailerId);
    if (idx === -1) return pool[0];
    return pool[idx + 1];
  }

  // Update positions for EN_ROUTE trailers (called by positionSimulator tick)
  public updateTrailerPositions(updatedTrailers: Trailer[]) {
    for (const updated of updatedTrailers) {
      const t = this.trailers.find(x => x.id === updated.id);
      if (t) {
        t.currentLat = updated.currentLat;
        t.currentLng = updated.currentLng;
        t.headingDeg = updated.headingDeg;
      }
    }
  }

  // Get minimal position data for all trailers (for map initial load)
  public getTrailerPositions() {
    return this.trailers.map(t => {
      const shipment = this.shipments.find(s => s.trailerId === t.id);
      const hasActiveException = shipment?.activeExceptionId !== undefined ||
        this.exceptions.some(e => (e.trailerId === t.id) && e.status === 'ACTIVE');
      return {
        id: t.id,
        lat: t.currentLat,
        lng: t.currentLng,
        heading: t.headingDeg,
        status: t.status,
        trailerType: t.trailerType,
        shipmentId: t.shipmentId,
        carrierName: t.carrierName,
        priority: shipment?.priority,
        risk: shipment?.risk,
        eta: shipment?.eta,
        demurrageRisk: t.demurrageRisk,
        hasActiveException,
      };
    });
  }

  // Shipments
  public getShipments(): Shipment[] { return this.shipments; }
  public getShipmentById(id: string): Shipment | undefined { return this.shipments.find(s => s.id === id); }
  public getShipmentByTrackingNumber(num: string): Shipment | undefined {
    return this.shipments.find(s => s.trackingNumber.toLowerCase() === num.toLowerCase() || s.id.toLowerCase() === num.toLowerCase() || s.trailerId.toLowerCase() === num.toLowerCase());
  }

  // Appointments
  public getAppointments(): Appointment[] { return this.appointments; }

  // Smart Priority Queue
  public getSmartQueue(): SmartQueueItem[] {
    const yardTrailers = this.trailers.filter(t => t.status === 'IN_YARD');
    return yardTrailers.map(t => {
      const shp = this.shipments.find(s => s.id === t.shipmentId || s.trailerId === t.id);
      return priorityEngine.evaluateTrailerPriority(t, shp);
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // CRUD: Create New Inbound Shipment
  public createShipment(data: {
    carrierName: string;
    supplier: string;
    origin?: string;
    destination?: string;
    loadType: LoadType;
    priority: ShipmentPriority;
    scheduledAppointment?: string;
    itemsSummary: string;
    totalWeightKg: number;
    trailerId?: string;
    operatorName?: string;
  }): Shipment {
    const nextNum = 1011 + this.shipments.length;
    const shipmentId = `SHP-${nextNum}`;
    const trackingNumber = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
    const trailerId = data.trailerId || `TR-${300 + this.shipments.length}`;

    const newShipment: Shipment = {
      id: shipmentId,
      trackingNumber,
      carrierId: `car-${100 + (this.shipments.length % 5) + 1}`,
      carrierName: data.carrierName,
      supplier: data.supplier,
      origin: data.origin || 'Regional Distribution Depot',
      destination: data.destination || 'Main Facility - Bay A',
      priority: data.priority || 'STANDARD',
      loadType: data.loadType || 'DRY_VAN',
      status: 'IN_TRANSIT',
      risk: 'NORMAL',
      eta: data.scheduledAppointment || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      scheduledAppointment: data.scheduledAppointment || new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      trailerId,
      itemsSummary: data.itemsSummary,
      totalWeightKg: Number(data.totalWeightKg) || 12000,
    };

    this.shipments.unshift(newShipment);

    let trailer = this.getTrailerById(trailerId);
    if (!trailer) {
      trailer = {
        id: trailerId,
        licensePlate: `US-${Math.floor(1000 + Math.random() * 9000)}-TR`,
        carrierId: newShipment.carrierId,
        carrierName: newShipment.carrierName,
        trailerType: newShipment.loadType,
        status: 'EN_ROUTE',
        shipmentId: newShipment.id,
        currentLat: 42.1500,
        currentLng: -88.0000,
        destinationLat: 41.7508,
        destinationLng: -88.1535,
        headingDeg: 180,
      };
      this.trailers.push(trailer);
    }

    this.addTrackingEvent(newShipment.id, 'IN_TRANSIT', newShipment.origin, 'Shipment dispatched into inbound delivery network', data.operatorName || 'System / Operator');
    this.addAuditLog('SHIPMENT', newShipment.id, 'SHIPMENT_CREATED', data.operatorName || 'System / Operator', `Created inbound shipment ${newShipment.id} (${newShipment.trackingNumber}) via ${newShipment.carrierName}`);

    return newShipment;
  }

  // CRUD: Gate Check-In Arriving Trailer
  public checkInTrailer(data: {
    trailerId: string;
    carrierName: string;
    trailerType: LoadType;
    licensePlate?: string;
    targetSlotId?: string;
    operatorName?: string;
  }): { trailer: Trailer; slot: YardSlot } {
    let slot: YardSlot | undefined;
    if (data.targetSlotId) {
      slot = this.yardSlots.find(s => s.id === data.targetSlotId);
    }
    if (!slot) {
      slot = this.yardSlots.find(s => s.status === 'AVAILABLE');
    }
    if (!slot) {
      throw new Error('No available yard slot found for trailer staging');
    }

    slot.status = 'OCCUPIED';
    slot.occupiedByTrailerId = data.trailerId;
    slot.trailerType = data.trailerType;
    slot.sensorTrailerId = data.trailerId;
    slot.rtlsTrailerId = data.trailerId;
    slot.yardMuleTrailerId = data.trailerId;
    slot.locationValidationStatus = 'VERIFIED';

    let trailer = this.getTrailerById(data.trailerId);
    if (!trailer) {
      trailer = {
        id: data.trailerId,
        licensePlate: data.licensePlate || `US-${Math.floor(1000 + Math.random() * 9000)}-TR`,
        carrierId: 'car-101',
        carrierName: data.carrierName,
        trailerType: data.trailerType,
        status: 'IN_YARD',
        currentSlotId: slot.id,
        shipmentId: `SHP-${1010 + this.trailers.length}`,
        arrivedAt: new Date().toISOString(),
        dwellMinutes: 0,
      };
      this.trailers.push(trailer);
    } else {
      trailer.status = 'IN_YARD';
      trailer.currentSlotId = slot.id;
      trailer.arrivedAt = new Date().toISOString();
      trailer.dwellMinutes = 0;
    }

    this.addAuditLog('TRAILER', trailer.id, 'GATE_CHECKIN', data.operatorName || 'Gate Operator', `Trailer ${trailer.id} checked in at security gate and staged in Yard Slot ${slot.id}`);

    return { trailer, slot };
  }

  // CRUD: Move Trailer Yard Slot (Yard Mule Re-slotting)
  public moveTrailerYardSlot(trailerId: string, toSlotId: string, operatorName: string = 'Yard Mule Operator'): { trailer: Trailer; oldSlot?: YardSlot; newSlot: YardSlot } {
    const trailer = this.getTrailerById(trailerId);
    if (!trailer) throw new Error(`Trailer ${trailerId} not found`);

    const newSlot = this.yardSlots.find(s => s.id === toSlotId);
    if (!newSlot) throw new Error(`Destination yard slot ${toSlotId} not found`);
    if (newSlot.status === 'OCCUPIED' && newSlot.occupiedByTrailerId !== trailerId) {
      throw new Error(`Destination yard slot ${toSlotId} is already occupied by ${newSlot.occupiedByTrailerId}`);
    }

    let oldSlot: YardSlot | undefined;
    if (trailer.currentSlotId) {
      oldSlot = this.yardSlots.find(s => s.id === trailer.currentSlotId);
      if (oldSlot && oldSlot.id !== toSlotId) {
        oldSlot.status = 'AVAILABLE';
        oldSlot.occupiedByTrailerId = undefined;
        oldSlot.sensorTrailerId = undefined;
        oldSlot.rtlsTrailerId = undefined;
        oldSlot.yardMuleTrailerId = undefined;
        oldSlot.locationValidationStatus = 'UNVALIDATED';
      }
    }

    newSlot.status = 'OCCUPIED';
    newSlot.occupiedByTrailerId = trailer.id;
    newSlot.trailerType = trailer.trailerType;
    newSlot.sensorTrailerId = trailer.id;
    newSlot.rtlsTrailerId = trailer.id;
    newSlot.yardMuleTrailerId = trailer.id;
    newSlot.locationValidationStatus = 'VERIFIED';

    trailer.currentSlotId = newSlot.id;

    const shipment = this.shipments.find(s => s.trailerId === trailer.id || s.id === trailer.shipmentId);
    if (shipment) {
      shipment.currentYardSlotId = newSlot.id;
      this.addTrackingEvent(shipment.id, 'IN_YARD', `Yard Slot ${newSlot.id}`, `Trailer relocated to Yard Slot ${newSlot.id}`, operatorName);
    }

    this.addAuditLog('YARD_MULE', newSlot.id, 'TRAILER_RELOCATED', operatorName, `Yard Mule relocated Trailer ${trailer.id} from ${oldSlot ? oldSlot.id : 'Gate'} to Slot ${newSlot.id}`);

    return { trailer, oldSlot, newSlot };
  }

  // CRUD: Create or Update Dock Door
  public createOrUpdateDock(data: Partial<Dock> & { id: string; name?: string }): Dock {
    let dock = this.getDockById(data.id);
    if (!dock) {
      dock = {
        id: data.id,
        name: data.name || `Dock Door ${data.id}`,
        dockType: data.dockType || 'STANDARD',
        status: data.status || 'AVAILABLE',
        capabilities: data.capabilities || ['DRY_VAN'],
        maintenanceNotes: data.maintenanceNotes,
      };
      this.docks.push(dock);
      this.addAuditLog('DOCK', dock.id, 'DOCK_CREATED', 'Admin', `Created new dock door ${dock.id} (${dock.name})`);
    } else {
      if (data.name) dock.name = data.name;
      if (data.dockType) dock.dockType = data.dockType;
      if (data.status) dock.status = data.status;
      if (data.capabilities) dock.capabilities = data.capabilities;
      if (data.maintenanceNotes !== undefined) dock.maintenanceNotes = data.maintenanceNotes;
      this.addAuditLog('DOCK', dock.id, 'DOCK_UPDATED', 'Admin', `Updated dock door ${dock.id} configuration`);
    }
    return dock;
  }

  // Exceptions
  public getExceptions(): Exception[] { return this.exceptions; }
  public getExceptionById(id: string): Exception | undefined { return this.exceptions.find(e => e.id === id); }
  
  public createException(data: Omit<Exception, 'id' | 'detectedAt' | 'status'>): Exception {
    const newEx: Exception = {
      id: `EX-${Math.floor(100 + Math.random() * 900)}`,
      ...data,
      detectedAt: new Date().toISOString(),
      status: 'ACTIVE',
    };
    this.exceptions.unshift(newEx);
    
    // Link to shipment if applicable
    if (data.shipmentId) {
      const shp = this.getShipmentById(data.shipmentId);
      if (shp) {
        shp.activeExceptionId = newEx.id;
        shp.risk = data.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
      }
    }

    this.addAuditLog('EXCEPTION', newEx.id, 'EXCEPTION_CREATED', 'System Detector', `Created ${newEx.type} exception (${newEx.severity}): ${newEx.title}`);
    return newEx;
  }

  public resolveException(id: string, resolutionDetails: string): Exception | undefined {
    const ex = this.getExceptionById(id);
    if (!ex) return undefined;

    ex.status = 'RESOLVED';
    ex.resolutionDetails = resolutionDetails;

    if (ex.shipmentId) {
      const shp = this.getShipmentById(ex.shipmentId);
      if (shp && shp.activeExceptionId === id) {
        shp.activeExceptionId = undefined;
        shp.risk = 'NORMAL';
      }
    }

    this.addAuditLog('EXCEPTION', id, 'EXCEPTION_RESOLVED', 'Kaviya (Operator)', `Resolved exception ${id}: ${resolutionDetails}`);
    return ex;
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] { return this.auditLogs; }
  public addAuditLog(entityType: string, entityId: string, action: string, actor: string, details: string): AuditLog {
    const log: AuditLog = {
      id: `LOG-${Math.floor(100 + Math.random() * 900)}`,
      entityType,
      entityId,
      action,
      actor,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    return log;
  }

  // Tracking Events
  public getTrackingEvents(shipmentId: string): TrackingEvent[] {
    return this.trackingEvents.filter(t => t.shipmentId === shipmentId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public addTrackingEvent(shipmentId: string, status: ShipmentStatus, location: string, description: string, updatedBy: string = 'Operator'): TrackingEvent {
    const evt: TrackingEvent = {
      id: `TRK-EVT-${Math.floor(100 + Math.random() * 900)}`,
      shipmentId,
      timestamp: new Date().toISOString(),
      status,
      location,
      description,
      updatedBy,
    };
    this.trackingEvents.push(evt);
    return evt;
  }

  // Operations: Assign Dock
  public assignDock(shipmentId: string, trailerId: string, dockId: string, operatorName: string = 'Kaviya (Operator)'): { shipment: Shipment; dock: Dock; trailer: Trailer } {
    const shipment = this.getShipmentById(shipmentId);
    const trailer = this.getTrailerById(trailerId);
    const dock = this.getDockById(dockId);

    if (!shipment || !trailer || !dock) {
      throw new Error('Invalid shipment, trailer, or dock ID');
    }

    // Unassign old dock if any
    if (shipment.currentDockId) {
      const oldDock = this.getDockById(shipment.currentDockId);
      if (oldDock) {
        oldDock.status = 'AVAILABLE';
        oldDock.currentTrailerId = undefined;
        oldDock.currentShipmentId = undefined;
      }
    }

    // Update Dock
    dock.status = 'RESERVED';
    dock.currentTrailerId = trailer.id;
    dock.currentShipmentId = shipment.id;
    dock.assignedTime = new Date().toISOString();
    dock.estimatedCompletionTime = new Date(Date.now() + 45 * 60 * 1000).toISOString(); // +45 mins

    // Update Trailer
    trailer.assignedDockId = dock.id;
    trailer.status = 'AT_DOCK';
    if (trailer.currentSlotId) {
      const slot = this.yardSlots.find(s => s.id === trailer.currentSlotId);
      if (slot) {
        slot.status = 'AVAILABLE';
        slot.occupiedByTrailerId = undefined;
      }
      trailer.currentSlotId = undefined;
    }

    // Update Shipment
    shipment.currentDockId = dock.id;
    shipment.currentYardSlotId = undefined;
    shipment.status = 'DOCK_ASSIGNED';

    this.addTrackingEvent(shipment.id, 'DOCK_ASSIGNED', `Dock ${dock.name}`, `Assigned to Dock ${dock.name}`, operatorName);
    this.addAuditLog('DOCK_ASSIGNMENT', dock.id, 'ASSIGNED', operatorName, `Assigned Trailer ${trailer.id} (Shipment ${shipment.id}) to Dock ${dock.name}`);

    return { shipment, dock, trailer };
  }

  // Operations: Reassign Dock (Dynamic Reassignment Scenario)
  public reassignDock(shipmentId: string, trailerId: string, oldDockId: string, newDockId: string, reason: string, operatorName: string = 'Kaviya (Operator)') {
    const shipment = this.getShipmentById(shipmentId);
    const trailer = this.getTrailerById(trailerId);
    const oldDock = this.getDockById(oldDockId);
    const newDock = this.getDockById(newDockId);

    if (!shipment || !trailer || !newDock) {
      throw new Error('Target shipment, trailer, or new dock not found');
    }

    // Update old dock status if it was occupied/reserved
    if (oldDock && (oldDock.status === 'OCCUPIED' || oldDock.status === 'RESERVED')) {
      oldDock.status = 'AVAILABLE';
      oldDock.currentTrailerId = undefined;
      oldDock.currentShipmentId = undefined;
    }

    // Reserve new dock
    newDock.status = 'RESERVED';
    newDock.currentTrailerId = trailer.id;
    newDock.currentShipmentId = shipment.id;
    newDock.assignedTime = new Date().toISOString();
    newDock.estimatedCompletionTime = new Date(Date.now() + 50 * 60 * 1000).toISOString();

    // Update trailer & shipment
    trailer.assignedDockId = newDock.id;
    shipment.currentDockId = newDock.id;
    shipment.status = 'DOCK_ASSIGNED';

    // Resolve any active DOCK_FAILURE exception for this shipment/trailer
    const activeEx = this.exceptions.find(e => (e.shipmentId === shipmentId || e.trailerId === trailerId || e.dockId === oldDockId) && e.status === 'ACTIVE');
    if (activeEx) {
      this.resolveException(activeEx.id, `Dynamic Reassignment Approved: Moved from ${oldDockId} to ${newDock.name}. Reason: ${reason}`);
    }

    this.addTrackingEvent(shipment.id, 'DOCK_ASSIGNED', `Dock ${newDock.name}`, `Reassigned from Dock ${oldDockId} to ${newDock.name} due to operational exception`, operatorName);
    this.addAuditLog('DOCK_REASSIGNMENT', newDock.id, 'DYNAMIC_REASSIGNMENT', operatorName, `Reassigned TR-105 / SHP-1005 from ${oldDockId} to ${newDock.name}. Reason: ${reason}`);

    return { shipment, newDock, trailer };
  }

  // Analytics KPIs calculation
  public getAnalyticsKPIs(): AnalyticsKPIs {
    const totalDocks = this.docks.length;
    const occupiedOrReservedDocks = this.docks.filter(d => d.status === 'OCCUPIED' || d.status === 'RESERVED').length;
    const dockUtil = Math.round((occupiedOrReservedDocks / totalDocks) * 100);

    const totalSlots = this.yardSlots.length;
    const occupiedSlots = this.yardSlots.filter(s => s.status === 'OCCUPIED').length;
    const yardOcc = Math.round((occupiedSlots / totalSlots) * 100);

    const activeExceptionsCount = this.exceptions.filter(e => e.status === 'ACTIVE').length;
    const highPriorityCount = this.shipments.filter(s => s.priority === 'HIGH' || s.priority === 'CRITICAL').length;

    return {
      activeShipmentsCount: this.shipments.filter(s => s.status !== 'COMPLETED').length,
      trailersArrivingToday: 14,
      highPriorityCount,
      yardOccupancyPercent: yardOcc,
      dockUtilizationPercent: dockUtil,
      avgWaitTimeMinutes: 24,
      avgDwellTimeMinutes: 52,
      onTimeArrivalRatePercent: 92,
      activeExceptionsCount,
    };
  }

  // 24-Hour Dock & Yard Congestion Heatmap Matrix Engine
  public getHeatmapData() {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

    const docks = this.docks.map(dock => {
      const isOccupied = dock.status === 'OCCUPIED' || dock.status === 'RESERVED';
      const isMaint = dock.status === 'MAINTENANCE';

      const hourly = hours.map((hour, idx) => {
        let base = 25;
        if (idx >= 6 && idx <= 18) base = 65;
        if (idx >= 10 && idx <= 15) base = 85;
        if (isMaint) base = 0;
        if (isOccupied && idx >= 12 && idx <= 16) base = 95;

        const varFactor = dock.dockType === 'REFRIGERATED' ? 10 : dock.dockType === 'HEAVY_DUTY' ? 5 : 0;
        const val = Math.min(100, Math.max(0, base + varFactor + ((idx * 7) % 15)));
        return { hour, value: isMaint ? 0 : val };
      });

      return {
        id: dock.id,
        name: dock.name,
        type: dock.dockType,
        status: dock.status,
        currentTrailerId: dock.currentTrailerId,
        hourly,
      };
    });

    const yardZones = [
      { id: 'ZONE_A', name: 'Zone A - Standard Dry Van', capability: 'DRY_VAN' },
      { id: 'ZONE_B', name: 'Zone B - Cold Storage Reefer', capability: 'REFRIGERATED' },
      { id: 'ZONE_C', name: 'Zone C - Overflow & Hazmat', capability: 'HAZMAT' },
    ].map(zone => {
      const slotsInZone = this.yardSlots.filter(s => s.zoneId === zone.id);
      const occInZone = slotsInZone.filter(s => s.status === 'OCCUPIED').length;
      const currentPct = slotsInZone.length > 0 ? Math.round((occInZone / slotsInZone.length) * 100) : 0;

      const hourly = hours.map((hour, idx) => {
        let base = 35;
        if (idx >= 7 && idx <= 17) base = 70;
        if (idx >= 11 && idx <= 14) base = 90;
        const val = Math.min(100, Math.max(10, Math.round(base * 0.7 + currentPct * 0.3 + ((idx * 5) % 12))));
        return { hour, value: val };
      });

      return {
        ...zone,
        totalSlots: slotsInZone.length,
        occupiedSlots: occInZone,
        currentOccupancyPercent: currentPct,
        hourly,
      };
    });

    const trailers = this.trailers;
    const highDwellTrailers = trailers.filter(t => (t.dwellMinutes || 0) > 90);
    const totalDwellMinutes = trailers.reduce((acc, t) => acc + (t.dwellMinutes || 0), 0);
    const avgTurnaroundMins = 38;
    const demurrageSavedDollars = 18450;
    const demurrageRiskDollars = highDwellTrailers.length * 450;

    return {
      hours,
      docks,
      yardZones,
      metrics: {
        avgTurnaroundMins,
        demurrageSavedDollars,
        demurrageRiskDollars,
        highDwellCount: highDwellTrailers.length,
        totalDwellMinutes,
      }
    };
  }

  // Feature 1: Smart Dynamic Trailer Priority Queue
  public getSmartPriorityQueue(): SmartQueueItem[] {
    // Get all trailers currently in yard waiting for dock assignment
    const waitingTrailers = this.trailers.filter(t => t.status === 'IN_YARD');

    const queueItems: SmartQueueItem[] = waitingTrailers.map(trailer => {
      const shipment = this.shipments.find(s => s.id === trailer.shipmentId || s.trailerId === trailer.id);
      return priorityEngine.evaluateTrailerPriority(trailer, shipment);
    });

    // Reorder queue dynamically based on priority score descending
    return queueItems.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // Feature 3: Software-Simulated Yard Sensor Location Validation
  public simulateSensorMatch(slotId: string = 'A42') {
    const slot = this.yardSlots.find(s => s.id === slotId);
    if (!slot) throw new Error(`Yard Slot ${slotId} not found`);

    const expectedTrailerId = slot.occupiedByTrailerId || 'TR-106';

    slot.sensorTrailerId = expectedTrailerId;
    slot.rtlsTrailerId = expectedTrailerId;
    slot.yardMuleTrailerId = expectedTrailerId;
    slot.locationValidationStatus = 'VERIFIED';

    // Resolve any active YARD_LOCATION_MISMATCH exception for this slot
    const mismatchEx = this.exceptions.find(e => e.type === 'YARD_LOCATION_MISMATCH' && e.yardSlotId === slotId && e.status === 'ACTIVE');
    if (mismatchEx) {
      this.resolveException(mismatchEx.id, `Operator/Sensor Re-validation Confirmed: All signals (IoT, RTLS, Yard Mule) match ${expectedTrailerId}`);
    }

    this.addAuditLog('YARD_SENSOR', slot.id, 'LOCATION_VERIFIED', 'System / Operator', `Location verified for Yard Slot ${slot.id}: IoT, RTLS, and Yard Mule signals all confirm ${expectedTrailerId}`);

    return { slot, status: 'VERIFIED' };
  }

  public simulateSensorMismatch(slotId: string = 'A42') {
    const slot = this.yardSlots.find(s => s.id === slotId);
    if (!slot) throw new Error(`Yard Slot ${slotId} not found`);

    const expectedTrailerId = slot.occupiedByTrailerId || 'TR-106';
    const conflictingTrailerId = 'TR-107';

    slot.sensorTrailerId = expectedTrailerId;
    slot.rtlsTrailerId = expectedTrailerId;
    slot.yardMuleTrailerId = conflictingTrailerId; // MISMATCH!
    slot.locationValidationStatus = 'MISMATCH';

    // Create YARD_LOCATION_MISMATCH exception
    const exception = this.createException({
      trailerId: expectedTrailerId,
      yardSlotId: slot.id,
      type: 'YARD_LOCATION_MISMATCH',
      severity: 'HIGH',
      title: `YARD LOCATION MISMATCH on Slot ${slot.id}`,
      description: `Discrepancy detected at Slot ${slot.id}: IoT Sensor & RTLS detect ${expectedTrailerId}, but Yard Mule confirmed ${conflictingTrailerId}. Action required by yard operator.`,
      recommendedAction: 'Verify physical trailer presence at Slot A42 and resolve discrepancy in control tower.',
      conflictingTrailerIds: [expectedTrailerId, conflictingTrailerId],
    });

    this.addAuditLog('YARD_SENSOR', slot.id, 'LOCATION_MISMATCH', 'Telemetry Simulation', `MISMATCH DETECTED at Slot ${slot.id}: Expected ${expectedTrailerId}, Mule signal detected ${conflictingTrailerId}`);

    return { slot, status: 'MISMATCH', exception };
  }

  public resetSensors() {
    for (const slot of this.yardSlots) {
      if (slot.status === 'OCCUPIED') {
        const trailerId = slot.occupiedByTrailerId || 'TR-106';
        slot.sensorTrailerId = trailerId;
        slot.rtlsTrailerId = trailerId;
        slot.yardMuleTrailerId = trailerId;
        slot.locationValidationStatus = 'VERIFIED';
      } else {
        slot.locationValidationStatus = 'UNVALIDATED';
      }
    }
    return { success: true, message: 'All yard sensors reset to verified state' };
  }
}

export const store = new DataStore();
