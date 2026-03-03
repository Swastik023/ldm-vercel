import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { ProTest } from '@/models/Test';
import { TestAnswerKey } from '@/models/TestAnswerKey';
import { ProTestAttempt } from '@/models/TestAttempt';

// ── GET /api/admin/tests/[id] — test detail + all attempts ─────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();

    const test = await ProTest.findById(id)
        .populate('batch', 'name intakeMonth joiningYear')
        .populate('subject', 'name code')
        .lean();
    if (!test) return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });

    const attempts = await ProTestAttempt.find({ testId: id })
        .populate('studentId', 'fullName email rollNumber')
        .sort({ marksObtained: -1 })   // Leaderboard order
        .lean();

    return NextResponse.json({ success: true, test, attempts });
}

// ── PATCH /api/admin/tests/[id] — toggle isActive / toggle isPublished ──────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();

    const body = await req.json();
    const allowedFields: Record<string, unknown> = {};
    if (typeof body.isActive === 'boolean') allowedFields.isActive = body.isActive;

    const test = await ProTest.findByIdAndUpdate(id, allowedFields, { new: true });
    if (!test) return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });
    return NextResponse.json({ success: true, test });
}

// ── DELETE /api/admin/tests/[id] — cascade delete ──────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();

    await ProTest.findByIdAndDelete(id);
    await TestAnswerKey.deleteOne({ testId: id });
    await ProTestAttempt.deleteMany({ testId: id });

    return NextResponse.json({ success: true, message: 'Test, answer key, and all attempts deleted.' });
}
