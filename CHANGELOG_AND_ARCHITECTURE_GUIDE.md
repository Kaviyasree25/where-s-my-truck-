# Inbound Warehouse Operations & Visibility Platform
## Technical Implementation, Changelog & Architecture Guide

---

## 📌 Executive Summary

This document details the complete technical implementation, architectural enhancements, and user experience upgrades completed across the **Inbound Warehouse Control Tower Platform**. Every feature was designed with enterprise logistics standards, high-performance real-time telemetry, and modular React/Node.js architecture.

---

## 📑 Table of Contents
1. [Batch D: Operator & Admin Manual CRUD Override Controls](#1-batch-d-operator--admin-manual-crud-override-controls)
2. [UI Layout, Navigation & Dynamic Breadcrumbs System](#2-ui-layout-navigation--dynamic-breadcrumbs-system)
3. [Dedicated Single-Shipment Live Highway & Facility GPS Map](#3-dedicated-single-shipment-live-highway--facility-gps-map)
4. [Production Backend Security & Cryptographic JWT Authentication](#4-production-backend-security--cryptographic-jwt-authentication)
5. [Multi-Account Concurrent Session Management](#5-multi-account-concurrent-session-management)
6. [Component Directory & API Surface Reference](#6-component-directory--api-surface-reference)

---

## 1. Batch D: Operator & Admin Manual CRUD Override Controls

### 🎯 Motivation & Purpose
While the platform provides automated AI/ML smart dock allocation and road-following GPS tracking, real-world warehouses face dynamic edge cases (dock mechanical breakdowns, physical bay maintenance, unscheduled gate arrivals, and yard re-slotting). Batch D gives warehouse supervisors, yard jockeys, and security gate staff full manual override capabilities with immutable audit trails.

### 📦 Features & Modals Built:

#### A. Inbound Shipment Dispatch Modal (`CreateShipmentModal.tsx`)
* **Location:** Triggered via `+ Dispatch Inbound Shipment` button on the Master Data Admin page (`/admin`).
* **Capabilities:**
  * **Carrier Selection:** Swift, J.B. Hunt, Schneider, Knight-Swift, Prime Inc., Werner.
  * **Origin & Supplier:** Custom facility dispatch origin and vendor metadata.
  * **Cargo Load Type:** `DRY_VAN`, `REFRIGERATED`, `HAZMAT`, `FLATBED`.
  * **Priority Level:** `STANDARD`, `HIGH`, `CRITICAL`.
  * **Freight Details:** Total cargo weight (kg) and manifest item descriptions.
* **Why:** Injects live inbound freight into the Midwest highway corridor on-demand.

#### B. Security Gate Trailer Check-In Modal (`RegisterTrailerModal.tsx`)
* **Location:** Triggered via `+ Gate Arrival Check-In` button on `/admin`.
* **Capabilities:**
  * Allows gate security operators to register arriving tractor-trailers.
  * Auto-assigns or manually selects an available staging zone (`Zone A`, `Zone B`, `Zone C`).
  * Initializes 3-way RFID & ground sensors to `VERIFIED`.
  * Generates an arrival timestamp and immutable audit log entry.
* **Why:** Bridges highway transit to internal yard staging.

#### C. Yard Mule Re-Slotting Modal (`YardMoveModal.tsx`)
* **Location:** Accessible on the Yard Management view (`/yard`) and `/admin` Yard Slots table.
* **Capabilities:**
  * Allows yard spotters/jockeys to transfer trailers between holding slots (e.g. `Slot A01` ➔ `Slot B04`).
  * Real-time slot vacancy filtering prevents slot collision.
  * Updates RTLS RFID sensors and holding position.
* **Why:** Allows yard optimization when preparing staging queues for high-priority dock unloading.

#### D. Dock Door Configuration & Maintenance Downtime Modal (`DockEditModal.tsx`)
* **Location:** Accessible on Dock Doors (`/docks`) and `/admin` via the `[⚙️ Configure]` button on each dock card.
* **Capabilities:**
  * Edit dock door display names and capability tags (`DRY_VAN`, `REFRIGERATED`, `HAZMAT`, `FLATBED`).
  * Set **`MAINTENANCE`** or **`BLOCKED`** status with custom downtime reason notes.
  * Changing status automatically triggers exception detection and real-time reassignment workflows.
* **Why:** Allows warehouse managers to log mechanical lift failures and safely reroute incoming reefers.

#### E. Master Data Administration & Audit Logs (`AdminPage.tsx`)
* **Location:** `/admin`
* **Capabilities:** 4 interactive tabs displaying master data tables for **Dock Doors**, **Yard Slots**, **Shipment Manifest**, and **Users & Immutable Audit Logs**.

---

## 2. UI Layout, Navigation & Dynamic Breadcrumbs System

### 🎯 Motivation & Purpose
Eliminate flexbox layout recalculation bugs where the operations menu would shift downwards, pin the session exit controls cleanly, and provide seamless route hierarchy context.

### 🛠️ Key Changes:
1. **Viewport Height Anchoring:**
   * Updated application root in [`App.tsx`](file:///e:/Hemanth/where-s-my-truck-/client/src/App.tsx) from `min-h-screen` to `h-screen overflow-hidden`.
   * Pinned sidebar as a flex child (`w-64 shrink-0 h-full overflow-y-auto`) with `mt-auto shrink-0` on the bottom session bar.
   * **Result:** The sidebar remains fixed with zero layout jitter, and `Exit Session` is pinned to the bottom of the viewport.
2. **Dynamic Breadcrumbs Component (`Breadcrumbs.tsx`):**
   * Automatically parses current URL routes.
   * Renders clickable parent navigation trails:
     * `🏢 Naperville DC-1  ›  Master Data & Manual Overrides`
     * `🏢 Naperville DC-1  ›  Shipment Tracking  ›  Shipment SHP-1005`
   * Clickable roots allow fast navigation back to the primary Control Tower.

---

## 3. Dedicated Single-Shipment Live Highway & Facility GPS Map

### 🎯 Motivation & Purpose
On the main Control Tower page, the map shows all fleet trucks simultaneously. However, suppliers, carriers, and operators inspecting a specific shipment (`/tracking`, `/customer-tracking`, `/shipments/:id`) need to track **strictly their vehicle** without clutter from unrelated trucks.

### 🗺️ Features Built (`SingleShipmentMap.tsx`):
1. **True Center Road Alignment:**
   * Replaced pointy teardrop needle pins with a **32px circular disc** featuring a crisp white border and drop shadow.
   * Set `iconAnchor: [17, 17]` so the circular truck puck travels **directly in the center of the blue highway polyline**.
   * Embedded a clean white **Truck vector silhouette icon** inside the circle.
2. **OSRM Corridor Polyline & Facility Pins:**
   * Renders the exact interstate highway trajectory (e.g. `I-94 E / I-294 S` or `I-65 N / I-80 W`) connecting dispatch origin to Naperville DC-1.
   * **`ORIGIN`** dispatch depot pin and **`DC-1 MAIN HUB`** destination warehouse pin.
3. **Floating Telemetry HUD:**
   * Live vehicle speed (e.g. `64 mph` en route vs. `0 mph (Parked/Docked)` in yard).
   * Transit condition, miles remaining, ETA arrival time, and cargo load type.
4. **Camera Controls:**
   * **`[🎯 Focus Truck]`**: Locks camera onto vehicle coordinates.
   * **`[🔍 Fit Route]`**: Auto-bounds the entire interstate corridor.
5. **Views Integrated:**
   * **Shipment Tracking (`/tracking`):** Embedded below milestone stepper.
   * **Customer Portal (`/customer-tracking`):** External customer safe view.
   * **Shipment Lifecycle File (`/shipments/:id`):** Embedded above audit trail.

---

## 4. Production Backend Security & Cryptographic JWT Authentication

### 🎯 Motivation & Purpose
Elevate the platform from prototype visual masking into an authentic, production-grade security architecture with cryptographic token signing and server-side RBAC middleware.

### 🔒 Backend Architecture (`server/src/services/authService.ts`):
1. **HMAC-SHA256 Token Signing:**
   * Built using Node.js native `crypto` module (`crypto.createHmac('sha256', SECRET)`).
   * Generates standard `base64url(header).base64url(payload).signature` JSON Web Tokens.
   * Encodes `userId`, `name`, `email`, `role`, `iat`, and `exp`.
2. **Backend Authentication Endpoints:**
   * `POST /api/auth/login`: Validates credentials, issues signed JWT token, returns user profile.
   * `GET /api/auth/me`: Validates token signature, returns active session payload.
3. **Express RBAC Middleware (`requireAuth`, `requireRole`):**
   * `POST /api/docks`, `POST /api/shipments`, `POST /api/yard/move`: Protected with `requireRole(['ADMIN', 'OPERATOR'])`.
   * `GET /api/analytics`: Protected with `requireRole(['ADMIN', 'MANAGER'])`.
   * `GET /api/tracking/:query`: Publicly accessible with internal warehouse bay numbers masked.
4. **Client-Side Axios Interceptor (`client/src/services/api.ts`):**
   * Automatically attaches `Authorization: Bearer <token>` to all HTTP requests.

---

## 5. Multi-Account Concurrent Session Management

### 🎯 Motivation & Purpose
Enable presenters and operators to switch between multiple authenticated roles (`Admin`, `Operator`, `Manager`, `Customer`) seamlessly during hackathon judging and live evaluation, while preserving independent sessions and JWT tokens.

### 👥 How It Works:
1. **Multi-Session State (`AuthContext.tsx`):**
   * Stores concurrent authenticated sessions in `localStorage` (`token`, `user`, `role`, `lastActive`).
2. **Header Multi-Account Dropdown (`Header.tsx`):**
   * Displays currently active user with role badge.
   * Lists all **Active Signed-In Accounts** with **1-click switching** (no re-entering passwords once authenticated).
3. **Add Account Modal (`AddAccountModal.tsx`):**
   * Clean role selectors (`Admin`, `Operator`, `Manager`, `Customer`).
   * Automatically **grays out and disables already signed-in sessions** with an `Active` badge.
   * Authenticates new accounts against backend `POST /api/auth/login` and receives a distinct JWT token.
4. **Minimal Login Page (`LoginPage.tsx`):**
   * Clean centered card with Email and Password inputs.
   * Quick-fill role pills for demo accounts:
     * **Admin:** `admin@warehouse.logistics` / `admin`
     * **Operator:** `kaviya@warehouse.logistics` / `operator`
     * **Manager:** `sri@controltower.logistics` / `manager`
     * **Customer:** `abi@apexretail.com` / `customer`

---

## 6. Component Directory & API Surface Reference

### 📁 Client Components Created & Updated
| File Path | Description |
| :--- | :--- |
| [`client/src/components/map/SingleShipmentMap.tsx`](file:///e:/Hemanth/where-s-my-truck-/client/src/components/map/SingleShipmentMap.tsx) | Dedicated single-truck live GPS map with centered circular puck, road polyline & telemetry HUD. |
| [`client/src/components/common/AddAccountModal.tsx`](file:///e:/Hemanth/where-s-my-truck-/client/src/components/common/AddAccountModal.tsx) | Modal to authenticate and add concurrent account sessions with password validation. |
| [`client/src/components/common/Breadcrumbs.tsx`](file:///e:/Hemanth/where-s-my-truck-/client/src/components/common/Breadcrumbs.tsx) | Dynamic route hierarchy navigation trail with facility context. |
| [`client/src/components/admin/CreateShipmentModal.tsx`](file:///e:/Hemanth/where-s-my-truck-/client/src/components/admin/CreateShipmentModal.tsx) | Inbound freight dispatch creation form. |
| [`client/src/components/admin/RegisterTrailerModal.tsx`](file:///e:/Hemanth/where-s-my-truck-/client/src/components/admin/RegisterTrailerModal.tsx) | Security gate arrival check-in and yard slot assignment. |
| [`client/src/components/admin/YardMoveModal.tsx`](file:///e:/Hemanth/where-s-my-truck-/client/src/components/admin/YardMoveModal.tsx) | Yard jockey trailer re-slotting transfer tool. |
| [`client/src/components/admin/DockEditModal.tsx`](file:///e:/Hemanth/where-s-my-truck-/client/src/components/admin/DockEditModal.tsx) | Dock capability configuration and maintenance downtime locks. |
| [`client/src/pages/LoginPage.tsx`](file:///e:/Hemanth/where-s-my-truck-/client/src/pages/LoginPage.tsx) | Minimal credentials login card with demo quick-fill role buttons. |
| [`client/src/pages/AdminPage.tsx`](file:///e:/Hemanth/where-s-my-truck-/client/src/pages/AdminPage.tsx) | Master data management tables, action buttons & audit log viewer. |
| [`client/src/context/AuthContext.tsx`](file:///e:/Hemanth/where-s-my-truck-/client/src/context/AuthContext.tsx) | Multi-account session management and JWT authentication provider. |

### 🛠️ Server Backend Endpoints
| HTTP Method | Route | Auth / Role Scope | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns user profile with signed JWT token. |
| `GET` | `/api/auth/me` | `Bearer JWT` | Validates token signature and returns active session payload. |
| `GET` | `/api/tracking/:query` | Public (Masked) | Customer freight tracking with masked internal bay numbers. |
| `POST` | `/api/shipments` | `['ADMIN', 'OPERATOR']` | Dispatches new inbound freight shipment. |
| `POST` | `/api/trailers/check-in` | `['ADMIN', 'OPERATOR']` | Security gate trailer check-in. |
| `POST` | `/api/yard/move` | `['ADMIN', 'OPERATOR']` | Transfers trailer to new yard staging slot. |
| `POST` | `/api/docks` | `['ADMIN', 'OPERATOR']` | Configures dock door capabilities or sets maintenance lock. |
| `GET` | `/api/analytics` | `['ADMIN', 'MANAGER']` | Executive analytics and demurrage cost calculations. |
| `GET` | `/api/trailers/:id/route` | Authenticated | High-resolution road waypoints and telemetry for single-truck tracking. |

---

*Generated for Inbound Warehouse Operations & Visibility Platform.*
