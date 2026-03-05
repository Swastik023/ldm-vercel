import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('image') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file provided.' }, { status: 400 });
        }

        // Validate type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ success: false, message: 'Only JPG, PNG, WebP and GIF files are allowed.' }, { status: 415 });
        }

        // Validate size (max 3MB)
        if (file.size > 3 * 1024 * 1024) {
            return NextResponse.json({ success: false, message: 'File size must be under 3MB.' }, { status: 413 });
        }

        // Build a safe filename
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const slug = file.name
            .replace(/\.[^.]+$/, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .slice(0, 40);
        const filename = `${slug}-${Date.now()}.${ext}`;

        // Save to /public/course_img/
        const dir = path.join(process.cwd(), 'public', 'course_img');
        await mkdir(dir, { recursive: true });
        const bytes = await file.arrayBuffer();
        await writeFile(path.join(dir, filename), Buffer.from(bytes));

        const url = `/course_img/${filename}`;
        return NextResponse.json({ success: true, url });

    } catch (err) {
        console.error('Image upload error:', err);
        return NextResponse.json({ success: false, message: 'Upload failed.' }, { status: 500 });
    }
}
