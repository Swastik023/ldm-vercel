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
import { safeParseJSON } from '@/lib/validate';

const VALID_STATUSES = ['active', 'inactive', 'suspended', 'pending', 'under_review', 'rejected'];

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

        const [body, parseErr] = await safeParseJSON(req);
        if (parseErr) return parseErr;

        const allowed = ['fullName', 'email', 'mobileNumber', 'rollNumber', 'sessionFrom', 'sessionTo', 'status', 'batch', 'classId'];
        const update: Record<string, unknown> = {};
        for (const key of allowed) {
            if (body[key] !== undefined) {
                // Whitelist status values
                if (key === 'status' && !VALID_STATUSES.includes(body[key])) {
                    return NextResponse.json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
                }
                update[key] = body[key];
            }
        }

        // Handle empty strings for ObjectIds to avoid Mongoose CastErrors
        if (update.batch === '') update.batch = null;
        if (update.classId === '') update.classId = null;

        // Auto-sync program/intake data when assigning a new batch
        if (update.batch) {
            const batchDoc = await Batch.findById(update.batch).lean() as any;
            if (batchDoc) {
                update.programId = batchDoc.program;
                update.session = batchDoc.session;
                update.joiningMonth = batchDoc.intakeMonth;
                update.joiningYear = batchDoc.joiningYear;
            }
        }

        const updated = await User.findByIdAndUpdate(id, update, { new: true })
            .select('-password')
            .populate('batch', 'name')
            .populate('classId', 'className')
            .populate('programId', 'name')
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
