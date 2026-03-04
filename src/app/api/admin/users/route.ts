import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { Batch } from '@/models/Academic';
import '@/models/Academic';
import { Class } from '@/models/Class';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { autoCreateStudentFee } from '@/lib/autoCreateStudentFee';
import { StudentFee } from '@/models/StudentFee';
import { StudentDocuments } from '@/models/StudentDocuments';
import { FeePayment } from '@/models/FeePayment';
import { ProTestAttempt } from '@/models/TestAttempt';

// GET /api/admin/users - list all users
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const users = await User.find({})
        .select('-password')
        .populate('session', 'name')
        .populate('batch', 'name')
        .sort({ createdAt: -1 })
        .lean();
    return NextResponse.json({ success: true, users });
}

// POST /api/admin/users - create a new user
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { username, email, password, fullName, role, sessionId, batchId } = body;

    if (!username || !email || !password || !fullName || !role) {
        return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
        return NextResponse.json({ success: false, message: 'Username or email already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        fullName,
        role,
        status: 'active',
        isProfileComplete: true, // Admin-created users don't need to go through complete-profile
        ...(role === 'student' && sessionId ? { session: sessionId } : {}),
        ...(role === 'student' && batchId ? { batch: batchId } : {}),
    });

    // Increment batch student count when a student is added
    if (role === 'student' && batchId) {
        await Batch.findByIdAndUpdate(batchId, { $inc: { current_students: 1 } });
    }

    // M-08: Auto-create Class record for admin-created students
    if (role === 'student' && batchId) {
        try {
            const batchData = await Batch.findById(batchId).populate('program', 'name code duration_years').lean() as any;
            if (batchData) {
                const jy = batchData.joiningYear;
                const dur = batchData.program?.duration_years || 3;
                let cls = await Class.findOne({ batchId: batchData._id, sessionFrom: jy, sessionTo: jy + dur });
                if (!cls) {
                    cls = await Class.create({
                        batchId: batchData._id,
                        sessionFrom: jy,
                        sessionTo: jy + dur,
                        className: `${batchData.program?.name || batchData.name} (${jy}-${jy + dur})`,
                    });
                }
                await User.findByIdAndUpdate(newUser._id, { classId: cls._id, session: batchData.session });
            }
        } catch (e) {
            console.warn('[admin/users POST] Class auto-create failed:', e);
        }
    }

    // Auto-create default fee record from CoursePricing (best-effort — never blocks user creation)
    let feeAutoCreated = false;
    let feeAutoMessage = 'No batch assigned — fee not auto-created.';
    if (role === 'student' && batchId) {
        try {
            const result = await autoCreateStudentFee(newUser._id, batchId);
            feeAutoCreated = result.created;
            feeAutoMessage = result.reason;
        } catch (feeErr: any) {
            feeAutoMessage = `Fee auto-creation failed: ${feeErr?.message}`;
        }
    }

    const { password: _pw, ...userWithoutPw } = newUser.toObject();
    return NextResponse.json({ success: true, user: userWithoutPw, feeAutoCreated, feeAutoMessage }, { status: 201 });
}


// DELETE /api/admin/users?id=xxx - delete a user
export async function DELETE(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });

    // L-07: Prevent admin self-delete
    if (id === session.user.id) {
        return NextResponse.json({ success: false, message: 'You cannot delete your own account.' }, { status: 403 });
    }

    await dbConnect();
    const userToDelete = await User.findById(id).select('role batch').lean();
    if (!userToDelete) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // If student had a batch, decrement count before deleting
    if (userToDelete.role === 'student' && userToDelete.batch) {
        await Batch.findByIdAndUpdate(userToDelete.batch, { $inc: { current_students: -1 } });
    }

    // M-09: Cascade delete — remove orphaned data
    await Promise.all([
        StudentDocuments.deleteMany({ userId: id }),
        StudentFee.deleteMany({ studentId: id }),
        FeePayment.deleteMany({ student: id }),
        ProTestAttempt.deleteMany({ studentId: id }),
    ]);

    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'User and related records deleted.' });
}
