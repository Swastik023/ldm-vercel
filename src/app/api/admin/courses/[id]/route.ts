import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';
import { User } from '@/models/User';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminOnly(session: any) {
    if (!session || session?.user?.role !== 'admin')
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    return null;
}

// PATCH /api/admin/courses/[id] — update a course
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const deny = adminOnly(session);
    if (deny) return deny;

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false, message: 'Invalid body' }, { status: 400 });

    // Validate pricing
    if (body.pricing) {
        if (body.pricing.offerPrice != null && body.pricing.totalFee != null && body.pricing.offerPrice > body.pricing.totalFee) {
            return NextResponse.json({ success: false, message: 'Offer price cannot exceed total fee.' }, { status: 400 });
        }
    }

    await dbConnect();
    const course = await Program.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!course) return NextResponse.json({ success: false, message: 'Course not found.' }, { status: 404 });

    return NextResponse.json({ success: true, course });
}

// DELETE /api/admin/courses/[id] — soft-disable or hard delete if no students
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const deny = adminOnly(session);
    if (deny) return deny;

    await dbConnect();

    // Check if students are linked
    const studentCount = await User.countDocuments({ programId: id, role: 'student' });

    if (studentCount > 0) {
        await Program.findByIdAndUpdate(id, { is_active: false });
        return NextResponse.json({
            success: true,
            message: `Course has ${studentCount} enrolled students. Deactivated instead of deleted.`,
            softDisabled: true,
        });
    }

    await Program.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Course deleted.' });
}
