'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Users, CheckCircle, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Batch {
    _id: string;
    name: string;
    program?: { name: string; code: string };
    intakeMonth: string;
    joiningYear: number;
}

interface Subject {
    _id: string;
    name: string;
    code: string;
    semester: number;
    credits: number;
}

export default function TeacherSelfAssignment() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [activeSession, setActiveSession] = useState<{ _id: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);

    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [section, setSection] = useState('A');
    const [submitting, setSubmitting] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch('/api/teacher/classes/assign?view=available-batches')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setBatches(data.batches || []);
                    setSubjects(data.subjects || []);
                    setActiveSession(data.activeSession || null);
                } else {
                    toast.error(data.message || 'Failed to load options');
                }
            })
            .catch(() => toast.error('Network Error'))
            .finally(() => setLoading(false));
    }, []);

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubject || !activeSession) {
            toast.error('Subject and Active Session are required');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/teacher/classes/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjectId: selectedSubject,
                    batchId: selectedBatch || null,
                    section: section,
                    sessionId: activeSession._id
                })
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Successfully self-assigned to class!');
                // Reset form optionally or leave for another assignment
                setSelectedSubject('');
                setSection('A');
            } else {
                toast.error(data.message || 'Failed to assign class');
            }
        } catch {
            toast.error('Network error during assignment');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading assignment portal...</div>;

    if (!activeSession) return (
        <div className="p-8 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800">
            <h2 className="text-xl font-bold mb-2">No Active Academic Session Found</h2>
            <p className="text-sm">You can only self-assign during an active academic session. Please contact an administrator to activate a session.</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Link href="/teacher" className="p-2 hover:bg-gray-100 rounded-full transition"><ArrowLeft size={20} /></Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Course Self-Assignment</h1>
                    <p className="text-gray-500 text-sm mt-1">Select the course, batch, and section you teach in the {activeSession.name} session.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                <div className="p-6 bg-blue-50 border-b border-blue-100 flex items-start gap-3">
                    <CheckCircle className="text-blue-500 mt-1 flex-shrink-0" size={20} />
                    <div className="text-blue-800 text-sm">
                        <p className="font-bold mb-1">How self-assignment works:</p>
                        <p>This allows you to link yourself directly to the subjects and batches you are teaching for the current active session. Once assigned, these classes will immediately appear in your dashboard for attendance and marks entry.</p>
                    </div>
                </div>

                <form onSubmit={handleAssign} className="p-6 space-y-8">
                    {/* Step 1: Subject */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                            <span className="bg-amber-100 text-amber-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                            Select Subject
                        </h2>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by subject name or code..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1 pr-2">
                            {filteredSubjects.map(sub => (
                                <label key={sub._id} className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${selectedSubject === sub._id ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-gray-200 hover:border-amber-300'}`}>
                                    <input
                                        type="radio"
                                        name="subject"
                                        value={sub._id}
                                        checked={selectedSubject === sub._id}
                                        onChange={() => setSelectedSubject(sub._id)}
                                        className="mt-1 mr-3 text-amber-600 focus:ring-amber-500"
                                        required
                                    />
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm truncate">{sub.name}</p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{sub.code}</p>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1.5 flex items-center gap-1">
                                            <BookOpen size={10} /> Sem {sub.semester} · {sub.credits} Credits
                                        </p>
                                    </div>
                                </label>
                            ))}
                            {filteredSubjects.length === 0 && (
                                <p className="text-sm text-gray-400 col-span-full py-4 text-center">No subjects mapped to your search.</p>
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Step 2: Batch & Section */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                            <span className="bg-amber-100 text-amber-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                            Batch & Section
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Batch <span className="font-normal text-xs text-gray-400">(Optional for open electives)</span></label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    value={selectedBatch}
                                    onChange={(e) => setSelectedBatch(e.target.value)}
                                >
                                    <option value="">— Generic / Open Elective —</option>
                                    {batches.map(b => (
                                        <option key={b._id} value={b._id}>
                                            {b.name} {b.program ? `(${b.program.code})` : ''} · {b.intakeMonth} {b.joiningYear}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Section *</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-semibold text-gray-900"
                                    value={section}
                                    onChange={(e) => setSection(e.target.value)}
                                    required
                                >
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'Group 1', 'Group 2', 'Lab 1', 'Lab 2'].map(sec => (
                                        <option key={sec} value={sec}>{sec}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || !selectedSubject}
                            className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
                        >
                            {submitting ? 'Assigning...' : <>Assign to My Courses <CheckCircle size={18} /></>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
