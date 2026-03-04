import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { EmailOTP } from '@/models/EmailOTP';
import { StudentProfile } from '@/models/StudentProfile';
import { User } from '@/models/User';
import { safeParseJSON } from '@/lib/validate';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
    // Rate limit: 5 OTP verifications per minute per IP
    const rateLimited = checkRateLimit(req, 'otp-verify', 5);
    if (rateLimited) return rateLimited;

    await dbConnect();

    const [body, parseErr] = await safeParseJSON(req);
    if (parseErr) return parseErr;

    const { email, otp } = body;
    if (!email || !otp) {
        return NextResponse.json({ success: false, message: 'Email and OTP are required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await EmailOTP.findOne({ email: normalizedEmail });

    if (!record) {
        return NextResponse.json({ success: false, message: 'No verification code found. Please request a new one.' }, { status: 404 });
    }

    if (record.verified) {
        return NextResponse.json({ success: false, message: 'This email is already verified.' }, { status: 400 });
    }

    if (new Date() > record.expiresAt) {
        return NextResponse.json({ success: false, message: 'Your code has expired. Please request a new one.' }, { status: 410 });
    }

    if (record.attempts >= 3) {
        return NextResponse.json({ success: false, message: 'Too many wrong attempts. Please request a new code.' }, { status: 429 });
    }

    const isMatch = await bcrypt.compare(otp.toString(), record.hashedOTP);
    if (!isMatch) {
        await EmailOTP.findOneAndUpdate(
            { email: normalizedEmail },
            { $inc: { attempts: 1 } }
        );
        const remaining = 3 - (record.attempts + 1);
        return NextResponse.json(
            { success: false, message: `Wrong code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` },
            { status: 401 }
        );
    }

    // Mark as verified in EmailOTP
    await EmailOTP.findOneAndUpdate({ email: normalizedEmail }, { verified: true });

    // Mark emailVerified in StudentProfile and User
    const user = await User.findOne({ email: normalizedEmail });
    if (user) {
        await Promise.all([
            StudentProfile.findOneAndUpdate({ userId: user._id }, { emailVerified: true }),
            User.findByIdAndUpdate(user._id, { isEmailVerified: true }),
        ]);
    }

    return NextResponse.json({ success: true, message: 'Email verified successfully! 🎉' });
}
