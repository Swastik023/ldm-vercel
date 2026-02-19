'use server';

import dbConnect from '@/lib/db';
import Notice, { INotice } from '@/models/Notice';
import { revalidatePath } from 'next/cache';

export async function getNotices(filter: any = {}) {
    await dbConnect();
    try {
        const notices = await Notice.find(filter).sort({ createdAt: -1 });
        return { success: true, data: JSON.parse(JSON.stringify(notices)) };
    } catch (error) {
        return { success: false, error: 'Failed to fetch notices' };
    }
}

export async function createNotice(data: Partial<INotice>) {
    await dbConnect();
    try {
        const notice = await Notice.create(data);
        revalidatePath('/admin/notices');
        return { success: true, data: JSON.parse(JSON.stringify(notice)) };
    } catch (error) {
        return { success: false, error: 'Failed to create notice' };
    }
}

export async function updateNotice(id: string, data: Partial<INotice>) {
    await dbConnect();
    try {
        const notice = await Notice.findByIdAndUpdate(id, data, { new: true });
        revalidatePath('/admin/notices');
        return { success: true, data: JSON.parse(JSON.stringify(notice)) };
    } catch (error) {
        return { success: false, error: 'Failed to update notice' };
    }
}

export async function deleteNotice(id: string) {
    await dbConnect();
    try {
        await Notice.findByIdAndDelete(id);
        revalidatePath('/admin/notices');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Failed to delete notice' };
    }
}
