'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Users, CheckCircle, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface Batch { _id: string; name: string; program?: { name: string; code: string }; intakeMonth: string; joiningYear: number; }
interface Subject { _id: string; name: string; code: string; semester: number; credits: number; }

export default function TeacherSelfAssignment() {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedBatch, setSelectedBatch] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [batchSearch, setBatchSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch('/api/teacher/classes/assign?view=available-batches')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setBatches(data.batches || []);
                    setSubjects(data.subjects || []);
                } else {
                    toast.error(data.message || 'Failed to load options');
                }
            })
            .catch(() => toast.error('Network Error'))
            .finally(() => setLoading(false));
    }, []);

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubject) { toast.error('Please select a subject'); return; }
        setSubmitting(true);
        try {
            const res = await fetch('/api/teacher/classes/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subjectId: selectedSubject,
                    batchId: selectedBatch || null,
                    section: 'A',
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'Successfully assigned!');
                setSelectedSubject('');
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

    const availableYears = [...new Set(batches.map((b: any) => b.joiningYear))].filter(Boolean).sort((a, b) => (b as number) - (a as number));

    const filteredBatches = batches.filter((b: any) => {
        if (filterMonth && b.intakeMonth !== filterMonth) return false;
        if (filterYear && b.joiningYear !== Number(filterYear)) return false;
        if (batchSearch && !b.name.toLowerCase().includes(batchSearch.toLowerCase()) &&
            !(b.program?.name || '').toLowerCase().includes(batchSearch.toLowerCase()) &&
            !(b.program?.code || '').toLowerCase().includes(batchSearch.toLowerCase())) return false;
        return true;
    });

    if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/teacher" className="p-2 hover:bg-gray-100 rounded-full transition">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
                    <p className="text-gray-500 text-sm mt-1">Select the subject, batch, and section you teach to add it to your classes.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                {/* Info banner */}
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex items-start gap-3">
                    <CheckCircle className="text-blue-500 mt-0.5 flex-shrink-0" size={18} />
                    <p className="text-blue-800 text-sm">
                        Once assigned, these classes appear in your <strong>Attendance</strong> and <strong>Marks Entry</strong> panels immediately. You can assign yourself to multiple courses.
                    </p>
                </div>

                <form onSubmit={handleAssign} className="p-6 space-y-8">

                    {/* Step 1: Subject */}
                    <div>
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                            <span className="bg-amber-100 text-amber-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            Select Subject <span className="text-red-500">*</span>
                        </h2>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search subject name or code…"
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
                                        <p className="font-semibold text-gray-900 text-sm leading-snug">{sub.name}</p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{sub.code}</p>
                                        <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1 uppercase tracking-wide">
                                            <BookOpen size={10} /> Sem {sub.semester} · {sub.credits} Cr
                                        </p>
                                    </div>
                                </label>
                            ))}
                            {filteredSubjects.length === 0 && (
                                <p className="col-span-full text-sm text-gray-400 text-center py-6">
                                    {subjects.length === 0
                                        ? 'No subjects found. Ask admin to add subjects.'
                                        : 'No subjects match your search.'}
                                </p>
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Step 2: Batch & Section */}
                    <div>
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">
                            <span className="bg-amber-100 text-amber-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            Select Batch
                        </h2>

                        {/* Filter row */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            <button type="button" onClick={() => setFilterMonth('')}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${!filterMonth ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'}`}>
                                All Months
                            </button>
                            {['January', 'July'].map(m => (
                                <button type="button" key={m} onClick={() => { setFilterMonth(m === filterMonth ? '' : m); setSelectedBatch(''); }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filterMonth === m ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300'}`}>
                                    {m}
                                </button>
                            ))}
                            <span className="w-px bg-gray-200 mx-1" />
                            <button type="button" onClick={() => setFilterYear('')}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${!filterYear ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                                All Years
                            </button>
                            {availableYears.map(y => (
                                <button type="button" key={y as number} onClick={() => { setFilterYear(filterYear === String(y) ? '' : String(y)); setSelectedBatch(''); }}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${filterYear === String(y) ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                                    {y as number}
                                </button>
                            ))}
                        </div>

                        {/* Batch search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                            <input type="text" placeholder="Search batch or programme…"
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                value={batchSearch} onChange={e => { setBatchSearch(e.target.value); setSelectedBatch(''); }} />
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Batch <span className="font-normal text-xs text-gray-400">(optional — leave blank for open electives)</span>
                                </label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    value={selectedBatch}
                                    onChange={e => setSelectedBatch(e.target.value)}
                                >
                                    <option value="">— None / Open Elective —</option>
                                    {filteredBatches.map((b: any) => (
                                        <option key={b._id} value={b._id}>
                                            {b.name}{b.program ? ` (${b.program.code})` : ''} · {b.intakeMonth} {b.joiningYear}
                                        </option>
                                    ))}
                                </select>
                                {batches.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1">No active batches. Ask admin to create batches.</p>
                                )}
                                {batches.length > 0 && filteredBatches.length === 0 && (
                                    <p className="text-xs text-gray-400 mt-1">No batches match your filters.</p>
                                )}
                                {filteredBatches.length > 0 && (
                                    <p className="text-xs text-gray-400 mt-1">{filteredBatches.length} batch{filteredBatches.length !== 1 ? 'es' : ''} shown</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-gray-400">You can repeat this form to assign yourself to multiple courses.</p>
                        <button
                            type="submit"
                            disabled={submitting || !selectedSubject}
                            className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center gap-2 whitespace-nowrap"
                        >
                            {submitting ? 'Assigning…' : <><Users size={16} /> Add to My Classes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
