/**
 * Batch Promotion & Document Review — Remaining High-Risk Flows
 * Covers semester overflow guard and teacher-only review authorization.
 */

jest.mock('next/server', () => ({
    NextResponse: {
        json: (body: any, init?: any) => ({ body, status: init?.status || 200 }),
    },
}));
jest.mock('next-auth', () => ({ getServerSession: jest.fn() }));
jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('@/lib/db', () => jest.fn().mockResolvedValue(true));

// --- Batch promotion mocks ---
jest.mock('@/models/Academic', () => ({
    Batch: { findById: jest.fn() },
    Program: {},
    Session: {},
    Subject: {},
    Assignment: {},
}));

// --- Document review mocks ---
jest.mock('@/models/DocumentSubmission', () => ({
    DocumentSubmission: { findById: jest.fn() },
}));
jest.mock('@/models/DocumentRequirement', () => ({
    DocumentRequirement: { findById: jest.fn() },
}));
jest.mock('@/models/AuditLog', () => ({
    AuditLog: { create: jest.fn() },
}));

import { getServerSession } from 'next-auth';
import { Batch } from '@/models/Academic';
import { DocumentSubmission } from '@/models/DocumentSubmission';
import { DocumentRequirement } from '@/models/DocumentRequirement';

function makeRequest(body?: any, url = 'http://localhost:3000/api/test') {
    return {
        json: () => Promise.resolve(body),
        url,
        headers: { get: () => '127.0.0.1' },
    } as unknown as Request;
}

describe('Batch Promotion', () => {
    let PUT: any;

    beforeAll(async () => {
        const mod = await import('@/app/api/admin/academic/batches/[id]/promote/route');
        PUT = mod.PUT;
    });

    beforeEach(() => jest.clearAllMocks());

    test('non-admin → 401', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'student' } });
        const res = await PUT(makeRequest(), { params: Promise.resolve({ id: 'b1' }) });
        expect(res.status).toBe(401);
    });

    test('batch not found → 404', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin' } });
        (Batch.findById as jest.Mock).mockReturnValue({ populate: () => null });
        const res = await PUT(makeRequest(), { params: Promise.resolve({ id: 'bad' }) });
        expect(res.status).toBe(404);
    });

    test('already at final semester → 400', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin' } });
        (Batch.findById as jest.Mock).mockReturnValue({
            populate: () => ({ current_semester: 8, program: { total_semesters: 8 }, save: jest.fn() }),
        });
        const res = await PUT(makeRequest(), { params: Promise.resolve({ id: 'b1' }) });
        expect(res.status).toBe(400);
        expect(res.body.message).toContain('final semester');
    });

    test('valid promotion increments semester', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin' } });
        const batch = { current_semester: 3, program: { total_semesters: 8 }, save: jest.fn() };
        (Batch.findById as jest.Mock).mockReturnValue({ populate: () => batch });
        const res = await PUT(makeRequest(), { params: Promise.resolve({ id: 'b1' }) });
        expect(res.status).toBe(200);
        expect(batch.current_semester).toBe(4);
        expect(batch.save).toHaveBeenCalled();
    });
});

describe('Document Review Authorization', () => {
    let PUT: any;

    beforeAll(async () => {
        const mod = await import('@/app/api/admin/documents/submissions/[id]/review/route');
        PUT = mod.PUT;
    });

    beforeEach(() => jest.clearAllMocks());

    test('unauthenticated → 401', async () => {
        (getServerSession as jest.Mock).mockResolvedValue(null);
        const res = await PUT(
            makeRequest({ action: 'approve' }),
            { params: Promise.resolve({ id: 'sub1' }) }
        );
        expect(res.status).toBe(401);
    });

    test('student role → 401', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'student', id: 's1' } });
        const res = await PUT(
            makeRequest({ action: 'approve' }),
            { params: Promise.resolve({ id: 'sub1' }) }
        );
        expect(res.status).toBe(401);
    });

    test('invalid action → 400', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        const res = await PUT(
            makeRequest({ action: 'delete' }),
            { params: Promise.resolve({ id: 'sub1' }) }
        );
        expect(res.status).toBe(400);
    });

    test('submission not found → 404', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        (DocumentSubmission.findById as jest.Mock).mockReturnValue({ populate: () => null });
        const res = await PUT(
            makeRequest({ action: 'approve' }),
            { params: Promise.resolve({ id: 'bad' }) }
        );
        expect(res.status).toBe(404);
    });

    test('teacher reviewing other teacher\'s requirement → 403', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'teacher', id: 'teacher1' } });
        (DocumentSubmission.findById as jest.Mock).mockReturnValue({
            populate: () => ({
                _id: 'sub1',
                requirement: 'req1',
                status: 'pending',
                submission_history: [],
                save: jest.fn(),
            }),
        });
        (DocumentRequirement.findById as jest.Mock).mockResolvedValue({
            created_by: { toString: () => 'teacher2' },
        });

        const res = await PUT(
            makeRequest({ action: 'approve' }),
            { params: Promise.resolve({ id: 'sub1' }) }
        );
        expect(res.status).toBe(403);
    });

    test('admin can approve any submission', async () => {
        (getServerSession as jest.Mock).mockResolvedValue({ user: { role: 'admin', id: 'a1' } });
        const submission = {
            _id: 'sub1', requirement: 'req1', status: 'pending',
            submission_history: [{ status: 'pending' }],
            save: jest.fn(),
        };
        (DocumentSubmission.findById as jest.Mock).mockReturnValue({ populate: () => submission });

        const res = await PUT(
            makeRequest({ action: 'approve', comment: 'Looks good' }),
            { params: Promise.resolve({ id: 'sub1' }) }
        );
        expect(res.status).toBe(200);
        expect(submission.status).toBe('approved');
        expect(submission.save).toHaveBeenCalled();
    });
});
