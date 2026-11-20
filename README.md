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

Prerequisites: Java 21, Maven, Node 18+, MySQL 8.

1. Clone the repository:
   ```bash
   git clone https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system.git
   cd resolveit-smart-ticket-system
   ```

2. Create the database (`resolveit_simple_db`):
   ```sql
   CREATE DATABASE resolveit_simple_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Configure and start the backend:
   ```bash
   cd backend
   # Create your local config from the template:
   cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties
   ```
   In `src/main/resources/application-local.properties`, set your local MySQL password and demo seed password:
   ```properties
   spring.datasource.password=YOUR_LOCAL_PASSWORD
   app.seed.enabled=true
   app.seed.demo-password=Demo@1234
   ```
   Then start the backend:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=local
   ```

4. Start the frontend:
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   Open http://localhost:5173 and log in with a demo account (password `Demo@1234`).

## Environment Variables

### Backend Variables

| Variable | Description |
|---|---|
| `DB_URL` | JDBC database connection string |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret key for JWT signing |
| `CORS_ORIGINS` | Allowed frontend origins |

### Frontend Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend REST API |

Optional (defaults are fine): PORT, SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE, JAVA_TOOL_OPTIONS, SEED_ENABLED, SEED_DEMO_PASSWORD, VITE_POLL_SECONDS, VITE_ALERT_SECONDS.

## Tests

297 local checks and 32 live checks, all passed. Run them with:
```bash
node scripts/run-all-tests.mjs
```

## Deployment

- Frontend on Vercel
- Backend on Render (Docker)
- Database on Aiven (MySQL over TLS)

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
