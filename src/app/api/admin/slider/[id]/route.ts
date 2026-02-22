import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { SliderImage } from '@/models/SliderImage';
import cloudinary from '@/lib/cloudinary';

// PATCH /api/admin/slider/[id] — update title/subtitle/order/isActive
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const update: Record<string, unknown> = {};
    if (body.title !== undefined) update.title = body.title;
    if (body.subtitle !== undefined) update.subtitle = body.subtitle;
    if (body.order !== undefined) update.order = body.order;
    if (body.isActive !== undefined) update.isActive = body.isActive;

    const slide = await SliderImage.findByIdAndUpdate(id, update, { new: true });
    if (!slide) return NextResponse.json({ success: false, message: 'Slide not found.' }, { status: 404 });
    return NextResponse.json({ success: true, slide });
}

// DELETE /api/admin/slider/[id] — remove slide + delete from Cloudinary
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();
    const slide = await SliderImage.findById(id);
    if (!slide) return NextResponse.json({ success: false, message: 'Slide not found.' }, { status: 404 });

    // Delete from Cloudinary
    try {
        await cloudinary.uploader.destroy(slide.publicId, { resource_type: 'image' });
    } catch {
        // Log but don't block deletion from DB
        console.error('Cloudinary delete failed for:', slide.publicId);
    }

    await slide.deleteOne();
    return NextResponse.json({ success: true, message: 'Slide deleted.' });
}
