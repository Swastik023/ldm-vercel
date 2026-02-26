import { adminTest as test } from '../fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('User Management', () => {
    test('users list loads', async ({ page }) => {
        await page.goto('/admin/users');
        await expect(page.locator('table, [class*="list"], [class*="grid"]').first()).toBeVisible();
    });

    test('create user form accessible', async ({ page }) => {
        await page.goto('/admin/users');
        const addBtn = page.getByRole('button', { name: /add|create|new/i });
        if (await addBtn.isVisible()) {
            await addBtn.click();
            await expect(page.locator('form, [role="dialog"]')).toBeVisible();
        }
    });

    test('search/filter users', async ({ page }) => {
        await page.goto('/admin/users');
        const searchInput = page.getByPlaceholder(/search/i);
        if (await searchInput.isVisible()) {
            await searchInput.fill('test');
            await page.waitForTimeout(500);
        }
    });
});
