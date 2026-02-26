import { adminTest as test } from '../fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('Academic Management', () => {
    test('programs page loads', async ({ page }) => {
        await page.goto('/admin/academic/programs');
        await expect(page).toHaveURL(/programs/);
    });

    test('batches page loads', async ({ page }) => {
        await page.goto('/admin/batches');
        await expect(page).toHaveURL(/batches/);
    });

    test('assignments page loads', async ({ page }) => {
        await page.goto('/admin/academic/assignments');
        await expect(page).toHaveURL(/assignments/);
    });

    test('attendance page loads', async ({ page }) => {
        await page.goto('/admin/attendance');
        await expect(page).toHaveURL(/attendance/);
    });
});
