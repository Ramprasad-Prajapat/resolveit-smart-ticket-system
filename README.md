# ResolveIT — Smart Complaint & Ticket Management System

ResolveIT is an enterprise-grade service desk and complaint tracking system engineered with a modern decoupled architecture: a **React 18** Single-Page Application (SPA) on the frontend, a **Spring Boot 3.3.5** RESTful API with **Spring Security 6** on the backend, and a high-availability **MySQL 8** database.

Designed to mirror realistic corporate support workflows, ResolveIT features strict Role-Based Access Control (RBAC), a deterministic ticket lifecycle state machine, real-time alert notifications via non-blocking polling, audit logging, brute-force protection, and responsive UI scaling across all device viewports.

---

## Live Links

| Service | Endpoint / URL | Status |
|---|---|---|
| **Frontend** | [https://resolveit-smart-ticket-system.vercel.app](https://resolveit-smart-ticket-system.vercel.app) | **Live** (Vercel Production Domain) |
| **Backend Health Check** | [https://resolveit-backend-z0js.onrender.com/api/health](https://resolveit-backend-z0js.onrender.com/api/health) | **Live** (Docker Web Service on Render) |
| **GitHub Repository** | [https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system](https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system) | **Public** |

> **Note on Backend Cold Starts:** The backend is hosted on Render's free tier, which goes to sleep after 15 minutes of inactivity. When visiting after an idle period, the initial cold start can take 45 to 90 seconds while the container initializes. Once awake, subsequent API requests respond in under 100ms.

---

## Demo Credentials

The application is pre-seeded with five test accounts covering all authorization tiers across both local and production environments:

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **ADMIN** | `admin@resolveit.com` | `Demo@1234` | Full access, assign/reassign tickets, manage user accounts |
| **AGENT** | `agent1@resolveit.com` | `Demo@1234` | View all tickets, update assigned status to IN_PROGRESS / RESOLVED |
| **AGENT** | `agent2@resolveit.com` | `Demo@1234` | View all tickets, handle assigned service requests |
| **USER** | `user1@resolveit.com` | `Demo@1234` | Create tickets, view/edit own tickets, post comments, reopen resolved tickets |
| **USER** | `user2@resolveit.com` | `Demo@1234` | Create tickets, track complaint status, add discussion comments |

---

## What It Does

- **Role-Based Access Control (RBAC):** Three roles (`USER`, `AGENT`, `ADMIN`) with strict client and server authorization.
- **Ticket Lifecycle Management:** Strict state machine transitions (`OPEN` -> `IN_PROGRESS` -> `RESOLVED`), with user ticket reopening.
- **Admin Reassignment:** Administrators can reassign a ticket to any agent at any time, instantly revoking previous agent edit permissions.
- **Live Alert Toasts:** Periodic 5-second polling displays non-blocking color-coded alert popups for ticket assignments and status updates.
- **Discussion Threads & History:** Commenting on tickets with an immutable chronological audit trail tracking all state transitions.
- **Search, Filtering & Pagination:** Full-text search and filtering by category, priority, status, and assignment.
- **Brute-Force Protection:** Rate limiting locks accounts with HTTP 429 for 15 minutes after 5 consecutive failed login attempts.
- **Responsive Design:** Fluid layout across all devices (320px mobile to desktop) with table-to-card transformations and touch targets.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, React Router DOM 6, Native Fetch, Vanilla CSS |
| **Backend** | Java 21 LTS, Spring Boot 3.3.5, Spring Security 6, Spring Data JPA, JJWT 0.12.6, Maven |
| **Database** | MySQL 8.0+ (InnoDB, UTF8mb4), HikariCP connection pool |
| **Cloud Hosting** | Vercel (Frontend SPA), Render (Backend Docker), Aiven (Managed MySQL) |
| **Testing** | JUnit 5, Mockito, JaCoCo, Vitest, Newman (Postman), Playwright |

---

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

---

## Environment Variables

### Backend Configuration (Render / Production)

| Variable | Description | Example / Default | Required |
|---|---|---|---|
| `DB_URL` | JDBC database connection string | `jdbc:mysql://<host>:<port>/<database>?sslMode=REQUIRED&serverTimezone=UTC` | Yes |
| `DB_USERNAME` | Database username | `avnadmin` | Yes |
| `DB_PASSWORD` | Database password | `<Aiven Password>` | Yes |
| `JWT_SECRET` | Secret key for JWT signing | 48+ character secure secret | Yes |
| `CORS_ORIGINS` | Allowed frontend origins | `https://resolveit-smart-ticket-system.vercel.app` | Yes |
| `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE` | Maximum JDBC pool connections | `5` | No |
| `JAVA_TOOL_OPTIONS` | JVM memory limits and GC parameters | `-XX:MaxRAMPercentage=70 -XX:+UseSerialGC` | No |
| `SEED_ENABLED` | Toggle demo data seeding on startup | `false` | No |
| `SEED_DEMO_PASSWORD` | Password assigned to seeded demo users | `<Demo Password>` | Only if seeded |

### Frontend Configuration (Vercel / Production)

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend REST API | `https://resolveit-backend-z0js.onrender.com/api` |
| `VITE_POLL_SECONDS` | Polling frequency for notification alerts (seconds) | `5` |
| `VITE_ALERT_SECONDS` | Display duration for toast messages (seconds) | `30` |

---

## Tests

297 local checks and live automated checks, all passed. Run them with:
```bash
node scripts/run-all-tests.mjs
```

---

## Production Deployment Summary

- **Frontend:** Hosted on **Vercel** with automatic deployment on pushes to `main`. Public production domain: `https://resolveit-smart-ticket-system.vercel.app` (previous alias `https://frontend-sandy-delta-64.vercel.app` permanently redirects via HTTP 308).
- **Backend:** Containerized on **Render** (Docker Web Service, Singapore region). Deploys are triggered manually from the Render dashboard.
- **Database:** Hosted on **Aiven** running managed MySQL 8 over TLS (`sslMode=REQUIRED`).

---

## Project Structure

```text
resolveit-smart-ticket-system/
├── backend/
│   ├── src/main/java/com/resolveit/
│   │   ├── config/             # Spring Security, CORS, and demo loaders
│   │   ├── controller/         # REST endpoints (Auth, Complaints, Comments, Admin)
│   │   ├── dto/                # Request & Response Data Transfer Objects
│   │   ├── exception/          # Global exception handler and custom error types
│   │   ├── model/              # JPA domain entities (User, Complaint, Comment, etc.)
│   │   ├── repository/         # Spring Data JPA data access interfaces
│   │   ├── security/           # JWT token provider, filter, and user details
│   │   └── service/            # Business logic and state machine validation
│   ├── src/main/resources/     # Application properties (base, local example, prod)
│   ├── Dockerfile              # Multi-stage production container build
│   └── pom.xml                 # Maven dependencies and build definition
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI widgets (Navbar, Modal, AlertToast)
│   │   ├── pages/              # Views (Home, Login, Register, Dashboard, Details)
│   │   ├── styles/             # Modular CSS stylesheets and responsive rules
│   │   ├── api.js              # Centralized Fetch wrapper with JWT injection
│   │   ├── App.jsx             # Route definitions and layout wrapper
│   │   ├── AuthContext.jsx     # Authentication state provider
│   │   └── NotificationContext.jsx # Background polling and alerts provider
│   ├── package.json            # Dependencies and scripts
│   ├── vercel.json             # Vercel SPA routing rewrite rules
│   └── vite.config.js          # Vite build configuration
├── database/                   # Schema scripts, ER diagrams, data dictionary
├── docs/                       # Operational guides (DEPLOYMENT.md, RESPONSIVE.md)
├── postman/                    # Postman collection & environment for API testing
├── scripts/                    # Test runner scripts (run-all-tests.mjs)
├── render.yaml                 # Infrastructure as Code blueprint for Render
└── README.md                   # Primary project documentation
```

---

## Author

- **Ramprasad Prajapat:** [https://github.com/Ramprasad-Prajapat](https://github.com/Ramprasad-Prajapat)
- **Repository:** [https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system](https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system)
