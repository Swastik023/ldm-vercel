import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dbConnect from '@/lib/db';
import { EmailOTP } from '@/models/EmailOTP';
import { checkRateLimit } from '@/lib/rateLimit';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// CRIT-03 fix: Use cryptographically secure random number generator
function generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

export async function POST(req: Request) {
    // Rate limit: 3 OTP sends per minute per IP
    const rateLimited = checkRateLimit(req, 'otp-send', 3);
    if (rateLimited) return rateLimited;

    await dbConnect();

    const { email } = await req.json();
    if (!email) {
        return NextResponse.json({ success: false, message: 'Email is required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: allow resend only after 60 seconds
    const existing = await EmailOTP.findOne({ email: normalizedEmail });
    if (existing) {
        const secondsSinceLastSent = (Date.now() - new Date(existing.lastSentAt).getTime()) / 1000;
        if (secondsSinceLastSent < 60) {
            const waitSeconds = Math.ceil(60 - secondsSinceLastSent);
            return NextResponse.json(
                { success: false, message: `Please wait ${waitSeconds} seconds before requesting a new code.` },
                { status: 429 }
            );
        }
    }

    const otp = generateOTP();
    const hashedOTP = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Upsert OTP record
    await EmailOTP.findOneAndUpdate(
        { email: normalizedEmail },
        {
            hashedOTP,
            expiresAt,
            attempts: 0,
            lastSentAt: new Date(),
            verified: false,
        },
        { upsert: true, new: true }
    );

    // Send OTP email
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"LDM College" <${process.env.SMTP_USER}>`,
            to: normalizedEmail,
            subject: 'Your LDM College Verification Code',
            html: `
                <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 480px; margin: auto; background: #0A192F; border-radius: 16px; padding: 32px; color: white;">
                    <h2 style="color: #10B981; margin-bottom: 8px;">🎓 LDM College</h2>
                    <h3 style="margin-bottom: 4px;">Your verification code</h3>
                    <p style="color: #9ca3af; margin-top: 0;">Enter this code to complete your registration.</p>
                    <div style="background: rgba(16,185,129,0.1); border: 2px solid #10B981; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                        <span style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #10B981;">${otp}</span>
                    </div>
                    <p style="color: #9ca3af; font-size: 14px;">This code is valid for <strong style="color: white;">5 minutes</strong>. Do not share it with anyone.</p>
                    <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">If you did not request this, please ignore this email.</p>
                </div>
            `,
        });
    } catch (error) {
        console.error('SMTP Send Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to send email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Verification code sent to your email!' });
}
