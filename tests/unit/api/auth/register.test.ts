jest.mock('next/server', () => ({
    NextResponse: {
        json: (body: any, init?: any) => ({ body, status: init?.status || 200 }),
    },
}));
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed_password'),
}));
jest.mock('@/lib/db', () => jest.fn().mockResolvedValue(true));
jest.mock('@/models/User', () => ({
    User: {
        findOne: jest.fn(),
        create: jest.fn(),
    },
}));
jest.mock('@/models/StudentProfile', () => ({
    StudentProfile: { create: jest.fn().mockResolvedValue({}) },
}));

import { User } from '@/models/User';

const VALID_BODY = {
    fullName: 'Test User',
    email: 'test@example.com',
    mobileNumber: '9999999999',
    gender: 'Male',
    dateOfBirth: '2000-01-01',
    highestQualification: 'Graduate',
    yearOfPassing: 2022,
    englishComfortLevel: 'Fluent',
    password: 'StrongPass123',
};

function makeRequest(body: any) {
    return { json: () => Promise.resolve(body) } as unknown as Request;
}

describe('POST /api/auth/register', () => {
    let POST: any;

    beforeAll(async () => {
        const mod = await import('@/app/api/auth/register/route');
        POST = mod.POST;
    });

    beforeEach(() => jest.clearAllMocks());

    test('missing required fields → 400', async () => {
        const res = await POST(makeRequest({ fullName: 'Only Name' }));
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('duplicate email → 409', async () => {
        (User.findOne as jest.Mock).mockResolvedValueOnce({ _id: 'existing' });
        const res = await POST(makeRequest(VALID_BODY));
        expect(res.status).toBe(409);
    });

    test('username collision auto-increments', async () => {
        (User.findOne as jest.Mock)
            .mockResolvedValueOnce(null)       // email check
            .mockResolvedValueOnce({ _id: 1 }) // username "test" taken
            .mockResolvedValueOnce(null);      // username "test1" available
        (User.create as jest.Mock).mockResolvedValue({ _id: 'new', fullName: 'Test' });

        const res = await POST(makeRequest(VALID_BODY));
        expect(res.status).toBe(201);
        expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ username: 'test1' }));
    });

    test('successful registration → 201', async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        (User.create as jest.Mock).mockResolvedValue({ _id: 'new123' });

        const res = await POST(makeRequest(VALID_BODY));
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });
});
