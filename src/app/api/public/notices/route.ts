import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Notice from '@/models/Notice';

// GET /api/public/notices - returns active public notices
export async function GET() {
    try {
        await dbConnect();
        const notices = await Notice.find({ isActive: true })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, notices });
    } catch (error) {
        console.error('Notices API error:', error);
        return NextResponse.json({ success: false, notices: [], message: 'Failed to fetch notices' }, { status: 500 });
    }
}
