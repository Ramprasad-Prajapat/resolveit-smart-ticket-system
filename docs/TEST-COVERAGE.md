# ResolveIT Simple Edition — Test Coverage Matrix

This document provides a comprehensive traceability matrix connecting every feature across the ResolveIT platform to its automated test coverage at the **Unit**, **Integration**, **API (Newman)**, and **End-to-End Browser (Playwright)** levels.

---

## 1. Feature-to-Test Traceability Matrix

| Feature ID | Feature Description | Unit Tests (Vitest / JUnit) | Integration Tests (Spring / MockMvc) | API Automation (Newman) | Browser E2E (Playwright) | Coverage Level |
|---|---|---|---|---|---|---|
| **F-01** | **User Registration & Validation**<br>Full name, email uniqueness, password complexity checklist | `RegisterPage.test.jsx`<br>`PasswordInput.test.jsx`<br>`AuthServiceTest.java` | `ApiIntegrationTest.java`<br>`BoundaryAndWorkflowIntegrationTest.java` | `POST /auth/register` (Citizen, Agent, Admin) | `app.spec.js` (Scenarios 02, 10)<br>`security-and-edge.spec.js` | Unit + Integration + API + E2E |
| **F-02** | **JWT Authentication & Login**<br>Bearer token issuance, user claims, login attempts tracking | `LoginPage.test.jsx`<br>`AuthServiceTest.java`<br>`JwtUtilTest.java` | `RolesEndpointsTableTest.java`<br>`ApiIntegrationTest.java` | `POST /auth/login` (Admin, Agent, User) | `app.spec.js` (Scenarios 01, 02, 06, 11) | Unit + Integration + API + E2E |
| **F-03** | **Brute-Force Rate Limiting**<br>5 failed login attempts $\to$ HTTP 429 lock for 15 minutes | `LoginPage.test.jsx`<br>`LoginAttemptServiceTest.java` | `BoundaryAndWorkflowIntegrationTest.java` | Newman rate-limiting lockout assertions | `app.spec.js` (Scenario 11) | Unit + Integration + API + E2E |
| **F-04** | **Bootstrap Administrator**<br>Auto-creates administrative account if missing on startup | `AuthServiceTest.java` | `ApiIntegrationTest.java` | Bootstrap admin login test | `app.spec.js` (Scenario 06) | Unit + Integration + API + E2E |
| **F-05** | **Profile & Password Management**<br>Update full name, change password with current password verification | `ProfilePage.test.jsx`<br>`AuthServiceTest.java` | `RolesEndpointsTableTest.java` (`PUT /api/auth/me`, `PUT /api/auth/password`) | `PUT /auth/me`<br>`PUT /auth/password` | `app.spec.js` (Scenario 10) | Unit + Integration + API + E2E |
| **F-06** | **Complaint Submission (Create)**<br>Title (3–100 chars), description (10–2000 chars), category, priority | `ComplaintFormPage.test.jsx`<br>`ComplaintServiceTest.java` | `BoundaryAndWorkflowIntegrationTest.java` (Boundary limits 3/100, 10/2000) | `POST /complaints` (Validation + Success) | `app.spec.js` (Scenario 03)<br>`security-and-edge.spec.js` | Unit + Integration + API + E2E |
| **F-07** | **Complaint Editing (Update)**<br>Author/Admin edit open complaints | `ComplaintFormPage.test.jsx`<br>`ComplaintServiceTest.java` | `RolesEndpointsTableTest.java` (`PUT /api/complaints/{id}`) | `PUT /complaints/{{id}}` | `app.spec.js` (Scenario 04) | Unit + Integration + API + E2E |
| **F-08** | **Complaint Listing & Filtering**<br>Search, category, priority, status, assignedToMe, pagination | `ComplaintTable.test.jsx`<br>`Pagination.test.jsx`<br>`ComplaintServiceTest.java` | `BoundaryAndWorkflowIntegrationTest.java` (250 items smoke load test, SQL injection safety) | `GET /complaints` (query params, pagination, sorting) | `app.spec.js` (Scenarios 03, 05, 08, 12)<br>`responsive.spec.js` | Unit + Integration + API + E2E |
| **F-09** | **Complaint Scoping & Multi-Tenancy**<br>USER sees only own complaints; AGENT/ADMIN see all | `ComplaintServiceTest.java` | `RolesEndpointsTableTest.java` (Citizen A vs Citizen B isolation) | Newman user scoping assertions | `app.spec.js` (Scenarios 05, 07) | Unit + Integration + API + E2E |
| **F-10** | **Status Workflow & State Transitions**<br>`OPEN` $\to$ `IN_PROGRESS` $\to$ `RESOLVED`, User reopening to `OPEN` | `ComplaintServiceTest.java` | `BoundaryAndWorkflowIntegrationTest.java` (Full lifecycle test) | `PATCH /complaints/{id}/status` (Success & 403 Forbidden checks) | `app.spec.js` (Scenarios 07, 08, 09, 14, 15) | Unit + Integration + API + E2E |
| **F-11** | **Audit Status History**<br>Tracks old status, new status, changed-by user, timestamp, note | `ComplaintAssignAndHistory.test.jsx`<br>`ComplaintServiceTest.java` | `RolesEndpointsTableTest.java` (`GET /api/complaints/{id}/history`) | `GET /complaints/{{id}}/history` | `app.spec.js` (Scenarios 04, 08, 14, 15) | Unit + Integration + API + E2E |
| **F-12** | **Internal Comments**<br>Collaborative comments on tickets with author and date | `ComplaintServiceTest.java`<br>`CommentServiceTest.java` | `RolesEndpointsTableTest.java` (`GET`, `POST` comments) | `GET /comments`<br>`POST /comments` | `app.spec.js` (Scenario 04) | Unit + Integration + API + E2E |
| **F-13** | **Complaint Assignment & Reassignment**<br>Self-assignment by agents, re-assignment by admin, history record | `ComplaintAssignAndHistory.test.jsx`<br>`ComplaintServiceTest.java` | `RolesEndpointsTableTest.java` (`PATCH /api/complaints/{id}/assign`) | `PATCH /complaints/{{id}}/assign` | `app.spec.js` (Scenarios 07, 14, 15) | Unit + Integration + API + E2E |
| **F-14** | **Live Assignment Alerts & Notifications**<br>Polling `/notifications/unread`, toast popups, auto-dismiss, dismiss marks read | `NotificationToasts.test.jsx`<br>`NotificationServiceTest.java` | `RolesEndpointsTableTest.java` (`GET /unread`, `PATCH /{id}/read`) | `GET /notifications/unread`<br>`PATCH /notifications/{{id}}/read` | `app.spec.js` (Scenarios 14, 15) | Unit + Integration + API + E2E |
| **F-15** | **Offline Notifications Catch-Up**<br>Notifications queued while offline delivered upon next login | `NotificationToasts.test.jsx`<br>`NotificationServiceTest.java` | `RolesEndpointsTableTest.java` | `GET /notifications/unread` after login | `app.spec.js` (Scenario 15) | Unit + Integration + API + E2E |
| **F-16** | **Admin User Management**<br>List staff, promote/demote roles (USER/AGENT/ADMIN), activate/deactivate accounts | `AdminUsersPage.test.jsx`<br>`UserServiceTest.java` | `RolesEndpointsTableTest.java` (`PATCH /admin/users/{id}/role`, `active`) | `GET /admin/users`<br>`PATCH /admin/users/{id}/role` | `app.spec.js` (Scenarios 06, 12, 13) | Unit + Integration + API + E2E |
| **F-17** | **Deactivated User Immediate Rejection**<br>Deactivated account immediately returns HTTP 401 on protected requests | `LoginPage.test.jsx`<br>`UserServiceTest.java` | `BoundaryAndWorkflowIntegrationTest.java` (`deactivatedUser_immediatelyRejected_with401`) | Newman deactivation check | `app.spec.js` (Scenario 13) | Unit + Integration + API + E2E |
| **F-18** | **Metrics & Summary Cards**<br>Calculates counts of total, open, in-progress, resolved complaints | `ComplaintServiceTest.java` | `BoundaryAndWorkflowIntegrationTest.java` | `GET /complaints/summary` | `app.spec.js` (Scenarios 05, 08) | Unit + Integration + API + E2E |
| **F-19** | **Marketing Landing Page**<br>Hero section, Features, How It Works, Roles, CTA, responsive layout | `HomePage.test.jsx`<br>`HomeNavbar.test.jsx` | N/A (Frontend) | N/A (Public Static) | `app.spec.js` (Scenario 01)<br>`responsive.spec.js` (All viewports) | Unit + E2E |
| **F-20** | **Multi-Column Professional Footer**<br>Product, Quick Links, Resources, Contact, dynamic from `siteInfo.js` | `HomeFooter.test.jsx` | N/A (Frontend) | N/A (Public Static) | `app.spec.js` (Scenario 01)<br>`responsive.spec.js` (All viewports) | Unit + E2E |
| **F-21** | **Responsive Design & Accessibility**<br>Mobile hamburger menu, 44px touch targets, 16px font inputs, table-card layout on $\le$ 640px | `Navbar.test.jsx`<br>`ComplaintTable.test.jsx`<br>`Pagination.test.jsx` | N/A (CSS/UI) | N/A (UI) | `responsive.spec.js` (75 viewport checks)<br>`docs/RESPONSIVE.md` | Unit + E2E |
| **F-22** | **XSS & Injection Protection**<br>HTML escaping, `<script>` tags rendered as text, parameterised SQL queries | `api.test.js` | `BoundaryAndWorkflowIntegrationTest.java` (`sqlInjectionPayload_inSearch_handlesGracefully`) | N/A | `security-and-edge.spec.js` (`Safe text (XSS defense)`) | Unit + Integration + E2E |
| **F-23** | **Session Back-Button & Cache Control**<br>Logged-out users cannot navigate back to private dashboard; bad tokens cleared | `api.test.js`<br>`ProtectedRoute.test.jsx`<br>`RootRoute.test.jsx` | `RolesEndpointsTableTest.java` (Cache-Control headers) | N/A | `security-and-edge.spec.js` (`Session back-button and bad token`) | Unit + Integration + E2E |

