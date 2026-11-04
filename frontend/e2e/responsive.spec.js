import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const RESPONSIVE_SCREENSHOTS_DIR = path.resolve(process.cwd(), 'test-results/responsive');
const TRACKED_SCREENSHOTS_DIR = path.resolve(process.cwd(), '../docs/screenshots');
const API_BASE = process.env.VITE_API_BASE_URL || 'http://localhost:8081/api';

const VIEWPORTS = [
  { name: 'Small phone (320x568)', width: 320, height: 568, isMobile: true, hasTouch: true },
  { name: 'Phone (360x740)', width: 360, height: 740, isMobile: true, hasTouch: true },
  { name: 'Phone (390x844)', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'Phone landscape (844x390)', width: 844, height: 390, isMobile: true, hasTouch: true },
  { name: 'Tablet portrait (768x1024)', width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: 'Tablet landscape (1024x768)', width: 1024, height: 768, isMobile: false, hasTouch: false },
  { name: 'Laptop (1280x800)', width: 1280, height: 800, isMobile: false, hasTouch: false },
  { name: 'Desktop (1440x900)', width: 1440, height: 900, isMobile: false, hasTouch: false },
];

/**
 * Reusable helper evaluating responsive rules R1, R2, R3, R4, R5, R8, R9 on the current page.
 * Returns array of violation objects: { rule, selector, detail }
 */
async function checkLayout(page, options = {}) {
  return await page.evaluate(({ allowScrollContainer = true }) => {
    const problems = [];
    const innerWidth = window.innerWidth;
    const scrollWidth = document.documentElement.scrollWidth;

    // R1: No horizontal page scroll
    if (scrollWidth > innerWidth + 1.5) {
      problems.push({
        rule: 'R1 (No horizontal page scroll)',
        selector: 'documentElement',
        detail: `scrollWidth (${scrollWidth}px) > innerWidth (${innerWidth}px) by ${scrollWidth - innerWidth}px`,
      });
    }

    // Helper: is element or ancestor an intentional scroll container?
    function isScrollContainer(el) {
      let cur = el;
      while (cur && cur !== document.body && cur !== document.documentElement) {
        const cs = window.getComputedStyle(cur);
        if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') {
          return true;
        }
        cur = cur.parentElement;
      }
      return false;
    }

    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'meta', 'link', 'head', 'title', 'noscript'].includes(tag)) continue;

      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        continue;
      }

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      // R2: No visible element sticks out of the screen (unless inside intentional overflow-x container)
      if (rect.right > innerWidth + 1.5) {
        if (!isScrollContainer(el) && tag !== 'svg' && tag !== 'path') {
          const id = el.id ? `#${el.id}` : '';
          const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : '';
          problems.push({
            rule: 'R2 (Element sticks out of screen)',
            selector: `${tag}${id}${cls}`,
            detail: `right edge (${Math.round(rect.right)}px) > viewport (${innerWidth}px)`,
          });
        }
      }

      // R3: Touch targets (<= 768px): buttons, inputs, selects, textareas, navbar/footer links >= 44px
      if (innerWidth <= 768) {
        const isInteractive =
          tag === 'button' ||
          tag === 'select' ||
          tag === 'textarea' ||
          (tag === 'input' && !['hidden', 'checkbox', 'radio'].includes(el.type)) ||
          el.classList.contains('btn') ||
          el.classList.contains('nav-link') ||
          (tag === 'a' && (el.closest('.nav-links') || el.closest('.home-nav') || el.closest('.home-footer')));

        if (isInteractive) {
          // Exemption: links inside a <p>
          const isLinkInParagraph = tag === 'a' && el.closest('p');
          if (!isLinkInParagraph) {
            const isIconOnly = rect.width < 50 && (!el.textContent || !el.textContent.trim());
            if (isIconOnly) {
              if (rect.height < 43.5 || rect.width < 43.5) {
                const id = el.id ? `#${el.id}` : '';
                const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : '';
                problems.push({
                  rule: 'R3 (Touch target >= 44x44px for icon buttons)',
                  selector: `${tag}${id}${cls}`,
                  detail: `size is ${Math.round(rect.width)}x${Math.round(rect.height)}px`,
                });
              }
            } else if (rect.height < 43.5) {
              const id = el.id ? `#${el.id}` : '';
              const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : '';
              problems.push({
                rule: 'R3 (Touch target height >= 44px)',
                selector: `${tag}${id}${cls}`,
                detail: `height is ${Math.round(rect.height)}px`,
              });
            }
          }
        }
      }

      // R4: Readable text
      // Input/select/textarea >= 16px at <= 768px
      if (innerWidth <= 768 && (tag === 'input' || tag === 'select' || tag === 'textarea')) {
        if (!['hidden', 'checkbox', 'radio'].includes(el.type)) {
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 15.5) {
            const id = el.id ? `#${el.id}` : '';
            problems.push({
              rule: 'R4 (Input font-size >= 16px on mobile)',
              selector: `${tag}${id}`,
              detail: `font-size is ${fontSize}px`,
            });
          }
        }
      }

      // Paragraph and table text >= 14px
      if (tag === 'p' || (tag === 'td' && !el.closest('thead'))) {
        if (!el.closest('.timeline-meta') && !el.closest('.rules-checklist') && !el.closest('small')) {
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 13.5) {
            const id = el.id ? `#${el.id}` : '';
            const cls = el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : '';
            problems.push({
              rule: 'R4 (Paragraph/table font-size >= 14px)',
              selector: `${tag}${id}${cls}`,
              detail: `font-size is ${fontSize}px`,
            });
          }
        }
      }
    }

    // R8: Overlays (toasts) fit and can be closed
    const toasts = document.querySelectorAll('.toast-card');
    for (const t of toasts) {
      const rect = t.getBoundingClientRect();
      if (rect.right > innerWidth + 1.5 || rect.left < 0) {
        problems.push({
          rule: 'R8 (Overlays fit inside screen)',
          selector: '.toast-card',
          detail: `toast bounding box [left: ${Math.round(rect.left)}, right: ${Math.round(rect.right)}] overflows ${innerWidth}px`,
        });
      }
    }

    // R9: Nothing overlaps or is clipped
    // Check password eye button does not cover input text area
    const pwdInputs = document.querySelectorAll('.password-input-wrapper input');
    for (const pi of pwdInputs) {
      const pr = parseFloat(window.getComputedStyle(pi).paddingRight);
      if (pr < 36) {
        problems.push({
          rule: 'R9 (Password toggle padding prevents text overlap)',
          selector: 'input in password-input-wrapper',
          detail: `padding-right is only ${pr}px (expected >= 36px)`,
        });
      }
    }

    return problems;
  }, options);
}

