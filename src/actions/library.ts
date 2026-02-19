'use server';

import dbConnect from '@/lib/db';
import { Library } from '@/models/Library';
import cloudinary from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth'; // Or custom auth
// Assuming we pass user ID from client or use session

export async function getDocuments(filters: any = {}) {
    await dbConnect();
    try {
        const query: any = {};
        if (filters.category && filters.category !== 'general') query.category = filters.category;

        const docs = await Library.find(query)
            .populate('uploaded_by', 'fullName')
            .sort({ createdAt: -1 });

        const stats = {
            total: await Library.countDocuments(),
            active: await Library.countDocuments(), // Add is_active if needed
            total_size: docs.reduce((acc, doc) => acc + (doc.file_size || 0), 0)
        };

        return { success: true, data: { documents: JSON.parse(JSON.stringify(docs)), stats } };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function uploadDocument(formData: FormData, userId: string) {
    await dbConnect();
    try {
        const file = formData.get('file') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const category = formData.get('category') as string;

        if (!file) {
            return { success: false, error: "No file provided" };
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Cloudinary
        const uploadResult = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'ldm-library',
                    resource_type: 'raw', // Important for PDFs/Docs
                    use_filename: true
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        const doc = await Library.create({
            title,
            description,
            category,
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            file_size: uploadResult.bytes,
            file_type: uploadResult.format || 'pdf',
            uploaded_by: userId
        });

        revalidatePath('/admin/library');
        return { success: true, data: JSON.parse(JSON.stringify(doc)) };

    } catch (error: any) {
        console.error("Upload error:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteDocument(id: string) {
    await dbConnect();
    try {
        const doc = await Library.findById(id);
        if (!doc) return { success: false, error: "Document not found" };

        if (doc.public_id) {
            await cloudinary.uploader.destroy(doc.public_id, { resource_type: 'raw' });
        }

        await Library.findByIdAndDelete(id);
        revalidatePath('/admin/library');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
