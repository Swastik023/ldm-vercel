'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, Users, BookOpen } from 'lucide-react';

interface AssignedClass {
    id: string;
    subject_name: string;
    subject_code: string;
    batch_name: string | null;
    section: string;
    session_name: string;
}

export default function AttendanceList() {
    const router = useRouter();
    const [classes, setClasses] = useState<AssignedClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/teacher/dashboard')
            .then(res => res.json())
            .then(d => {
                if (d.success) setClasses(d.classes || []);
                else setError('Failed to load courses');
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="h-[50vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600 mb-1">
                    Take Attendance
                </h1>
                <p className="text-gray-500 text-sm">Select a course to mark attendance for today.</p>
            </div>

            {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm">{error}</div>}

            {classes.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-16 text-center text-gray-400">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-gray-500">No courses assigned to you</p>
                    <p className="text-sm mt-1">Contact admin to get courses assigned.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {classes.map(cls => (
                        <div
                            key={cls.id}
                            onClick={() => router.push(`/teacher/attendance/${cls.id}`)}
                            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg cursor-pointer transition border-l-4 border-amber-500 group"
                        >
                            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                                {cls.subject_name}
                            </h2>
                            <p className="text-sm text-gray-500 font-mono mt-0.5">{cls.subject_code}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                {cls.batch_name && (
                                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                                        {cls.batch_name}
                                    </span>
                                )}
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                    Section {cls.section}
                                </span>
                                {cls.session_name && (
                                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                        {cls.session_name}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-amber-600 mt-4 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                <ClipboardCheck size={15} /> Click to take attendance →
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
