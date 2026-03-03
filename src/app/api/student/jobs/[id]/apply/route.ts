import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { JobPosting } from '@/models/JobPosting';
import { JobApplication } from '@/models/JobApplication';
import { User } from '@/models/User';
import { StudentDocuments } from '@/models/StudentDocuments';
import { checkEligibility } from '@/lib/checkEligibility';
import cloudinary from '@/lib/cloudinary';
import { checkFileSizeBackend } from '@/lib/uploadLimits';

async function uploadToCloudinary(buffer: Buffer, folder: string, publicId: string, resourceType: 'image' | 'raw'): Promise<{ secure_url: string }> {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, public_id: publicId, resource_type: resourceType },
            (error: any, result: any) => { if (error) reject(error); else resolve({ secure_url: result.secure_url }); }
        );
        stream.end(buffer);
    });
}

// POST /api/student/jobs/[id]/apply — apply to a job with resume
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const { id: jobId } = await params;

    // Fetch job + student + docs
    const [job, student, docs] = await Promise.all([
        JobPosting.findById(jobId),
        User.findById(session.user.id).lean(),
        StudentDocuments.findOne({ userId: session.user.id }).lean(),
    ]);

    if (!job) return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    if (!student) return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });

    // Re-check eligibility at apply time
    const documentMeta = (docs as any)?.documentMeta || [];
    const elig = checkEligibility(job, {
        isProfileComplete: student.isProfileComplete,
        status: student.status,
        programId: student.programId?.toString(),
        courseEndDate: (student as any).courseEndDate,
    }, documentMeta);

    if (!elig.eligible) {
        return NextResponse.json({ success: false, message: 'You are not eligible for this job.', reasons: elig.reasons }, { status: 403 });
    }

    // Check duplicate application
    const existing = await JobApplication.findOne({ jobId, studentId: session.user.id });
    if (existing) {
        return NextResponse.json({ success: false, message: 'You have already applied to this job.' }, { status: 409 });
    }

    // Parse resume from FormData
    const formData = await req.formData();
    const resume = formData.get('resume') as File | null;
    if (!resume) {
        return NextResponse.json({ success: false, message: 'Resume upload is mandatory.' }, { status: 400 });
    }

    const ext = resume.name.split('.').pop()?.toLowerCase() ?? '';
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    if (!allowedTypes.includes(ext)) {
        return NextResponse.json({ success: false, message: `Resume must be PDF or image. Got: ${ext}` }, { status: 400 });
    }
    const resumeSizeGuard = checkFileSizeBackend('Resume', resume);
    if (resumeSizeGuard) return resumeSizeGuard;

    // Upload resume to Cloudinary
    const folder = `ldm-job-resumes/${session.user.id}`;
    const resourceType = ext === 'pdf' ? 'raw' as const : 'image' as const;
    const result = await uploadToCloudinary(Buffer.from(await resume.arrayBuffer()), folder, `${Date.now()}-resume`, resourceType);

    // Create application
    const application = await JobApplication.create({
        jobId,
        studentId: session.user.id,
        resumeUrl: result.secure_url,
        resumeType: ext,
    });

    return NextResponse.json({ success: true, message: 'Applied successfully!', application }, { status: 201 });
}
