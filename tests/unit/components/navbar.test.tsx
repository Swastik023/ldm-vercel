import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
    useSession: () => ({ data: null, status: 'unauthenticated' }),
    signIn: jest.fn(),
    signOut: jest.fn(),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock AuthContext
jest.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        logout: jest.fn(),
        login: jest.fn(),
    }),
}));

describe('Navigation Component', () => {
    test('renders without crashing', async () => {
        const { default: Navbar } = await import('@/components/layout/Navbar');
        render(<Navbar />);
        expect(document.querySelector('nav, header')).toBeTruthy();
    });
});
