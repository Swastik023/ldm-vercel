/**
 * Security Attack Simulations
 * Tests JWT tampering, role escalation, and malformed payload injection
 * against all protected API routes.
 */

jest.mock('next/server', () => ({
    NextResponse: {
        json: (body: any, init?: any) => ({ body, status: init?.status || 200 }),
    },
}));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/db', () => jest.fn().mockResolvedValue(true));
jest.mock('@/models/FeeRecord', () => ({
    FeeRecord: { find: jest.fn().mockReturnValue({ sort: () => ({ lean: () => [] }) }), findOne: jest.fn(), create: jest.fn() },
}));
jest.mock('@/models/User', () => ({
    User: { findById: jest.fn() },
}));
jest.mock('@/models/Expense', () => ({
    Expense: { find: jest.fn(), create: jest.fn(), findById: jest.fn() },
}));
jest.mock('@/models/AuditLog', () => ({
    AuditLog: { create: jest.fn() },
}));
jest.mock('@/models/Salary', () => ({
    Salary: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), findById: jest.fn() },
}));
jest.mock('@/models/FeePayment', () => ({
    FeePayment: { find: jest.fn() },
}));
jest.mock('@/lib/feeCalculator', () => ({
    calcFees: jest.fn(),
}));

import { getServerSession } from 'next-auth';

function makeRequest(body?: any, url = 'http://localhost:3000/api/test') {
    return {
        json: () => Promise.resolve(body),
        url,
        headers: { get: () => '127.0.0.1' },
    } as unknown as Request;
}

describe('Security: Role Escalation', () => {
    beforeEach(() => jest.clearAllMocks());

    const ROLE_ATTACKS = [
        { role: 'student', label: 'student → admin' },
        { role: 'teacher', label: 'teacher → admin' },
        { role: 'employee', label: 'employee → admin' },
    ];

    ROLE_ATTACKS.forEach(({ role, label }) => {
        test(`${label}: fee-records blocked`, async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role, id: 'x' } });
            const { GET } = await import('@/app/api/admin/finance/fee-records/route');
            const res = await GET(makeRequest(null, 'http://localhost:3000/api/admin/finance/fee-records'));
            expect(res.status).toBe(401);
        });
    });

    ROLE_ATTACKS.forEach(({ role, label }) => {
        test(`${label}: expenses blocked`, async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role, id: 'x' } });
            const { GET } = await import('@/app/api/admin/finance/expenses/route');
            const res = await GET(makeRequest(null, 'http://localhost:3000/api/admin/finance/expenses'));
            expect(res.status).toBe(401);
        });
    });

    ROLE_ATTACKS.forEach(({ role, label }) => {
        test(`${label}: salary blocked`, async () => {
            (getServerSession as jest.Mock).mockResolvedValue({ user: { role, id: 'x' } });
            const { GET } = await import('@/app/api/admin/finance/salary/route');
            const res = await GET(makeRequest(null, 'http://localhost:3000/api/admin/finance/salary'));
            expect(res.status).toBe(401);
        });
    });
});

describe('Security: No Session (JWT Tampering)', () => {
    beforeEach(() => jest.clearAllMocks());

    test('null session → fee-records 401', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        const { POST } = await import('@/app/api/admin/finance/fee-records/route');
        const res = await POST(makeRequest({}));
        expect(res.status).toBe(401);
    });

    test('undefined user → expenses 401', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: undefined });
        const { POST } = await import('@/app/api/admin/finance/expenses/route');
        const res = await POST(makeRequest({}));
        expect(res.status).toBe(401);
    });

    test('empty session → salary 401', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({});
        const { POST } = await import('@/app/api/admin/finance/salary/route');
        const res = await POST(makeRequest({}));
        expect(res.status).toBe(401);
    });
});

describe('Security: Malformed Payload Injection', () => {
    beforeEach(() => jest.clearAllMocks());

    test('expenses: XSS in title field → accepted but stored (no crash)', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        const { Expense } = require('@/models/Expense');
        Expense.create.mockResolvedValue({ _id: 'e1', toObject: () => ({}) });
        const { POST } = await import('@/app/api/admin/finance/expenses/route');
        const res = await POST(makeRequest({
            title: '<script>alert("xss")</script>',
            amount: 100, category: 'Test', paid_on: '2026-01-01', paid_to: 'Target',
        }));
        expect(res.status).toBe(201);
    });

    test('expenses: prototype pollution attempt → no crash', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        const { POST } = await import('@/app/api/admin/finance/expenses/route');
        const res = await POST(makeRequest({
            title: 'Normal', amount: 100, category: 'Test',
            paid_on: '2026-01-01', paid_to: 'Target',
            __proto__: { admin: true },
            constructor: { prototype: { isAdmin: true } },
        }));
        expect([201, 400]).toContain(res.status);
    });

    test('fee-records: NaN/Infinity in numeric fields', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        const { POST } = await import('@/app/api/admin/finance/fee-records/route');
        const res = await POST(makeRequest({
            studentId: 's1', course: 'BAMS', baseCoursePrice: NaN,
        }));
        expect([400, 401]).toContain(res.status);
    });

    test('fee-records: negative discount percent', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        const { User } = require('@/models/User');
        User.findById.mockReturnValue({ lean: () => Promise.resolve({ fullName: 'Test' }) });
        const { FeeRecord } = require('@/models/FeeRecord');
        FeeRecord.findOne.mockResolvedValue(null);
        const { calcFees } = require('@/lib/feeCalculator');
        calcFees.mockImplementation(() => { throw new Error('Discount percent must be between 0 and 100.'); });

        const { POST } = await import('@/app/api/admin/finance/fee-records/route');
        const res = await POST(makeRequest({
            studentId: 's1', course: 'BAMS', baseCoursePrice: 50000, discountPercent: -999,
        }));
        expect(res.status).toBe(400);
    });

    test('salary: empty string in required field → 400', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        const { POST } = await import('@/app/api/admin/finance/salary/route');
        const res = await POST(makeRequest({
            employee: 'e1', month: '2026-01', base_amount: '',
        }));
        expect(res.status).toBe(400);
    });
});
