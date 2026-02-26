jest.mock('next/server', () => ({
    NextResponse: {
        json: (body: any, init?: any) => ({ body, status: init?.status || 200 }),
    },
}));
jest.mock('bcryptjs', () => ({
    compare: jest.fn(),
}));
jest.mock('@/lib/db', () => jest.fn().mockResolvedValue(true));
jest.mock('@/models/EmailOTP', () => ({
    EmailOTP: {
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
    },
}));
jest.mock('@/models/StudentProfile', () => ({
    StudentProfile: { findOneAndUpdate: jest.fn() },
}));
jest.mock('@/models/User', () => ({
    User: { findOne: jest.fn(), findByIdAndUpdate: jest.fn().mockResolvedValue({}) },
}));

import { EmailOTP } from '@/models/EmailOTP';
import bcrypt from 'bcryptjs';

function makeRequest(body: any) {
    return { json: () => Promise.resolve(body) } as unknown as Request;
}

describe('POST /api/auth/verify-otp', () => {
    let POST: any;

    beforeAll(async () => {
        const mod = await import('@/app/api/auth/verify-otp/route');
        POST = mod.POST;
    });

    beforeEach(() => jest.clearAllMocks());

    test('missing email/OTP → 400', async () => {
        const res = await POST(makeRequest({ email: 'a@b.com' }));
        expect(res.status).toBe(400);
    });

    test('no OTP record → 404', async () => {
        (EmailOTP.findOne as jest.Mock).mockResolvedValue(null);
        const res = await POST(makeRequest({ email: 'a@b.com', otp: '1234' }));
        expect(res.status).toBe(404);
    });

    test('already verified → 400', async () => {
        (EmailOTP.findOne as jest.Mock).mockResolvedValue({ verified: true });
        const res = await POST(makeRequest({ email: 'a@b.com', otp: '1234' }));
        expect(res.status).toBe(400);
    });

    test('expired OTP → 410', async () => {
        (EmailOTP.findOne as jest.Mock).mockResolvedValue({
            verified: false,
            expiresAt: new Date(Date.now() - 60000),
            attempts: 0,
        });
        const res = await POST(makeRequest({ email: 'a@b.com', otp: '1234' }));
        expect(res.status).toBe(410);
    });

    test('max attempts exceeded → 429', async () => {
        (EmailOTP.findOne as jest.Mock).mockResolvedValue({
            verified: false,
            expiresAt: new Date(Date.now() + 60000),
            attempts: 3,
        });
        const res = await POST(makeRequest({ email: 'a@b.com', otp: '1234' }));
        expect(res.status).toBe(429);
    });

    test('wrong OTP increments attempts → 401', async () => {
        (EmailOTP.findOne as jest.Mock).mockResolvedValue({
            verified: false,
            expiresAt: new Date(Date.now() + 60000),
            attempts: 1,
            hashedOTP: 'hash',
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        (EmailOTP.findOneAndUpdate as jest.Mock).mockResolvedValue({});

        const res = await POST(makeRequest({ email: 'a@b.com', otp: 'wrong' }));
        expect(res.status).toBe(401);
        expect(EmailOTP.findOneAndUpdate).toHaveBeenCalledWith(
            { email: 'a@b.com' },
            { $inc: { attempts: 1 } }
        );
    });

    test('correct OTP → success', async () => {
        (EmailOTP.findOne as jest.Mock).mockResolvedValue({
            verified: false,
            expiresAt: new Date(Date.now() + 60000),
            attempts: 0,
            hashedOTP: 'hash',
        });
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (EmailOTP.findOneAndUpdate as jest.Mock).mockResolvedValue({});
        const { User } = require('@/models/User');
        (User.findOne as jest.Mock).mockResolvedValue({ _id: 'uid' });

        const res = await POST(makeRequest({ email: 'a@b.com', otp: '1234' }));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
