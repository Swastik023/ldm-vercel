import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Batch } from '@/models/Academic';
import '@/models/Academic';

// GET /api/public/batches — fetch active batches for the registration form dropdown
export async function GET() {
    await dbConnect();
    const batches = await Batch.find({ is_active: true })
        .populate('program', 'name code duration_years')
        .select('name batchCode intakeMonth joiningYear status program')
        .sort({ joiningYear: -1, intakeMonth: 1 })
        .lean();

    return NextResponse.json({ success: true, batches });
}
