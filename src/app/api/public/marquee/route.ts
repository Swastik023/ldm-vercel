import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import MarqueeMessage from '@/models/MarqueeMessage';
import Notice from '@/models/Notice';

// GET /api/public/marquee - returns active messages for the scrolling notice bar
export async function GET() {
    try {
        await dbConnect();

        // First: check for manually added MarqueeMessages
        const marqueeMessages = await MarqueeMessage.find({ isActive: true })
            .sort({ order: 1, createdAt: -1 })
            .lean();

        if (marqueeMessages.length > 0) {
            return NextResponse.json({
                success: true,
                messages: marqueeMessages.map(m => ({ message: m.message })),
            });
        }

        // Fallback: use recent active Notice titles
        const notices = await Notice.find({ isActive: true })
            .select('title')
            .sort({ createdAt: -1 })
            .limit(8)
            .lean();

        if (notices.length > 0) {
            return NextResponse.json({
                success: true,
                messages: notices.map(n => ({ message: n.title })),
            });
        }

        // Default static fallback
        return NextResponse.json({
            success: true,
            messages: [
                { message: 'Welcome to LDM College of Paramedical Sciences' },
                { message: 'Admissions Open for 2026 Batch — Apply Now!' },
                { message: 'Providing Quality Education in Paramedical Sciences' },
            ],
        });
    } catch {
        return NextResponse.json({
            success: true,
            messages: [
                { message: 'Welcome to LDM College of Paramedical Sciences' },
                { message: 'Admissions Open — Contact Us Today' },
            ],
        });
    }
}