---

## 2. Test File Locations

### Backend Unit & Integration Tests (JUnit 5 + Spring Boot Test)
- `backend/src/test/java/com/resolveit/ApiIntegrationTest.java`: Core Spring Boot integration test covering auth, complaints, and admin.
- `backend/src/test/java/com/resolveit/BoundaryAndWorkflowIntegrationTest.java`: Boundary limit tests, full status workflow lifecycle, SQL injection safety, 250-complaint load smoke, deactivated user 401.
- `backend/src/test/java/com/resolveit/RolesEndpointsTableTest.java`: Exhaustive role-based access matrix, cache-control headers, CORS preflight, controller endpoints.
- `backend/src/test/java/com/resolveit/service/AuthServiceTest.java`: User registration, password hashing, authentication logic.
- `backend/src/test/java/com/resolveit/service/ComplaintServiceTest.java`: Complaint creation, status transition validation, scoping, assignment, comments, history.
- `backend/src/test/java/com/resolveit/service/CommentServiceTest.java`: Internal notes and comments creation and listing.
- `backend/src/test/java/com/resolveit/service/NotificationServiceTest.java`: Notification creation, unread retrieval, mark-as-read scoping.
- `backend/src/test/java/com/resolveit/service/UserServiceTest.java`: User listing, role updates, account activation/deactivation.
- `backend/src/test/java/com/resolveit/security/JwtUtilTest.java`: Token generation, claim extraction, expiration validation.
- `backend/src/test/java/com/resolveit/security/LoginAttemptServiceTest.java`: In-memory failed attempt tracking and lock duration.

