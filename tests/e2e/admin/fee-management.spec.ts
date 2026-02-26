import { adminTest as test } from '../fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('Fee Management — Logical Validation', () => {
    test('page loads and shows header + summary cards', async ({ page }) => {
        await page.goto('/admin/finance/fees');
        await expect(page.getByText('Fee Management')).toBeVisible();
        await expect(page.getByText(/collected revenue/i)).toBeVisible();
        await expect(page.getByText(/pending dues/i)).toBeVisible();
    });

    test('add fee record button opens modal', async ({ page }) => {
        await page.goto('/admin/finance/fees');
        await page.getByRole('button', { name: /add fee record/i }).click();
        await expect(page.getByText('Add Fee Record')).toBeVisible();
        await expect(page.getByText(/student id/i)).toBeVisible();
        await expect(page.getByText(/base price/i)).toBeVisible();
    });

    test('live fee preview updates when base price entered', async ({ page }) => {
        await page.goto('/admin/finance/fees');
        await page.getByRole('button', { name: /add fee record/i }).click();
        // Enter a base price
        await page.locator('input[placeholder="30999"]').fill('50000');
        // Live preview should appear
        await expect(page.getByText(/final fees/i)).toBeVisible();
    });

    test('fee record modal cancel closes without error', async ({ page }) => {
        await page.goto('/admin/finance/fees');
        await page.getByRole('button', { name: /add fee record/i }).click();
        await expect(page.getByText('Add Fee Record')).toBeVisible();
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page.getByText('Add Fee Record')).not.toBeVisible();
    });

    test('save with empty student ID shows API error message', async ({ page }) => {
        await page.goto('/admin/finance/fees');
        await page.getByRole('button', { name: /add fee record/i }).click();
        // Fill partial form — no student ID
        await page.locator('input[placeholder="30999"]').fill('50000');
        await page.getByRole('button', { name: /save record/i }).click();
        // Wait for API response error
        await page.waitForTimeout(1000);
        // Should show error message from API (not blank screen)
        const modal = page.locator('.fixed');
        await expect(modal.locator('text=required').or(modal.locator('.text-red-600'))).toBeVisible();
    });

    test('double-click protection: save button disabled while saving', async ({ page }) => {
        await page.goto('/admin/finance/fees');
        await page.getByRole('button', { name: /add fee record/i }).click();
        await page.locator('input[placeholder="30999"]').fill('50000');
        // Click save
        const saveBtn = page.getByRole('button', { name: /save record/i });
        await saveBtn.click();
        // Button should be disabled or show loading state
        await expect(saveBtn).toBeDisabled({ timeout: 2000 }).catch(() => {
            // If not disabled, check it shows "Saving..." text (loading indicator)
            return expect(page.getByText(/saving/i)).toBeVisible();
        });
    });

    test('filter by status works without crash', async ({ page }) => {
        await page.goto('/admin/finance/fees');
        const statusFilter = page.locator('select').first();
        await statusFilter.selectOption('paid');
        // Page should not crash — either shows records or "No records found"
        await page.waitForTimeout(500);
        const table = page.locator('table');
        const emptyState = page.getByText(/no records found/i);
        await expect(table.or(emptyState)).toBeVisible();
    });
});

test.describe('Payment Modal — Logical Validation', () => {
    test('payment button visible only for unpaid/partial records', async ({ page }) => {
        await page.goto('/admin/finance/fees');
        await page.waitForTimeout(1000);
        // If records exist, check that "paid" rows don't have a payment button
        const paidBadges = page.locator('span:text("paid")');
        const count = await paidBadges.count();
        if (count > 0) {
            // The paid row's parent tr should NOT have a "+ Payment" button
            const paidRow = paidBadges.first().locator('xpath=ancestor::tr');
            await expect(paidRow.getByText('+ Payment')).not.toBeVisible();
        }
    });
});
