import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';

export async function GET() {
    try {
        await dbConnect();
        // Return only active and public programs (if such filter exists)
        // For now, return all programs to populate the library selector
        const programs = await Program.find({}, 'name code').sort({ name: 1 }).lean();

        return NextResponse.json({
            success: true,
            programs: programs.map(p => ({
                id: p._id.toString(),
                name: p.name,
                code: p.code
            }))
        });
    } catch (err) {
        console.error('Public programs error:', err);
        return NextResponse.json({ success: false, programs: [] }, { status: 500 });
    }
}
