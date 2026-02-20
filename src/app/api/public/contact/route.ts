import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Contact from '@/models/Contact';

// POST /api/public/contact — submit a contact form enquiry
export async function POST(req: Request) {
    try {
        // --- Parse & validate body ---
        const body = await req.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
        }

        const { name, email, phone, subject, message } = body;

        if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
            return NextResponse.json(
                { success: false, message: 'Name, email, subject and message are required.' },
                { status: 400 }
            );
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 });
        }

        // Phone format check (if provided)
        if (phone && !/^[\d\s\+\-\(\)]{7,15}$/.test(phone)) {
            return NextResponse.json({ success: false, message: 'Please enter a valid phone number.' }, { status: 400 });
        }

        // Length guards to prevent abuse
        if (name.length > 100 || subject.length > 200 || message.length > 2000) {
            return NextResponse.json({ success: false, message: 'Input exceeds maximum allowed length.' }, { status: 400 });
        }

        // --- IP & User-Agent metadata ---
        const ipAddress =
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            '0.0.0.0';
        const userAgent = req.headers.get('user-agent') || '';

        await dbConnect();

        // --- Rate limiting: max 3 submissions per IP per hour ---
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentCount = await Contact.countDocuments({
            ipAddress,
            createdAt: { $gte: oneHourAgo },
        });

        if (recentCount >= 3) {
            return NextResponse.json(
                { success: false, message: 'Too many submissions. Please try again after an hour.' },
                { status: 429 }
            );
        }

        // --- Save to DB ---
        await Contact.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone?.trim() || undefined,
            subject: subject.trim(),
            message: message.trim(),
            status: 'new',
            ipAddress,
            userAgent,
        });

        return NextResponse.json(
            { success: true, message: 'Thank you! Your message has been received. We will get back to you shortly.' },
            { status: 201 }
        );
    } catch (err) {
        console.error('[Contact API Error]', err);
        return NextResponse.json(
            { success: false, message: 'Something went wrong. Please try again or call us directly.' },
            { status: 500 }
        );
    }
}
