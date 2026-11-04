import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8081/api';
let failed = false;

function pass(name, detail = '') {
  console.log(`[PASS] ${name}${detail ? ' - ' + detail : ''}`);
}

function fail(name, detail = '') {
  console.error(`[FAIL] ${name}${detail ? ' - ' + detail : ''}`);
  failed = true;
}

async function run() {
  console.log('====================================================');
  console.log(`Starting ResolveIT Live Smoke Test against ${BASE_URL}`);
  console.log('====================================================\n');

  const ts = Date.now();
  const smokeEmail = `smoke.${ts}@example.test`;
  const initialPassword = 'SmokePassword1';
  const updatedPassword = 'NewSmokePassword1';
  let token = null;
  let complaintId = null;

  // ----------------------------------------------------
  // Check 1: Register unique user -> login -> GET /me
  // ----------------------------------------------------
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Smoke Tester',
        email: smokeEmail,
        password: initialPassword
      })
    });

    if (regRes.status !== 201) {
      const err = await regRes.text();
      fail('Check 1: Register unique user', `Expected 201, got ${regRes.status}: ${err}`);
    } else {
      const regData = await regRes.json();
      token = regData.token;

      // Verify login explicitly
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: smokeEmail, password: initialPassword })
      });
      const loginData = await loginRes.json();

      // Verify GET /me
      const meRes = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const meData = await meRes.json();

      if (loginRes.status === 200 && meRes.status === 200 && meData.email === smokeEmail) {
        pass('Check 1: User register -> login -> GET /me', `Registered & verified ${smokeEmail}`);
      } else {
        fail('Check 1: User register -> login -> GET /me', `Login/me failed`);
      }
    }
  } catch (err) {
    fail('Check 1: User register -> login -> GET /me', err.message);
  }

  // ----------------------------------------------------
  // Check 2: Complaint CRUD, comment, USER 403 on IN_PROGRESS, delete
  // ----------------------------------------------------
  try {
    if (!token) throw new Error('Cannot proceed without token from Check 1');

    // 2a: Create complaint
    const createRes = await fetch(`${BASE_URL}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Smoke Test Ticket',
        description: 'Smoke test ticket description with sufficient length',
        category: 'NETWORK',
        priority: 'MEDIUM'
      })
    });
    const createData = await createRes.json();
    complaintId = createData.id;

    // 2b: Read complaint
    const readRes = await fetch(`${BASE_URL}/complaints/${complaintId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const readData = await readRes.json();

    // 2c: Update complaint (title/description while OPEN)
    const updateRes = await fetch(`${BASE_URL}/complaints/${complaintId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Updated Smoke Test Ticket',
        description: 'Updated smoke test description with sufficient length',
        category: 'NETWORK',
        priority: 'HIGH'
      })
    });

    // 2d: Add comment
    const commentRes = await fetch(`${BASE_URL}/complaints/${complaintId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        message: 'Smoke test comment adding additional information.'
      })
    });

    // 2e: Attempt status transition to IN_PROGRESS as USER (must return 403)
    const statusRes = await fetch(`${BASE_URL}/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        status: 'IN_PROGRESS',
        note: 'User attempting to mark in progress'
      })
    });

    // 2f: Delete complaint
    const deleteRes = await fetch(`${BASE_URL}/complaints/${complaintId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (
      createRes.status === 201 &&
      readRes.status === 200 &&
      updateRes.status === 200 &&
      commentRes.status === 201 &&
      statusRes.status === 403 &&
      deleteRes.status === 204
    ) {
      pass(
        'Check 2: Complaint CRUD + Comment + Permission Guard (USER 403 on IN_PROGRESS)',
        `Ticket #${complaintId} verified and removed`
      );
    } else {
      fail(
        'Check 2: Complaint CRUD',
        `create=${createRes.status}, read=${readRes.status}, update=${updateRes.status}, comment=${commentRes.status}, statusChange=${statusRes.status} (expected 403), delete=${deleteRes.status}`
      );
    }
  } catch (err) {
    fail('Check 2: Complaint CRUD', err.message);
  }

  // ----------------------------------------------------
  // Check 3: Change password -> login with new -> old fails
  // ----------------------------------------------------
  try {
    if (!token) throw new Error('Cannot proceed without token');

    const changePwRes = await fetch(`${BASE_URL}/auth/me/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: updatedPassword
      })
    });

    // Old password should fail (401)
    const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: smokeEmail, password: initialPassword })
    });

    // New password should succeed (200)
    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: smokeEmail, password: updatedPassword })
    });

    if (changePwRes.status === 204 && oldLoginRes.status === 401 && newLoginRes.status === 200) {
      pass('Check 3: Password change flow', 'Password changed, old password rejected, new password authenticated');
    } else {
      fail('Check 3: Password change flow', `change=${changePwRes.status}, oldLogin=${oldLoginRes.status}, newLogin=${newLoginRes.status}`);
    }
  } catch (err) {
    fail('Check 3: Password change flow', err.message);
  }

  // ----------------------------------------------------
  // Check 4: CORS preflight (OPTIONS with Origin: http://localhost:5173)
  // ----------------------------------------------------
  try {
    const corsRes = await fetch(`${BASE_URL}/complaints`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET'
      }
    });

    const allowOrigin = corsRes.headers.get('access-control-allow-origin');
    if (allowOrigin === 'http://localhost:5173' || allowOrigin === '*') {
      pass('Check 4: CORS preflight', `Origin http://localhost:5173 allowed (header: ${allowOrigin})`);
    } else {
      fail('Check 4: CORS preflight', `access-control-allow-origin header was "${allowOrigin}"`);
    }
  } catch (err) {
    fail('Check 4: CORS preflight', err.message);
  }

  // ----------------------------------------------------
  // Check 5: Static scan for leaked credentials
  // ----------------------------------------------------
  try {
    const forbiddenPatterns = ['Demo@1234', 'admin@resolveit.com'];
    const violations = [];

    function scanDir(dir, filterFn) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath, filterFn);
        } else if (entry.isFile()) {
          if (filterFn(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            for (const p of forbiddenPatterns) {
              if (content.includes(p)) {
                violations.push({ file: fullPath, pattern: p });
              }
            }
          }
        }
      }
    }

    // Scan frontend/src (excluding test files)
    scanDir(path.join(rootDir, 'frontend', 'src'), (p) => {
      const normalized = p.replace(/\\/g, '/');
      return !normalized.includes('/src/test/');
    });

    // Scan frontend/dist
    scanDir(path.join(rootDir, 'frontend', 'dist'), () => true);

    // Scan committed config files
    const configFiles = [
      path.join(rootDir, 'backend', 'src', 'main', 'resources', 'application.properties'),
      path.join(rootDir, 'backend', 'src', 'main', 'resources', 'application-prod.properties'),
      path.join(rootDir, 'frontend', '.env.example')
    ];

    for (const cf of configFiles) {
      if (fs.existsSync(cf)) {
        const content = fs.readFileSync(cf, 'utf8');
        for (const p of forbiddenPatterns) {
          if (content.includes(p)) {
            violations.push({ file: cf, pattern: p });
          }
        }
      }
    }

    if (violations.length === 0) {
      pass('Check 5: Static scan for demo credentials', 'No committed demo credentials found in frontend or configs');
    } else {
      fail(
        'Check 5: Static scan for demo credentials',
        `Found ${violations.length} violations: ` +
          violations.map((v) => `${path.relative(rootDir, v.file)} (${v.pattern})`).join(', ')
      );
    }
  } catch (err) {
    fail('Check 5: Static scan', err.message);
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  if (failed) {
    console.error('Smoke Test: FAILED');
    process.exit(1);
  } else {
    console.log('Smoke Test: ALL PASS');
    process.exit(0);
  }
}

run();
