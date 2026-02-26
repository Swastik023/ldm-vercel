import { test, expect } from '@playwright/test';

const API_BASE = '/api';

test.describe('Public API Endpoints', () => {
    test('GET /api/public/notices', async ({ request }) => {
        const res = await request.get(`${API_BASE}/public/notices`);
        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('application/json');
    });

    test('GET /api/public/gallery', async ({ request }) => {
        const res = await request.get(`${API_BASE}/public/gallery`);
        expect(res.status()).toBe(200);
    });

    test('GET /api/public/slider', async ({ request }) => {
        const res = await request.get(`${API_BASE}/public/slider`);
        expect(res.status()).toBe(200);
    });

    test('GET /api/public/marquee', async ({ request }) => {
        const res = await request.get(`${API_BASE}/public/marquee`);
        expect(res.status()).toBe(200);
    });

    test('GET /api/public/programs', async ({ request }) => {
        const res = await request.get(`${API_BASE}/public/programs`);
        expect(res.status()).toBe(200);
    });

    test('GET /api/public/library', async ({ request }) => {
        const res = await request.get(`${API_BASE}/public/library`);
        expect(res.status()).toBe(200);
    });

    test('GET /api/public/course-pricing', async ({ request }) => {
        const res = await request.get(`${API_BASE}/public/course-pricing`);
        expect(res.status()).toBe(200);
    });

    test('POST /api/public/contact', async ({ request }) => {
        const res = await request.post(`${API_BASE}/public/contact`, {
            data: { name: 'Bot', email: 'bot@test.com', message: 'Automated' },
        });
        expect([200, 201, 400]).toContain(res.status());
    });
});

test.describe('Protected API - No Auth', () => {
    test('GET /api/admin/stats returns 401', async ({ request }) => {
        const res = await request.get(`${API_BASE}/admin/stats`);
        expect([401, 403, 302]).toContain(res.status());
    });

    test('GET /api/admin/users returns 401', async ({ request }) => {
        const res = await request.get(`${API_BASE}/admin/users`);
        expect([401, 403, 302]).toContain(res.status());
    });
});
