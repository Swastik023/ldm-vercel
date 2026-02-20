'use client';

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, GraduationCap, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AssignedClass {
    id: string;
    subject_name: string;
    subject_code: string;
    batch_name: string | null;
    section: string;
    session_name: string;
}

interface StudentMark {
    _id: string;
    fullName: string;
    rollNo: string;
    marks_obtained: number | string;
    remarks: string;
}

export default function MarksEntry() {
    const [classes, setClasses] = useState<AssignedClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('');

    // Marks State
    const [examType, setExamType] = useState('midterm');
    const [maxMarks, setMaxMarks] = useState(100);
    const [students, setStudents] = useState<StudentMark[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/teacher/dashboard')
            .then(res => res.json())
            .then(d => { if (d.success) setClasses(d.classes || []); })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedClass) {
            setStudents([]);
            return;
        }

        setLoadingStudents(true);
        fetch(`/api/teacher/marks/${selectedClass}?exam_type=${examType}`)
            .then(res => res.json())
            .then(d => {
                if (d.success) {
                    setStudents(d.students || []);
                    setMaxMarks(d.max_marks || 100);
                }
            })
            .finally(() => setLoadingStudents(false));
    }, [selectedClass, examType]);

    const handleMarkChange = (id: string, value: string) => {
        setStudents(prev => prev.map(s => s._id === id ? { ...s, marks_obtained: value } : s));
    };

    const handleRemarkChange = (id: string, value: string) => {
        setStudents(prev => prev.map(s => s._id === id ? { ...s, remarks: value } : s));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/teacher/marks/${selectedClass}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exam_type: examType,
                    max_marks: maxMarks,
                    marks: students.map(s => ({
                        student: s._id,
                        marks_obtained: Number(s.marks_obtained) || 0,
                        remarks: s.remarks
                    }))
                })
            });
            const data = await res.json();
            if (data.success) toast.success('Marks saved successfully!');
            else toast.error(data.message || 'Failed to save marks');
        } catch (e) {
            toast.error('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

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

            {/* Controls */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 grid md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subject / Assignment</label>
                    <select
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="">-- Select a subject --</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.subject_name} ({c.section})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Type</label>
                    <select
                        value={examType}
                        onChange={e => setExamType(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-amber-500"
                    >
                        <option value="midterm">Midterm</option>
                        <option value="final">Final Exam</option>
                        <option value="practical">Practical</option>
                        <option value="assignment">Assignment</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Max Marks</label>
                    <input
                        type="number"
                        value={maxMarks}
                        onChange={e => setMaxMarks(Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>
            </div>

            {/* Content area */}
            {selectedClass ? (
                loadingStudents ? (
                    <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" /></div>
                ) : students.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold text-gray-600 text-sm">Roll No</th>
                                        <th className="px-6 py-4 text-left font-semibold text-gray-600 text-sm">Student Name</th>
                                        <th className="px-6 py-4 text-left font-semibold text-gray-600 text-sm w-32">Marks</th>
                                        <th className="px-6 py-4 text-left font-semibold text-gray-600 text-sm">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {students.map(s => (
                                        <tr key={s._id} className="hover:bg-amber-50/30 transition-colors">
                                            <td className="px-6 py-3 text-sm text-gray-500 font-medium">{s.rollNo}</td>
                                            <td className="px-6 py-3 text-sm font-semibold text-gray-900">{s.fullName}</td>
                                            <td className="px-6 py-3">
                                                <input
                                                    type="number"
                                                    min="0" max={maxMarks}
                                                    value={s.marks_obtained}
                                                    onChange={e => handleMarkChange(s._id, e.target.value)}
                                                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input
                                                    type="text"
                                                    placeholder="Optional remark..."
                                                    value={s.remarks}
                                                    onChange={e => handleRemarkChange(s._id, e.target.value)}
                                                    className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                <Save size={18} />
                                <span>{saving ? 'Saving...' : 'Save Marks'}</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-100">
                        <p className="text-gray-500">No students found in this batch.</p>
                    </div>
                )
            ) : (
                <div className="bg-white rounded-xl shadow-md p-12 text-center border border-dashed border-gray-200">
                    <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Select a subject to begin</p>
                </div>
            )}
        </div>
    );
}
