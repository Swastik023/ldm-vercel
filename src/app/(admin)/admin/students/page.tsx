'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Download, Search, Filter, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, X, User, Phone, Mail, BookOpen, Hash, CalendarDays, CheckCircle2, XCircle, Eye, Clock, AlertTriangle } from 'lucide-react';

interface Student {
    _id: string; fullName: string; email: string; mobileNumber?: string;
    username: string; rollNumber?: string; sessionFrom?: number; sessionTo?: number;
    isProfileComplete: boolean; status: string; createdAt: string; provider?: string;
    rejectionReasons?: Record<string, string>;
    batch: { _id: string; name: string } | null;
    classId: { _id: string; className: string; sessionFrom: number; sessionTo: number } | null;
}
interface Batch { _id: string; name: string; }
interface StudentDocs {
    passportPhotoUrl: string; passportPhotoType: string;
    marksheet10Url: string; marksheet10Type: string;
    marksheet12Url: string; marksheet12Type: string;
    aadhaarFamilyIdUrl: string; aadhaarFamilyIdType: string;
    uploadedAt: string;
}

const DOC_SLOTS = [
    { urlKey: 'passportPhotoUrl', typeKey: 'passportPhotoType', label: 'Passport Photo', fieldKey: 'passportPhoto' },
    { urlKey: 'marksheet10Url', typeKey: 'marksheet10Type', label: '10th Marksheet', fieldKey: 'marksheet10' },
    { urlKey: 'marksheet12Url', typeKey: 'marksheet12Type', label: '12th Marksheet', fieldKey: 'marksheet12' },
    { urlKey: 'aadhaarFamilyIdUrl', typeKey: 'aadhaarFamilyIdType', label: 'Aadhaar/Family ID', fieldKey: 'aadhaarFamilyId' },
] as const;

const CURRENT_YEAR = new Date().getFullYear();
const SESSION_YEARS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - 5 + i);

type TabType = 'all' | 'pending' | 'under_review' | 'rejected';

