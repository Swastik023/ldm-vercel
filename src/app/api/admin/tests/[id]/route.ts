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

    // HIGH-03: Teachers can only see full questions of their own tests
    const isOwner = session.user.role === 'admin' || String(test.createdBy) === session.user.id;
    const testResponse = isOwner ? test : { ...test, questions: undefined, questionCount: (test.questions ?? []).length };

    const attempts = await ProTestAttempt.find({ testId: id })
        .populate('studentId', 'fullName email rollNumber')
        .sort({ marksObtained: -1 })
        .lean();

    return NextResponse.json({ success: true, test: testResponse, attempts });
}

// ── PATCH /api/admin/tests/[id] — toggle isActive / isPublished (respects isLocked) ──
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

    // isLocked enforcement: once locked, only isActive and isPublished can be changed
    const existingTest = await ProTest.findById(id).lean();
    if (!existingTest) return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });

    if (existingTest.isLocked && (body.questions || body.title || body.durationMinutes || body.totalMarks)) {
        return NextResponse.json({
            success: false,
            message: 'This test is locked because students have already started it. You can only toggle Active/Published status.',
        }, { status: 403 });
    }

    // HIGH-02: Teachers can only toggle their own tests
    const query = session.user.role === 'admin' ? { _id: id } : { _id: id, createdBy: session.user.id };
    const test = await ProTest.findOneAndUpdate(query, allowedFields, { new: true });
    if (!test) return NextResponse.json({ success: false, message: 'Test not found or not owned by you.' }, { status: 404 });
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

    // MED-06: Check test exists before cascading delete
    const test = await ProTest.findById(id);
    if (!test) return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });

    await Promise.all([
        ProTest.findByIdAndDelete(id),
        TestAnswerKey.deleteOne({ testId: id }),
        ProTestAttempt.deleteMany({ testId: id }),
    ]);

    return NextResponse.json({ success: true, message: 'Test, answer key, and all attempts deleted.' });
}
