'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Users, CheckCircle, Search, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Batch { _id: string; name: string; program?: { name: string; code: string }; intakeMonth: string; joiningYear: number; }
interface Subject { _id: string; name: string; code: string; semester: number; credits: number; }
interface AcademicSession { _id: string; name: string; status: string; }

export default function TeacherSelfAssignment() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [sessions, setSessions] = useState<AcademicSession[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedSession, setSelectedSession] = useState('');
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
                    const allSessions: AcademicSession[] = data.sessions || [];
                    setSessions(allSessions);
                    // Auto-select the best session (active first, then most recent)
                    const best = data.activeSession as AcademicSession | null;
                    if (best) setSelectedSession(best._id);
                } else {
                    toast.error(data.message || 'Failed to load options');
                }
            })
            .catch(() => toast.error('Network Error'))
            .finally(() => setLoading(false));
    }, []);

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubject || !selectedSession) {
            toast.error('Please select a subject and session');
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
                    section,
                    sessionId: selectedSession,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Successfully assigned to class!');
                setSelectedSubject('');
                setSection('A');
                setSelectedBatch('');
            } else {
                toast.error(data.message || 'Failed to assign');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading assignment portal...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/teacher" className="p-2 hover:bg-gray-100 rounded-full transition"><ArrowLeft size={20} /></Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Course Self-Assignment</h1>
                    <p className="text-gray-500 text-sm mt-1">Assign yourself to the subjects and batches you teach.</p>
                </div>
            </div>

            {sessions.length === 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex gap-2 items-start">
                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                    <p>No academic sessions found. Please ask your administrator to create a session first.</p>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                {/* Info box */}
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-start gap-3">
                    <CheckCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={18} />
                    <p className="text-blue-800 text-sm">Once assigned, these classes will appear in your attendance and marks panels immediately.</p>
                </div>

                <form onSubmit={handleAssign} className="p-6 space-y-8">

                    {/* Step 0: Session */}
                    <div>
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-3">
                            <span className="bg-amber-100 text-amber-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            Academic Session *
                        </h2>
                        <select
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                            value={selectedSession}
                            onChange={e => setSelectedSession(e.target.value)}
                            required
                        >
                            <option value="">— Select Session —</option>
                            {sessions.map(s => (
                                <option key={s._id} value={s._id}>
                                    {s.name} {s.status === 'active' ? '✓ Active' : `(${s.status})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Step 1: Subject */}
                    <div>
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-3">
                            <span className="bg-amber-100 text-amber-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            Select Subject *
                        </h2>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by subject name or code..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-0.5">
                            {filteredSubjects.map(sub => (
                                <label key={sub._id}
                                    className={`flex items-start p-3 rounded-xl border cursor-pointer transition ${selectedSubject === sub._id ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-gray-200 hover:border-amber-300'}`}>
                                    <input type="radio" name="subject" value={sub._id}
                                        checked={selectedSubject === sub._id}
                                        onChange={() => setSelectedSubject(sub._id)}
                                        className="mt-1 mr-3 accent-amber-500 flex-shrink-0" required />
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm">{sub.name}</p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{sub.code}</p>
                                        <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1 uppercase tracking-wide">
                                            <BookOpen size={10} /> Sem {sub.semester} · {sub.credits} Cr
                                        </p>
                                    </div>
                                </label>
                            ))}
                            {filteredSubjects.length === 0 && (
                                <p className="col-span-full text-sm text-gray-400 text-center py-6">
                                    {subjects.length === 0 ? 'No subjects found. Ask admin to add subjects.' : 'No subjects match your search.'}
                                </p>
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Step 2: Batch & Section */}
                    <div>
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-3">
                            <span className="bg-amber-100 text-amber-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                            Batch & Section
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Batch <span className="font-normal text-xs text-gray-400">(leave blank for open electives)</span>
                                </label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    value={selectedBatch}
                                    onChange={e => setSelectedBatch(e.target.value)}
                                >
                                    <option value="">— Generic / Open Elective —</option>
                                    {batches.map(b => (
                                        <option key={b._id} value={b._id}>
                                            {b.name}{b.program ? ` (${b.program.code})` : ''} · {b.intakeMonth} {b.joiningYear}
                                        </option>
                                    ))}
                                </select>
                                {batches.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">No active batches found. Admin needs to create batches.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Section *</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                                    value={section}
                                    onChange={e => setSection(e.target.value)}
                                    required
                                >
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'Group 1', 'Group 2', 'Lab 1', 'Lab 2'].map(sec => (
                                        <option key={sec} value={sec}>{sec}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-between">
                        <p className="text-xs text-gray-400">You can assign yourself to multiple courses. Repeat as needed.</p>
                        <button
                            type="submit"
                            disabled={submitting || !selectedSubject || !selectedSession}
                            className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2 whitespace-nowrap"
                        >
                            {submitting ? 'Assigning...' : <><Users size={16} /> Assign to My Courses</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
