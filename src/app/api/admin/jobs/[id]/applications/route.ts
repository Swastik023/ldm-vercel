import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { JobApplication } from '@/models/JobApplication';

// GET /api/admin/jobs/[id]/applications — list applications for a job
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin')
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    const applications = await JobApplication.find({ jobId: id })
        .populate('studentId', 'fullName email rollNumber mobileNumber')
        .sort({ appliedAt: -1 })
        .lean();

    return NextResponse.json({ success: true, applications });
}

// PATCH /api/admin/jobs/[id]/applications — update application status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin')
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const body = await req.json();
    const { applicationId, status, adminNotes } = body;

    if (!applicationId || !status) {
        return NextResponse.json({ success: false, message: 'applicationId and status are required' }, { status: 400 });
    }

    const validStatuses = ['applied', 'shortlisted', 'rejected', 'selected'];
    if (!validStatuses.includes(status)) {
        return NextResponse.json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const update: Record<string, unknown> = { status };
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const app = await JobApplication.findByIdAndUpdate(applicationId, update, { new: true }).lean();
    if (!app) return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });

    return NextResponse.json({ success: true, application: app });
}
