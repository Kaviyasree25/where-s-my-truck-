import csv
import random
import os

def generate_warehouse_dataset(output_path, num_records=1200, seed=42):
    random.seed(seed)
    
    trailer_types = ['DRY_VAN', 'REFRIGERATED', 'HAZMAT', 'FLATBED']
    priorities = ['STANDARD', 'HIGH', 'CRITICAL']
    carriers = ['BlueLine Logistics', 'SwiftHaul Freight', 'TransRoute Express', 'Prime ColdChain Inc']
    yard_slots = ['A01', 'A02', 'A03', 'A04', 'A42', 'B01', 'B02', 'B03', 'B04', 'C01', 'C02', 'C03', 'C04']
    docks = ['D01', 'D02', 'D03', 'D04', 'D05', 'D06']

    headers = [
        'record_id', 'trailer_id', 'load_type', 'priority', 'carrier',
        'arrival_hour', 'scheduled_hour', 'eta_variance_mins', 'dwell_minutes',
        'inventory_urgency', 'perishable_flag', 'current_yard_slot',
        'distance_to_docks_m', 'yard_congestion_pct', 'candidate_dock_id',
        'dock_type', 'dock_capability_match', 'dock_status', 'queue_length',
        'expected_wait_mins', 'dock_utilization_pct', 'successful_allocation',
        'selected_dock', 'selected_yard_slot', 'operational_delay_mins'
    ]

    records = []
    for i in range(1, num_records + 1):
        t_type = random.choice(trailer_types)
        priority = random.choice(priorities)
        carrier = random.choice(carriers)
        arr_hour = random.randint(6, 22)
        sched_hour = arr_hour + random.choice([-1, 0, 1, 2])
        eta_var = (sched_hour - arr_hour) * 60 + random.randint(-15, 30)
        dwell_mins = random.randint(10, 180)
        
        urgency = 100 if priority == 'CRITICAL' else (50 if priority == 'HIGH' else 20)
        is_perishable = 1 if t_type == 'REFRIGERATED' else 0
        yard_slot = random.choice(yard_slots)
        
        dist_m = random.randint(30, 120)
        congestion = random.randint(35, 95)
        
        c_dock = random.choice(docks)
        
        # Capability match logic
        if t_type == 'REFRIGERATED':
            cap_match = 1 if c_dock in ['D04', 'D05'] else 0
            dock_t = 'REFRIGERATED' if c_dock in ['D04', 'D05'] else 'STANDARD'
        elif t_type == 'HAZMAT':
            cap_match = 1 if c_dock in ['D03', 'D06'] else 0
            dock_t = 'HEAVY_DUTY' if c_dock in ['D03', 'D06'] else 'STANDARD'
        elif t_type == 'FLATBED':
            cap_match = 1 if c_dock in ['D01', 'D03'] else 0
            dock_t = 'STANDARD'
        else:
            cap_match = 1
            dock_t = 'STANDARD'
            
        dock_st = 'AVAILABLE' if random.random() > 0.35 else 'OCCUPIED'
        if random.random() < 0.05:
            dock_st = 'BLOCKED'
            
        queue_len = 0 if dock_st == 'AVAILABLE' else random.randint(1, 3)
        wait_mins = 0 if dock_st == 'AVAILABLE' else queue_len * 35
        utilization = random.randint(40, 90)

        # Target outcome logic
        is_success = 1 if (cap_match == 1 and dock_st != 'BLOCKED' and wait_mins <= 45) else 0
        
        selected_dock = c_dock if is_success == 1 else ('D04' if t_type == 'REFRIGERATED' else 'D01')
        selected_slot = 'A42' if t_type == 'REFRIGERATED' else 'A01'
        op_delay = 0 if is_success == 1 else random.randint(15, 60)

        records.append([
            f'REC-{i:04d}', f'TR-{100 + (i % 50)}', t_type, priority, carrier,
            arr_hour, sched_hour, eta_var, dwell_mins, urgency, is_perishable,
            yard_slot, dist_m, congestion, c_dock, dock_t, cap_match, dock_st,
            queue_len, wait_mins, utilization, is_success, selected_dock, selected_slot, op_delay
        ])

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(records)

    print(f"Generated {num_records} warehouse operational training records at: {output_path}")

if __name__ == '__main__':
    target = os.path.join(os.path.dirname(__file__), 'warehouse_training_data.csv')
    generate_warehouse_dataset(target)
