import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { SliderImage } from '@/models/SliderImage';

// GET /api/public/slider — fetch active slides for homepage (no auth required)
export async function GET() {
    await dbConnect();
    const slides = await SliderImage.find({ isActive: true }).sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, slides });
}
