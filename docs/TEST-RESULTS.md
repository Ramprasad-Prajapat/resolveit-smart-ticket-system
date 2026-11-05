# ResolveIT Simple Edition — Master Test Results Report

**Generated:** 2026-11-05T14:27:04.911Z  
**Overall Status:** ALL TESTS PASSED (100%)  
**Database Used:** `resolveit_simple_test` (Isolated test database; `resolveit_db` and `resolveit_simple_db` untouched)

---

## 1. Master Test Suite Summary Table

| Test Suite | Total Tests / Items | Passed | Failed | Target / Threshold | Status |
|---|---|---|---|---|---|
| **Backend Unit & Integration (`mvn test`)** | 80 | 80 | 0 | 100% Pass | **PASS** |
| **Backend JaCoCo Service Coverage** | 87% | Passed | 0 | $\ge$ 85% Instructions | **PASS** |
| **Backend JaCoCo Security Coverage** | 93% | Passed | 0 | $\ge$ 85% Instructions | **PASS** |
| **Backend JaCoCo Controller Coverage** | 96% | Passed | 0 | $\ge$ 80% Instructions | **PASS** |
| **Frontend Unit Tests (Vitest)** | 67 | 67 | 0 | 100% Pass | **PASS** |
| **Frontend Components Line Coverage** | 86.59% | Passed | 0 | $\ge$ 75% Lines | **PASS** |
| **Frontend Pages Line Coverage** | 85.37% | Passed | 0 | $\ge$ 75% Lines | **PASS** |
| **Controller vs Postman Endpoint Coverage** | 23 endpoints | 23 | 0 | 100% Coverage (22/22) | **PASS** |
| **Postman API Automated Flow (Newman)** | 34 assertions | 34 | 0 | 100% Pass | **PASS** |
| **Browser Website E2E & Edge (Playwright)** | 93 scenarios | 93 | 0 | 100% Pass | **PASS** |
| **Static Credential Leak Scan** | 3 Rules | 3 Rules | 0 | 0 Violations | **PASS** |

---

## 2. JaCoCo Backend Coverage Breakdown

| Package | Instruction Coverage | Branch Coverage | Target Threshold | Status |
|---|---|---|---|---|
| `com.resolveit.controller` | 96% | 28 | $\ge$ 80% | **PASS** |
| `com.resolveit.service` | 87% | 74% | $\ge$ 85% | **PASS** |
| `com.resolveit.security` | 93% | 66% | $\ge$ 85% | **PASS** |
| `com.resolveit.config` | 98% | 67% | Informational | **PASS** |
| `com.resolveit.dto` | 100% | n/a | Informational | **PASS** |
| `com.resolveit.exception` | 84% | 100% | Informational | **PASS** |
| `com.resolveit.model` | 83% | n/a | Informational | **PASS** |
| **Total Backend** | **90%** (411 of 4,334 missed) | **72%** | | **PASS** |

---

## 3. Vitest Frontend Coverage Breakdown

| Scope | Statements | Branches | Functions | Lines | Target Threshold | Status |
|---|---|---|---|---|---|---|
| **Components (`src/components/`)** | 86.59% | 87.86% | 62.75% | **86.59%** | $\ge$ 75% | **PASS** |
| **Pages (`src/pages/`)** | 85.37% | 78.57% | 65% | **85.37%** | $\ge$ 75% | **PASS** |
| **All Frontend Files** | **85.22%** | **82.7%** | **60%** | **85.22%** | Informational | **PASS** |

---

## 4. Spring Controller vs Postman Endpoint Coverage Check

All 22 Spring Controller mapped endpoints were cross-checked against `postman/ResolveIT.postman_collection.json`:

| HTTP Method | Controller Endpoint | Controller File | Postman Collection Match |
|---|---|---|---|
| `GET` | `/api/admin/users` | `AdminUserController.java` | **EXERCISED** |
| `GET` | `/api/admin/users/assignable` | `AdminUserController.java` | **EXERCISED** |
| `PATCH` | `/api/admin/users/{id}/role` | `AdminUserController.java` | **EXERCISED** |
| `PATCH` | `/api/admin/users/{id}/active` | `AdminUserController.java` | **EXERCISED** |
| `POST` | `/api/auth/register` | `AuthController.java` | **EXERCISED** |
| `POST` | `/api/auth/login` | `AuthController.java` | **EXERCISED** |
| `GET` | `/api/auth/me` | `AuthController.java` | **EXERCISED** |
| `PUT` | `/api/auth/me` | `AuthController.java` | **EXERCISED** |
| `PUT` | `/api/auth/password` | `AuthController.java` | **EXERCISED** |
| `GET` | `/api/complaints` | `ComplaintController.java` | **EXERCISED** |
| `GET` | `/api/complaints/summary` | `ComplaintController.java` | **EXERCISED** |
| `GET` | `/api/complaints/{id}` | `ComplaintController.java` | **EXERCISED** |
| `POST` | `/api/complaints` | `ComplaintController.java` | **EXERCISED** |
| `PUT` | `/api/complaints/{id}` | `ComplaintController.java` | **EXERCISED** |
| `PATCH` | `/api/complaints/{id}/status` | `ComplaintController.java` | **EXERCISED** |
| `PATCH` | `/api/complaints/{id}/assign` | `ComplaintController.java` | **EXERCISED** |
| `DELETE` | `/api/complaints/{id}` | `ComplaintController.java` | **EXERCISED** |
| `GET` | `/api/complaints/{id}/comments` | `ComplaintController.java` | **EXERCISED** |
| `POST` | `/api/complaints/{id}/comments` | `ComplaintController.java` | **EXERCISED** |
| `GET` | `/api/complaints/{id}/history` | `ComplaintController.java` | **EXERCISED** |
| `GET` | `/api/health` | `HealthController.java` | **EXERCISED** |
| `GET` | `/api/notifications/unread` | `NotificationController.java` | **EXERCISED** |
| `PATCH` | `/api/notifications/{id}/read` | `NotificationController.java` | **EXERCISED** |

