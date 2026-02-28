import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { JobPosting } from '@/models/JobPosting';
import { JobApplication } from '@/models/JobApplication';
import { JobReferral } from '@/models/JobReferral';
import '@/models/Academic';

// GET /api/admin/jobs — list all jobs with counts
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin')
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    const jobs = await JobPosting.find()
        .populate('eligibility.programs', 'name code')
        .populate('createdBy', 'fullName')
        .sort({ createdAt: -1 })
        .lean();

    // Attach counts
    const jobIds = jobs.map(j => j._id);
    const [appCounts, refCounts] = await Promise.all([
        JobApplication.aggregate([
            { $match: { jobId: { $in: jobIds } } },
            { $group: { _id: '$jobId', count: { $sum: 1 } } },
        ]),
        JobReferral.aggregate([
            { $match: { jobId: { $in: jobIds } } },
            { $group: { _id: '$jobId', count: { $sum: 1 } } },
        ]),
    ]);

    const appMap = Object.fromEntries(appCounts.map((a: any) => [a._id.toString(), a.count]));
    const refMap = Object.fromEntries(refCounts.map((r: any) => [r._id.toString(), r.count]));

    const result = jobs.map(job => ({
        ...job,
        applicationCount: appMap[job._id.toString()] || 0,
        referralCount: refMap[job._id.toString()] || 0,
    }));

    return NextResponse.json({ success: true, jobs: result });
}

// POST /api/admin/jobs — create a new job
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin')
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const body = await req.json();

    const { title, company, jobType, location, ctc, description, skillsRequired, deadline, status, eligibility, referral } = body;

    if (!title || !company || !jobType || !location || !ctc || !description || !deadline) {
        return NextResponse.json({ success: false, message: 'Title, company, job type, location, CTC, description, and deadline are required.' }, { status: 400 });
    }

    const job = await JobPosting.create({
        title, company, jobType, location, ctc, description,
        skillsRequired: skillsRequired || [],
        deadline: new Date(deadline),
        status: status || 'draft',
        createdBy: session.user.id,
        eligibility: eligibility || {},
        referral: referral || {},
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
}
