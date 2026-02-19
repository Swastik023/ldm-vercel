import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Gallery from '@/models/Gallery';

// GET /api/public/gallery - returns active gallery images
export async function GET() {
    try {
        await dbConnect();
        const images = await Gallery.find({ isActive: true })
            .sort({ displayOrder: 1, createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, images });
    } catch (error) {
        console.error('Gallery API error:', error);
        return NextResponse.json({ success: false, images: [], message: 'Failed to fetch gallery' }, { status: 500 });
    }
}
