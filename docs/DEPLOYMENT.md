# ResolveIT — Production Deployment Guide (Aiven + Render + Vercel)

This guide documents the full architecture, configuration steps, and operational procedures required to deploy and maintain the **ResolveIT Smart Complaint & Ticket Management System** in production across cloud providers.

---

## 1. Architecture Overview

```mermaid
flowchart LR
    Browser["Client Browser (Desktop / Mobile)"] -->|HTTPS / Edge CDN| Vercel["Frontend (Vercel SPA)<br/>resolveit-smart-ticket-system.vercel.app<br/>frontend-sandy-delta-64.vercel.app"]
    Vercel -->|CORS REST Requests + Bearer JWT| Render["Backend API (Render Docker Web Service)<br/>resolveit-backend-z0js.onrender.com"]
    Render -->|TLS / JDBC Port 3306| Aiven["Database (Aiven Managed MySQL 8)<br/>defaultdb (sslMode=REQUIRED)"]
```

- **Frontend (Vercel):** React 18 SPA hosted on **Vercel** with global CDN edge routing and client-side route rewrites via `vercel.json`. Configured with two active production domains:
  - **Primary:** `https://resolveit-smart-ticket-system.vercel.app`
  - **Verified Alias:** `https://frontend-sandy-delta-64.vercel.app`
- **Backend (Render):** Spring Boot 3.3.5 containerized via multi-stage Docker on **Render** (Free tier, Singapore region, auto-sleeps after 15 minutes of inactivity).
  - **Live URL:** `https://resolveit-backend-z0js.onrender.com`
  - **Health Endpoint:** `https://resolveit-backend-z0js.onrender.com/api/health`
- **Database (Aiven):** Managed MySQL 8 on **Aiven** cloud with SSL/TLS encryption enforced (`sslMode=REQUIRED`).

---

## 2. Prerequisites & Accounts

1. **GitHub Repository:** `https://github.com/Ramprasad-Prajapat/resolveit-smart-ticket-system`
2. **Aiven Console:** `https://console.aiven.io/` (Project: `ramprasadprajapat709-500c`)
3. **Render Dashboard:** `https://dashboard.render.com/` (Service: `resolveit-backend`)
4. **Vercel Dashboard:** `https://vercel.com/ramprasad-prajapats-projects` (Project: `resolveit-smart-ticket-system`)

---

## 3. Step 1: Push Code to GitHub

From the local project root (`C:\Resume-Project\resolveit-smart-ticket-system`):

```bash
git push -u origin main
```

Both Vercel and Render are configured with automatic deployments connected to the `main` branch:
- Pushes modifying `frontend/` trigger a new build and edge deployment on Vercel.
- Pushes modifying `backend/` or `Dockerfile` trigger a container build and rolling deployment on Render.

---

## 4. Step 2: Aiven MySQL Configuration

