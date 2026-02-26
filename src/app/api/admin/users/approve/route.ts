import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db';
import { User } from '@/models/User';

// PATCH /api/admin/users/approve  { userId, action: 'approve' | 'reject' }
export async function PATCH(req: NextRequest) {
    const token = await getToken({ req });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { userId, action } = await req.json();
    if (!userId || !['approve', 'reject'].includes(action)) {
        return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }

    await connectDB();

    const newStatus = action === 'approve' ? 'active' : 'rejected';
    const updated = await User.findByIdAndUpdate(
        userId,
        { status: newStatus },
        { new: true }
    ).select('fullName email status');

    if (!updated) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
        success: true,
        message: action === 'approve' ? 'Student approved successfully.' : 'Student rejected.',
        user: { id: updated._id, name: updated.fullName, status: updated.status },
    });
}

// GET /api/admin/users/approve?status=pending  — list pending/rejected students
export async function GET(req: NextRequest) {
    const token = await getToken({ req });
    if (!token || token.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'pending';

    const users = await User.find({ status: statusFilter, role: 'student' })
        .select('fullName email mobileNumber rollNumber sessionFrom sessionTo createdAt status batch classId provider')
        .populate('batch', 'name')
        .populate('classId', 'className')
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json({ success: true, users });
}
