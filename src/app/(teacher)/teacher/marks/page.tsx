'use client';

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, GraduationCap } from 'lucide-react';

interface AssignedClass {
    id: string;
    subject_name: string;
    subject_code: string;
    batch_name: string | null;
    section: string;
    session_name: string;
}

// Marks entry requires a marks/results model in the DB.
// This page loads the teacher's real assigned subjects for selection,
// but shows an empty state for student marks until a marks model is implemented.

export default function MarksEntry() {
    const [classes, setClasses] = useState<AssignedClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('');

    useEffect(() => {
        fetch('/api/teacher/dashboard')
            .then(res => res.json())
            .then(d => { if (d.success) setClasses(d.classes || []); })
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
                    Marks Entry
                </h1>
                <p className="text-gray-500 text-sm">Enter examination marks for your assigned subjects.</p>
            </div>

            {/* Subject Selector */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Subject / Assignment</label>
                {classes.length === 0 ? (
                    <p className="text-gray-400 text-sm py-2">No subjects assigned to you yet.</p>
                ) : (
                    <select
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">-- Select a subject --</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.subject_name} ({c.subject_code}){c.batch_name ? ` · ${c.batch_name}` : ''} · Section {c.section}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Content area */}
            {selectedClass ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <GraduationCap size={30} className="text-amber-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Marks Entry Coming Soon</h2>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                        The marks entry system is being set up. Once the results module is configured by the admin, you'll be able to enter marks here.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-md p-12 text-center border border-dashed border-gray-200">
                    <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Select a subject to begin</p>
                </div>
            )}
        </div>
    );
}
