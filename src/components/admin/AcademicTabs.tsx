'use client';

import { useState } from 'react';
import AcademicManager from './AcademicManager';
import SubjectManager from './SubjectManager';

export default function AcademicTabs({ programs, sessions, subjects }: any) {
    const [activeTab, setActiveTab] = useState('configuration');

    return (
        <div className="space-y-6">
            <div className="flex space-x-4 border-b">
                <button
                    onClick={() => setActiveTab('configuration')}
                    className={`pb-2 px-1 font-medium ${activeTab === 'configuration' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                    Programs & Sessions
                </button>
                <button
                    onClick={() => setActiveTab('subjects')}
                    className={`pb-2 px-1 font-medium ${activeTab === 'subjects' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                >
                    Subjects
                </button>
            </div>

            {activeTab === 'configuration' && (
                <AcademicManager initialPrograms={programs} initialSessions={sessions} />
            )}

            {activeTab === 'subjects' && (
                <SubjectManager initialSubjects={subjects} programs={programs} />
            )}
        </div>
    );
}
