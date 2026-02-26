import { studentTest as test } from '../fixtures/auth.fixture';
import { expect } from '@playwright/test';

test.describe('Student Dashboard', () => {
    test('dashboard loads', async ({ page }) => {
        await page.goto('/student');
        await expect(page).toHaveURL(/\/student/);
    });

    test('fees page accessible', async ({ page }) => {
        await page.goto('/student/fees');
        await expect(page).toHaveURL(/fees/);
    });

    test('documents page accessible', async ({ page }) => {
        await page.goto('/student/documents');
        await expect(page).toHaveURL(/documents/);
    });

    test('report card accessible', async ({ page }) => {
        await page.goto('/student/report-card');
        await expect(page).toHaveURL(/report-card/);
    });

    test('library accessible', async ({ page }) => {
        await page.goto('/student/library');
        await expect(page).toHaveURL(/library/);
    });

    test('tests page accessible', async ({ page }) => {
        await page.goto('/student/tests');
        await expect(page).toHaveURL(/tests/);
    });

    test('resume builder accessible', async ({ page }) => {
        await page.goto('/student/resume');
        await expect(page).toHaveURL(/resume/);
    });
});
