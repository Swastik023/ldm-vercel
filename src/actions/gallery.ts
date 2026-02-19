'use server';

import dbConnect from '@/lib/db';
import Gallery, { IGallery } from '@/models/Gallery';
import cloudinary from '@/lib/cloudinary';
import { revalidatePath } from 'next/cache';

export async function uploadImage(formData: FormData) {
    const file = formData.get('image') as File;
    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'ldm-gallery' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        return { success: true, url: result.secure_url };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: 'Upload failed' };
    }
}


export async function getGalleryImages(filter: any = {}) {
    await dbConnect();
    try {
        const images = await Gallery.find(filter).sort({ displayOrder: 1, createdAt: -1 });
        return { success: true, data: JSON.parse(JSON.stringify(images)) };
    } catch (error) {
        return { success: false, error: 'Failed to fetch gallery images' };
    }
}

export async function createGalleryImage(data: Partial<IGallery>) {
    await dbConnect();
    try {
        const image = await Gallery.create(data);
        revalidatePath('/admin/gallery');
        revalidatePath('/gallery');
        return { success: true, data: JSON.parse(JSON.stringify(image)) };
    } catch (error) {
        return { success: false, error: 'Failed to create gallery image' };
    }
}

export async function updateGalleryImage(id: string, data: Partial<IGallery>) {
    await dbConnect();
    try {
        const image = await Gallery.findByIdAndUpdate(id, data, { new: true });
        revalidatePath('/admin/gallery');
        revalidatePath('/gallery');
        return { success: true, data: JSON.parse(JSON.stringify(image)) };
    } catch (error) {
        return { success: false, error: 'Failed to update gallery image' };
    }
}

export async function deleteGalleryImage(id: string) {
    await dbConnect();
    try {
        await Gallery.findByIdAndDelete(id);
        revalidatePath('/admin/gallery');
        revalidatePath('/gallery');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete gallery image' };
    }
}
