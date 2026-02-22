import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { SliderImage } from '@/models/SliderImage';
import cloudinary from '@/lib/cloudinary';

// GET /api/admin/slider — list all slides ordered
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const slides = await SliderImage.find().sort({ order: 1 }).lean();
    return NextResponse.json({ success: true, slides });
}

// POST /api/admin/slider — upload new slide (multipart)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;

    if (!file) return NextResponse.json({ success: false, message: 'Image file is required.' }, { status: 400 });
    if (!title?.trim()) return NextResponse.json({ success: false, message: 'Title is required.' }, { status: 400 });

    // Convert File to buffer and upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder: 'ldm_slider', resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
            (err, result) => {
                if (err || !result) reject(err || new Error('Upload failed'));
                else resolve(result as { secure_url: string; public_id: string });
            }
        ).end(buffer);
    });

    // Get next order
    const lastSlide = await SliderImage.findOne().sort({ order: -1 }).lean();
    const nextOrder = lastSlide ? lastSlide.order + 1 : 0;

    const slide = await SliderImage.create({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        title: title.trim(),
        subtitle: subtitle?.trim() || '',
        order: nextOrder,
        isActive: true,
    });

    return NextResponse.json({ success: true, slide }, { status: 201 });
}
