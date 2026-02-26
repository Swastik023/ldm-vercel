import { adminTest as test } from '../fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('Library Management', () => {
    test('library page loads', async ({ page }) => {
        await page.goto('/admin/library');
        await expect(page).toHaveURL(/library/);
    });

    test('categories page loads', async ({ page }) => {
        await page.goto('/admin/library/categories');
        await expect(page).toHaveURL(/categories/);
    });

    test('document upload modal opens', async ({ page }) => {
        await page.goto('/admin/library');
        const uploadBtn = page.getByRole('button', { name: /upload|add/i });
        if (await uploadBtn.isVisible()) {
            await uploadBtn.click();
            await expect(page.locator('[role="dialog"], [class*="modal"]')).toBeVisible();
        }
    });
});
