/**
 * Payment Recording — Behavior-Driven Tests
 * Covers the full payment lifecycle: create, overpayment guard, status transitions.
 */

jest.mock('next/server', () => ({
    NextResponse: {
        json: (body: any, init?: any) => ({ body, status: init?.status || 200 }),
    },
}));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/db', () => jest.fn().mockResolvedValue(true));
jest.mock('@/models/FeeStructure', () => ({
    FeeStructure: { findById: jest.fn(), find: jest.fn() },
}));
jest.mock('@/models/FeePayment', () => ({
    FeePayment: { findOne: jest.fn(), create: jest.fn(), findByIdAndUpdate: jest.fn(), find: jest.fn() },
}));
jest.mock('@/models/AuditLog', () => ({ AuditLog: { create: jest.fn() } }));
jest.mock('@/models/User', () => ({ User: { findById: jest.fn() } }));
jest.mock('@/models/Academic', () => ({}));

import { getServerSession } from 'next-auth';
import { FeeStructure } from '@/models/FeeStructure';
import { FeePayment } from '@/models/FeePayment';

const adminSession = { user: { role: 'admin', id: 'admin1' } };

function paymentRequest(body: any) {
    return {
        json: () => Promise.resolve(body),
        url: 'http://localhost:3000/api/admin/finance/payments/student1',
        headers: { get: () => '127.0.0.1' },
    } as unknown as Request;
}

const paramsPromise = Promise.resolve({ studentId: 'student1' });

describe('Payment Recording: Behavior', () => {
    let POST: any;

    beforeAll(async () => {
        const mod = await import('@/app/api/admin/finance/payments/[studentId]/route');
        POST = mod.POST;
    });

    beforeEach(() => jest.clearAllMocks());

    test('when no prior payment exists → creates new FeePayment + records transaction', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(adminSession);
        (FeeStructure.findById as jest.Mock).mockResolvedValue({ total_amount: 50000 });
        (FeePayment.findOne as jest.Mock).mockResolvedValue(null);
        (FeePayment.create as jest.Mock).mockResolvedValue({
            _id: 'fp_new', amount_paid: 0, payments: [],
        });
        (FeePayment.findByIdAndUpdate as jest.Mock).mockResolvedValue({
            _id: 'fp_new', amount_paid: 10000, status: 'partial', payments: [{ amount: 10000 }],
        });

        const res = await POST(paymentRequest({
            fee_structure_id: 'fs1', amount: 10000, mode: 'cash', receipt_no: 'R001', paid_on: '2026-01-15',
        }), { params: paramsPromise });

        expect(res.status).toBe(201);
        expect(FeePayment.create).toHaveBeenCalled();
    });

    test('when payment would exceed total → amount blocked with clear message', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(adminSession);
        (FeeStructure.findById as jest.Mock).mockResolvedValue({ total_amount: 50000 });
        (FeePayment.findOne as jest.Mock).mockResolvedValue({
            _id: 'fp1', amount_paid: 48000, payments: [],
        });

        const res = await POST(paymentRequest({
            fee_structure_id: 'fs1', amount: 5000, mode: 'online', receipt_no: 'R002', paid_on: '2026-01-20',
        }), { params: paramsPromise });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/exceeds remaining/i);
    });

    test('when amount equals exact remaining → status becomes paid', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(adminSession);
        (FeeStructure.findById as jest.Mock).mockResolvedValue({ total_amount: 50000 });
        (FeePayment.findOne as jest.Mock).mockResolvedValue({
            _id: 'fp1', amount_paid: 40000, payments: [],
        });
        (FeePayment.findByIdAndUpdate as jest.Mock).mockResolvedValue({
            _id: 'fp1', amount_paid: 50000, status: 'paid', payments: [{}],
        });

        const res = await POST(paymentRequest({
            fee_structure_id: 'fs1', amount: 10000, mode: 'upi', receipt_no: 'R003', paid_on: '2026-01-25',
        }), { params: paramsPromise });

        expect(res.status).toBe(201);
        expect(FeePayment.findByIdAndUpdate).toHaveBeenCalledWith(
            'fp1',
            expect.objectContaining({
                $set: expect.objectContaining({ status: 'paid' }),
            }),
            { new: true }
        );
    });

    test('missing required fields → 400', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(adminSession);
        const res = await POST(paymentRequest({ fee_structure_id: 'fs1' }), { params: paramsPromise });
        expect(res.status).toBe(400);
    });

    test('zero amount → 400', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(adminSession);
        const res = await POST(paymentRequest({
            fee_structure_id: 'fs1', amount: 0, mode: 'cash', receipt_no: 'R004', paid_on: '2026-01-15',
        }), { params: paramsPromise });
        expect(res.status).toBe(400);
    });

    test('fee structure not found → 404', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(adminSession);
        (FeeStructure.findById as jest.Mock).mockResolvedValue(null);
        const res = await POST(paymentRequest({
            fee_structure_id: 'invalid', amount: 1000, mode: 'cash', receipt_no: 'R005', paid_on: '2026-01-15',
        }), { params: paramsPromise });
        expect(res.status).toBe(404);
    });
});
