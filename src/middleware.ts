import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;
        const role = token?.role;

        // If profile is incomplete, redirect to complete-profile (except if already there or calling the API)
        if (token && !token.isProfileComplete && path !== '/complete-profile' && !path.startsWith('/api/')) {
            return NextResponse.redirect(new URL('/complete-profile', req.url));
        }

        // Role-based redirection
        if (path.startsWith("/admin") && role !== "admin") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (path.startsWith("/teacher") && role !== "teacher") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (path.startsWith("/student") && role !== "student") {
            return NextResponse.redirect(new URL("/", req.url));
        }
        if (path.startsWith("/employee") && role !== "employee") {
            return NextResponse.redirect(new URL("/", req.url));
        }
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        "/admin/:path*",
        "/teacher/:path*",
        "/student/:path*",
        "/employee/:path*",
        "/complete-profile",
    ],
};

