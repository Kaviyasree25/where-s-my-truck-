import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateWarehouseDataset(outputPath, numRecords = 1200, seed = 42) {
  let s = seed;
  const pseudoRandom = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const choice = (arr) => arr[Math.floor(pseudoRandom() * arr.length)];
  const randInt = (min, max) => Math.floor(pseudoRandom() * (max - min + 1)) + min;

  const trailerTypes = ['DRY_VAN', 'REFRIGERATED', 'HAZMAT', 'FLATBED'];
  const priorities = ['STANDARD', 'HIGH', 'CRITICAL'];
  const carriers = ['BlueLine Logistics', 'SwiftHaul Freight', 'TransRoute Express', 'Prime ColdChain Inc'];
  const yardSlots = ['A01', 'A02', 'A03', 'A04', 'A42', 'B01', 'B02', 'B03', 'B04', 'C01', 'C02', 'C03', 'C04'];
  const docks = ['D01', 'D02', 'D03', 'D04', 'D05', 'D06'];

  const headers = [
    'record_id', 'trailer_id', 'load_type', 'priority', 'carrier',
    'arrival_hour', 'scheduled_hour', 'eta_variance_mins', 'dwell_minutes',
    'inventory_urgency', 'perishable_flag', 'current_yard_slot',
    'distance_to_docks_m', 'yard_congestion_pct', 'candidate_dock_id',
    'dock_type', 'dock_capability_match', 'dock_status', 'queue_length',
    'expected_wait_mins', 'dock_utilization_pct', 'successful_allocation',
    'selected_dock', 'selected_yard_slot', 'operational_delay_mins'
  ];

  const rows = [headers.join(',')];

  for (let i = 1; i <= numRecords; i++) {
    const tType = choice(trailerTypes);
    const priority = choice(priorities);
    const carrier = choice(carriers);
    const arrHour = randInt(6, 22);
    const schedHour = arrHour + choice([-1, 0, 1, 2]);
    const etaVar = (schedHour - arrHour) * 60 + randInt(-15, 30);
    const dwellMins = randInt(10, 180);

    const urgency = priority === 'CRITICAL' ? 100 : (priority === 'HIGH' ? 50 : 20);
    const isPerishable = tType === 'REFRIGERATED' ? 1 : 0;
    const yardSlot = choice(yardSlots);

    const distM = randInt(30, 120);
    const congestion = randInt(35, 95);

    const cDock = choice(docks);

    let capMatch = 0;
    let dockType = 'STANDARD';
    if (tType === 'REFRIGERATED') {
      capMatch = (cDock === 'D04' || cDock === 'D05') ? 1 : 0;
      dockType = capMatch ? 'REFRIGERATED' : 'STANDARD';
    } else if (tType === 'HAZMAT') {
      capMatch = (cDock === 'D03' || cDock === 'D06') ? 1 : 0;
      dockType = capMatch ? 'HEAVY_DUTY' : 'STANDARD';
    } else if (tType === 'FLATBED') {
      capMatch = (cDock === 'D01' || cDock === 'D03') ? 1 : 0;
      dockType = 'STANDARD';
    } else {
      capMatch = 1;
      dockType = 'STANDARD';
    }

    const dockSt = pseudoRandom() > 0.35 ? 'AVAILABLE' : 'OCCUPIED';
    const finalDockSt = pseudoRandom() < 0.05 ? 'BLOCKED' : dockSt;

    const queueLen = finalDockSt === 'AVAILABLE' ? 0 : randInt(1, 3);
    const waitMins = finalDockSt === 'AVAILABLE' ? 0 : queueLen * 35;
    const utilization = randInt(40, 90);

    const isSuccess = (capMatch === 1 && finalDockSt !== 'BLOCKED' && waitMins <= 45) ? 1 : 0;

    const selectedDock = isSuccess ? cDock : (tType === 'REFRIGERATED' ? 'D04' : 'D01');
    const selectedSlot = tType === 'REFRIGERATED' ? 'A42' : 'A01';
    const opDelay = isSuccess ? 0 : randInt(15, 60);

    const recId = `REC-${String(i).padStart(4, '0')}`;
    const trId = `TR-${100 + (i % 50)}`;

    rows.push([
      recId, trId, tType, priority, carrier,
      arrHour, schedHour, etaVar, dwellMins, urgency, isPerishable,
      yardSlot, distM, congestion, cDock, dockType, capMatch, finalDockSt,
      queueLen, waitMins, utilization, isSuccess, selectedDock, selectedSlot, opDelay
    ].join(','));
  }

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, rows.join('\n'), 'utf-8');
  console.log(`Generated ${numRecords} training records at ${outputPath}`);
}

const targetPath = path.join(__dirname, 'warehouse_training_data.csv');
generateWarehouseDataset(targetPath);
