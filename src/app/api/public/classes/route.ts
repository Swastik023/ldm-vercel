import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Class } from '@/models/Class';
import { Batch } from '@/models/Academic';
import '@/models/Academic';

// GET /api/public/classes?batchId=X
// Returns existing classes for a given batch (so registration form can show previews)
export async function GET(req: NextRequest) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('batchId');

    const filter: Record<string, unknown> = {};
    if (batchId) filter.batchId = batchId;

    const classes = await Class.find(filter)
        .populate('batchId', 'name')
        .sort({ sessionFrom: -1 })
        .lean();

    return NextResponse.json({ success: true, classes });
}
