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

        // Allow teachers to view all active batches to assign themselves
        if (view === 'available-batches') {
            const activeSession = await Session.findOne({ status: 'active' }).sort({ start_date: -1 }).lean();
            const batches = await Batch.find({ is_active: true })
                .populate('program', 'name code')
                .sort({ joiningYear: -1, intakeMonth: 1, name: 1 })
                .lean();

            const subjects = await Subject.find().sort({ semester: 1, name: 1 }).lean();

            return NextResponse.json({
                success: true,
                activeSession,
                batches,
                subjects
            });
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
        const { subjectId, batchId, sessionId, section } = body;

        if (!subjectId || !sessionId || !section) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // Check if assignment already exists
        const existingAssignment = await Assignment.findOne({
            teacher: userSession.user.id,
            subject: subjectId,
            batch: batchId || { $exists: false },
            session: sessionId,
            section: section
        });

        if (existingAssignment) {
            return NextResponse.json({ success: false, message: 'You are already assigned to this class' }, { status: 400 });
        }

        // Create the assignment
        const newAssignment = await Assignment.create({
            teacher: userSession.user.id,
            subject: subjectId,
            batch: batchId || undefined,
            session: sessionId,
            section: section
        });

        return NextResponse.json({
            success: true,
            message: 'Self-assignment successful',
            assignment: newAssignment
        });

    } catch (error: any) {
        console.error('Teacher Assign POST error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
