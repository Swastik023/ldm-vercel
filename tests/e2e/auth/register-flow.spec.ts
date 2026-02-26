import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/register');
    });

    test('page renders with step 1 visible', async ({ page }) => {
        await expect(page.getByText('Basic Details')).toBeVisible();
        await expect(page.getByPlaceholder(/Priya Sharma/i)).toBeVisible();
    });

    test('empty form submit shows validation error', async ({ page }) => {
        await page.getByRole('button', { name: /continue/i }).click();
        await expect(page.getByText(/please fill in all fields/i)).toBeVisible();
    });

    test('invalid email shows error', async ({ page }) => {
        await page.getByPlaceholder(/Priya Sharma/i).fill('Test User');
        await page.locator('select').first().selectOption('Male');
        await page.getByRole('textbox', { name: /date/i }).fill('2000-01-01');
        await page.getByPlaceholder(/10-digit/i).fill('9876543210');
        await page.getByPlaceholder(/your@email/i).fill('bademail');
        await page.getByPlaceholder(/strong password/i).fill('password123');
        await page.getByRole('button', { name: /continue/i }).click();
        await expect(page.getByText(/valid email/i)).toBeVisible();
    });

    test('short password shows error', async ({ page }) => {
        await page.getByPlaceholder(/Priya Sharma/i).fill('Test User');
        await page.locator('select').first().selectOption('Female');
        await page.getByRole('textbox', { name: /date/i }).fill('2000-01-01');
        await page.getByPlaceholder(/10-digit/i).fill('9876543210');
        await page.getByPlaceholder(/your@email/i).fill('test@test.com');
        await page.getByPlaceholder(/strong password/i).fill('short');
        await page.getByRole('button', { name: /continue/i }).click();
        await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    });

    test('invalid mobile number shows error', async ({ page }) => {
        await page.getByPlaceholder(/Priya Sharma/i).fill('Test User');
        await page.locator('select').first().selectOption('Male');
        await page.getByRole('textbox', { name: /date/i }).fill('2000-01-01');
        await page.getByPlaceholder(/10-digit/i).fill('123');
        await page.getByPlaceholder(/your@email/i).fill('test@test.com');
        await page.getByPlaceholder(/strong password/i).fill('password123');
        await page.getByRole('button', { name: /continue/i }).click();
        await expect(page.getByText(/10 digits/i)).toBeVisible();
    });

    test('valid step 1 navigates to step 2', async ({ page }) => {
        await page.getByPlaceholder(/Priya Sharma/i).fill('Test User');
        await page.locator('select').first().selectOption('Male');
        await page.getByRole('textbox', { name: /date/i }).fill('2000-06-15');
        await page.getByPlaceholder(/10-digit/i).fill('9876543210');
        await page.getByPlaceholder(/your@email/i).fill('validuser@test.com');
        await page.getByPlaceholder(/strong password/i).fill('password123');
        await page.getByRole('button', { name: /continue/i }).click();
        await expect(page.getByText('Academic Details')).toBeVisible();
    });

    test('step 2 empty submit shows error', async ({ page }) => {
        // Fill step 1 and advance
        await page.getByPlaceholder(/Priya Sharma/i).fill('Test User');
        await page.locator('select').first().selectOption('Male');
        await page.getByRole('textbox', { name: /date/i }).fill('2000-06-15');
        await page.getByPlaceholder(/10-digit/i).fill('9876543210');
        await page.getByPlaceholder(/your@email/i).fill('step2test@test.com');
        await page.getByPlaceholder(/strong password/i).fill('password123');
        await page.getByRole('button', { name: /continue/i }).click();
        await expect(page.getByText('Academic Details')).toBeVisible();

        // Try to submit step 2 without filling
        await page.getByRole('button', { name: /continue/i }).click();
        await expect(page.getByText(/please fill in all fields/i)).toBeVisible();
    });

    test('back button returns to step 1', async ({ page }) => {
        // Advance to step 2
        await page.getByPlaceholder(/Priya Sharma/i).fill('Test User');
        await page.locator('select').first().selectOption('Male');
        await page.getByRole('textbox', { name: /date/i }).fill('2000-06-15');
        await page.getByPlaceholder(/10-digit/i).fill('9876543210');
        await page.getByPlaceholder(/your@email/i).fill('backtest@test.com');
        await page.getByPlaceholder(/strong password/i).fill('password123');
        await page.getByRole('button', { name: /continue/i }).click();
        await expect(page.getByText('Academic Details')).toBeVisible();

        // Go back
        await page.getByRole('button', { name: /back/i }).click();
        await expect(page.getByText('Basic Details')).toBeVisible();
    });

    test('login link navigates to /login', async ({ page }) => {
        await page.getByText(/login here/i).click();
        await expect(page).toHaveURL(/\/login/);
    });
});
