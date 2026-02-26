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
jest.mock('@/lib/feeCalculator', () => ({
    calcFees: jest.fn(),
}));
jest.mock('@/models/FeeRecord', () => ({
    FeeRecord: {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
    },
}));
jest.mock('@/models/User', () => ({
    User: { findById: jest.fn() },
}));

import { getServerSession } from 'next-auth';
import { FeeRecord } from '@/models/FeeRecord';
import { User } from '@/models/User';
import { calcFees } from '@/lib/feeCalculator';

function makeRequest(body?: any, params?: Record<string, string>) {
    const url = new URL('http://localhost:3000/api/admin/finance/fee-records');
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return {
        json: () => Promise.resolve(body),
        url: url.toString(),
    } as unknown as Request;
}

describe('Admin Fee Records API', () => {
    let GET: any, POST: any;

    beforeAll(async () => {
        const mod = await import('@/app/api/admin/finance/fee-records/route');
        GET = mod.GET;
        POST = mod.POST;
    });

    beforeEach(() => jest.clearAllMocks());

    // --- Auth ---
    test('GET: non-admin → 401', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'teacher' } });
        const res = await GET(makeRequest());
        expect(res.status).toBe(401);
    });

    test('POST: no session → 401', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        const res = await POST(makeRequest({}));
        expect(res.status).toBe(401);
    });

    // --- POST Validation ---
    test('POST: missing required fields → 400', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        const res = await POST(makeRequest({ studentId: 's1' }));
        expect(res.status).toBe(400);
    });

    test('POST: negative base price → 400', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        const res = await POST(makeRequest({ studentId: 's1', course: 'BAMS', baseCoursePrice: -100 }));
        expect(res.status).toBe(400);
    });

    test('POST: student not found → 404', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        (User.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(null) });
        const res = await POST(makeRequest({ studentId: 's1', course: 'BAMS', baseCoursePrice: 50000 }));
        expect(res.status).toBe(404);
    });

    test('POST: duplicate fee record → 409', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        (User.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve({ fullName: 'Test' }) });
        (FeeRecord.findOne as jest.Mock).mockResolvedValue({ _id: 'existing' });
        const res = await POST(makeRequest({ studentId: 's1', course: 'BAMS', baseCoursePrice: 50000 }));
        expect(res.status).toBe(409);
    });

    test('POST: successful creation → 201', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        (User.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve({ fullName: 'Test Student' }) });
        (FeeRecord.findOne as jest.Mock).mockResolvedValue(null);
        (calcFees as jest.Mock).mockReturnValue({
            baseCoursePrice: 50000, discountPercent: 10, discountAmount: 5000, finalFees: 45000,
        });
        (FeeRecord.create as jest.Mock).mockResolvedValue({ _id: 'fr1' });

        const res = await POST(makeRequest({
            studentId: 's1', course: 'BAMS', baseCoursePrice: 50000, discountPercent: 10,
        }));
        expect(res.status).toBe(201);
        expect(FeeRecord.create).toHaveBeenCalledWith(expect.objectContaining({
            baseCoursePrice: 50000,
            finalFees: 45000,
            remainingAmount: 45000,
            amountPaid: 0,
        }));
    });

    test('POST: invalid discount → 400 from calcFees', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        (User.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve({ fullName: 'Test' }) });
        (FeeRecord.findOne as jest.Mock).mockResolvedValue(null);
        (calcFees as jest.Mock).mockImplementation(() => { throw new Error('Discount percent must be between 0 and 100.'); });

        const res = await POST(makeRequest({
            studentId: 's1', course: 'BAMS', baseCoursePrice: 50000, discountPercent: 150,
        }));
        expect(res.status).toBe(400);
    });
});
