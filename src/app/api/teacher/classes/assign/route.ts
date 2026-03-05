import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Assignment, Batch, Session, Subject } from '@/models/Academic';
import '@/models/Academic';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const url = new URL(req.url);
        const view = url.searchParams.get('view');

        if (view === 'available-batches') {
            const batches = await Batch.find({ is_active: true })
                .populate('program', 'name code')
                .sort({ joiningYear: -1, intakeMonth: 1, name: 1 })
                .lean();

            const subjects = await Subject.find().sort({ semester: 1, name: 1 }).lean();

            return NextResponse.json({ success: true, batches, subjects });
        }

        return NextResponse.json({ success: false, message: 'Invalid view' }, { status: 400 });

    } catch (error: any) {
        console.error('Teacher Assign GET error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const userSession = await getServerSession(authOptions);
    if (!userSession || userSession.user?.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    try {
        const body = await req.json();
        const { subjectId, batchId, section } = body;

        if (!subjectId || !section) {
            return NextResponse.json({ success: false, message: 'Subject and section are required' }, { status: 400 });
        }

        // Auto-resolve session: prefer active, else most recent — null is fine if none exists
        const resolvedSession = await Session.findOne({ status: 'active' }).sort({ start_date: -1 }).lean()
            || await Session.findOne().sort({ start_date: -1 }).lean()
            || null;

        const sessionId = resolvedSession ? (resolvedSession as any)._id : null;

        // Check for duplicate assignment
        const existing = await Assignment.findOne({
            teacher: userSession.user.id,
            subject: subjectId,
            ...(batchId ? { batch: batchId } : { batch: { $exists: false } }),
            section,
        });

        if (existing) {
            return NextResponse.json({ success: false, message: 'You are already assigned to this subject and batch.' }, { status: 400 });
        }

        const newAssignment = await Assignment.create({
            teacher: userSession.user.id,
            subject: subjectId,
            batch: batchId || undefined,
            session: sessionId,
            section,
        });

        return NextResponse.json({
            success: true,
            message: resolvedSession
                ? `Assigned successfully under session: ${(resolvedSession as any).name}`
                : 'Assigned successfully!',
            assignment: newAssignment,
        });

    } catch (error: any) {
        console.error('Teacher Assign POST error:', error?.message, error?.stack);
        return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
    }
}
