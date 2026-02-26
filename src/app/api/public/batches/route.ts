import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Batch } from '@/models/Academic';

// GET /api/public/batches — fetch active batches for the registration form dropdown
export async function GET() {
    await dbConnect();
    const batches = await Batch.find({ is_active: true })
        .populate('program', 'name code')
        .populate('session', 'name')
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json({ success: true, batches });
}
