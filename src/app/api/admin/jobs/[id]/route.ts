import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { JobPosting } from '@/models/JobPosting';
import mongoose from 'mongoose';

// PATCH /api/admin/jobs/[id] — update a job
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin')
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id))
        return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

    const body = await req.json();
    const allowed = ['title', 'company', 'jobType', 'location', 'ctc', 'description', 'skillsRequired', 'deadline', 'status', 'eligibility', 'referral'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
        if (body[key] !== undefined) update[key] = body[key];
    }
    if (update.deadline) update.deadline = new Date(update.deadline as string);

    const job = await JobPosting.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!job) return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });

    return NextResponse.json({ success: true, job });
}

// DELETE /api/admin/jobs/[id] — delete a job
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin')
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;
    await JobPosting.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Job deleted' });
}
