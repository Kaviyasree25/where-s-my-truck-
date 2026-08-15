# 🚛 WHERE'S MY TRUCK? — Inbound Logistics & Predictive Control Tower

> **Enterprise Inbound Warehouse Operations, Machine Learning Dock Allocation & Cold-Chain Fleet Visibility Platform**

---

## 🌟 Key Features & Architectural Highlights

1. **🗺️ Live Inbound Highway GPS Control Tower:**
   * 50 commercial tractor-trailers mapped across Midwest Interstate corridors (`I-80`, `I-90`, `I-55`, `I-94`) leading to the Naperville DC-1 hub.
   * Heading-oriented directional pins, animated live road movement (ticks every 4s), and interactive quick filters (`All`, `En Route`, `Yard`, `Docks`).

2. **🌲 50-Tree Random Forest Machine Learning Dock Engine:**
   * **96.5% Model Fit (OOB Validation)** evaluating Cargo Compatibility (34.8%), Demurrage & Dwell Penalty (26.2%), Inventory Urgency (20.5%), and Appointment Variance (18.5%).
   * Transparent, human-explainable decision cards breakdown.
   * **Hard Safety Rules**: Cryo Lock (`-20°C` strictly to D01–D04), Hazmat Containment (Class-3/8 strictly to D15).

3. **🏢 Multi-Horizon Shift Simulation & Time-Travel Scheduler:**
   * 15 specialized dock doors with multi-horizon views (`LIVE NOW`, `Next 1 Hr`, `Next 2 Hrs`, `Next 3 Hrs`, `Next 4 Hrs`, `Full 24h Day`).
   * **60-Second Real-Time Turnover Engine**: Progressively ages unloading timers, completes expired trailers, and rotates next-queued trucks into freed bays.

4. **⚡ Cold-Chain Emergency Preemption Engine:**
   * Real-world edge case: Critical `-20°C` Cryo trucks automatically bump low-priority dry vans (`TR-101`) to Yard Slot `A02` to protect temperature-critical pharmaceutical & vaccine cargo.

5. **🛡️ 3-Way IoT Yard Sensor Reconciliation:**
   * 14 staging slots across Zones A, B, and C with dwell timers & demurrage alerts ($450/hr).
   * Triangulates Ground IoT Radar vs Kingpin RTLS vs Yard Mule RFID to detect mismatches with 1-click resolution.

6. **🔒 Customer Privacy Shield & Single-Shipment Tracking:**
   * Dedicated External Customer Portal (`/customer`).
   * Single-shipment isolation restricts competitor manifests and internal dock logs, providing verified cold-chain telemetry (`❄️ Thermal Lock Verified`).

7. **👥 Multi-Persona Role-Based Access Control (RBAC):**
   * 4 active enterprise personas: **Admin** (`Maya Lin`), **Inbound Manager** (`Sri`), **Dock & Yard Operator** (`Kaviya`), and **Customer** (`Abi`).

---

## 💻 Tech Stack

* **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Leaflet / React-Leaflet, Socket.IO Client, Lucide React, Axios.
* **Backend**: Node.js, Express.js, TypeScript, Socket.IO Server, JWT (HMAC-SHA256), In-Memory ACID Store.
* **Geospatial & ML**: OSRM (Open Source Routing Machine) highway coordinates, 50-Tree Random Forest Classifier.

---

## 🚀 Quick Start (Running Locally)

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
```
*Backend runs on `http://localhost:5000` (API: `http://localhost:5000/api`, Socket.IO on `http://localhost:5000`).*

### 2. Start Frontend Client
```bash
cd client
npm install
npm run dev
```
*Frontend runs on `http://localhost:3001` (or `http://localhost:5173`).*

---

## 🎛️ Interactive Demo Testing Flow

1. Open **[http://localhost:3001/control-tower](http://localhost:3001/control-tower)**.
2. **Replay Moving Trucks**: Click `[Replay Truck Routes]` on the top toolbar to watch trucks smoothly move along Interstate highways toward the warehouse.
3. **Simulate Dock Failure**: Click `[Simulate Dock Failure]`. Observe Dock `D04` fail and an emergency ML Reassignment Modal appear recommending `D05` with 1-click execution.
4. **Simulate ETA Delay**: Click `[Simulate ETA Delay]` to push shipment `SHP-1005` back by +45m in interstate traffic.
5. **Simulate Yard Congestion**: Click `[Simulate Congestion]` to trigger >80% yard volume surge.
6. **Simulate Cold-Chain Preemption**: Click `[Simulate Cryo]`. Watch critical `-20°C` reefer bump `TR-101` to Yard Slot `A02`.
7. **Single-Shipment Tracking**: Go to `/shipments` and search `TR-219` or `SHP-1005` to view live corridor GPS breadcrumbs and cold-chain telemetry.
8. **Customer View**: Go to `/customer` with tracking number `TRK-984210` to view the privacy-isolated customer freight portal.
9. **Reset State**: Click `[Reset Demo]` to restore the platform back to baseline.

---

## 📄 Complete Documentation
For full architectural details, mathematical ML formulas, and API reference, see:
👉 **[FULL_FEATURE_TECH_STACK_AND_ARCHITECTURE_GUIDE.md](file:///e:/Hemanth/where-s-my-truck-/FULL_FEATURE_TECH_STACK_AND_ARCHITECTURE_GUIDE.md)**
