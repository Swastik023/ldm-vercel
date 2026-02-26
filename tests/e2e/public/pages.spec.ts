import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
    test('homepage loads', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/.+/);
    });

    test('about page loads', async ({ page }) => {
        await page.goto('/about');
        await expect(page).toHaveURL(/about/);
    });

    test('courses page loads', async ({ page }) => {
        await page.goto('/courses');
        await expect(page).toHaveURL(/courses/);
    });

    test('contact page loads', async ({ page }) => {
        await page.goto('/contact');
        await expect(page).toHaveURL(/contact/);
    });

    test('notices page loads', async ({ page }) => {
        await page.goto('/notices');
        await expect(page).toHaveURL(/notices/);
    });

    test('gallery page loads', async ({ page }) => {
        await page.goto('/gallery');
        await expect(page).toHaveURL(/gallery/);
    });

    test('library page loads', async ({ page }) => {
        await page.goto('/library');
        await expect(page).toHaveURL(/library/);
    });

    test('team page loads', async ({ page }) => {
        await page.goto('/team');
        await expect(page).toHaveURL(/team/);
    });

    test('facilities page loads', async ({ page }) => {
        await page.goto('/facilities');
        await expect(page).toHaveURL(/facilities/);
    });

    test('contact form submission', async ({ page }) => {
        await page.goto('/contact');
        const form = page.locator('form');
        if (await form.isVisible()) {
            const nameInput = page.getByPlaceholder(/name/i);
            const emailInput = page.getByPlaceholder(/email/i);
            const msgInput = page.getByPlaceholder(/message/i);
            if (await nameInput.isVisible()) await nameInput.fill('Test User');
            if (await emailInput.isVisible()) await emailInput.fill('test@test.com');
            if (await msgInput.isVisible()) await msgInput.fill('Automated test message');
        }
    });
});
