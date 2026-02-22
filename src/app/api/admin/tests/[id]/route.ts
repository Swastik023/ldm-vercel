import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Test } from '@/models/Test';
import { TestAttempt } from '@/models/TestAttempt';

// GET /api/admin/tests/[id] — test detail + all attempts
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();
    const test = await Test.findById(id).lean();
    if (!test) return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });
    const attempts = await TestAttempt.find({ testId: id })
        .populate('studentId', 'fullName email')
        .sort({ submittedAt: -1 })
        .lean();
    return NextResponse.json({ success: true, test, attempts });
}

// PATCH /api/admin/tests/[id] — toggle isActive
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const test = await Test.findByIdAndUpdate(id, { isActive: body.isActive }, { new: true });
    if (!test) return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });
    return NextResponse.json({ success: true, test });
}

// DELETE /api/admin/tests/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();
    await Test.findByIdAndDelete(id);
    await TestAttempt.deleteMany({ testId: id });
    return NextResponse.json({ success: true, message: 'Test deleted.' });
}