1. Log in to the [Aiven Console](https://console.aiven.io/account/a5c9a2562d42/project/ramprasadprajapat709-500c/services).
2. Locate the existing **MySQL** service:
   - Ensure service status is **Running**.
   - Note the connection parameters: **Host**, **Port** (e.g., `14125`), **User** (`avnadmin`), and **Password**.
3. Verify connection over TLS using MySQL CLI:
   ```bash
   mysql -h <host> -P <port> -u avnadmin -p --ssl-mode=REQUIRED
   ```
4. Construct the JDBC connection URL for Render:
   ```
   jdbc:mysql://<host>:<port>/defaultdb?sslMode=REQUIRED&serverTimezone=UTC
   ```

---

## 5. Step 3: Render Backend Deployment

### Service Settings
- **Service Name:** `resolveit-backend`
- **Environment:** `Docker`
- **Region:** `Singapore (Southeast Asia)`
- **Root Directory:** `backend`
- **Dockerfile Path:** `./Dockerfile`
- **Docker Build Context:** `.`
- **Branch:** `main`
- **Instance Type:** `Free`
- **Auto-Deploy:** `On Commit`
- **Health Check Path:** `/api/health`

### Environment Variables on Render

| Variable | Description | Sensitivity |
|---|---|---|
| `DB_URL` | `jdbc:mysql://<host>:<port>/defaultdb?sslMode=REQUIRED&serverTimezone=UTC` | Secret |
| `DB_USERNAME` | Database username (`avnadmin`) | Secret |
| `DB_PASSWORD` | Database password from Aiven console | Secret |
| `JWT_SECRET` | 256-bit secret key for HMAC-SHA256 JWT signing | Secret |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins (see Step 5) | Config |
| `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE` | `5` (preserves connection pool limits on free tier) | Config |
| `JAVA_TOOL_OPTIONS` | `-XX:MaxRAMPercentage=70 -XX:+UseSerialGC` | Config |
| `SEED_ENABLED` | `false` in steady state (`true` on initial setup) | Config |
| `SEED_DEMO_PASSWORD` | Pre-configured demo user password | Secret |

---

## 6. Step 4: Vercel Frontend Deployment & Custom Domains

### Initial Project Setup
1. Log in to the [Vercel Dashboard](https://vercel.com/ramprasad-prajapats-projects).
2. Import repository `Ramprasad-Prajapat/resolveit-smart-ticket-system`.
3. Configure build settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Set Environment Variables:
   - `VITE_API_BASE_URL` = `https://resolveit-backend-z0js.onrender.com/api`
5. Deploy project.

### Managing Production Domains
In Vercel **Project Settings → Domains**, multiple production domains can be attached simultaneously without project renaming:
- `resolveit-smart-ticket-system.vercel.app` (Target: `Production`, Redirect: `None`, SSL: `Valid Configuration`)
- `frontend-sandy-delta-64.vercel.app` (Target: `Production`, Redirect: `None`, SSL: `Valid Configuration`)

Both domains serve the current production deployment instantaneously without requiring a rebuild or project rename.

---

## 7. Step 5: CORS Configuration & Multi-Domain Support

Backend CORS authorization is driven by the `CORS_ORIGINS` environment variable in Render, parsed by `SecurityConfig.java`:

```properties
app.cors.allowed-origins=${CORS_ORIGINS:http://localhost:5173}
```

### Active CORS Allowlist
```
CORS_ORIGINS=https://frontend-sandy-delta-64.vercel.app,https://frontend-brolyy7aw-ramprasad-prajapats-projects.vercel.app,http://localhost:5173
```

### Pending Target Allowlist
To enable direct browser API calls from the clean primary domain, update `CORS_ORIGINS` on Render:
```
CORS_ORIGINS=https://resolveit-smart-ticket-system.vercel.app,https://frontend-sandy-delta-64.vercel.app,http://localhost:5173
```

> **Operational Notice:** Updating environment variables on Render triggers a service restart and redeploy (~2 minutes boot time). This update is scheduled as a dedicated, approved maintenance window. Until updated, API requests originating from `resolveit-smart-ticket-system.vercel.app` receive `HTTP 403 Invalid CORS request`, whereas `frontend-sandy-delta-64.vercel.app` remains fully operational.

---

## 8. Verifying the Deployment

### Smoke Tests Runbook
- [x] **Backend Health Check:**
  ```bash
  curl -i https://resolveit-backend-z0js.onrender.com/api/health
  # HTTP/1.1 200 OK -> {"status":"UP"}
  ```
- [x] **Frontend Asset Parity:**
  Both `https://resolveit-smart-ticket-system.vercel.app` and `https://frontend-sandy-delta-64.vercel.app` serve identical HTML, asset bundles (`/assets/index-CWSeh7PI.js`), and valid SSL certificates from Google Trust Services.
- [x] **SPA Direct Routing:**
  Direct navigation and page reloads on `/login`, `/register`, and `/dashboard` succeed with `HTTP 200` via `vercel.json` rewrites.
- [x] **End-to-End Authentication & Workflows (Verified on Alias):**
  Full login with all five demo roles (`admin@resolveit.com`, `agent1@resolveit.com`, `user1@resolveit.com`), ticket creation, agent status transitions, and audit logs pass verification on `https://frontend-sandy-delta-64.vercel.app`.

### Cold-Start Behavior (Render Free Tier)
Render spins down free web services after 15 minutes of inactivity:
- Initial requests after idle sleep take **45 to 90 seconds** while the JVM container initializes and establishes MySQL database connection pools.
- Once awake, subsequent API calls respond in **<100ms**.

---

## 9. Rollback & Troubleshooting Runbook

- **Frontend Rollback (Vercel):**
  In Vercel **Deployments**, locate the last healthy deployment, click **... → Promote to Production**. Rollback is instantaneous globally across all attached domains.
- **Frontend Domain Removal:**
  In Vercel **Settings → Domains**, click **Edit** on the domain to remove and click **Remove**. Existing domains remain untouched.
- **Backend Rollback (Render):**
  In Render **Events**, locate the previous successful deploy (e.g., `dep-dbo21oc9v7es73e37270`) and click **Rollback to this deploy**.
- **Database Schema:**
  The production schema is managed by Hibernate JPA (`ddl-auto=update`). In case of connection failure, verify Aiven service state and HikariCP connection pool metrics.
