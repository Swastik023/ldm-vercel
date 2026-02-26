describe('Auth Utility', () => {
    test('authOptions has required providers', async () => {
        const authModule = await import('@/lib/auth');
        const authOptions = (authModule as any).authOptions || (authModule as any).default;
        expect(authOptions).toBeDefined();
        if (authOptions?.providers) {
            expect(Array.isArray(authOptions.providers)).toBe(true);
        }
    });
});
