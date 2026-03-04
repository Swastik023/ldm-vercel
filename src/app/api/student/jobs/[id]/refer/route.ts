import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { JobPosting } from '@/models/JobPosting';
import { JobReferral } from '@/models/JobReferral';
import { User } from '@/models/User';
import cloudinary from '@/lib/cloudinary';
import { checkFileSizeBackend } from '@/lib/uploadLimits';
import { isValidEmail, isValidPhone } from '@/lib/validate';

async function uploadToCloudinary(buffer: Buffer, folder: string, publicId: string, resourceType: 'image' | 'raw'): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, public_id: publicId, resource_type: resourceType },
            (error: any, result: any) => { if (error) reject(error); else resolve({ secure_url: result.secure_url }); }
        );
        stream.end(buffer);
    });
}

// POST /api/student/jobs/[id]/refer — refer a candidate
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id: jobId } = await params;

    const [job, student] = await Promise.all([
        JobPosting.findById(jobId),
        User.findById(session.user.id).lean(),
    ]);

    if (!job) return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    // Check referral enabled
    if (!job.referral?.enabled) {
        return NextResponse.json({ success: false, message: 'Referrals are not enabled for this job.' }, { status: 403 });
    }

    // Check job status & deadline
    if (job.status !== 'published') {
        return NextResponse.json({ success: false, message: 'Job is not open for referrals.' }, { status: 403 });
    }
    if (new Date(job.deadline) < new Date()) {
        return NextResponse.json({ success: false, message: 'Application deadline has passed.' }, { status: 403 });
    }

    // Check profile complete
    if (!student.isProfileComplete) {
        return NextResponse.json({ success: false, message: 'Please complete your profile before referring candidates.' }, { status: 403 });
    }

    // Check max referrals per student
    const existingCount = await JobReferral.countDocuments({ jobId, referredBy: session.user.id });
    if (existingCount >= (job.referral.maxPerStudent || 3)) {
        return NextResponse.json({ success: false, message: `You have reached the maximum referrals (${job.referral.maxPerStudent}) for this job.` }, { status: 409 });
    }

    // Parse form data
    const formData = await req.formData();
    const candidateName = (formData.get('candidateName') as string || '').trim();
    const candidateEmail = (formData.get('candidateEmail') as string || '').trim().toLowerCase();
    const candidatePhone = (formData.get('candidatePhone') as string || '').trim();
    const resume = formData.get('resume') as File | null;

    if (!candidateName || !candidateEmail || !candidatePhone) {
        return NextResponse.json({ success: false, message: 'Candidate name, email, and phone are required.' }, { status: 400 });
    }
    if (!isValidEmail(candidateEmail)) {
        return NextResponse.json({ success: false, message: 'Please enter a valid email for the candidate.' }, { status: 400 });
    }
    if (!isValidPhone(candidatePhone)) {
        return NextResponse.json({ success: false, message: 'Candidate phone must be a 10-digit number.' }, { status: 400 });
    }

    // Block self-referral
    if (candidateEmail === student.email?.toLowerCase()) {
        return NextResponse.json({ success: false, message: 'You cannot refer yourself.' }, { status: 400 });
    }

    // Check duplicate candidate email for this job
    const existingRef = await JobReferral.findOne({ jobId, candidateEmail });
    if (existingRef) {
        return NextResponse.json({ success: false, message: 'This candidate has already been referred for this job.' }, { status: 409 });
    }

    // Resume upload
    if (!resume) {
        return NextResponse.json({ success: false, message: 'Candidate resume is required.' }, { status: 400 });
    }

    const ext = resume.name.split('.').pop()?.toLowerCase() ?? '';
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    if (!allowedTypes.includes(ext)) {
        return NextResponse.json({ success: false, message: `Resume must be PDF or image.` }, { status: 400 });
    }
    const resumeSizeGuard = checkFileSizeBackend('Referral resume', resume);
    if (resumeSizeGuard) return resumeSizeGuard;

    const folder = `ldm-job-referrals/${session.user.id}`;
    const resourceType = ext === 'pdf' ? 'raw' as const : 'image' as const;
    const result = await uploadToCloudinary(Buffer.from(await resume.arrayBuffer()), folder, `${Date.now()}-referral`, resourceType);

    // Create referral
    const referral = await JobReferral.create({
        jobId,
        referredBy: session.user.id,
        candidateName,
        candidateEmail,
        candidatePhone,
        resumeUrl: result.secure_url,
        resumeType: ext,
    });

    return NextResponse.json({ success: true, message: 'Referral submitted successfully!', referral }, { status: 201 });
}
