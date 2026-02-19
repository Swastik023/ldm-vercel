export const dynamic = 'force-dynamic';
import ContactMessages from '@/components/admin/ContactMessages';
import { getContactMessages } from '@/actions/contact';



export default async function MessagesPage() {
    const { data: messages } = await getContactMessages();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Contact Messages</h1>
            </div>
            <ContactMessages initialMessages={messages || []} />
        </div>
    );
}
