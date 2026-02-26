import { adminTest as test, } from '../fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
    test('loads dashboard with stats', async ({ page }) => {
        await page.goto('/admin');
        await expect(page).toHaveURL(/\/admin/);
        await expect(page.locator('h1, h2, [class*="title"]').first()).toBeVisible();
    });

    test('sidebar navigation renders all modules', async ({ page }) => {
        await page.goto('/admin');
        const nav = page.locator('nav, [class*="sidebar"], aside');
        await expect(nav.first()).toBeVisible();
    });

    test('navigate to user management', async ({ page }) => {
        await page.goto('/admin/users');
        await expect(page).toHaveURL(/\/admin\/users/);
    });

    test('navigate to finance module', async ({ page }) => {
        await page.goto('/admin/finance');
        await expect(page).toHaveURL(/\/admin\/finance/);
    });

    test('navigate to notices', async ({ page }) => {
        await page.goto('/admin/notices');
        await expect(page).toHaveURL(/\/admin\/notices/);
    });

    test('navigate to gallery', async ({ page }) => {
        await page.goto('/admin/gallery');
        await expect(page).toHaveURL(/\/admin\/gallery/);
    });
});
