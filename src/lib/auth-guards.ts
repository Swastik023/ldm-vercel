import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface SessionUser {
    id: string;
    role: string;
    [key: string]: unknown;
}

/**
 * Require an authenticated session with a specific role.
 * Returns `null` if authorized, or a 401 JSON response if not.
 *
 * Usage:
 *   const deny = await requireRole('admin');
 *   if (deny) return deny;
 */
export async function requireRole(role: string): Promise<NextResponse | null> {
    const session = await getServerSession(authOptions) as { user?: SessionUser } | null;
    if (!session?.user?.id || session.user.role !== role) {
        return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
        );
    }
    return null;
}

/** Convenience wrappers */
export const requireAdmin = () => requireRole('admin');
export const requireStudent = () => requireRole('student');
export const requireTeacher = () => requireRole('teacher');

/**
 * Get authenticated session + deny response in one call.
 * Returns { session, deny } — check deny first.
 */
export async function getAuthSession(role?: string) {
    const session = await getServerSession(authOptions) as { user?: SessionUser } | null;
    const deny = (!session?.user?.id || (role && session.user.role !== role))
        ? NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
        : null;
    return { session, deny };
}
