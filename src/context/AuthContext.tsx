'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    username: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: any) => void; // Kept for compatibility but should use signIn directly usually
    logout: () => void;
    isLoading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Internal provider that uses useSession
function AuthProviderContent({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const isLoading = status === "loading";
    const isAuthenticated = status === "authenticated";

    const user = session?.user ? {
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role || 'student', // Default fallback
        username: session.user.username || ''
    } : null;

    const login = async (userData: any) => {
        // This function is less useful now as we use signIn directly in components, 
        // but for compatibility with migrated code calling login(user):
        // We can't easily "set" session client-side without a reload or signIn call.
        // Migrated components should be updated to use signIn() from next-auth/react.
        console.warn("AuthContext.login is deprecated. Use signIn from next-auth/react instead.");
    };

    const logout = async () => {
        await signOut({ redirect: false });
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AuthProviderContent>
                {children}
            </AuthProviderContent>
        </SessionProvider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
