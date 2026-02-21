import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Contact from '@/models/Contact';

// POST /api/public/admission — submit a course application enquiry
export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
        }

        const { name, email, phone, course, qualification, message } = body;

        // Required field validation
        if (!name?.trim() || !phone?.trim() || !course?.trim()) {
            return NextResponse.json(
                { success: false, message: 'Name, phone and course selection are required.' },
                { status: 400 }
            );
        }

        // Email format check (required for admissions)
        if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 });
        }

        // Phone format check
        if (!/^[\d\s\+\-\(\)]{7,15}$/.test(phone)) {
            return NextResponse.json({ success: false, message: 'Please enter a valid phone number.' }, { status: 400 });
        }

        // Length guards
        if (name.length > 100 || course.length > 200) {
            return NextResponse.json({ success: false, message: 'Input exceeds maximum allowed length.' }, { status: 400 });
        }

        const ipAddress =
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            '0.0.0.0';
        const userAgent = req.headers.get('user-agent') || '';

        await dbConnect();

        // Rate limiting: max 3 per IP per hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentCount = await Contact.countDocuments({ ipAddress, createdAt: { $gte: oneHourAgo } });
        if (recentCount >= 3) {
            return NextResponse.json(
                { success: false, message: 'Too many submissions. Please try again after an hour or call us directly.' },
                { status: 429 }
            );
        }

        // Compose a clear subject and message for admin visibility
        const subject = `Admission Enquiry — ${course}`;
        const composedMessage = [
            `Course Applied: ${course}`,
            qualification ? `Qualification: ${qualification}` : null,
            message?.trim() ? `Message: ${message.trim()}` : null,
        ].filter(Boolean).join('\n');

        await Contact.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            subject,
            message: composedMessage,
            status: 'new',
            ipAddress,
            userAgent,
        });

        return NextResponse.json(
            { success: true, message: 'Thank you for your interest! Our admissions team will contact you within 24 hours.' },
            { status: 201 }
        );
    } catch (err) {
        console.error('[Admission API Error]', err);
        return NextResponse.json(
            { success: false, message: 'Something went wrong. Please call us directly at +91 989-660-7010.' },
            { status: 500 }
        );
    }
}
