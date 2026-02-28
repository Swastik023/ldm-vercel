import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { StudentDocuments } from '@/models/StudentDocuments';
import { StudentFee } from '@/models/StudentFee';
import mongoose from 'mongoose';
import { Batch } from '@/models/Academic';
import '@/models/Academic';
import '@/models/Class';
import { autoCreateStudentFee } from '@/lib/autoCreateStudentFee';

// PATCH /api/admin/students/[id] — edit student details
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;

        if (!mongoose.Types.ObjectId.isValid(id))
            return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

        const body = await req.json();
        const allowed = ['fullName', 'email', 'mobileNumber', 'rollNumber', 'sessionFrom', 'sessionTo', 'status', 'batch', 'classId'];
        const update: Record<string, unknown> = {};
        for (const key of allowed) {
            if (body[key] !== undefined) update[key] = body[key];
        }

        const updated = await User.findByIdAndUpdate(id, update, { new: true })
            .select('-password')
            .populate('batch', 'name')
            .populate('classId', 'className')
            .lean();

        // Auto-create default fee if a batch is being assigned for the first time (best-effort)
        if (update.batch) {
            try {
                await autoCreateStudentFee(id, update.batch as string);
            } catch {
                // Silent — fee auto-creation failure never blocks the PATCH
            }
        }

        return NextResponse.json({ success: true, student: updated });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}

// GET /api/admin/students/[id] — get full student record (profile + docs + fees)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const { id } = await params;

        const [student, docs, fees] = await Promise.all([
            User.findById(id).select('-password').populate('batch', 'name').populate('classId', 'className').populate('programId', 'name').lean(),
            StudentDocuments.findOne({ userId: id }).lean(),
            StudentFee.find({ studentId: id }).sort({ createdAt: -1 }).lean(),
        ]);

        return NextResponse.json({ success: true, student, documents: docs, fees });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}
