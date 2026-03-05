import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { Class } from '@/models/Class';
import { Batch } from '@/models/Academic';
import '@/models/Academic';
import '@/models/Class';
import { autoCreateStudentFee } from '@/lib/autoCreateStudentFee';

// PATCH /api/admin/users/approve
// Approve:  { userId, action: 'approve' }
// Reject:   { userId, action: 'reject', rejectionReasons: { passportPhoto: 'Photo not clear', ... } }
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, action, rejectionReasons } = body;

        if (!userId || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
        }

        await dbConnect();

        if (action === 'approve') {
            const updated = await User.findByIdAndUpdate(
                userId,
                { status: 'active', rejectionReasons: null },
                { new: true }
            ).select('fullName email status batch programId joiningYear courseEndDate');

            if (!updated) {
                return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
            }

            // ── Auto-link: Create Class record if missing ─────────────────
            if (updated.batch && !updated.classId) {
                try {
                    const batch = await Batch.findById(updated.batch).populate('program', 'name code duration_years').lean() as any;
                    if (batch) {
                        const jy = batch.joiningYear;
                        const dur = batch.program?.duration_years || 3;
                        const existingClass = await Class.findOne({ batchId: batch._id, sessionFrom: jy, sessionTo: jy + dur });
                        if (!existingClass) {
                            const cls = await Class.create({
                                batchId: batch._id,
                                sessionFrom: jy,
                                sessionTo: jy + dur,
                                className: `${batch.program?.name || batch.name} (${jy}-${jy + dur})`,
                            });
                            await User.findByIdAndUpdate(userId, { classId: cls._id });
                        } else {
                            await User.findByIdAndUpdate(userId, { classId: existingClass._id });
                        }
                    }
                } catch (e) {
                    console.warn('[approve] Class auto-create failed (non-blocking):', e);
                }
            }

            // ── Auto-link: Create StudentFee record if missing ────────────
            if (updated.batch) {
                try {
                    await autoCreateStudentFee(userId, updated.batch);
                } catch (e) {
                    console.warn('[approve] Fee auto-create failed (non-blocking):', e);
                }
                // M-01 fix: Increment batch student count on approval
                await Batch.findByIdAndUpdate(updated.batch, { $inc: { current_students: 1 } });
            }

            return NextResponse.json({
                success: true,
                message: 'Student approved successfully! They can now access their dashboard.',
                user: { id: updated._id, name: updated.fullName, status: updated.status },
            });
        }

        // Reject with per-field reasons
        if (action === 'reject') {
            if (!rejectionReasons || typeof rejectionReasons !== 'object' || Object.keys(rejectionReasons).length === 0) {
                return NextResponse.json({
                    success: false,
                    message: 'Please provide at least one rejection reason.'
                }, { status: 400 });
            }

            const updated = await User.findByIdAndUpdate(
                userId,
                { status: 'rejected', rejectionReasons },
                { new: true }
            ).select('fullName email status rejectionReasons');

            if (!updated) {
                return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
            }

            return NextResponse.json({
                success: true,
                message: 'Student rejected. They will see the rejection reasons and can re-upload.',
                user: { id: updated._id, name: updated.fullName, status: updated.status },
            });
        }

        return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
    } catch (err: any) {
        console.error('[admin/users/approve PATCH]', err);
        return NextResponse.json({ success: false, message: err?.message || 'Internal server error' }, { status: 500 });
    }
}

// GET /api/admin/users/approve?status=pending — list students by status
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const statusFilter = searchParams.get('status') || 'pending';

        const users = await User.find({ status: statusFilter, role: 'student' })
            .select('fullName email mobileNumber rollNumber sessionFrom sessionTo isProfileComplete status createdAt batch classId provider rejectionReasons programId session joiningMonth joiningYear semester')
            .populate('batch', 'name batchCode')
            .populate('classId', 'className')
            .populate('programId', 'name code')
            .populate('session', 'name')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, users });
    } catch (err: any) {
        console.error('[admin/users/approve GET]', err);
        return NextResponse.json({ success: false, message: err?.message || 'Internal server error' }, { status: 500 });
    }
}
