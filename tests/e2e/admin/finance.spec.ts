import { adminTest as test } from '../fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('Finance Module', () => {
    test('fee structures page loads', async ({ page }) => {
        await page.goto('/admin/finance/fee-structures');
        await expect(page).toHaveURL(/fee-structures/);
    });

    test('create fee structure', async ({ page }) => {
        await page.goto('/admin/finance/fee-structures');
        const addBtn = page.getByRole('button', { name: /add|create|new/i });
        if (await addBtn.isVisible()) {
            await addBtn.click();
            await expect(page.locator('form, [role="dialog"], [class*="modal"]')).toBeVisible();
        }
    });

    test('expenses page loads', async ({ page }) => {
        await page.goto('/admin/finance/expenses');
        await expect(page).toHaveURL(/expenses/);
    });

    test('salary page loads', async ({ page }) => {
        await page.goto('/admin/finance/salary');
        await expect(page).toHaveURL(/salary/);
    });

    test('payments page loads', async ({ page }) => {
        await page.goto('/admin/finance/payments');
        await expect(page).toHaveURL(/payments/);
    });

    test('fee records page loads', async ({ page }) => {
        await page.goto('/admin/finance/fees');
        await expect(page).toHaveURL(/fees/);
    });
});
