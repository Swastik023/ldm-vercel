import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Resume } from '@/models/Resume';
import { StudentProfile } from '@/models/StudentProfile';
import { User } from '@/models/User';

// GET /api/student/resume — fetch current student's resume + profile
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const resume = await Resume.findOne({ userId: session.user.id }).lean();
    const profile = await StudentProfile.findOne({ userId: session.user.id }).lean();
    const user = await User.findById(session.user.id).select('fullName email').lean();

    return NextResponse.json({ success: true, resume, profile, user });
}

// POST /api/student/resume — create or update resume
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const {
        address,
        careerObjective,
        education,
        skills,
        internship,
        experience,
        languages,
    } = body;

    const updateData = {
        ...(address !== undefined && { address }),
        ...(careerObjective !== undefined && { careerObjective }),
        ...(education !== undefined && { education }),
        ...(skills !== undefined && { skills }),
        ...(internship !== undefined && { internship }),
        ...(experience !== undefined && { experience }),
        ...(languages !== undefined && { languages }),
    };

    const resume = await Resume.findOneAndUpdate(
        { userId: session.user.id },
        updateData,
        { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, resume });
}
