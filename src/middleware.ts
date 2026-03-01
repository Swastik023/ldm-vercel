import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;
        const role = token?.role;
        const status = token?.status;

        // ── API route protection ─────────────────────────────────────────
        // Block unauthenticated or wrong-role API calls at the edge
        // Note: /api/admin/tests is shared between admin and teacher (route handler checks both roles)
        if (path.startsWith('/api/admin/') && role !== 'admin') {
            const isSharedRoute = path.startsWith('/api/admin/tests');
            if (!(isSharedRoute && role === 'teacher')) {
                return NextResponse.json(
                    { success: false, message: 'Unauthorized — admin access required' },
                    { status: 401 }
                );
            }
        }
        if (path.startsWith('/api/student/') && role !== 'student') {
            // /api/student/notices is shared with teacher (route handler checks both roles)
            const isSharedStudentRoute = path === '/api/student/notices';
            if (!(isSharedStudentRoute && role === 'teacher')) {
                return NextResponse.json(
                    { success: false, message: 'Unauthorized — student access required' },
                    { status: 401 }
                );
            }
        }
        if (path.startsWith('/api/teacher/') && role !== 'teacher') {
            return NextResponse.json(
                { success: false, message: 'Unauthorized — teacher access required' },
                { status: 401 }
            );
        }

        // ── Page protection below ────────────────────────────────────────

        // Profile completion and pending approval flows are ONLY for students
        if (role === 'student') {
            // Pending / under_review / rejected users → pending-approval page
            if (token && !path.startsWith('/api/') && path !== '/pending-approval') {
                if (status === 'pending' || status === 'under_review') {
                    if (path !== '/complete-profile') {
                        return NextResponse.redirect(new URL('/pending-approval', req.url));
                    }
                }
                if (status === 'rejected') {
                    if (path !== '/complete-profile') {
                        return NextResponse.redirect(new URL('/pending-approval', req.url));
                    }
                }
            }

            // If profile is incomplete, redirect to complete-profile
            if (token && !token.isProfileComplete && status === 'active' && path !== '/complete-profile' && path !== '/pending-approval' && !path.startsWith('/api/')) {
                return NextResponse.redirect(new URL('/complete-profile', req.url));
            }
        }

        // Role-based page redirection
        if (path.startsWith("/admin") && !path.startsWith("/api/") && role !== "admin") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (path.startsWith("/teacher") && !path.startsWith("/api/") && role !== "teacher") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (path.startsWith("/student") && !path.startsWith("/api/") && role !== "student") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (path.startsWith("/employee") && !path.startsWith("/api/") && role !== "employee") {
            return NextResponse.redirect(new URL("/", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Public API routes don't need auth
                if (req.nextUrl.pathname.startsWith('/api/public/')) return true;
                if (req.nextUrl.pathname.startsWith('/api/auth/')) return true;
                if (req.nextUrl.pathname.startsWith('/api/notifications')) return true;
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        // Pages
        "/admin/:path*",
        "/teacher/:path*",
        "/student/:path*",
        "/employee/:path*",
        "/complete-profile",
        "/pending-approval",
        "/library",
        // API routes (protected)
        "/api/admin/:path*",
        "/api/student/:path*",
        "/api/teacher/:path*",
    ],
};
