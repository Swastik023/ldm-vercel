import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { JobPosting } from '@/models/JobPosting';
import { JobApplication } from '@/models/JobApplication';
import { JobReferral } from '@/models/JobReferral';
import { User } from '@/models/User';
import { StudentDocuments } from '@/models/StudentDocuments';
import { checkEligibility } from '@/lib/checkEligibility';
import '@/models/Academic';

// GET /api/student/jobs — list published jobs with auto-eligibility + student's application status
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    // Fetch student data + docs in parallel
    const [student, docs, jobs] = await Promise.all([
        User.findById(session.user.id).lean(),
        StudentDocuments.findOne({ userId: session.user.id }).lean(),
        JobPosting.find({ status: 'published' })
            .populate('eligibility.programs', 'name code')
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    // Fetch existing applications & referral counts for this student
    const jobIds = jobs.map(j => j._id);
    const [myApps, myReferrals] = await Promise.all([
        JobApplication.find({ studentId: session.user.id, jobId: { $in: jobIds } }).lean(),
        JobReferral.aggregate([
            { $match: { referredBy: student._id, jobId: { $in: jobIds } } },
            { $group: { _id: '$jobId', count: { $sum: 1 } } },
        ]),
    ]);

    const appMap = Object.fromEntries(myApps.map(a => [a.jobId.toString(), a]));
    const refCountMap = Object.fromEntries(myReferrals.map((r: any) => [r._id.toString(), r.count]));

    const documentMeta = (docs as any)?.documentMeta || [];

    const result = jobs.map(job => {
        const eligibility = checkEligibility(job as any, {
            isProfileComplete: student.isProfileComplete,
            status: student.status,
            programId: student.programId?.toString(),
            courseEndDate: (student as any).courseEndDate,
        }, documentMeta);

        const application = appMap[job._id.toString()] || null;
        const referralCount = refCountMap[job._id.toString()] || 0;

        return {
            ...job,
            eligibility: eligibility,
            myApplication: application ? { _id: application._id, status: application.status, appliedAt: application.appliedAt } : null,
            myReferralCount: referralCount,
        };
    });

    return NextResponse.json({ success: true, jobs: result });
}
