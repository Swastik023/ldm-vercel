import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { ProTest } from '@/models/Test';
import { ProTestAttempt } from '@/models/TestAttempt';

// ── PATCH /api/admin/tests/[id]/publish — publish all results for this test ─
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();

    const test = await ProTest.findById(id);
    if (!test) return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });

    if (test.resultMode !== 'manual') {
        return NextResponse.json({ success: false, message: 'Only manual-mode tests need publishing.' }, { status: 400 });
    }

    // Mark test as published
    test.isPublished = true;
    await test.save();

    // Set resultVisible = true on ALL attempts for this test
    const updated = await ProTestAttempt.updateMany(
        { testId: id },
        { $set: { resultVisible: true } }
    );

    return NextResponse.json({
        success: true,
        message: `Results published. ${updated.modifiedCount} student result(s) now visible.`,
    });
}
