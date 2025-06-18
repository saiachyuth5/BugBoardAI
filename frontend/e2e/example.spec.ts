import { test, expect } from '@playwright/test';
import { createHash } from 'crypto';

// Helper function to generate a unique email for testing
function generateTestEmail(prefix = 'test') {
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${random}@example.com`;
}

// Test data
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const TEST_USER = {
  email: generateTestEmail('user'),
  password: 'Test123!',
  fullName: 'Test User',
};

// Authenticate as admin
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin');
}

test.describe('BugBoard AI MVP', () => {
  test.beforeEach(async ({ page }) => {
    // Run tests in a clean state
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test('should allow admin to log in', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should allow admin to create a new user', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to users page
    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL(/\/admin\/users/);
    
    // Click add user button
    await page.getByRole('button', { name: 'Add User' }).click();
    await expect(page).toHaveURL(/\/admin\/users\/new/);
    
    // Fill in user details
    await page.fill('input[name="email"]', TEST_USER.email);
    await page.fill('input[name="full_name"]', TEST_USER.fullName);
    await page.fill('input[name="password"]', TEST_USER.password);
    await page.fill('input[name="confirmPassword"]', TEST_USER.password);
    
    // Submit the form
    await page.getByRole('button', { name: 'Create User' }).click();
    
    // Verify user was created
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText('User created successfully')).toBeVisible();
    await expect(page.getByText(TEST_USER.email)).toBeVisible();
  });

  test('should allow admin to create a bug report', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to submit bug page
    await page.getByRole('link', { name: 'Submit Bug' }).click();
    await expect(page).toHaveURL(/\/submit/);
    
    // Fill in bug report
    const bugTitle = `Test Bug ${Date.now()}`;
    const bugDescription = 'This is a test bug description.';
    
    await page.fill('input[name="title"]', bugTitle);
    await page.fill('textarea[name="description"]', bugDescription);
    await page.selectOption('select[name="severity"]', 'medium');
    
    // Submit the form
    await page.getByRole('button', { name: 'Submit Bug' }).click();
    
    // Verify bug was created
    await expect(page.getByText('Bug reported successfully')).toBeVisible();
    await expect(page.getByText(bugTitle)).toBeVisible();
    await expect(page.getByText(bugDescription)).toBeVisible();
  });

  test('should display bugs on the dashboard', async ({ page }) => {
    // First, create a bug as admin
    await loginAsAdmin(page);
    
    // Go to dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    
    // Verify bugs are displayed
    await expect(page.getByRole('heading', { name: 'Recent Bugs' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should allow admin to view audit logs', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Navigate to audit logs
    await page.getByRole('link', { name: 'Audit Logs' }).click();
    await expect(page).toHaveURL(/\/admin\/audit-logs/);
    
    // Verify audit logs are displayed
    await expect(page.getByRole('heading', { name: 'Audit Logs' })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });
});
