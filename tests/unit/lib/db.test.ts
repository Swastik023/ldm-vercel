import '@testing-library/jest-dom';

// Mock mongoose
jest.mock('mongoose', () => ({
    connect: jest.fn().mockResolvedValue(true),
    connection: { readyState: 1 },
    model: jest.fn(),
    Schema: jest.fn(),
}));

describe('Database Connection', () => {
    test('dbConnect resolves without error', async () => {
        const { default: dbConnect } = await import('@/lib/db');
        await expect(dbConnect()).resolves.not.toThrow();
    });
});
