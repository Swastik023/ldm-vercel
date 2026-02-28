import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';
import '@/models/Academic';

// GET /api/public/programs — fetch active programs for the registration form dropdown
export async function GET() {
    await dbConnect();
    const programs = await Program.find({ is_active: true })
        .select('name code duration_years course_type')
        .sort({ name: 1 })
        .lean();

    return NextResponse.json({ success: true, programs });
}
