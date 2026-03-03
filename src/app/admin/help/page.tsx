'use client';
import HelpPage from '@/components/help/HelpPage';
import { adminCategories } from '@/data/helpContent';

export default function AdminHelpPage() {
    return (
        <div className="py-2">
            <HelpPage role="admin" categories={adminCategories} roleLabel="Admin" />
        </div>
    );
}
