import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { CollegeSettings } from '@/models/CollegeSettings';

// GET /api/admin/settings — fetch current settings
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin')
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const settings = await CollegeSettings.getSingleton();
    return NextResponse.json({ success: true, settings });
}

// PATCH /api/admin/settings — update settings
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin')
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const body = await req.json();
    const settings = await CollegeSettings.getSingleton();

    if (body.academicSession !== undefined) settings.academicSession = body.academicSession;
    if (body.intakeMonths !== undefined && Array.isArray(body.intakeMonths)) settings.intakeMonths = body.intakeMonths;
    if (body.collegeName !== undefined) settings.collegeName = body.collegeName;

    await settings.save();
    return NextResponse.json({ success: true, settings });
}