### Frontend Unit & Component Tests (Vitest + React Testing Library)
- `frontend/src/test/api.test.js`: Fetch client, token headers, 401 redirect, error handling, parameter encoding.
- `frontend/src/test/Navbar.test.jsx`: Mobile hamburger menu, keyboard accessible controls (`Enter`, `Space`, `Escape`), role-based links.
- `frontend/src/test/ComplaintTable.test.jsx`: Table rendering, empty states, `data-label` mobile attributes.
- `frontend/src/test/Pagination.test.jsx`: Page navigation, size changer, mobile page indicator.
- `frontend/src/test/AdminUsersPage.test.jsx`: Admin user management, self-account protection, role and active toggles.
- `frontend/src/test/ComplaintFormPage.test.jsx`: Submission validation (3–100, 10–2000), error alerts, edit mode.
- `frontend/src/test/ComplaintAssignAndHistory.test.jsx`: Reassignment select, history timeline rendering.
- `frontend/src/test/NotificationToasts.test.jsx`: Live toast notification polling, auto-dismiss, click dismissal.
- `frontend/src/test/HomePage.test.jsx`: Home page sections and CTA links.
- `frontend/src/test/HomeNavbar.test.jsx`: Public landing page navigation and smooth scrolling.
- `frontend/src/test/HomeFooter.test.jsx`: Multi-column footer and dynamic site information.
- `frontend/src/test/LoginPage.test.jsx`: Login form handling, 401/403/429 error messages.
- `frontend/src/test/RegisterPage.test.jsx`: Password complexity checklist and validation.
- `frontend/src/test/ProfilePage.test.jsx`: Profile form and password change validation.
- `frontend/src/test/PasswordInput.test.jsx`: Password visibility toggle button.
- `frontend/src/test/ProtectedRoute.test.jsx`: Route guarding for unauthenticated or unauthorized users.
- `frontend/src/test/RootRoute.test.jsx`: Conditional landing page vs dashboard routing.
- `frontend/src/test/NotFoundPage.test.jsx`: 404 page fallback.

### API Automated Flow (Newman / Postman)
- `postman/ResolveIT.postman_collection.json`: 57 API requests covering all 22 Spring Controller endpoints with automated assertion scripts.
- `postman/ResolveIT-Local.postman_environment.json`: Dynamic environment variables (`baseUrl`, `token`, `complaintId`, `flowAgentId`, etc.).

### End-to-End Browser Tests (Playwright)
- `frontend/e2e/app.spec.js`: 15 comprehensive end-to-end user journeys (auth, complaint lifecycle, admin operations, live notifications).
- `frontend/e2e/security-and-edge.spec.js`: XSS protection, UI validation error preservation, back-button and bad token handling.
- `frontend/e2e/responsive.spec.js`: 75 automated viewport tests across 8 standard viewports and 9 application pages/states.
