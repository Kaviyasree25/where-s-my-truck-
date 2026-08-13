# Enterprise Inbound Warehouse Operations & Supply-Chain Control Tower Platform MVP

A production-style, enterprise-grade warehouse inbound operations and control tower application built for real warehouse operations teams and hackathon demonstration.

## Key Features & Operational Highlights

1. **End-to-End Inbound Workflow**:
   `Shipment → Trailer → Transit → ETA → Gate → Yard → Waiting → Smart Dock Allocation → Dock Unloading → Completion`

2. **Smart Dock Allocation Engine**:
   - Evaluates Hard Constraints (Dock status != BLOCKED/MAINTENANCE, Load type capability fit, equipment)
   - Soft Weighted Scoring Formula (Max 100 pts: Load capability fit 25%, Yard proximity 25%, Queue/wait time 20%, Priority bonus 15%, Appointment match 15%)
   - **Explainable Decision Support**: Human-readable explanation cards breaking down exact point contributions.

3. **Dynamic Dock Reassignment (Hackathon Demo Scenario)**:
   - Dock `D04` fails (Simulated actuator fault) → Automatically marks `D04` as `BLOCKED`
   - Generates `DOCK_FAILURE` exception & Socket.IO real-time alert
   - Identifies impacted trailer `TR-105` & shipment `SHP-1005`
   - Evaluates alternative candidate docks (`D05` scored 89/100)
   - Operator approves reassignment → Cascades updates to Dock, Trailer, Shipment, Exception, Control Tower table, Audit Log, and Customer Tracking view.

4. **Real-Time Interactive Simulation Toolbar**:
   - `[Simulate Dock Failure (D04)]`
   - `[Simulate ETA Delay (+45m)]`
   - `[Simulate Yard Congestion (>80%)]`
   - `[Start Unloading]`
   - `[Complete Unloading]`
   - `[Reset Demo State]`

5. **Role-Based Access Control**:
   - **Warehouse Operator**: Active inbound monitoring, visual yard grid, dock management, allocation approval, reassignment.
   - **Control Tower Manager**: High-level KPIs, operational risk alerts, dwell times, analytics.
   - **Customer Logistics Portal**: Customer tracking (`TRK-984210`), status milestones, ETA, delay notices (no internal dock/slot noise).
   - **Master Data Admin**: Master data maintenance for docks, yard slots, carriers, users.

---

## How to Run locally

### 1. Backend Server (Node.js + Express + Socket.IO)
```bash
cd server
npm install
npm run dev
```
*Backend API will run at `http://localhost:5000/api` with Socket.IO live server on `http://localhost:5000`.*

### 2. Frontend Client (React + Vite + Tailwind CSS)
In a second terminal window:
```bash
cd client
npm install
npm run dev
```
*Frontend application will run at `http://localhost:3001`.*

---

## Verified Demo Acceptance Test Flow

1. Open `http://localhost:3001` and select **Warehouse Operator** role.
2. Open **Control Tower** (`/control-tower`).
3. Locate shipment `SHP-1005` (Trailer `TR-105`, Refrigerated load type).
4. Click **Smart Allocation** button for `SHP-1005`.
5. Observe Dock `D04` recommended with score 91/100 and clear explainable reasons. Click **Approve Dock Assignment (D04)**.
6. Click `[Simulate Dock Failure (D04)]` on the top demo toolbar.
7. Observe `D04` transition to `BLOCKED`, `DOCK_FAILURE` exception created, and emergency Reassignment Modal popup appearing automatically via Socket.IO.
8. Observe candidate dock `D05` evaluated and recommended (Score: 89/100).
9. Click **Approve Dynamic Reassignment to D05**.
10. Confirm `D05` becomes assigned, `TR-105` & `SHP-1005` update, exception is marked `RESOLVED`, and audit log records the transition.
11. Navigate to **Customer Portal** (`/customer-tracking`) with tracking `TRK-984210` to verify clean customer-facing milestone status without internal dock info.
12. Click `[Reset Demo]` on top toolbar to restore initial state cleanly.
