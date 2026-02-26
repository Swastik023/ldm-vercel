import { test as base } from '@playwright/test';
import path from 'path';

type AuthFixtures = {
    adminPage: ReturnType<typeof base.extend>;
};

export const adminTest = base.extend({
    storageState: path.join(__dirname, '../../.auth/admin.json'),
});

export const studentTest = base.extend({
    storageState: path.join(__dirname, '../../.auth/student.json'),
});

export const teacherTest = base.extend({
    storageState: path.join(__dirname, '../../.auth/teacher.json'),
});
