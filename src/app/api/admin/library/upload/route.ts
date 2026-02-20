import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize filename
        const filename = Date.now() + '-' + file.name.replace(/\s+/g, '_');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'library');

        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        const relativePath = `/uploads/library/${filename}`;

        return NextResponse.json({
            success: true,
            message: 'File uploaded successfully',
            url: relativePath
        });

    } catch (error: any) {
        console.error('File Upload Error:', error);
        return NextResponse.json({ success: false, message: 'Upload failed', error: error.message }, { status: 500 });
    }
}
