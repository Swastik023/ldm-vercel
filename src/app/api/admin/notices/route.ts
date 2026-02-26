import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Notice from '@/models/Notice';
import cloudinary from '@/lib/cloudinary';

// GET /api/admin/notices — list all notices (admin only)
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const notices = await Notice.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, notices });
}

// POST /api/admin/notices — create notice with optional multi-format attachment
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();

    const formData = await req.formData();
    const title = (formData.get('title') as string)?.trim();
    const content = (formData.get('content') as string)?.trim();
    const category = (formData.get('category') as string) || 'general';
    const priority = (formData.get('priority') as string) || 'normal';
    const file_type = (formData.get('file_type') as string) || 'none';
    // For rich-text / md: content is stored in 'attachment_content'
    const attachment_content = (formData.get('attachment_content') as string) || undefined;
    const file = formData.get('file') as File | null;

    if (!title || !content) {
        return NextResponse.json({ success: false, message: 'Title and content are required.' }, { status: 400 });
    }

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;

    // Upload file to Cloudinary for binary formats
    if (file && file.size > 0 && !['rich-text', 'md', 'none'].includes(file_type)) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        // Only true image formats go as 'image' resource type.
        // PDFs MUST stay as 'raw' — Cloudinary with resource_type:'image' rasterizes
        // the PDF into a JPEG (first page only), destroying the original document.
        const resourceType: 'image' | 'raw' = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)
            ? 'image'
            : 'raw';

        const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: 'ldm_notices',
                    resource_type: resourceType,
                    use_filename: true,
                    unique_filename: true,
                },
                (err, result) => {
                    if (err || !result) reject(err || new Error('Upload failed'));
                    else resolve(result as { secure_url: string; public_id: string });
                }
            ).end(buffer);
        });

        attachmentUrl = uploadResult.secure_url;
        attachmentName = file.name;
    }

    // For markdown files: also read & store content inline
    let inlineContent = attachment_content;
    if (file && file.size > 0 && file_type === 'md' && !inlineContent) {
        inlineContent = await file.text();
    }

    const notice = await Notice.create({
        title,
        content,
        category,
        priority,
        attachmentUrl,
        attachmentName,
        file_type: file_type || 'none',
        attachment_content: inlineContent,
        isActive: true,
    });

    return NextResponse.json({ success: true, notice: JSON.parse(JSON.stringify(notice)) }, { status: 201 });
}

// DELETE /api/admin/notices?id=xxx — delete a notice
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

    await Notice.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
}
