jest.mock('next/server', () => ({
    NextResponse: {
        json: (body: any, init?: any) => ({ body, status: init?.status || 200 }),
    },
}));
jest.mock('next-auth', () => ({
    getServerSession: jest.fn(),
}));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/db', () => jest.fn().mockResolvedValue(true));
jest.mock('@/models/Expense', () => ({
    Expense: {
        find: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
    },
}));
jest.mock('@/models/AuditLog', () => ({
    AuditLog: { create: jest.fn().mockResolvedValue({}) },
}));
jest.mock('@/models/User', () => ({
    User: { findById: jest.fn() },
}));

import { getServerSession } from 'next-auth';
import { Expense } from '@/models/Expense';
import { User } from '@/models/User';

function makeRequest(method: string, body?: any, params?: Record<string, string>) {
    const url = new URL('http://localhost:3000/api/admin/finance/expenses');
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return {
        json: () => Promise.resolve(body),
        url: url.toString(),
        headers: { get: () => '127.0.0.1' },
    } as unknown as Request;
}

describe('Admin Expenses API', () => {
    let GET: any, POST: any, DELETE: any;

    beforeAll(async () => {
        const mod = await import('@/app/api/admin/finance/expenses/route');
        GET = mod.GET;
        POST = mod.POST;
        DELETE = mod.DELETE;
    });

    beforeEach(() => jest.clearAllMocks());

    // --- Auth Guard ---
    test('GET: non-admin → 401', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'student' } });
        const res = await GET(makeRequest('GET'));
        expect(res.status).toBe(401);
    });

    test('POST: non-admin → 401', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        const res = await POST(makeRequest('POST', {}));
        expect(res.status).toBe(401);
    });

    // --- POST Validation ---
    test('POST: missing fields → 400', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        const res = await POST(makeRequest('POST', { title: 'Rent' }));
        expect(res.status).toBe(400);
    });

    test('POST: amount <= 0 → 400', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        const res = await POST(makeRequest('POST', {
            title: 'Rent', amount: 0, category: 'Infra', paid_on: '2026-01-01', paid_to: 'Landlord',
        }));
        expect(res.status).toBe(400);
    });

    test('POST: valid data → 201', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        (Expense.create as jest.Mock).mockResolvedValue({ _id: 'e1', toObject: () => ({}) });
        const res = await POST(makeRequest('POST', {
            title: 'Rent', amount: 5000, category: 'Infra', paid_on: '2026-01-01', paid_to: 'Landlord',
        }));
        expect(res.status).toBe(201);
    });

    // --- DELETE Guards ---
    test('DELETE: non-root user → 403', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        (User.findById as jest.Mock).mockResolvedValue({ is_root: false });
        const res = await DELETE(makeRequest('DELETE', null, { id: 'e1' }));
        expect(res.status).toBe(403);
    });

    test('DELETE: locked record → 403', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        (User.findById as jest.Mock).mockResolvedValue({ is_root: true });
        (Expense.findById as jest.Mock).mockResolvedValue({ is_locked: true, is_deleted: false });
        const res = await DELETE(makeRequest('DELETE', null, { id: 'e1' }));
        expect(res.status).toBe(403);
    });

    test('DELETE: already deleted → 400', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        (User.findById as jest.Mock).mockResolvedValue({ is_root: true });
        (Expense.findById as jest.Mock).mockResolvedValue({ is_locked: false, is_deleted: true });
        const res = await DELETE(makeRequest('DELETE', null, { id: 'e1' }));
        expect(res.status).toBe(400);
    });

    test('DELETE: success → soft delete', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        (User.findById as jest.Mock).mockResolvedValue({ is_root: true });
        const saveMock = jest.fn();
        (Expense.findById as jest.Mock).mockResolvedValue({
            is_locked: false, is_deleted: false, _id: 'e1', save: saveMock,
        });
        const res = await DELETE(makeRequest('DELETE', null, { id: 'e1', reason: 'Wrong entry' }));
        expect(res.status).toBe(200);
        expect(saveMock).toHaveBeenCalled();
    });
});
