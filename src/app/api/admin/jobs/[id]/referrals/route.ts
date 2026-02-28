import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { JobReferral } from '@/models/JobReferral';

// GET /api/admin/jobs/[id]/referrals — list referrals for a job
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin')
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id } = await params;

    const referrals = await JobReferral.find({ jobId: id })
        .populate('referredBy', 'fullName email rollNumber')
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json({ success: true, referrals });
}

// PATCH /api/admin/jobs/[id]/referrals — update referral status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin')
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const body = await req.json();
    const { referralId, status, rewardApproved, adminNotes } = body;

    if (!referralId || !status) {
        return NextResponse.json({ success: false, message: 'referralId and status are required' }, { status: 400 });
    }

    const validStatuses = ['referred', 'shortlisted', 'rejected', 'hired'];
    if (!validStatuses.includes(status)) {
        return NextResponse.json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const update: Record<string, unknown> = { status };
    if (rewardApproved !== undefined) update.rewardApproved = rewardApproved;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const ref = await JobReferral.findByIdAndUpdate(referralId, update, { new: true }).lean();
    if (!ref) return NextResponse.json({ success: false, message: 'Referral not found' }, { status: 404 });

    return NextResponse.json({ success: true, referral: ref });
}
