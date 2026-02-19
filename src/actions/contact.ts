'use server';

import dbConnect from '@/lib/db';
import Contact, { IContact } from '@/models/Contact';
import { revalidatePath } from 'next/cache';

export async function submitContactForm(data: Partial<IContact>) {
    await dbConnect();
    try {
        const contact = await Contact.create(data);
        return { success: true, data: JSON.parse(JSON.stringify(contact)) };
    } catch (error) {
        return { success: false, error: 'Failed to submit contact form' };
    }
}

export async function getContactMessages(filter: any = {}) {
    await dbConnect();
    try {
        const messages = await Contact.find(filter).sort({ createdAt: -1 });
        return { success: true, data: JSON.parse(JSON.stringify(messages)) };
    } catch (error) {
        return { success: false, error: 'Failed to fetch messages' };
    }
}

export async function updateContactStatus(id: string, status: string) {
    await dbConnect();
    try {
        const contact = await Contact.findByIdAndUpdate(id, { status }, { new: true });
        revalidatePath('/admin/messages');
        return { success: true, data: JSON.parse(JSON.stringify(contact)) };
    } catch (error) {
        return { success: false, error: 'Failed to update message status' };
    }
}
