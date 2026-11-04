import { test, expect } from '@playwright/test';
import path from 'path';

// Define path for screenshots
const SCREENSHOTS_DIR = path.resolve(process.cwd(), '../docs/screenshots');

test.describe.serial('ResolveIT Full Application Browser Flow', () => {
  const timestamp = Date.now();
  const user1Email = `user1.${timestamp}@example.test`;
  const user2Email = `user2.${timestamp}@example.test`;
  const agentName = `Agent Bob ${timestamp}`;
  const userPassword = 'Password123';
  const newPassword = 'NewPassword123';

  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@resolveit.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'AdminTestPass123';

  let complaintTitle = `Network Outage #${timestamp}`;
  let updatedTitle = `Updated Outage #${timestamp}`;

  test('01. Unauthenticated root shows Home page and protected route redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Raise, track and resolve complaints in one place.');

    // Visiting protected route redirects to /login
    await page.goto('/complaints/new');
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('h2')).toContainText('ResolveIT');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login.png') });
  });

  test('02. Register user with password visibility toggle', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h2')).toContainText('Create an Account');

    // Fill form
    await page.fill('#regFullName', 'E2E First User');
    await page.fill('#regEmail', user1Email);

    const pwdInput = page.locator('#regPassword');
    const toggleBtns = page.locator('.password-toggle-btn');

    await pwdInput.fill('Secret123');
    await expect(pwdInput).toHaveAttribute('type', 'password');

    // Toggle eye button
    await toggleBtns.first().click();
    await expect(pwdInput).toHaveAttribute('type', 'text');
    await toggleBtns.first().click();
    await expect(pwdInput).toHaveAttribute('type', 'password');

    // Re-fill with actual test password
    await pwdInput.fill(userPassword);
    await page.fill('#regConfirmPassword', userPassword);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'register.png') });

    await page.click('button[type="submit"]');

    // Redirects to dashboard after successful registration
    await expect(page).toHaveURL(/\//);
    await expect(page.locator('.page-title')).toContainText('Complaint Dashboard');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'dashboard.png') });
  });

  test('03. Create complaint and verify on dashboard', async ({ page }) => {
    // Login as user1
    await page.goto('/login');
    await page.fill('#loginEmail', user1Email);
    await page.fill('#loginPassword', userPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Navigate to new complaint
    await page.click('text=+ New Complaint');
    await expect(page).toHaveURL(/.*\/complaints\/new/);

    await page.fill('#complaintTitle', complaintTitle);
    await page.selectOption('#complaintCategory', 'NETWORK');
    await page.selectOption('#complaintPriority', 'HIGH');
    await page.fill('#complaintDesc', 'Main office floor switch disconnects during traffic spikes.');

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/complaints\/\d+/);

    // Return to dashboard and verify search finds it
    await page.goto('/');
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill(complaintTitle);

    // Wait for debounced search
    await expect(page.locator('table')).toContainText(complaintTitle);
  });

  test('04. View details, edit title, comment, and inspect history', async ({ page }) => {
    // Login as user1
    await page.goto('/login');
    await page.fill('#loginEmail', user1Email);
    await page.fill('#loginPassword', userPassword);
    await page.click('button[type="submit"]');

    // Open complaint
    await page.locator('table a', { hasText: complaintTitle }).click();
    await expect(page).toHaveURL(/.*\/complaints\/\d+/);

    // Edit title
    await page.click('text=Edit');
    await expect(page).toHaveURL(/.*\/edit/);
    await page.fill('#complaintTitle', updatedTitle);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/complaints\/\d+/);
    await expect(page.locator('h1')).toContainText(updatedTitle);

    // Add a comment
    await page.fill('#commentInput', 'Customer confirms port 2 is blinking amber.');
    await page.click('button:has-text("Post Comment")');
    await expect(page.locator('.comments-list')).toContainText('Customer confirms port 2 is blinking amber.');

    // History shows creation
    await expect(page.locator('.timeline')).toContainText('Complaint created');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'details.png') });
  });

  test('05. Admin promotes second user to AGENT and assigns complaint', async ({ page }) => {
    // Register second user
    await page.goto('/register');
    await page.fill('#regFullName', agentName);
    await page.fill('#regEmail', user2Email);
    await page.fill('#regPassword', userPassword);
    await page.fill('#regConfirmPassword', userPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Logout
    await page.click('button:has-text("Logout")');

    // Admin login
    await page.goto('/login');
    await page.fill('#loginEmail', adminEmail);
    await page.fill('#loginPassword', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Admin Users page
    await page.click('nav a:has-text("Users")');
    await expect(page).toHaveURL(/.*\/admin\/users/);
    await expect(page.locator('.page-title')).toContainText('User Accounts');

    // Promote user2 to AGENT
    const userRow = page.locator(`tr:has-text("${user2Email}")`);
    await userRow.locator('select').selectOption('AGENT');
    await expect(page.locator('.alert-success')).toContainText('User role updated');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'admin-users.png') });

    // Open complaint and assign to newly promoted agent
    await page.goto('/');
    await page.locator('table a', { hasText: updatedTitle }).click();

    const agentOption = page.locator('#adminAssignSelect option', { hasText: agentName });
    const agentVal = await agentOption.getAttribute('value');
    await page.selectOption('#adminAssignSelect', agentVal);
    await page.click('button:has-text("Assign")');
    await expect(page.locator('.card').first()).toContainText(agentName);
  });

  test('06. Agent sets IN_PROGRESS and RESOLVED', async ({ page }) => {
    // Agent login
    await page.goto('/login');
    await page.fill('#loginEmail', user2Email);
    await page.fill('#loginPassword', userPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Filter "Assigned to me"
    await page.check('#assignedToMeFilter');
    await expect(page.locator('table')).toContainText(updatedTitle);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'agent-dashboard.png') });

    // Open complaint
    await page.locator('table a', { hasText: updatedTitle }).click();
    await expect(page).toHaveURL(/.*\/complaints\/\d+/);

    // Set IN_PROGRESS
    await page.selectOption('#nextStatusSelect', 'IN_PROGRESS');
    await page.fill('input[placeholder*="transition note"]', 'Investigating hardware cabling');
    await page.click('button:has-text("Update Status")');
    await expect(page.locator('.card .badge-status-in_progress').first()).toBeVisible();

    // Set RESOLVED
    await page.selectOption('#nextStatusSelect', 'RESOLVED');
    await page.fill('input[placeholder*="transition note"]', 'Replaced faulty RJ45 connector');
    await page.click('button:has-text("Update Status")');
    await expect(page.locator('.card .badge-status-resolved').first()).toBeVisible();

    // Verify 3 entries in history
    await expect(page.locator('.timeline-item')).toHaveCount(3);
  });

  test('07. First user sees RESOLVED and reopens complaint', async ({ page }) => {
    // Login as user1
    await page.goto('/login');
    await page.fill('#loginEmail', user1Email);
    await page.fill('#loginPassword', userPassword);
    await page.click('button[type="submit"]');

    // Open complaint
    await page.locator('table a', { hasText: updatedTitle }).click();
    await expect(page).toHaveURL(/.*\/complaints\/\d+/);

    // Verify resolved, edit/delete hidden
    await expect(page.locator('.card .badge-status-resolved').first()).toBeVisible();
    await expect(page.locator('text=Edit')).not.toBeVisible();
    await expect(page.locator('text=Delete')).not.toBeVisible();

    // Reopen complaint
    await page.selectOption('#nextStatusSelect', 'OPEN');
    await page.fill('input[placeholder*="transition note"]', 'Link dropped again after reboot');
    await page.click('button:has-text("Reopen Complaint")');

    await expect(page.locator('.card .badge-status-open').first()).toBeVisible();
  });

  test('08. Profile update and password change', async ({ page }) => {
    // Login as user1
    await page.goto('/login');
    await page.fill('#loginEmail', user1Email);
    await page.fill('#loginPassword', userPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    await page.click('header .nav-username');
    await expect(page).toHaveURL('/profile');

    // Update display name
    await page.fill('#profileFullName', 'E2E User Renamed');
    await page.click('button:has-text("Update Name")');
    await expect(page.locator('.alert-success').first()).toContainText('Full name updated');

    // Change password
    await page.fill('#currentPassword', userPassword);
    await page.fill('#newPassword', newPassword);
    await page.fill('#confirmNewPassword', newPassword);
    await page.click('button:has-text("Change Password")');
    await expect(page.locator('.alert-success').last()).toContainText('Password changed');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'profile.png') });

    // Logout and log in with new password
    await page.click('button:has-text("Logout")');
    await page.fill('#loginEmail', user1Email);
    await page.fill('#loginPassword', newPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('09. Login lockout shows 429 message after failed attempts', async ({ page }) => {
    const throwawayEmail = `lockout.${Date.now()}@example.test`;
    await page.goto('/login');

    for (let i = 0; i < 5; i++) {
      await page.fill('#loginEmail', throwawayEmail);
      await page.fill('#loginPassword', 'WrongPass123');
      await page.click('button[type="submit"]');
      await expect(page.locator('.alert-error')).toContainText('Invalid email or password');
    }

    // 6th attempt triggers lockout
    await page.fill('#loginEmail', throwawayEmail);
    await page.fill('#loginPassword', 'AnyPass123');
    await page.click('button[type="submit"]');

    await expect(page.locator('.alert-error')).toContainText(/Too many failed login attempts/i);
  });

  test('10. Create and delete complaint', async ({ page }) => {
    // Login as user1 with new password
    await page.goto('/login');
    await page.fill('#loginEmail', user1Email);
    await page.fill('#loginPassword', newPassword);
    await page.click('button[type="submit"]');

    const disposableTitle = `Disposable Ticket #${Date.now()}`;
    await page.click('text=+ New Complaint');
    await page.fill('#complaintTitle', disposableTitle);
    await page.fill('#complaintDesc', 'This ticket will be deleted immediately for testing.');
    await page.click('button[type="submit"]');

    await expect(page.locator('h1')).toContainText(disposableTitle);

    // Accept browser confirmation dialog
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('button:has-text("Delete")');

    await expect(page).toHaveURL('/');
    await expect(page.locator('table')).not.toContainText(disposableTitle);
  });

  test('11. Home navbar scroll links update hash, viewport, and active state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Capture desktop screenshot of Home page
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'home.png'), fullPage: true });

    // Verify navbar has NO Technology button
    await expect(page.locator('header nav a[href="#technology"]')).toHaveCount(0);

    // Verify page contains no removed or untrue text
    await expect(page.locator('body')).not.toContainText('Ticket Lifecycle');
    await expect(page.locator('body')).not.toContainText('Ready to try it');
    await expect(page.locator('body')).not.toContainText('Real-Time Feedback');
    await expect(page.locator('h2:has-text("Technology")')).toHaveCount(0);

    const sections = [
      { id: 'features', name: 'Features' },
      { id: 'how-it-works', name: 'How It Works' },
      { id: 'roles', name: 'Roles' },
      { id: 'home', name: 'Home' },
    ];

    for (const sec of sections) {
      await page.click(`header nav a[href="#${sec.id}"]`);
      await expect(page).toHaveURL(new RegExp(`.*#${sec.id}$`));
      await expect(page.locator(`#${sec.id}`)).toBeInViewport();
      const linkEl = page.locator(`header nav a[href="#${sec.id}"]`);
      await expect(linkEl).toHaveAttribute('aria-current', 'location');
    }
  });

  test('12. Home navigation links to login, register, and footer shortcuts', async ({ page }) => {
    await page.goto('/');

    // Home Navbar Login button -> /login
    await page.click('header .home-nav-actions a:has-text("Login")');
    await expect(page).toHaveURL(/.*\/login/);

    // "← Back to Home" link -> /
    await page.click('text=← Back to Home');
    await expect(page).toHaveURL(/\/(#.*)?$/);
    await expect(page.locator('h1')).toContainText('Raise, track and resolve complaints in one place.');

    // Home Get Started button -> /register
    await page.click('text=Get Started');
    await expect(page).toHaveURL(/.*\/register/);

    // Register page "← Back to Home" link -> /
    await page.click('text=← Back to Home');
    await expect(page).toHaveURL(/\/(#.*)?$/);

    // Footer verifications
    await page.locator('footer.home-footer').scrollIntoViewIfNeeded();

    // Verify Contact column and GitHub link when siteInfo.githubUrl is configured
    await expect(page.locator('footer.home-footer h3:has-text("Contact")')).toBeVisible();
    await expect(page.locator('footer.home-footer a:has-text("GitHub")')).toHaveAttribute('href', 'https://github.com/Ramprasad-Prajapat');

    // Footer Quick Links scroll to section
    await page.click('footer.home-footer a[href="#features"]');
    await expect(page.locator('#features')).toBeInViewport();

    // Footer Login -> /login
    await page.locator('footer.home-footer').scrollIntoViewIfNeeded();
    await page.click('footer.home-footer a[href="/login"]');
    await expect(page).toHaveURL(/.*\/login/);

    // Return to home
    await page.click('text=← Back to Home');

    // Footer Create account -> /register
    await page.locator('footer.home-footer').scrollIntoViewIfNeeded();
    await page.click('footer.home-footer a[href="/register"]');
    await expect(page).toHaveURL(/.*\/register/);

    // Return to home and test Back to top
    await page.click('text=← Back to Home');
    await page.locator('footer.home-footer').scrollIntoViewIfNeeded();
    await page.click('footer.home-footer a[href="#home"]');
    await expect(page.locator('#home')).toBeInViewport();
  });

  test('13. Mobile viewport hamburger menu and responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify hamburger button is visible
    const hamburger = page.locator('.home-nav-toggle');
    await expect(hamburger).toBeVisible();

    // Capture mobile screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'home-mobile.png') });

    // Open hamburger menu
    await hamburger.click();
    await expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    // Click Features link inside mobile menu
    await page.click('header nav a[href="#features"]');
    await expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    // Features section is in viewport
    await expect(page.locator('#features')).toBeInViewport();

    // Verify footer shows in one column on mobile 390px
    const footerGridCols = await page.locator('.home-footer-grid').evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('grid-template-columns').split(' ').length;
    });
    expect(footerGridCols).toBe(1);

    // Verify no horizontal scroll (scrollWidth <= innerWidth)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('14. Logged-in user visiting / sees dashboard instead of Home page', async ({ page }) => {
    // Log in as user1
    await page.goto('/login');
    await page.fill('#loginEmail', user1Email);
    await page.fill('#loginPassword', newPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Verify user sees dashboard
    await expect(page.locator('.page-title')).toContainText('Complaint Dashboard');
    await expect(page.locator('h1')).not.toContainText('Raise, track and resolve complaints in one place.');

    // Direct navigation to / while logged in still shows dashboard
    await page.goto('/');
    await expect(page.locator('.page-title')).toContainText('Complaint Dashboard');
    await expect(page.locator('table')).toBeVisible();
  });

  test('15. Admin reassign and live alert toasts across three browser contexts without page reload', async ({ browser }) => {
    // We create three independent browser contexts: Admin, Agent A, Agent B
    const adminCtx = await browser.newContext();
    const agentACtx = await browser.newContext();
    const agentBCtx = await browser.newContext();

    const pageAdmin = await adminCtx.newPage();
    const pageA = await agentACtx.newPage();
    const pageB = await agentBCtx.newPage();

    const subTs = Date.now();
    const agentAName = `Agent Alice ${subTs}`;
    const agentAEmail = `agent.alice.${subTs}@example.test`;
    const agentBName = `Agent Charlie ${subTs}`;
    const agentBEmail = `agent.charlie.${subTs}@example.test`;
    const flowPassword = 'Password123';

    // Step A: Register Agent Alice & Agent Charlie
    await pageA.goto('/register');
    await pageA.fill('#regFullName', agentAName);
    await pageA.fill('#regEmail', agentAEmail);
    await pageA.fill('#regPassword', flowPassword);
    await pageA.fill('#regConfirmPassword', flowPassword);
    await pageA.click('button[type="submit"]');
    await expect(pageA.locator('.page-title')).toContainText('Complaint Dashboard');

    await pageB.goto('/register');
    await pageB.fill('#regFullName', agentBName);
    await pageB.fill('#regEmail', agentBEmail);
    await pageB.fill('#regPassword', flowPassword);
    await pageB.fill('#regConfirmPassword', flowPassword);
    await pageB.click('button[type="submit"]');
    await expect(pageB.locator('.page-title')).toContainText('Complaint Dashboard');

    // Step B: Admin logs in and promotes both to AGENT
    await pageAdmin.goto('/login');
    await pageAdmin.fill('#loginEmail', adminEmail);
    await pageAdmin.fill('#loginPassword', adminPassword);
    await pageAdmin.click('button[type="submit"]');
    await expect(pageAdmin.locator('.page-title')).toContainText('Complaint Dashboard');

    await pageAdmin.goto('/admin/users');
    const rowA = pageAdmin.locator(`tr:has-text("${agentAEmail}")`);
    await rowA.locator('select').selectOption('AGENT');
    await expect(pageAdmin.locator('.alert-success')).toContainText('User role updated');

    const rowB = pageAdmin.locator(`tr:has-text("${agentBEmail}")`);
    await rowB.locator('select').selectOption('AGENT');
    await expect(pageAdmin.locator('.alert-success')).toContainText('User role updated');

    // Create a complaint to be assigned
    const liveComplaintTitle = `Printer Network Issue ${subTs}`;
    await pageAdmin.goto('/complaints/new');
    await pageAdmin.fill('#complaintTitle', liveComplaintTitle);
    await pageAdmin.selectOption('#complaintCategory', 'HARDWARE');
    await pageAdmin.selectOption('#complaintPriority', 'HIGH');
    await pageAdmin.fill('#complaintDesc', 'Heavy printing queue causes memory overflow on main router.');
    await pageAdmin.click('button[type="submit"]');
    await expect(pageAdmin).toHaveURL(/.*\/complaints\/\d+/);

    // Initial assign to Agent Alice
    const optAlice = pageAdmin.locator('#adminAssignSelect option', { hasText: agentAName });
    const aliceVal = await optAlice.getAttribute('value');
    await pageAdmin.selectOption('#adminAssignSelect', aliceVal);
    await pageAdmin.click('button:has-text("Assign")');
    await expect(pageAdmin.locator('.card').first()).toContainText(agentAName);

    // Get complaint URL and ticket number
    const complaintUrl = pageAdmin.url();
    const ticketNumber = await pageAdmin.locator('.page-header span').first().textContent();

    // Re-login Agent Alice & Agent Charlie to refresh their JWT with the AGENT role
    await pageA.click('button:has-text("Logout")');
    await pageA.goto('/login');
    await pageA.fill('#loginEmail', agentAEmail);
    await pageA.fill('#loginPassword', flowPassword);
    await pageA.click('button[type="submit"]');
    await expect(pageA).toHaveURL('/');

    await pageB.click('button:has-text("Logout")');
    await pageB.goto('/login');
    await pageB.fill('#loginEmail', agentBEmail);
    await pageB.fill('#loginPassword', flowPassword);
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL('/');

    // 1. Both Agent A and Agent B remain open on dashboard - NO RELOAD FROM NOW ON
    await expect(pageA.locator('.page-title')).toContainText('Complaint Dashboard');
    await expect(pageB.locator('.page-title')).toContainText('Complaint Dashboard');

    // 2. Admin opens the complaint -> Reassign to Agent Charlie
    await pageAdmin.goto(complaintUrl);
    await expect(pageAdmin.locator('.card').first()).toContainText(agentAName);

    // Confirm dialog handling for Reassign
    pageAdmin.on('dialog', (dialog) => dialog.accept());

    const optCharlie = pageAdmin.locator('#adminAssignSelect option', { hasText: agentBName });
    const charlieVal = await optCharlie.getAttribute('value');
    await pageAdmin.selectOption('#adminAssignSelect', charlieVal);

    // Button should now say Reassign
    const reassignBtn = pageAdmin.locator('button:has-text("Reassign")');
    await expect(reassignBtn).toBeVisible();
    await reassignBtn.click();

    // Admin sees blue confirmation popup with ticket number and both names
    const adminToast = pageAdmin.locator('.toast-card.toast-info');
    await expect(adminToast).toBeVisible({ timeout: 10000 });
    await expect(adminToast).toContainText(ticketNumber.trim());
    await expect(adminToast).toContainText(agentAName);
    await expect(adminToast).toContainText(agentBName);

    // Page shows Agent Charlie as assignee and history shows "Assignment changed"
    await expect(pageAdmin.locator('.card').first()).toContainText(agentBName);
    await expect(pageAdmin.locator('.timeline')).toContainText('Assignment changed');

    // Capture screenshot: alert-admin.png
    await pageAdmin.screenshot({ path: path.join(SCREENSHOTS_DIR, 'alert-admin.png') });

    // 3. Without reloading, Agent A's page shows the amber popup within 15 seconds
    const agentAToast = pageA.locator('.toast-card.toast-reassigned');
    await expect(agentAToast).toBeVisible({ timeout: 15000 });
    await expect(agentAToast).toContainText(ticketNumber.trim());
    await expect(agentAToast).toContainText(liveComplaintTitle);
    await expect(agentAToast).toContainText(agentBName);

    // Capture screenshot: alert-previous-agent.png
    await pageA.screenshot({ path: path.join(SCREENSHOTS_DIR, 'alert-previous-agent.png') });

    // Agent A clicks OK -> popup disappears
    await agentAToast.locator('.toast-ok-btn').click();
    await expect(pageA.locator('.toast-card')).toHaveCount(0);

    // 4. Without reloading, Agent B's page shows the green "assigned to you" popup
    const agentBToast = pageB.locator('.toast-card.toast-assigned');
    await expect(agentBToast).toBeVisible({ timeout: 15000 });
    await expect(agentBToast).toContainText(ticketNumber.trim());
    await expect(agentBToast).toContainText(liveComplaintTitle);
    await expect(agentBToast).toContainText(`handled by ${agentAName} before`);

    // Capture screenshot: alert-new-agent.png
    await pageB.screenshot({ path: path.join(SCREENSHOTS_DIR, 'alert-new-agent.png') });

    // Agent B does nothing -> popup disappears by itself (within 6-10 seconds)
    await expect(pageB.locator('.toast-card')).toHaveCount(0, { timeout: 15000 });

    // 5. Agent A reloads page -> NO popup comes back
    await pageA.reload();
    await expect(pageA.locator('.toast-card')).toHaveCount(0);

    // Agent A's "Assigned to me" does not show it
    await pageA.check('#assignedToMeFilter');
    await expect(pageA.locator('.state-box')).toContainText('No complaints found');
    await expect(pageA.locator('body')).not.toContainText(ticketNumber.trim());

    // Opening it shows no status controls for Agent A
    await pageA.goto(complaintUrl);
    await expect(pageA.locator('#nextStatusSelect')).toHaveCount(0);

    // Agent B's "Assigned to me" shows it and Agent B can change status
    await pageB.goto('/');
    await pageB.check('#assignedToMeFilter');
    await expect(pageB.locator('table')).toContainText(ticketNumber.trim());
    await pageB.goto(complaintUrl);
    await expect(pageB.locator('#nextStatusSelect')).toBeVisible();

    // 6. Offline case: admin assigns another complaint to Agent B while Agent B is logged out
    await pageB.click('button:has-text("Logout")');
    await expect(pageB).toHaveURL('/login');

    const offlineTitle = `Server Room Heating ${subTs}`;
    await pageAdmin.goto('/complaints/new');
    await pageAdmin.fill('#complaintTitle', offlineTitle);
    await pageAdmin.selectOption('#complaintCategory', 'TECHNICAL');
    await pageAdmin.selectOption('#complaintPriority', 'MEDIUM');
    await pageAdmin.fill('#complaintDesc', 'Air conditioning unit failed in rack 4.');
    await pageAdmin.click('button[type="submit"]');
    await expect(pageAdmin).toHaveURL(/.*\/complaints\/\d+/);

    const offlineTicket = await pageAdmin.locator('.page-header span').first().textContent();
    const optCharlie2 = pageAdmin.locator('#adminAssignSelect option', { hasText: agentBName });
    const charlieVal2 = await optCharlie2.getAttribute('value');
    await pageAdmin.selectOption('#adminAssignSelect', charlieVal2);
    await pageAdmin.click('button:has-text("Assign")');
    await expect(pageAdmin.locator('.card').first()).toContainText(agentBName);

    // Agent B logs in -> the alert appears right after login
    await pageB.fill('#loginEmail', agentBEmail);
    await pageB.fill('#loginPassword', flowPassword);
    await pageB.click('button[type="submit"]');
    await expect(pageB).toHaveURL('/');

    const offlineAlert = pageB.locator('.toast-card.toast-assigned');
    await expect(offlineAlert).toBeVisible({ timeout: 10000 });
    await expect(offlineAlert).toContainText(offlineTicket.trim());
    await expect(offlineAlert).toContainText(offlineTitle);

    // Clean up browser contexts
    await adminCtx.close();
    await agentACtx.close();
    await agentBCtx.close();
  });
});
