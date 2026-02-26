import { test as setup, expect } from '@playwright/test';
import path from 'path';

const ADMIN_AUTH = path.join(__dirname, '../.auth/admin.json');
const STUDENT_AUTH = path.join(__dirname, '../.auth/student.json');
const TEACHER_AUTH = path.join(__dirname, '../.auth/teacher.json');

setup('authenticate admin', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/username/i).fill(process.env.TEST_ADMIN_USERNAME || 'admin');
    await page.getByPlaceholder(/password/i).fill(process.env.TEST_ADMIN_PASSWORD || 'admin123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await page.waitForURL('/admin/**');
    await page.context().storageState({ path: ADMIN_AUTH });
});

setup('authenticate student', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/username/i).fill(process.env.TEST_STUDENT_USERNAME || 'student01');
    await page.getByPlaceholder(/password/i).fill(process.env.TEST_STUDENT_PASSWORD || 'student123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await page.waitForURL('/student/**');
    await page.context().storageState({ path: STUDENT_AUTH });
});

setup('authenticate teacher', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/username/i).fill(process.env.TEST_TEACHER_USERNAME || 'teacher01');
    await page.getByPlaceholder(/password/i).fill(process.env.TEST_TEACHER_PASSWORD || 'teacher123');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await page.waitForURL('/teacher/**');
    await page.context().storageState({ path: TEACHER_AUTH });
});
