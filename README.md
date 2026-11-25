# ResolveIT — Smart Complaint & Ticket Management System

ResolveIT is an enterprise-grade service desk and complaint tracking system engineered with a modern decoupled architecture: a **React 18** Single-Page Application (SPA) on the frontend, a **Spring Boot 3.3.5** RESTful API with **Spring Security 6** on the backend, and a high-availability **MySQL 8** database.

Designed to mirror realistic corporate support workflows, ResolveIT features strict Role-Based Access Control (RBAC), a deterministic ticket lifecycle state machine, real-time alert notifications via non-blocking polling, audit logging, brute-force protection, and responsive UI scaling across all device viewports.

---

## Live Links

| Service | Endpoint / URL | Status |
|---|---|---|
| **Frontend (Primary)** | [https://resolveit-smart-ticket-system.vercel.app](https://resolveit-smart-ticket-system.vercel.app) | **Live** (Vercel Production Domain) |
| **Frontend (Verified Alias)** | [https://frontend-sandy-delta-64.vercel.app](https://frontend-sandy-delta-64.vercel.app) | **Live** (Verified Production Domain) |
| **Backend Health Check** | [https://resolveit-backend-z0js.onrender.com/api/health](https://resolveit-backend-z0js.onrender.com/api/health) | **Live** (Docker Web Service on Render) |
| **GitHub Repository** | [https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system](https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system) | **Public** |

> **Note on Deployment & API Connectivity:**
> - Both frontend domains (`resolveit-smart-ticket-system.vercel.app` and `frontend-sandy-delta-64.vercel.app`) serve the active production build on Vercel's global edge network with valid TLS/SSL certificates.
> - Full end-to-end API communication and authentication are actively verified on `https://frontend-sandy-delta-64.vercel.app`. Browser-level API calls from `https://resolveit-smart-ticket-system.vercel.app` require appending the new origin to Render's `CORS_ORIGINS` environment variable (scheduled as a separate pending backend configuration task).
> - **Backend Cold Starts:** The backend runs on Render's free tier, which spins down containers after 15 minutes of inactivity. When accessed after an idle period, the initial request takes 45 to 90 seconds while the container initializes. Once awake, subsequent API responses complete in under 100ms.

---

## Demo Credentials

The application is pre-seeded with five test accounts covering all authorization tiers across both local and production environments:

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **ADMIN** | `admin@resolveit.com` | `Demo@1234` | Full platform oversight, reassign tickets to any agent, manage users, view all audit events |
| **AGENT** | `agent1@resolveit.com` | `Demo@1234` | View ticket queue, self-assign open tickets, update assigned status to `IN_PROGRESS` / `RESOLVED` |
| **AGENT** | `agent2@resolveit.com` | `Demo@1234` | Handle assigned queue, collaborate on tickets, resolve service requests |
| **USER** | `user1@resolveit.com` | `Demo@1234` | Submit complaints/tickets, track status, add comments, reopen resolved tickets |
| **USER** | `user2@resolveit.com` | `Demo@1234` | Submit complaints, view personal ticket history, engage in ticket discussions |

---

## Key Features

- **Role-Based Access Control (RBAC):** Three distinct roles (`USER`, `AGENT`, `ADMIN`) enforced through Spring Security 6 URL filters, method-level authorization, and React Router protected route guards.
- **Deterministic Ticket Lifecycle:** Strict state transitions (`OPEN` → `IN_PROGRESS` → `RESOLVED`). Only the original ticket creator or an administrator can reopen a resolved ticket, returning it to `OPEN`.
- **Dynamic Admin Reassignment:** Administrators can reassign any ticket to a different agent at any point. Reassignment immediately updates assignment boundaries and revokes the previous agent's status update privileges.
- **Non-Blocking Alert Notifications:** Light-weight background polling checks for ticket status changes and assignment updates every 5 seconds, displaying non-intrusive color-coded toast notifications.
- **Audit Logging & Discussion Thread:** Each ticket maintains an immutable timeline recording state transitions, assignments, and chronological comment threads between users, agents, and administrators.
- **Search, Filtering & Pagination:** Server-backed filtering by category, priority, status, and agent assignment, complemented by client-side search across ticket titles and descriptions.
- **Brute-Force Attack Protection:** In-memory sliding window rate limiter locks accounts with `HTTP 429 Too Many Requests` for 15 minutes after 5 consecutive failed authentication attempts.
- **Adaptive Responsive Design:** Mobile-first architecture tested from 320px mobile viewports up to 1920px desktop displays, featuring dynamic table-to-card transformations and WCAG-compliant touch targets.

---

## Technology Stack

```
Frontend:  React 18  •  Vite 5  •  React Router 6  •  Fetch API  •  Vanilla CSS
Backend:   Java 21 LTS  •  Spring Boot 3.3.5  •  Spring Security 6  •  Hibernate / JPA
Database:  MySQL 8.0+ (Aiven Cloud Managed)  •  HikariCP Connection Pool
DevOps:    Docker (Multi-Stage Build)  •  Render  •  Vercel Edge  •  GitHub Actions
Testing:   JUnit 5  •  Mockito  •  Vitest  •  Playwright  •  Newman / Postman
```

### Detailed Component Matrix

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend UI** | React 18, Vite 5 | Component-driven Single-Page Application (SPA) with fast HMR |
| **Routing & State** | React Router DOM 6, React Context | Declarative client routing and centralized auth/toast state management |
| **Styling** | Vanilla CSS3 (Custom Properties) | Zero-runtime-overhead design system with full dark/light palette support |
| **Backend Framework** | Spring Boot 3.3.5, Java 21 LTS | High-performance enterprise REST API runtime |
| **Security & Auth** | Spring Security 6, JJWT 0.12.6 | Stateless JWT authentication, BCrypt password hashing, RBAC filters |
| **Data Persistence** | Spring Data JPA, Hibernate 6 | ORM domain model, declarative repositories, automated DDL migrations |
| **Connection Pooling** | HikariCP | High-throughput JDBC connection pooling tuned for cloud constraints |
| **Database** | MySQL 8.0+ (Aiven Cloud) | Relational database with InnoDB engine, UTF-8mb4 charset, and TLS enforcement |
| **Containerization** | Docker (Eclipse Temurin 21 JRE) | Multi-stage lightweight container packaging (~200MB image footprint) |
| **Cloud Hosting** | Vercel (Frontend), Render (Backend) | Edge CDN frontend distribution paired with cloud container execution |

---

## Project Structure

```text
resolveit-smart-ticket-system/
├── backend/
│   ├── src/main/java/com/resolveit/
│   │   ├── config/             # Spring Security, CORS, and JPA configurations
│   │   ├── controller/         # REST endpoints (Auth, Tickets, Comments, Admin)
│   │   ├── dto/                # Request & Response Data Transfer Objects
│   │   ├── entity/             # JPA domain entities (User, Ticket, Comment, Audit)
│   │   ├── exception/          # Global exception handler and custom error types
│   │   ├── repository/         # Spring Data JPA data access interfaces
│   │   ├── security/           # JWT token provider, filter, and user details
│   │   └── service/            # Core business logic and state machine validation
│   └── src/main/resources/
│       ├── application.properties               # Base production configuration
│       └── application-local.properties.example # Template for local development
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI widgets (Navbar, Modal, AlertToast)
│   │   ├── pages/              # Views (Home, Login, Register, Dashboard, Details)
│   │   ├── styles/             # Modular CSS stylesheets and responsive rules
│   │   ├── api.js              # Centralized Fetch wrapper with JWT injection
│   │   ├── App.jsx             # Route definitions and layout wrapper
│   │   └── AuthContext.jsx     # Authentication state provider
│   └── vercel.json             # Vercel SPA routing rewrite rules
├── database/                   # Schema scripts, ER diagrams, data dictionary
├── docs/                       # Operational guides (DEPLOYMENT.md, RESPONSIVE.md)
├── postman/                    # Postman collection & environment for API testing
├── scripts/                    # Test runner scripts (run-all-tests.mjs)
├── Dockerfile                  # Multi-stage production container build
├── render.yaml                 # Infrastructure as Code blueprint for Render
└── README.md                   # Primary project documentation
```

---

## Local Setup & Development

### Prerequisites

- **Java Development Kit (JDK):** Version 21 LTS
- **Build Tool:** Apache Maven 3.9+
- **Node.js:** Version 18.x or 20.x LTS with npm
- **Database:** Local MySQL 8.0+ server (or Docker container)
- **Git:** Version 2.30+

### Step 1: Clone the Repository

```bash
git clone https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system.git
cd resolveit-smart-ticket-system
```

### Step 2: Set Up Local MySQL Database

Create a local UTF-8mb4 database using MySQL CLI or your preferred GUI client:

```sql
CREATE DATABASE resolveit_simple_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 3: Configure and Run the Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Copy the sample local configuration file:
   ```bash
   cp src/main/resources/application-local.properties.example src/main/resources/application-local.properties
   ```

3. Update `src/main/resources/application-local.properties` with your database credentials:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/resolveit_simple_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   spring.datasource.username=root
   spring.datasource.password=YOUR_LOCAL_MYSQL_PASSWORD
   app.seed.enabled=true
   app.seed.demo-password=Demo@1234
   ```

4. Launch the Spring Boot backend with the `local` profile:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.profiles=local
   ```
   The backend will start on `http://localhost:8080`. Verify by checking:
   ```bash
   curl http://localhost:8080/api/health
   # Response: {"status":"UP"}
   ```

### Step 4: Configure and Run the Frontend

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser. Log in with any demo account (password `Demo@1234`).

---

## Environment Variables

### Backend Configuration (Render / Production)

| Variable | Description | Example / Default | Required |
|---|---|---|---|
| `DB_URL` | JDBC connection string | `jdbc:mysql://<host>:<port>/defaultdb?sslMode=REQUIRED&serverTimezone=UTC` | Yes |
| `DB_USERNAME` | Database connection username | `avnadmin` | Yes |
| `DB_PASSWORD` | Database connection password | `<secure-password>` | Yes |
| `JWT_SECRET` | Base64-encoded or raw 256-bit signing key | `<64-character-hex-or-base64>` | Yes |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | `https://resolveit-smart-ticket-system.vercel.app,https://frontend-sandy-delta-64.vercel.app` | Yes |
| `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE` | Maximum JDBC pool connections | `5` | No (Default: 5) |
| `JAVA_TOOL_OPTIONS` | JVM memory limits and GC parameters | `-XX:MaxRAMPercentage=70 -XX:+UseSerialGC` | No |
| `SEED_ENABLED` | Toggle demo data seeding on startup | `false` (set `true` on initial setup) | No |
| `SEED_DEMO_PASSWORD` | Password assigned to seeded demo users | `Demo@1234` | Only if seeded |

### Frontend Configuration (Vercel / Production)

| Variable | Description | Production Value |
|---|---|---|
| `VITE_API_BASE_URL` | Target base URL of the backend REST API | `https://resolveit-backend-z0js.onrender.com/api` |
| `VITE_POLL_SECONDS` | Polling frequency for notification alerts | `5` (Default) |
| `VITE_ALERT_SECONDS` | Display duration for toast messages | `4` (Default) |

---

## Testing & Verification

The codebase includes an extensive multi-tier verification suite covering backend unit and integration tests, frontend component tests, and end-to-end API workflows:

```bash
# Run comprehensive automated test suite (297 local checks)
node scripts/run-all-tests.mjs

# Run backend unit and integration tests only
cd backend && mvn test

# Run frontend tests only
cd frontend && npm test
```

---

## Production Deployment Summary

ResolveIT is deployed across three cloud platforms:
1. **Frontend:** Deployed to **Vercel** with automatic deployment on commits to `main`. Custom domains are mapped directly in project settings with zero-downtime routing.
2. **Backend:** Packaged via multi-stage **Docker** build and deployed on **Render** (Singapore region) with automatic deployments on `main`.
3. **Database:** Hosted on **Aiven** running managed MySQL 8 with TLS encryption required (`sslMode=REQUIRED`).

For full step-by-step infrastructure provisioning, configuration guidelines, and rollback runbooks, see the [Production Deployment Guide](file:///C:/Resume-Project/resolveit-smart-ticket-system/docs/DEPLOYMENT.md).

---

## Author

- **Ramprasad Prajapat**
- GitHub: [https://github.com/Ramprasad-Prajapat](https://github.com/Ramprasad-Prajapat)
- Repository: [https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system](https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system)
