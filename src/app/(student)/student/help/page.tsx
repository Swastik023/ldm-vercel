'use client';
import HelpPage from '@/components/help/HelpPage';
import { studentCategories } from '@/data/helpContent';

export default function StudentHelpPage() {
    return (
        <div className="py-2">
            <HelpPage role="student" categories={studentCategories} roleLabel="Student" />
        </div>
    );
}
