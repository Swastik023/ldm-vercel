import { adminTest as test } from '../fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('Attendance Flow — Logical Validation', () => {
    test('attendance page loads with header', async ({ page }) => {
        await page.goto('/admin/attendance');
        await expect(page.getByText(/attendance review/i)).toBeVisible();
    });

    test('page renders without crash on empty state', async ({ page }) => {
        await page.goto('/admin/attendance');
        // Should show a date picker, filter controls, or an empty-state message — never a blank screen
        await page.waitForTimeout(1000);
        const body = page.locator('body');
        const bodyText = await body.textContent();
        expect(bodyText!.length).toBeGreaterThan(50);
    });

    test('no JavaScript errors on page load', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));
        await page.goto('/admin/attendance');
        await page.waitForTimeout(2000);
        expect(errors).toHaveLength(0);
    });
});