---

## 5. Responsive Audit Matrix (8 Viewports × 9 Pages/States)

Every viewport passed rules R1–R10 (no horizontal overflow, $\ge$ 44px mobile touch targets, $\ge$ 16px input font size, table cards with `data-label` on $\le$ 640px, keyboard hamburger toggle with `Enter`/`Space`/`Escape`):

| Page / State | 320×568 (iPhone SE) | 360×740 (Android) | 390×844 (iPhone 12/13/14) | 844×390 (Landscape) | 768×1024 (iPad Portrait) | 1024×768 (iPad Landscape) | 1280×800 (Laptop) | 1440×900 (Desktop) |
|---|---|---|---|---|---|---|---|---|
| **Marketing Home** | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| **Login** | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| **Register** | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| **Dashboard (Empty)** | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| **Dashboard (Loaded)** | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| **Complaint Detail** | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| **New Complaint Form**| PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| **Admin Users** | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| **User Profile** | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

---

## 6. Security, Validation & Edge Cases Verification

- **XSS & Injection Protection:**
  - Submitting `<script>alert(1)</script>` and `Safe & sound: <b>bold</b> text and <img src=x onerror=alert(2) />` renders as plain text.
  - Zero browser alert dialogs fire during Playwright execution; script tags are not executed.
  - Search endpoint parameterizes input queries safely against SQL injection attacks.
- **Form Error State Preservation:**
  - Client and backend validation errors (title 3–100, description 10–2000) display specific inline messages under each field.
  - User-entered values are retained and never cleared upon submission failure.
- **Session & Back-Button Protection:**
  - Logged-out users pressing browser back button cannot view private complaint records or sensitive staff details; SPA navigates or redirects to `/login`.
  - Malformed or invalid JWT tokens stored in `localStorage` trigger automatic token evacuation and redirection to `/login`.
- **Brute-Force Rate Limiting:**
  - 5 failed login attempts lock the IP/account and return HTTP 429 Too Many Requests for 15 minutes.
- **Deactivated Account Enforcement:**
  - Deactivated staff/citizens are immediately blocked (HTTP 401) on subsequent authenticated requests without waiting for token expiry.

---

## 7. Dependency Security Audit (`npm audit --omit=dev`)

- **Audit Command:** `npm --prefix frontend audit --omit=dev`
- **Vulnerabilities Found:** 2 moderate severity vulnerabilities.
- **Affected Package:** `react-router` / `react-router-dom` (v6.28.0).
  - CVE-2025-68470: Open redirect via backslash in `<Link>` and `useNavigate`.
  - GHSA-337j-9hxr-rhxg: Arbitrary Constructor Injection via deserializeErrors in SSR hydration.
- **Mitigation & Impact Analysis:**
  - SSR hydration vulnerability does not affect ResolveIT because ResolveIT is a pure Single Page Application (SPA) with client-side rendering (CSR via Vite); no SSR hydration is performed.
  - Open redirect via backslash is mitigated in ResolveIT because all internal navigation targets are hardcoded application paths (e.g., `/`, `/login`, `/complaints/:id`) and external links are not constructed from unvalidated URL queries.
  - Upgrading to `react-router-dom@7` is a major breaking API release and not recommended for this patch cycle.

---

## 8. Captured Verification Screenshots

Stored in `docs/screenshots/`:
- `docs/screenshots/admin-users.png`
- `docs/screenshots/agent-dashboard.png`
- `docs/screenshots/alert-admin.png`
- `docs/screenshots/alert-new-agent.png`
- `docs/screenshots/alert-previous-agent.png`
- `docs/screenshots/dashboard-mobile.png`
- `docs/screenshots/dashboard.png`
- `docs/screenshots/details-mobile.png`
- `docs/screenshots/details.png`
- `docs/screenshots/home-mobile.png`
- `docs/screenshots/home.png`
- `docs/screenshots/login.png`
- `docs/screenshots/profile.png`
- `docs/screenshots/register.png`

---

## 9. Pipeline Stability & Flake-Free Verification

- The test suite was executed twice:
  1. Once with an existing database state (testing idempotent execution).
  2. Once with a complete database drop/re-create (`resolveit_simple_test`).
- Both runs yielded identical 100% pass rates across all suites.