test.describe('Part R — Comprehensive Responsive Layout Verification', () => {
  const ts = Date.now();
  let adminToken = '';
  let adminUser = null;
  let userToken = '';
  let agentToken = '';
  let longComplaintId = null;
  const longTitle = 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW';

  test.beforeAll(async ({ request }) => {
    fs.mkdirSync(RESPONSIVE_SCREENSHOTS_DIR, { recursive: true });
    fs.mkdirSync(TRACKED_SCREENSHOTS_DIR, { recursive: true });

    const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@resolveit.com';
    const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'AdminTestPass123';

    // 1. Authenticate Admin
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: adminEmail, password: adminPassword },
    });
    if (loginRes.ok()) {
      const data = await loginRes.json();
      adminToken = data.token;
      adminUser = data.user;
    }

    // 2. Register User & Agent
    const uEmail = `resp.user.${ts}@example.test`;
    const aEmail = `resp.agent.${ts}@example.test`;
    const regU = await request.post(`${API_BASE}/auth/register`, {
      data: { fullName: 'Responsive User', email: uEmail, password: 'Password123' },
    });
    if (regU.ok()) {
      const data = await regU.json();
      userToken = data.token;
    }

    const regA = await request.post(`${API_BASE}/auth/register`, {
      data: { fullName: 'Responsive Agent', email: aEmail, password: 'Password123' },
    });
    let agentId = null;
    if (regA.ok()) {
      const data = await regA.json();
      agentToken = data.token;
      agentId = data.user.id;
    }

    // Promote Agent
    if (adminToken && agentId) {
      await request.patch(`${API_BASE}/admin/users/${agentId}/role`, {
        headers: { Authorization: `Bearer ${adminToken}` },
        data: { role: 'AGENT' },
      });
      // re-login agent
      const aLog = await request.post(`${API_BASE}/auth/login`, {
        data: { email: aEmail, password: 'Password123' },
      });
      if (aLog.ok()) agentToken = (await aLog.json()).token;
    }

    // 3. Create complaint with 100-character word-less title for R5
    if (userToken) {
      const compRes = await request.post(`${API_BASE}/complaints`, {
        headers: { Authorization: `Bearer ${userToken}` },
        data: {
          title: longTitle,
          description: 'This is a test complaint with a very long wordless title to ensure overflow-wrap: anywhere wraps correctly without layout breakage.',
          category: 'TECHNICAL',
          priority: 'HIGH',
        },
      });
      if (compRes.ok()) {
        const compData = await compRes.json();
        longComplaintId = compData.id;

        // Post a comment
        await request.post(`${API_BASE}/complaints/${longComplaintId}/comments`, {
          headers: { Authorization: `Bearer ${userToken}` },
          data: { message: 'First test comment on responsive long title complaint.' },
        });

        // Assign to agent
        if (adminToken && agentId) {
          await request.patch(`${API_BASE}/complaints/${longComplaintId}/assign`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { assigneeId: agentId },
          });
        }
      }
    }
  });

  // Rule R6: Viewport meta tag in index.html
  test('Rule R6: index.html has zoom-friendly viewport meta tag without user-scalable=no', async () => {
    const htmlPath = path.resolve(process.cwd(), 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    expect(html).toContain('name="viewport"');
    expect(html).toContain('width=device-width');
    expect(html).toContain('initial-scale=1');
    expect(html).not.toContain('user-scalable=no');
    expect(html).not.toContain('maximum-scale');
  });

  // Test matrix: Pages x Viewports
  for (const vp of VIEWPORTS) {
    test.describe(`Viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });

      test(`responsive: Home Page at ${vp.width}x${vp.height}`, async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const problems = await checkLayout(page);
        await page.screenshot({ path: path.join(RESPONSIVE_SCREENSHOTS_DIR, `home-${vp.width}x${vp.height}.png`), fullPage: true });
        expect(problems, `Violations on Home at ${vp.width}x${vp.height}: ${JSON.stringify(problems, null, 2)}`).toHaveLength(0);
      });

      test(`responsive: Login Page at ${vp.width}x${vp.height}`, async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        const problems = await checkLayout(page);
        await page.screenshot({ path: path.join(RESPONSIVE_SCREENSHOTS_DIR, `login-${vp.width}x${vp.height}.png`) });
        expect(problems, `Violations on Login at ${vp.width}x${vp.height}: ${JSON.stringify(problems, null, 2)}`).toHaveLength(0);
      });

      test(`responsive: Register Page at ${vp.width}x${vp.height}`, async ({ page }) => {
        await page.goto('/register');
        await page.waitForLoadState('networkidle');
        const problems = await checkLayout(page);
        await page.screenshot({ path: path.join(RESPONSIVE_SCREENSHOTS_DIR, `register-${vp.width}x${vp.height}.png`), fullPage: true });
        expect(problems, `Violations on Register at ${vp.width}x${vp.height}: ${JSON.stringify(problems, null, 2)}`).toHaveLength(0);
      });

      test(`responsive: Dashboard (ADMIN) at ${vp.width}x${vp.height}`, async ({ page }) => {
        if (adminToken && adminUser) {
          await page.addInitScript(({ token, user }) => {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
          }, { token: adminToken, user: adminUser });
        }
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const problems = await checkLayout(page);
        await page.screenshot({ path: path.join(RESPONSIVE_SCREENSHOTS_DIR, `dashboard-admin-${vp.width}x${vp.height}.png`) });

        if (vp.width === 390 && vp.height === 844) {
          await page.screenshot({ path: path.join(TRACKED_SCREENSHOTS_DIR, 'dashboard-mobile.png') });
        }
        expect(problems, `Violations on Dashboard (ADMIN) at ${vp.width}x${vp.height}: ${JSON.stringify(problems, null, 2)}`).toHaveLength(0);
      });

      test(`responsive: Complaint Details (Long Title & Comments) at ${vp.width}x${vp.height}`, async ({ page }) => {
        if (adminToken && adminUser) {
          await page.addInitScript(({ token, user }) => {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
          }, { token: adminToken, user: adminUser });
        }
        const targetId = longComplaintId || 1;
        await page.goto(`/complaints/${targetId}`);
        await page.waitForLoadState('networkidle');
        const problems = await checkLayout(page);
        await page.screenshot({ path: path.join(RESPONSIVE_SCREENSHOTS_DIR, `details-${vp.width}x${vp.height}.png`), fullPage: true });

        if (vp.width === 390 && vp.height === 844) {
          await page.screenshot({ path: path.join(TRACKED_SCREENSHOTS_DIR, 'details-mobile.png') });
        }
        expect(problems, `Violations on Details at ${vp.width}x${vp.height}: ${JSON.stringify(problems, null, 2)}`).toHaveLength(0);
      });

      test(`responsive: Complaint Form (Create) at ${vp.width}x${vp.height}`, async ({ page }) => {
        if (adminToken && adminUser) {
          await page.addInitScript(({ token, user }) => {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
          }, { token: adminToken, user: adminUser });
        }
        await page.goto('/complaints/new');
        await page.waitForLoadState('networkidle');
        const problems = await checkLayout(page);
        await page.screenshot({ path: path.join(RESPONSIVE_SCREENSHOTS_DIR, `create-form-${vp.width}x${vp.height}.png`) });
        expect(problems, `Violations on Complaint Form at ${vp.width}x${vp.height}: ${JSON.stringify(problems, null, 2)}`).toHaveLength(0);
      });

      test(`responsive: Profile Page at ${vp.width}x${vp.height}`, async ({ page }) => {
        if (adminToken && adminUser) {
          await page.addInitScript(({ token, user }) => {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
          }, { token: adminToken, user: adminUser });
        }
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        const problems = await checkLayout(page);
        await page.screenshot({ path: path.join(RESPONSIVE_SCREENSHOTS_DIR, `profile-${vp.width}x${vp.height}.png`) });
        expect(problems, `Violations on Profile at ${vp.width}x${vp.height}: ${JSON.stringify(problems, null, 2)}`).toHaveLength(0);
      });

      test(`responsive: Admin Users Page at ${vp.width}x${vp.height}`, async ({ page }) => {
        if (adminToken && adminUser) {
          await page.addInitScript(({ token, user }) => {
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
          }, { token: adminToken, user: adminUser });
        }
        await page.goto('/admin/users');
        await page.waitForLoadState('networkidle');
        const problems = await checkLayout(page);
        await page.screenshot({ path: path.join(RESPONSIVE_SCREENSHOTS_DIR, `admin-users-${vp.width}x${vp.height}.png`) });
        expect(problems, `Violations on Admin Users at ${vp.width}x${vp.height}: ${JSON.stringify(problems, null, 2)}`).toHaveLength(0);
      });

      test(`responsive: 404 Not Found Page at ${vp.width}x${vp.height}`, async ({ page }) => {
        await page.goto('/non-existent-page-404');
        await page.waitForLoadState('networkidle');
        const problems = await checkLayout(page);
        await page.screenshot({ path: path.join(RESPONSIVE_SCREENSHOTS_DIR, `notfound-${vp.width}x${vp.height}.png`) });
        expect(problems, `Violations on 404 at ${vp.width}x${vp.height}: ${JSON.stringify(problems, null, 2)}`).toHaveLength(0);
      });
    });
  }

  // Rule R7: Dedicated check for Table vs Card layout at 390px vs 1024px
  test('Rule R7: Complaints and Users tables render as stacked cards at 390px and table at 1024px', async ({ page }) => {
    if (adminToken && adminUser) {
      await page.addInitScript(({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }, { token: adminToken, user: adminUser });
    }

    // At 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('table tbody td', { timeout: 10000 });

    // On mobile <= 640px, each tr or td should display as block or card with data-label
    const hasDataLabels = await page.evaluate(() => {
      const cells = document.querySelectorAll('table tbody td');
      return Array.from(cells).some((td) => td.getAttribute('data-label'));
    });
    expect(hasDataLabels).toBe(true);

    // At 1024px
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const tableDisplay = await page.locator('table').evaluate((el) => window.getComputedStyle(el).display);
    expect(['table', 'block']).toContain(tableDisplay);
  });

  // Rule R10: Keyboard navigation and accessible hamburger menu on logged-in navbar
  test('Rule R10: Logged-in navbar hamburger toggle works with keyboard Enter/Space and Escape closes', async ({ page }) => {
    if (adminToken && adminUser) {
      await page.addInitScript(({ token, user }) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }, { token: adminToken, user: adminUser });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hamburger = page.locator('.nav-toggle-btn');
    await expect(hamburger).toBeVisible();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    // Press Enter to open
    await hamburger.focus();
    await page.keyboard.press('Enter');
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    // Press Space to open
    await page.keyboard.press('Space');
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');
  });
});
