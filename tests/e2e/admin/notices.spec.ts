import { adminTest as test } from '../fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('Notice Management', () => {
    test('notices page loads', async ({ page }) => {
        await page.goto('/admin/notices');
        await expect(page).toHaveURL(/notices/);
    });

    test('create notice form', async ({ page }) => {
        await page.goto('/admin/notices');
        const addBtn = page.getByRole('button', { name: /add|create|new/i });
        if (await addBtn.isVisible()) {
            await addBtn.click();
            await expect(page.locator('form, [role="dialog"]')).toBeVisible();
        }
    });
});
