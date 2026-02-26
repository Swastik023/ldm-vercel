import { teacherTest as test } from '../fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('Teacher Dashboard', () => {
    test('dashboard loads', async ({ page }) => {
        await page.goto('/teacher');
        await expect(page).toHaveURL(/\/teacher/);
    });

    test('attendance page accessible', async ({ page }) => {
        await page.goto('/teacher/attendance');
        await expect(page).toHaveURL(/attendance/);
    });

    test('marks entry accessible', async ({ page }) => {
        await page.goto('/teacher/marks');
        await expect(page).toHaveURL(/marks/);
    });

    test('documents accessible', async ({ page }) => {
        await page.goto('/teacher/documents');
        await expect(page).toHaveURL(/documents/);
    });
});
