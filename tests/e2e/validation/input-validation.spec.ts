import { adminTest as test } from '../fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('Expense Form — Input Validation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin/finance/expenses');
        await page.getByRole('button', { name: /add expense/i }).click();
        await expect(page.getByText('Add Expense')).toBeVisible();
    });

    test('empty form submit is blocked with toast error', async ({ page }) => {
        await page.getByRole('button', { name: /save expense/i }).click();
        // Toast or inline error should appear
        await expect(
            page.getByText(/fill required/i)
                .or(page.getByText(/required/i))
                .or(page.locator('[role="status"]'))
        ).toBeVisible({ timeout: 3000 });
    });

    test('submit button shows loading state while saving', async ({ page }) => {
        // Fill the form
        await page.locator('input[type="text"]').first().fill('Test Expense');
        await page.locator('input[type="number"]').fill('500');
        await page.locator('input[type="text"]').last().fill('Vendor Test');
        const saveBtn = page.getByRole('button', { name: /save expense/i });
        await saveBtn.click();
        // Check disabled or "Saving..." state
        await expect(saveBtn).toBeDisabled({ timeout: 2000 }).catch(() =>
            expect(page.getByText(/saving/i)).toBeVisible()
        );
    });

    test('cancel closes modal cleanly', async ({ page }) => {
        await page.getByRole('button', { name: /cancel/i }).click();
        await expect(page.getByText('Add Expense')).not.toBeVisible();
    });
});

test.describe('Salary Form — Input Validation', () => {
    test('salary page loads without crash', async ({ page }) => {
        await page.goto('/admin/finance/salary');
        await expect(page).toHaveURL(/salary/);
        // Should show either records or empty state — not a blank page
        await page.waitForTimeout(1000);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText!.length).toBeGreaterThan(50);
    });
});

test.describe('Fee Structures — No Silent Failures', () => {
    test('fee structures page shows data or empty state', async ({ page }) => {
        await page.goto('/admin/finance/fee-structures');
        await page.waitForTimeout(1500);
        // Must show either table with data OR "No" empty state — never a raw error
        const content = await page.locator('body').textContent();
        expect(content).not.toContain('Error');
        expect(content!.length).toBeGreaterThan(50);
    });
});

test.describe('Cross-Page: No JavaScript Errors', () => {
    const adminPages = [
        '/admin/finance/fees',
        '/admin/finance/expenses',
        '/admin/finance/salary',
        '/admin/finance/payments',
        '/admin/finance/fee-structures',
    ];

    for (const url of adminPages) {
        test(`${url} loads without JS errors`, async ({ page }) => {
            const errors: string[] = [];
            page.on('pageerror', (err) => errors.push(err.message));
            await page.goto(url);
            await page.waitForTimeout(2000);
            expect(errors).toHaveLength(0);
        });
    }
});
