import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { Batch } from '@/models/Academic';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
        ...(role === 'student' && sessionId ? { session: sessionId } : {}),
        ...(role === 'student' && batchId ? { batch: batchId } : {}),
    });

    // Increment batch student count when a student is added
    if (role === 'student' && batchId) {
        await Batch.findByIdAndUpdate(batchId, { $inc: { current_students: 1 } });
    }

    const { password: _pw, ...userWithoutPw } = newUser.toObject();
    return NextResponse.json({ success: true, user: userWithoutPw }, { status: 201 });
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

    await dbConnect();
    // If student had a batch, decrement count before deleting
    const userToDelete = await User.findById(id).select('role batch').lean();
    if (userToDelete?.role === 'student' && userToDelete.batch) {
        await Batch.findByIdAndUpdate(userToDelete.batch, { $inc: { current_students: -1 } });
    }
    await User.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'User deleted' });
}
