# ResolveIT — Smart Complaint & Ticket Management System

A production-ready full-stack complaint and service-desk ticket management system built with React, Spring Boot, and MySQL.

## Live Links

- **Frontend (Vercel):** https://frontend-sandy-delta-64.vercel.app
- **Backend Health Check:** https://resolveit-backend-z0js.onrender.com/api/health
- **GitHub Repository:** https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system

> **Note:** The backend is hosted on Render's free tier, which goes to sleep after 15 minutes of inactivity. When visiting after an idle period, the initial cold start can take 45 to 90 seconds while the container initializes. Once awake, requests respond in under 100ms.

## Demo Logins

The demo accounts below are pre-configured on both the live website and local environment:

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **ADMIN** | `admin@resolveit.com` | `Demo@1234` | Full access, assign/reassign tickets, manage user accounts |
| **AGENT** | `agent1@resolveit.com` | `Demo@1234` | View all tickets, update assigned status to IN_PROGRESS / RESOLVED |
| **AGENT** | `agent2@resolveit.com` | `Demo@1234` | View all tickets, handle assigned service requests |
| **USER** | `user1@resolveit.com` | `Demo@1234` | Create tickets, view/edit own tickets, post comments, reopen resolved tickets |
| **USER** | `user2@resolveit.com` | `Demo@1234` | Create tickets, track complaint status, add discussion comments |

## What It Does

- **Role-Based Access Control (RBAC):** Three roles (`USER`, `AGENT`, `ADMIN`) with strict client and server authorization.
- **Ticket Lifecycle Management:** Strict state machine transitions (`OPEN` -> `IN_PROGRESS` -> `RESOLVED`), with user ticket reopening.
- **Admin Reassignment:** Administrators can reassign a ticket to any agent at any time, instantly revoking previous agent edit permissions.
- **Live Alert Toasts:** Periodic 5-second polling displays non-blocking color-coded alert popups for ticket assignments and status updates.
- **Discussion Threads & History:** Commenting on tickets with an immutable chronological audit trail tracking all state transitions.
- **Search, Filtering & Pagination:** Full-text search and filtering by category, priority, status, and assignment.
- **Brute-Force Protection:** Rate limiting locks accounts with HTTP 429 for 15 minutes after 5 consecutive failed login attempts.
- **Responsive Design:** Fluid layout across all devices (320px mobile to desktop) with table-to-card transformations and touch targets.

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, React Router DOM 6, Native Fetch, Vanilla CSS |
| **Backend** | Java 21 LTS, Spring Boot 3.3.5, Spring Security 6, Spring Data JPA, JJWT 0.12.6, Maven |
| **Database** | MySQL 8.0+ (InnoDB, UTF8mb4), HikariCP connection pool |
| **Cloud Hosting** | Vercel (Frontend SPA), Render (Backend Docker), Aiven (Managed MySQL) |
| **Testing** | JUnit 5, Mockito, JaCoCo, Vitest, Newman (Postman), Playwright |

## Run It Locally

### Prerequisites
- Java 21 JDK
- Maven 3.9+
- Node.js 18+ and npm
- MySQL 8.0+ running locally

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system.git
   cd resolveit-smart-ticket-system
   ```

2. **Create the database:**
   ```sql
   CREATE DATABASE resolveit_simple_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Start the backend:**
   ```bash
   cd backend
   mvn spring-boot:run -Dspring-boot.run.profiles=local
   ```
   Backend starts on `http://localhost:8080/api` (Health check at `http://localhost:8080/api/health`).

4. **Start the frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser. Log in with any demo account using password `Demo@1234`.

## Environment Variables

### Backend Variables

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Web server listening port | `8080` |
| `DB_URL` | JDBC database connection string | `jdbc:mysql://<host>:<port>/<db>?sslMode=REQUIRED` |
| `DB_USERNAME` | Database username | `root` or `resolveit_user` |
| `DB_PASSWORD` | Database password | `<database-password>` |
| `JWT_SECRET` | Secret key for HMAC-SHA256 JWT signing | `<32-plus-char-secret>` |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `https://frontend-sandy-delta-64.vercel.app` |
| `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE` | Max JDBC connections | `5` (cloud free tier) |
| `JAVA_TOOL_OPTIONS` | JVM memory parameters | `-XX:MaxRAMPercentage=70 -XX:+UseSerialGC` |
| `SEED_ENABLED` | Seed demo data on initial database creation | `false` (default) |
| `SEED_DEMO_PASSWORD` | Password for seeded demo accounts | `<seed-password>` |

### Frontend Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend REST API | `http://localhost:8080/api` |
| `VITE_POLL_SECONDS` | Interval for live notification polling | `5` |
| `VITE_ALERT_SECONDS` | Duration before live toast dismisses | `30` |

## Tests

| Test Suite | Environment | Total Checks | Passed | Coverage / Details |
|---|---|---|---|---|
| **Local Quality Gates** | Local | 297 | 297 | Backend (80), Vitest (67), Newman (34), Playwright (93), Scan (3) |
| **Live Cloud Verification** | Live | 32 | 32 | Auth, RBAC, Complaint Lifecycle, Playwright Browser & Viewports |

Run the complete local test pipeline:
```bash
node scripts/run-all-tests.mjs
```

## Deployment

ResolveIT is deployed across three cloud platforms: the React frontend is hosted on **Vercel** with global edge caching and SPA client routing rewrites; the Spring Boot backend runs inside a multi-stage Docker container on **Render** (free-tier web service in Singapore with memory-tuned JVM flags); and the persistence layer is hosted on **Aiven** as a managed MySQL 8 database connected securely over TLS (port 22945).

## Project Structure

```text
resolveit-smart-ticket-system/
├── backend/              # Spring Boot 3.3.5 Java application (REST API & Security)
├── frontend/             # React 18 + Vite SPA application (UI & Contexts)
├── database/             # Database documentation, ER diagrams, data dictionary
├── docs/                 # Operational guides (Deployment, Responsive, Postman)
├── postman/              # Postman collection & environment for API testing
├── scripts/              # Master test pipeline orchestrator (run-all-tests.mjs)
├── Dockerfile            # Multi-stage Eclipse Temurin 21 container packaging
├── render.yaml           # Render Cloud Infrastructure as Code blueprint
└── README.md             # Project documentation
```

## Author

- **Ramprasad Prajapat:** [https://github.com/Ramprasad-Prajapat](https://github.com/Ramprasad-Prajapat)
- **Repository:** [https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system](https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system)
