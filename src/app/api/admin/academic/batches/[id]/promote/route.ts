import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Batch } from '@/models/Academic';

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
        const { id } = await params;
        const batch = await Batch.findById(id).populate('program');

        if (!batch) {
            return NextResponse.json({ success: false, message: 'Batch not found' }, { status: 404 });
        }

        const program = batch.program as any;
        if (batch.current_semester >= program.total_semesters) {
            return NextResponse.json({
                success: false,
                message: `Batch is already in its final semester (${program.total_semesters}).`
            }, { status: 400 });
        }

        batch.current_semester += 1;
        await batch.save();

        return NextResponse.json({ success: true, batch });
    } catch (error) {
        console.error("Batch promotion error:", error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
