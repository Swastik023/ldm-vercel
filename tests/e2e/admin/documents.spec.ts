import { adminTest as test } from '../fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('Document Management', () => {
    test('documents page loads', async ({ page }) => {
        await page.goto('/admin/documents');
        await expect(page).toHaveURL(/documents/);
    });

    test('create document requirement', async ({ page }) => {
        await page.goto('/admin/documents');
        const addBtn = page.getByRole('button', { name: /add|create|new/i });
        if (await addBtn.isVisible()) {
            await addBtn.click();
            await expect(page.locator('form, [role="dialog"]')).toBeVisible();
        }
    });
});