export default function AdminStudentsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('all');

    // ── All Students tab ─────────────────────────────────
    const [students, setStudents] = useState<Student[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [sessionFrom, setSessionFrom] = useState('');
    const [sessionTo, setSessionTo] = useState('');
    const [rollSearch, setRollSearch] = useState('');
    const [nameSearch, setNameSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentDocs, setStudentDocs] = useState<StudentDocs | null>(null);
    const [docsLoading, setDocsLoading] = useState(false);

    // ── Pending / Under Review / Rejected tabs ──────────
    const [tabStudents, setTabStudents] = useState<Student[]>([]);
    const [tabLoading, setTabLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // ── Reject modal ────────────────────────────────────
    const [rejectTarget, setRejectTarget] = useState<Student | null>(null);
    const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
    const [rejectFields, setRejectFields] = useState<Set<string>>(new Set());

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: '25' });
        if (selectedBatch) params.set('batchId', selectedBatch);
        if (sessionFrom) params.set('sessionFrom', sessionFrom);
        if (sessionTo) params.set('sessionTo', sessionTo);
        if (rollSearch) params.set('rollNumber', rollSearch);
        const res = await fetch(`/api/admin/students?${params}`);
        const data = await res.json();
        if (data.success) { setStudents(data.students); setTotal(data.total); setPages(data.pages); }
        setLoading(false);
    }, [page, selectedBatch, sessionFrom, sessionTo, rollSearch]);

    const fetchTabStudents = useCallback(async (status: string) => {
        setTabLoading(true);
        const res = await fetch(`/api/admin/users/approve?status=${status}`);
        const data = await res.json();
        if (data.success) setTabStudents(data.users);
        setTabLoading(false);
    }, []);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    useEffect(() => {
        fetch('/api/public/batches').then(r => r.json()).then(d => { if (d.success) setBatches(d.batches); });
    }, []);

    useEffect(() => {
        if (activeTab !== 'all') fetchTabStudents(activeTab);
    }, [activeTab, fetchTabStudents]);

    const handleApprove = async (userId: string) => {
        setActionLoading(userId);
        const res = await fetch('/api/admin/users/approve', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, action: 'approve' }),
        });
        if (res.ok) {
            setTabStudents(prev => prev.filter(s => s._id !== userId));
        }
        setActionLoading(null);
    };

    const openRejectModal = (student: Student) => {
        setRejectTarget(student);
        setRejectFields(new Set());
        setRejectReasons({});
    };

    const toggleRejectField = (field: string) => {
        setRejectFields(prev => {
            const next = new Set(prev);
            if (next.has(field)) {
                next.delete(field);
                const r = { ...rejectReasons };
                delete r[field];
                setRejectReasons(r);
            } else {
                next.add(field);
            }
            return next;
        });
    };

    const submitReject = async () => {
        if (!rejectTarget || rejectFields.size === 0) return;
        // Validate all checked fields have reasons
        for (const field of rejectFields) {
            if (!rejectReasons[field]?.trim()) return;
        }
        setActionLoading(rejectTarget._id);
        const res = await fetch('/api/admin/users/approve', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: rejectTarget._id,
                action: 'reject',
                rejectionReasons: rejectReasons,
            }),
        });
        if (res.ok) {
            setTabStudents(prev => prev.filter(s => s._id !== rejectTarget._id));
            setRejectTarget(null);
        }
        setActionLoading(null);
    };

    const openStudentModal = async (student: Student) => {
        setSelectedStudent(student); setStudentDocs(null); setDocsLoading(true);
        const res = await fetch(`/api/admin/students/${student._id}/documents`);
        const data = await res.json();
        if (data.success) setStudentDocs(data.documents);
        setDocsLoading(false);
    };

    const filteredStudents = nameSearch
        ? students.filter(s =>
            s.fullName.toLowerCase().includes(nameSearch.toLowerCase()) ||
            s.email.toLowerCase().includes(nameSearch.toLowerCase()) ||
            (s.rollNumber || '').toLowerCase().includes(nameSearch.toLowerCase())
        )
        : students;

    const resetFilters = () => { setSelectedBatch(''); setSessionFrom(''); setSessionTo(''); setRollSearch(''); setNameSearch(''); setPage(1); };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                    <p className="text-gray-500 text-sm">{total} registered</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
                {([
                    { key: 'all', label: 'All Students' },
                    { key: 'pending', label: '📝 Pending' },
                    { key: 'under_review', label: '⏳ Under Review' },
                    { key: 'rejected', label: '❌ Rejected' },
                ] as { key: TabType; label: string }[]).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Tab Content: Pending / Under Review / Rejected ─── */}
            {activeTab !== 'all' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {tabLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
                        </div>
                    ) : tabStudents.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" />
                            <p className="font-medium">No {activeTab.replace('_', ' ')} students</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Student</th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Phone</th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Class</th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Profile</th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Registered</th>
                                        <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {tabStudents.map(student => (
                                        <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${activeTab === 'rejected' ? 'bg-gradient-to-br from-red-400 to-red-600' : activeTab === 'under_review' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
                                                        {student.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-sm">{student.fullName}</p>
                                                        <p className="text-gray-400 text-xs">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600 text-sm">{student.mobileNumber || '—'}</td>
                                            <td className="px-5 py-3.5">
                                                {student.classId ? (
                                                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">{student.classId.className}</span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {student.isProfileComplete ? (
                                                    <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</span>
                                                ) : (
                                                    <span className="text-xs text-amber-600 font-semibold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Incomplete</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-400 text-xs">
                                                {new Date(student.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    {/* View docs */}
                                                    <button onClick={() => openStudentModal(student)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                                        <Eye className="w-3 h-3" /> View
                                                    </button>
                                                    {/* Approve button (for under_review and rejected) */}
                                                    {(activeTab === 'under_review' || activeTab === 'rejected') && (
                                                        <button
                                                            onClick={() => handleApprove(student._id)}
                                                            disabled={actionLoading === student._id}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {actionLoading === student._id ? '…' : 'Approve'}
                                                        </button>
                                                    )}
                                                    {/* Reject button (for under_review) */}
                                                    {activeTab === 'under_review' && (
                                                        <button
                                                            onClick={() => openRejectModal(student)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors"
                                                        >
                                                            <XCircle className="w-3 h-3" /> Reject
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── All Students Tab ───────────────────────────────── */}
            {activeTab === 'all' && (
                <>
                    {/* Filters */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Search by name, email, roll no…" value={nameSearch} onChange={e => setNameSearch(e.target.value)} />
                            </div>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
                                    placeholder="Roll No" value={rollSearch} onChange={e => { setRollSearch(e.target.value); setPage(1); }} />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                            <select className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setPage(1); }}>
                                <option value="">All Batches</option>
                                {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                            <select className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                value={sessionFrom} onChange={e => { setSessionFrom(e.target.value); setPage(1); }}>
                                <option value="">From Year</option>
                                {SESSION_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                value={sessionTo} onChange={e => { setSessionTo(e.target.value); setPage(1); }}>
                                <option value="">To Year</option>
                                {SESSION_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            {(selectedBatch || sessionFrom || sessionTo || rollSearch || nameSearch) && (
                                <button onClick={resetFilters} className="px-3 py-2 text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
                                    <X className="w-3 h-3" /> Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                <p className="font-medium">No students found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Student</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Class</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Roll No</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Phone</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Profile</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Joined</th>
                                            <th className="px-5 py-3.5" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredStudents.map(student => (
                                            <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                            {student.fullName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-sm">{student.fullName}</p>
                                                            <p className="text-gray-400 text-xs">{student.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {student.classId ? (
                                                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">{student.classId.className}</span>
                                                    ) : student.batch ? (
                                                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">{student.batch.name}</span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    {student.rollNumber
                                                        ? <span className="font-mono text-sm font-bold text-gray-700">{student.rollNumber}</span>
                                                        : <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-600 text-sm">{student.mobileNumber || '—'}</td>
                                                <td className="px-5 py-3.5">
                                                    {student.isProfileComplete ? (
                                                        <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><XCircle className="w-3.5 h-3.5" /> Pending</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${student.status === 'active' ? 'bg-green-50 text-green-700' : student.status === 'under_review' ? 'bg-blue-50 text-blue-700' : student.status === 'pending' ? 'bg-amber-50 text-amber-700' : student.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {student.status === 'under_review' ? 'Under Review' : student.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-gray-400 text-xs">
                                                    {new Date(student.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <button onClick={() => openStudentModal(student)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                                        <Eye className="w-3 h-3" /> View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {pages > 1 && (
                            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500">Page {page} of {pages}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── Student Detail / Docs Modal ── */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900 text-lg">Student Details</h3>
                            <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                                    {selectedStudent.fullName.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">{selectedStudent.fullName}</p>
                                    {selectedStudent.classId && <p className="text-indigo-600 text-sm font-semibold">🎓 {selectedStudent.classId.className}</p>}
                                    {selectedStudent.rollNumber && <p className="text-gray-400 text-xs">Roll: <span className="font-mono font-bold text-gray-700">{selectedStudent.rollNumber}</span></p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <InfoChip icon={<Mail className="w-4 h-4 text-blue-500" />} label="Email" value={selectedStudent.email} />
                                <InfoChip icon={<Phone className="w-4 h-4 text-green-500" />} label="Phone" value={selectedStudent.mobileNumber || '—'} />
                                <InfoChip icon={<BookOpen className="w-4 h-4 text-purple-500" />} label="Batch" value={selectedStudent.batch?.name || '—'} />
                                <InfoChip
                                    icon={<CalendarDays className="w-4 h-4 text-orange-500" />}
                                    label="Session"
                                    value={selectedStudent.sessionFrom && selectedStudent.sessionTo ? `${selectedStudent.sessionFrom}–${selectedStudent.sessionTo}` : '—'}
                                />
                                <InfoChip icon={<Hash className="w-4 h-4 text-pink-500" />} label="Roll Number" value={selectedStudent.rollNumber || '—'} />
                                <InfoChip
                                    icon={selectedStudent.status === 'active'
                                        ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        : selectedStudent.status === 'under_review' ? <Clock className="w-4 h-4 text-blue-500" />
                                            : selectedStudent.status === 'rejected' ? <XCircle className="w-4 h-4 text-red-500" />
                                                : <Clock className="w-4 h-4 text-amber-500" />}
                                    label="Account Status"
                                    value={selectedStudent.status === 'under_review' ? 'Under Review' : selectedStudent.status}
                                />
                            </div>

                            {/* Documents */}
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-blue-600" /> Documents
                                </h4>
                                {docsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                    </div>
                                ) : !studentDocs ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <XCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                        <p className="text-sm">No documents uploaded yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {DOC_SLOTS.map(({ urlKey, typeKey, label }) => {
                                            const url = (studentDocs as any)[urlKey] as string;
                                            const type = (studentDocs as any)[typeKey] as string;
                                            return (
                                                <div key={urlKey} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                            {type === 'pdf' ? <FileText className="w-4 h-4 text-blue-600" /> : <ImageIcon className="w-4 h-4 text-blue-600" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-xs">{label}</p>
                                                            <p className="text-gray-400 text-xs uppercase">{type}</p>
                                                        </div>
                                                    </div>
                                                    <a href={url} target="_blank" rel="noopener noreferrer" download
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                                                        <Download className="w-3 h-3" /> Download
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject Modal (per-field rejection) ── */}
            {rejectTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500" /> Reject Documents
                                </h3>
                                <p className="text-gray-500 text-xs mt-1">Select which documents to reject and provide reasons</p>
                            </div>
                            <button onClick={() => setRejectTarget(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="mb-2">
                                <p className="text-sm font-semibold text-gray-900">{rejectTarget.fullName}</p>
                                <p className="text-xs text-gray-400">{rejectTarget.email}</p>
                            </div>

                            {DOC_SLOTS.map(({ fieldKey, label }) => (
                                <div key={fieldKey} className="space-y-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={rejectFields.has(fieldKey)}
                                            onChange={() => toggleRejectField(fieldKey)}
                                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                        />
                                        <span className="text-sm font-semibold text-gray-700">{label}</span>
                                    </label>
                                    {rejectFields.has(fieldKey) && (
                                        <input
                                            type="text"
                                            placeholder={`Reason for rejecting ${label}…`}
                                            value={rejectReasons[fieldKey] || ''}
                                            onChange={e => setRejectReasons(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50/50 placeholder-red-300"
                                        />
                                    )}
                                </div>
                            ))}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setRejectTarget(null)}
                                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={submitReject}
                                    disabled={rejectFields.size === 0 || [...rejectFields].some(f => !rejectReasons[f]?.trim()) || actionLoading === rejectTarget._id}
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {actionLoading === rejectTarget._id ? 'Rejecting…' : `Reject ${rejectFields.size} Document${rejectFields.size !== 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="mt-0.5 shrink-0">{icon}</div>
            <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
            </div>
        </div>
    );
}
