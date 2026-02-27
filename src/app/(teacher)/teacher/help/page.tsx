'use client';
import HelpPage from '@/components/help/HelpPage';
import { teacherCategories } from '@/data/helpContent';

export default function TeacherHelpPage() {
    return (
        <div className="py-2">
            <HelpPage role="teacher" categories={teacherCategories} roleLabel="Teacher" />
        </div>
    );
}
