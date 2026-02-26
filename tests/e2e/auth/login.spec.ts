import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('admin login redirects to /admin', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder(/username/i).fill('admin');
        await page.getByPlaceholder(/password/i).fill('admin123');
        await page.getByRole('button', { name: /login|sign in/i }).click();
        await expect(page).toHaveURL(/\/admin/);
    });

    test('student login redirects to /student', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder(/username/i).fill('student01');
        await page.getByPlaceholder(/password/i).fill('student123');
        await page.getByRole('button', { name: /login|sign in/i }).click();
        await expect(page).toHaveURL(/\/student/);
    });

    test('teacher login redirects to /teacher', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder(/username/i).fill('teacher01');
        await page.getByPlaceholder(/password/i).fill('teacher123');
        await page.getByRole('button', { name: /login|sign in/i }).click();
        await expect(page).toHaveURL(/\/teacher/);
    });

    test('invalid credentials shows error', async ({ page }) => {
        await page.goto('/login');
        await page.getByPlaceholder(/username/i).fill('invalid');
        await page.getByPlaceholder(/password/i).fill('wrong');
        await page.getByRole('button', { name: /login|sign in/i }).click();
        await expect(page.locator('[role="alert"], .error, [class*="error"]')).toBeVisible();
    });

    test('unauthenticated access to /admin redirects', async ({ page }) => {
        await page.goto('/admin');
        await expect(page).toHaveURL(/\/login|\/$/);
    });

    test('unauthenticated access to /student redirects', async ({ page }) => {
        await page.goto('/student');
        await expect(page).toHaveURL(/\/login|\/$/);
    });
});
