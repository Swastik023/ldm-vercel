import { test as teardown } from '@playwright/test';
import fs from 'fs';
import path from 'path';

teardown('cleanup auth state', async () => {
    const authDir = path.join(__dirname, '../.auth');
    if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
    }
});
