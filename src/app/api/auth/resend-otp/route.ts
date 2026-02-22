import { NextResponse } from 'next/server';
import { POST as sendOTP } from '@/app/api/auth/send-otp/route';

// Resend OTP — delegates to send-otp with same rate-limiting logic
export async function POST(req: Request) {
    return sendOTP(req);
}
