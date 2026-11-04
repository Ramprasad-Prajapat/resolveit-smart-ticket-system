import { test, expect } from '@playwright/test';

test.describe('ResolveIT Security, Validation & Session Edge Cases', () => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@resolveit.com';
  const adminPassword = process.env.E2E_ADMIN_PASSWORD || 'AdminTestPass123';

  test('Safe text (XSS defense): script tags and HTML are escaped and not executed', async ({ page }) => {
    let dialogFired = false;
    page.on('dialog', async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });

    // Login as admin
    await page.goto('/login');
    await page.fill('#loginEmail', adminEmail);
    await page.fill('#loginPassword', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('.page-title')).toContainText('Complaint Dashboard');

    // Create complaint with malicious HTML / XSS payloads
    await page.click('text=+ New Complaint');
    await expect(page).toHaveURL(/.*\/complaints\/new/);
    const xssTitle = '<script>alert(1)</script>';
    const xssBody = 'Safe & sound: <b>bold</b> text and <img src=x onerror=alert(2) />';

    await page.fill('#complaintTitle', xssTitle);
    await page.selectOption('#complaintCategory', 'TECHNICAL');
    await page.selectOption('#complaintPriority', 'MEDIUM');
    await page.fill('#complaintDesc', xssBody);
    await page.click('button[type="submit"]');

    // On details page
    await expect(page).toHaveURL(/.*\/complaints\/\d+/);

    // Verify text is rendered as plain text in the heading
    const heading = page.locator('.page-header h1');
    await expect(heading).toContainText('<script>alert(1)</script>');

    // Verify body is rendered as text in paragraph
    const bodyParagraph = page.locator('.card p').first();
    await expect(bodyParagraph).toContainText('Safe & sound: <b>bold</b> text and <img src=x onerror=alert(2) />');

    // Verify no script tag or malicious img was inserted into DOM as executable element
    const scriptsInBody = await page.locator('.card script').count();
    expect(scriptsInBody).toBe(0);

    // Verify no alert dialog was triggered
    expect(dialogFired).toBe(false);
  });

  test('UI validation checks: field error messages appear and typed values are retained', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('#loginEmail', adminEmail);
    await page.fill('#loginPassword', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('.page-title')).toContainText('Complaint Dashboard');

    await page.click('text=+ New Complaint');
    await expect(page).toHaveURL(/.*\/complaints\/new/);

    const invalidShortTitle = 'ab';
    const invalidShortDesc = 'too short';

    await page.fill('#complaintTitle', invalidShortTitle);
    await page.fill('#complaintDesc', invalidShortDesc);
    await page.click('button[type="submit"]');

    // Specific error messages under fields
    const errorLocators = page.locator('.form-error');
    await expect(errorLocators.nth(0)).toContainText('Title must be 3 to 100 characters');
    await expect(errorLocators.nth(1)).toContainText('Description must be 10 to 2000 characters');

    // Typed values are NOT wiped
    await expect(page.locator('#complaintTitle')).toHaveValue(invalidShortTitle);
    await expect(page.locator('#complaintDesc')).toHaveValue(invalidShortDesc);
  });

  test('Session back-button and bad token handling', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.fill('#loginEmail', adminEmail);
    await page.fill('#loginPassword', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator('.page-title')).toContainText('Complaint Dashboard');

    // 2. Log out
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login');

    // 3. Browser back button does NOT show authenticated dashboard
    await page.goBack();
    const currentUrl = page.url();
    expect(currentUrl.endsWith('/login') || currentUrl.endsWith('/')).toBe(true);
    // Page title for Dashboard should not exist
    await expect(page.locator('.page-title')).toHaveCount(0);

    // 4. Bad token in localStorage redirects on navigation
    await page.evaluate(() => {
      localStorage.setItem('token', 'bad-invalid-malformed-token');
      localStorage.setItem('user', JSON.stringify({ id: 999, role: 'USER' }));
    });

    await page.goto('/complaints/new');
    // ProtectedRoute or API client 401 kicks back to /login
    await expect(page).toHaveURL(/.*\/login/);
  });
});
