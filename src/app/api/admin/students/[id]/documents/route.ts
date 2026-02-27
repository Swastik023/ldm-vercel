import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { StudentDocuments } from '@/models/StudentDocuments';
import { User } from '@/models/User';
import mongoose from 'mongoose';
// Register models needed for populate()
import { Batch } from '@/models/Academic';
import '@/models/Academic';

// GET /api/admin/students/[id]/documents — admin views a specific student's documents
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, message: 'Invalid student ID' }, { status: 400 });
    }

    const [student, docs] = await Promise.all([
        User.findOne({ _id: id, role: 'student' })
            .populate('batch', 'name program session')
            .select('fullName email mobileNumber username isProfileComplete status createdAt batch')
            .lean(),
        StudentDocuments.findOne({ userId: id }).lean(),
    ]);

    if (!student) {
        return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, student, documents: docs ?? null });
}
