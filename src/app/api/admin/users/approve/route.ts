import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db';
import { User } from '@/models/User';

// PATCH /api/admin/users/approve
// Approve:  { userId, action: 'approve' }
// Reject:   { userId, action: 'reject', rejectionReasons: { passportPhoto: 'Photo not clear', ... } }
export async function PATCH(req: NextRequest) {
    const token = await getToken({ req });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action, rejectionReasons } = body;

    if (!userId || !['approve', 'reject'].includes(action)) {
        return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    await connectDB();

    if (action === 'approve') {
        const updated = await User.findByIdAndUpdate(
            userId,
            { status: 'active', rejectionReasons: null },
            { new: true }
        ).select('fullName email status');

        if (!updated) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
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
}

// GET /api/admin/users/approve?status=pending — list students by status
export async function GET(req: NextRequest) {
    const token = await getToken({ req });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'pending';

    const users = await User.find({ status: statusFilter, role: 'student' })
        .select('fullName email mobileNumber rollNumber sessionFrom sessionTo createdAt status batch classId provider rejectionReasons isProfileComplete')
        .populate('batch', 'name')
        .populate('classId', 'className')
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json({ success: true, users });
}
