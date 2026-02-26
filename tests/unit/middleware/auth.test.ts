jest.mock('next-auth/middleware', () => ({
    withAuth: (fn: any) => fn,
}));

jest.mock('next/server', () => ({
    NextResponse: {
        redirect: jest.fn(),
        next: jest.fn(),
    },
}));

describe('Middleware Logic', () => {
    test('middleware config matches protected routes', async () => {
        const middleware = await import('@/middleware');
        const config = (middleware as any).config;
        expect(config).toBeDefined();
        expect(config.matcher).toContain('/admin/:path*');
        expect(config.matcher).toContain('/student/:path*');
        expect(config.matcher).toContain('/teacher/:path*');
        expect(config.matcher).toContain('/employee/:path*');
    });
});
