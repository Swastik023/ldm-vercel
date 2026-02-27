'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Download, Search, Filter, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, X, User, Phone, Mail, BookOpen, Hash, CalendarDays, CheckCircle2, XCircle, Eye, Clock, AlertTriangle, Edit2, Plus, IndianRupee, Trash2 } from 'lucide-react';

interface Student {
    _id: string; fullName: string; email: string; mobileNumber?: string;
    username: string; rollNumber?: string; sessionFrom?: number; sessionTo?: number;
    isProfileComplete: boolean; status: string; createdAt: string; provider?: string;
    rejectionReasons?: Record<string, string>;
    batch: { _id: string; name: string } | null;
    classId: { _id: string; className: string } | null;
}
interface Batch { _id: string; name: string; }
interface StudentDocs {
    passportPhotoUrl: string; passportPhotoType: string;
    marksheet10Url: string; marksheet10Type: string;
    marksheet12Url: string; marksheet12Type: string;
    aadhaarIdUrl?: string; aadhaarIdType?: string;
    familyIdUrl?: string; familyIdType?: string;
    customDocuments?: { _id: string; title: string; fileUrl: string; fileType: string; }[];
}
interface FeeRecord {
    _id: string; feeLabel: string; academicYear: string; notes?: string;
    baseFee: number;       // From course pricing
    discountPct: number;   // 0–100
    finalFee: number;      // baseFee - (baseFee * discountPct / 100)
    amountPaid: number;    // sum of payments
    amountRemaining: number; // finalFee - amountPaid
    payments: { _id: string; amount: number; date: string; note?: string; }[];
}

const STANDARD_DOC_SLOTS = [
    { urlKey: 'passportPhotoUrl', typeKey: 'passportPhotoType', label: 'Passport Photo' },
    { urlKey: 'marksheet10Url', typeKey: 'marksheet10Type', label: '10th Marksheet' },
    { urlKey: 'marksheet12Url', typeKey: 'marksheet12Type', label: '12th Marksheet' },
    { urlKey: 'aadhaarIdUrl', typeKey: 'aadhaarIdType', label: 'Aadhaar Card' },
    { urlKey: 'familyIdUrl', typeKey: 'familyIdType', label: 'Family ID' },
] as const;

const DOC_SLOTS_FOR_REJECT = [
    { fieldKey: 'passportPhoto', label: 'Passport Photo' },
    { fieldKey: 'marksheet10', label: '10th Marksheet' },
    { fieldKey: 'marksheet12', label: '12th Marksheet' },
    { fieldKey: 'aadhaarId', label: 'Aadhaar Card' },
    { fieldKey: 'familyId', label: 'Family ID' },
] as const;

const CURRENT_YEAR = new Date().getFullYear();
const SESSION_YEARS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - 5 + i);
type TabType = 'all' | 'pending' | 'under_review' | 'rejected';

export default function AdminStudentsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('all');
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

    // Tab students
    const [tabStudents, setTabStudents] = useState<Student[]>([]);
    const [tabLoading, setTabLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modals
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentDocs, setStudentDocs] = useState<StudentDocs | null>(null);
    const [studentFees, setStudentFees] = useState<FeeRecord[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const [modalTab, setModalTab] = useState<'docs' | 'fees' | 'edit'>('docs');

    // Reject modal
    const [rejectTarget, setRejectTarget] = useState<Student | null>(null);
    const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
    const [rejectFields, setRejectFields] = useState<Set<string>>(new Set());

    // Edit form
    const [editForm, setEditForm] = useState<Record<string, string>>({});
    const [editLoading, setEditLoading] = useState(false);

    // Fee form
    const [newFee, setNewFee] = useState({ baseFee: '', discountPct: '0', feeLabel: 'Course Fee', academicYear: `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`, notes: '' });
    const [editFeeId, setEditFeeId] = useState<string | null>(null);
    const [editFeeForm, setEditFeeForm] = useState<{ baseFee: string; discountPct: string; finalFee: string; notes: string }>({ baseFee: '', discountPct: '0', finalFee: '', notes: '' });
    const [paymentForm, setPaymentForm] = useState<{ feeId: string; amount: string; note: string } | null>(null);
    const [feeLoading, setFeeLoading] = useState(false);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const p = new URLSearchParams({ page: String(page), limit: '25' });
        if (selectedBatch) p.set('batchId', selectedBatch);
        if (sessionFrom) p.set('sessionFrom', sessionFrom);
        if (sessionTo) p.set('sessionTo', sessionTo);
        if (rollSearch) p.set('rollNumber', rollSearch);
        const res = await fetch(`/api/admin/students?${p}`);
        const d = await res.json();
        if (d.success) { setStudents(d.students); setTotal(d.total); setPages(d.pages); }
        setLoading(false);
    }, [page, selectedBatch, sessionFrom, sessionTo, rollSearch]);

    const fetchTabStudents = useCallback(async (status: string) => {
        setTabLoading(true);
        const res = await fetch(`/api/admin/users/approve?status=${status}`);
        const d = await res.json();
        if (d.success) setTabStudents(d.users);
        setTabLoading(false);
    }, []);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);
    useEffect(() => { fetch('/api/public/batches').then(r => r.json()).then(d => { if (d.success) setBatches(d.batches); }); }, []);
    useEffect(() => { if (activeTab !== 'all') fetchTabStudents(activeTab); }, [activeTab, fetchTabStudents]);

    const handleApprove = async (userId: string) => {
        setActionLoading(userId);
        await fetch('/api/admin/users/approve', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, action: 'approve' }) });
        setTabStudents(prev => prev.filter(s => s._id !== userId));
        setActionLoading(null);
    };

    const openRejectModal = (student: Student) => { setRejectTarget(student); setRejectFields(new Set()); setRejectReasons({}); };
    const toggleRejectField = (field: string) => {
        setRejectFields(prev => { const n = new Set(prev); if (n.has(field)) { n.delete(field); const r = { ...rejectReasons }; delete r[field]; setRejectReasons(r); } else n.add(field); return n; });
    };
    const submitReject = async () => {
        if (!rejectTarget || rejectFields.size === 0) return;
        if ([...rejectFields].some(f => !rejectReasons[f]?.trim())) return;
        setActionLoading(rejectTarget._id);
        await fetch('/api/admin/users/approve', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: rejectTarget._id, action: 'reject', rejectionReasons: rejectReasons }) });
        setTabStudents(prev => prev.filter(s => s._id !== rejectTarget._id));
        setRejectTarget(null); setActionLoading(null);
    };

    const openStudentModal = async (student: Student) => {
        setSelectedStudent(student); setStudentDocs(null); setStudentFees([]); setDocsLoading(true); setModalTab('docs');
        setEditForm({ fullName: student.fullName, email: student.email, mobileNumber: student.mobileNumber || '', rollNumber: student.rollNumber || '' });
        const [docRes, feeRes] = await Promise.all([
            fetch(`/api/admin/students/${student._id}/documents`),
            fetch(`/api/admin/students/${student._id}/fees`),
        ]);
        const docData = await docRes.json();
        const feeData = await feeRes.json();
        if (docData.success) setStudentDocs(docData.documents);
        if (feeData.success) setStudentFees(feeData.fees);
        setDocsLoading(false);
    };

    const saveEdit = async () => {
        if (!selectedStudent) return;
        setEditLoading(true);
        const res = await fetch(`/api/admin/students/${selectedStudent._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
        const d = await res.json();
        if (d.success) {
            setSelectedStudent(d.student);
            setStudents(prev => prev.map(s => s._id === selectedStudent._id ? d.student : s));
        }
        setEditLoading(false);
    };

    const addFee = async () => {
        if (!selectedStudent || !newFee.baseFee) return;
        setFeeLoading(true);
        const res = await fetch(`/api/admin/students/${selectedStudent._id}/fees`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newFee, baseFee: Number(newFee.baseFee), discountPct: Number(newFee.discountPct) }),
        });
        const d = await res.json();
        if (d.success) { setStudentFees(prev => [d.fee, ...prev]); setNewFee({ baseFee: '', discountPct: '0', feeLabel: 'Course Fee', academicYear: `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`, notes: '' }); }
        setFeeLoading(false);
    };

    const saveFeeEdit = async (feeId: string) => {
        if (!selectedStudent) return;
        setFeeLoading(true);
        const res = await fetch(`/api/admin/students/${selectedStudent._id}/fees`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                feeId, action: 'update_fee',
                baseFee: Number(editFeeForm.baseFee),
                discountPct: editFeeForm.discountPct !== '' ? Number(editFeeForm.discountPct) : undefined,
                finalFee: editFeeForm.finalFee !== '' && editFeeForm.discountPct === '' ? Number(editFeeForm.finalFee) : undefined,
                notes: editFeeForm.notes,
            }),
        });
        const d = await res.json();
        if (d.success) { setStudentFees(prev => prev.map(f => f._id === feeId ? d.fee : f)); setEditFeeId(null); }
        setFeeLoading(false);
    };

    const addPayment = async () => {
        if (!selectedStudent || !paymentForm?.amount) return;
        setFeeLoading(true);
        const res = await fetch(`/api/admin/students/${selectedStudent._id}/fees`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ feeId: paymentForm.feeId, action: 'add_payment', amount: Number(paymentForm.amount), note: paymentForm.note }) });
        const d = await res.json();
        if (d.success) { setStudentFees(prev => prev.map(f => f._id === paymentForm.feeId ? d.fee : f)); setPaymentForm(null); }
        setFeeLoading(false);
    };

    const deleteFee = async (feeId: string) => {
        if (!selectedStudent || !confirm('Delete this fee record?')) return;
        await fetch(`/api/admin/students/${selectedStudent._id}/fees?feeId=${feeId}`, { method: 'DELETE' });
        setStudentFees(prev => prev.filter(f => f._id !== feeId));
    };

    const filteredStudents = nameSearch
        ? students.filter(s => s.fullName.toLowerCase().includes(nameSearch.toLowerCase()) || s.email.toLowerCase().includes(nameSearch.toLowerCase()) || (s.rollNumber || '').toLowerCase().includes(nameSearch.toLowerCase()))
        : students;

    const resetFilters = () => { setSelectedBatch(''); setSessionFrom(''); setSessionTo(''); setRollSearch(''); setNameSearch(''); setPage(1); };

    const downloadCSV = () => { window.open('/api/admin/students/export', '_blank'); };

    const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div><h1 className="text-2xl font-bold text-gray-900">Students</h1><p className="text-gray-500 text-sm">{total} registered</p></div>
                <button onClick={downloadCSV}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors shadow-sm">
                    <Download className="w-4 h-4" /> Export CSV
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
                {([{ key: 'all', label: 'All Students' }, { key: 'pending', label: '📝 Pending' }, { key: 'under_review', label: '⏳ Under Review' }, { key: 'rejected', label: '❌ Rejected' }] as { key: TabType; label: string }[]).map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Under Review / Pending / Rejected */}
            {activeTab !== 'all' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {tabLoading ? <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" /></div>
                        : tabStudents.length === 0 ? <div className="text-center py-16 text-gray-400"><CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400 opacity-60" /><p>No {activeTab.replace('_', ' ')} students</p></div>
                            : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Student</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Phone</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Class</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Profile</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Registered</th>
                                            <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Actions</th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {tabStudents.map(student => (
                                                <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${activeTab === 'rejected' ? 'bg-gradient-to-br from-red-400 to-red-600' : activeTab === 'under_review' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>{student.fullName.charAt(0)}</div>
                                                            <div><p className="font-semibold text-gray-900 text-sm">{student.fullName}</p><p className="text-gray-400 text-xs">{student.email}</p></div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-gray-600 text-sm">{student.mobileNumber || '—'}</td>
                                                    <td className="px-5 py-3.5">{student.classId ? <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">{student.classId.className}</span> : '—'}</td>
                                                    <td className="px-5 py-3.5">{student.isProfileComplete ? <span className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</span> : <span className="text-xs text-amber-600 font-semibold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Incomplete</span>}</td>
                                                    <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(student.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => openStudentModal(student)} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"><Eye className="w-3 h-3" /> View</button>
                                                            {(activeTab === 'under_review' || activeTab === 'rejected') && (
                                                                <button onClick={() => handleApprove(student._id)} disabled={actionLoading === student._id} className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                                                                    <CheckCircle2 className="w-3 h-3" />{actionLoading === student._id ? '…' : 'Approve'}
                                                                </button>
                                                            )}
                                                            {activeTab === 'under_review' && (
                                                                <button onClick={() => openRejectModal(student)} className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors"><XCircle className="w-3 h-3" /> Reject</button>
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

            {/* All Students Tab */}
            {activeTab === 'all' && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search name, email, roll…" value={nameSearch} onChange={e => setNameSearch(e.target.value)} />
                            </div>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input className="pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" placeholder="Roll No" value={rollSearch} onChange={e => { setRollSearch(e.target.value); setPage(1); }} />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                            <select className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none" value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setPage(1); }}>
                                <option value="">All Batches</option>
                                {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                            <select className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none" value={sessionFrom} onChange={e => { setSessionFrom(e.target.value); setPage(1); }}>
                                <option value="">From Year</option>
                                {SESSION_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none" value={sessionTo} onChange={e => { setSessionTo(e.target.value); setPage(1); }}>
                                <option value="">To Year</option>
                                {SESSION_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            {(selectedBatch || sessionFrom || sessionTo || rollSearch || nameSearch) && (
                                <button onClick={resetFilters} className="px-3 py-2 text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"><X className="w-3 h-3" /> Clear</button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
                            : filteredStudents.length === 0 ? <div className="text-center py-16 text-gray-400"><User className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No students found</p></div>
                                : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead><tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Student</th>
                                                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Class</th>
                                                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Roll No</th>
                                                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Phone</th>
                                                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Status</th>
                                                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Joined</th>
                                                <th className="px-5 py-3.5" />
                                            </tr></thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {filteredStudents.map(student => (
                                                    <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-5 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">{student.fullName.charAt(0)}</div>
                                                                <div><p className="font-semibold text-gray-900 text-sm">{student.fullName}</p><p className="text-gray-400 text-xs">{student.email}</p></div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3.5">{student.classId ? <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">{student.classId.className}</span> : student.batch ? <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">{student.batch.name}</span> : '—'}</td>
                                                        <td className="px-5 py-3.5">{student.rollNumber ? <span className="font-mono text-sm font-bold text-gray-700">{student.rollNumber}</span> : <span className="text-gray-300">—</span>}</td>
                                                        <td className="px-5 py-3.5 text-gray-600 text-sm">{student.mobileNumber || '—'}</td>
                                                        <td className="px-5 py-3.5">
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${student.status === 'active' ? 'bg-green-50 text-green-700' : student.status === 'under_review' ? 'bg-blue-50 text-blue-700' : student.status === 'pending' ? 'bg-amber-50 text-amber-700' : student.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                                                {student.status === 'under_review' ? 'Under Review' : student.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3.5 text-gray-400 text-xs">{new Date(student.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                        <td className="px-5 py-3.5">
                                                            <button onClick={() => openStudentModal(student)} className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"><Eye className="w-3 h-3" /> View</button>
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
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                                    <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── Student Detail Modal ─────────────────────────────── */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">{selectedStudent.fullName.charAt(0)}</div>
                                <div>
                                    <p className="font-bold text-gray-900">{selectedStudent.fullName}</p>
                                    <p className="text-gray-400 text-xs">{selectedStudent.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>

                        {/* Sub-tabs */}
                        <div className="flex gap-0.5 bg-gray-100 mx-5 mt-4 p-1 rounded-xl flex-shrink-0">
                            {[{ k: 'docs', l: '📄 Documents' }, { k: 'fees', l: '💰 Fees' }, { k: 'edit', l: '✏️ Edit' }].map(t => (
                                <button key={t.k} onClick={() => setModalTab(t.k as any)}
                                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${modalTab === t.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                                    {t.l}
                                </button>
                            ))}
                        </div>

                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">

                            {/* ── DOCUMENTS TAB ── */}
                            {modalTab === 'docs' && (
                                docsLoading ? <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                                    : !studentDocs ? <div className="text-center py-8 text-gray-400"><XCircle className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No documents uploaded yet</p></div>
                                        : (
                                            <div className="space-y-2">
                                                {STANDARD_DOC_SLOTS.map(({ urlKey, typeKey, label }) => {
                                                    const url = (studentDocs as any)[urlKey] as string | undefined;
                                                    const type = (studentDocs as any)[typeKey] as string | undefined;
                                                    if (!url) return null;
                                                    return (
                                                        <div key={urlKey} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                                    {type === 'pdf' ? <FileText className="w-4 h-4 text-blue-600" /> : <ImageIcon className="w-4 h-4 text-blue-600" />}
                                                                </div>
                                                                <div><p className="font-semibold text-gray-900 text-xs">{label}</p><p className="text-gray-400 text-xs uppercase">{type}</p></div>
                                                            </div>
                                                            <a href={url} target="_blank" rel="noopener noreferrer" download
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                                                                <Download className="w-3 h-3" /> Download
                                                            </a>
                                                        </div>
                                                    );
                                                })}
                                                {(studentDocs.customDocuments || []).map((doc) => (
                                                    <div key={doc._id} className="flex items-center justify-between gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                                                {doc.fileType === 'pdf' ? <FileText className="w-4 h-4 text-purple-600" /> : <ImageIcon className="w-4 h-4 text-purple-600" />}
                                                            </div>
                                                            <div><p className="font-semibold text-gray-900 text-xs">{doc.title}</p><p className="text-gray-400 text-xs uppercase">{doc.fileType} · Custom</p></div>
                                                        </div>
                                                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors">
                                                            <Download className="w-3 h-3" /> Download
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                            )}

                            {/* ── FEES TAB ── */}
                            {modalTab === 'fees' && (
                                <div className="space-y-4">
                                    {/* Add fee form */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Add Fee Record</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input className={inputCls} placeholder="Fee Label (e.g. Semester 1)" value={newFee.feeLabel} onChange={e => setNewFee(p => ({ ...p, feeLabel: e.target.value }))} />
                                            <input className={inputCls} placeholder="Academic Year (e.g. 2024-25)" value={newFee.academicYear} onChange={e => setNewFee(p => ({ ...p, academicYear: e.target.value }))} />
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                <input className={`${inputCls} pl-8`} placeholder="Base Fee" type="number" value={newFee.baseFee} onChange={e => setNewFee(p => ({ ...p, baseFee: e.target.value }))} />
                                            </div>
                                            <input className={`${inputCls} w-28`} placeholder="Discount %" type="number" min="0" max="100" value={newFee.discountPct} onChange={e => setNewFee(p => ({ ...p, discountPct: e.target.value }))} />
                                            <button onClick={addFee} disabled={feeLoading || !newFee.baseFee}
                                                className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5">
                                                <Plus className="w-4 h-4" /> Add
                                            </button>
                                        </div>
                                        {newFee.baseFee && (
                                            <p className="text-xs text-blue-600">
                                                Final Fee: ₹{Math.round(Number(newFee.baseFee) - (Number(newFee.baseFee) * Number(newFee.discountPct || 0)) / 100).toLocaleString('en-IN')}
                                                {Number(newFee.discountPct) > 0 && ` (${newFee.discountPct}% discount)`}
                                            </p>
                                        )}
                                        <input className={inputCls} placeholder="Notes (optional)" value={newFee.notes} onChange={e => setNewFee(p => ({ ...p, notes: e.target.value }))} />
                                    </div>

                                    {/* Fee records */}
                                    {studentFees.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400"><IndianRupee className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No fee records yet</p></div>
                                    ) : studentFees.map(fee => {
                                        const pct = fee.finalFee > 0 ? Math.min(100, Math.round((fee.amountPaid / fee.finalFee) * 100)) : 0;
                                        const remaining = fee.amountRemaining ?? Math.max(0, fee.finalFee - fee.amountPaid);
                                        return (
                                            <div key={fee._id} className="border border-gray-200 rounded-xl overflow-hidden">
                                                <div className="p-4 space-y-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className="font-bold text-gray-900 text-sm">{fee.feeLabel}</p>
                                                            <p className="text-gray-400 text-xs">{fee.academicYear}</p>
                                                        </div>
                                                        <div className="flex gap-2 items-center">
                                                            <button onClick={() => { setEditFeeId(fee._id); setEditFeeForm({ baseFee: String(fee.baseFee), discountPct: String(fee.discountPct), finalFee: String(fee.finalFee), notes: fee.notes || '' }); }}
                                                                className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 flex items-center gap-1">
                                                                <Edit2 className="w-3 h-3" /> Edit
                                                            </button>
                                                            <button onClick={() => setPaymentForm({ feeId: fee._id, amount: '', note: '' })}
                                                                className="px-2.5 py-1 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 flex items-center gap-1">
                                                                <Plus className="w-3 h-3" /> Payment
                                                            </button>
                                                            <button onClick={() => deleteFee(fee._id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>

                                                    {/* Inline edit form */}
                                                    {editFeeId === fee._id && (
                                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                                                            <p className="text-xs font-bold text-blue-700">Edit Fee Figures</p>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div>
                                                                    <label className="text-xs text-gray-500 mb-0.5 block">Base Fee (₹)</label>
                                                                    <input className={inputCls} type="number" value={editFeeForm.baseFee} onChange={e => setEditFeeForm(p => ({ ...p, baseFee: e.target.value, finalFee: '' }))} />
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs text-gray-500 mb-0.5 block">Discount %</label>
                                                                    <input className={inputCls} type="number" min="0" max="100" placeholder="0" value={editFeeForm.discountPct} onChange={e => setEditFeeForm(p => ({ ...p, discountPct: e.target.value, finalFee: '' }))} />
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs text-gray-500 mb-0.5 block">Final Fee (₹)</label>
                                                                    <input className={inputCls} type="number" placeholder="auto" value={editFeeForm.finalFee} onChange={e => setEditFeeForm(p => ({ ...p, finalFee: e.target.value, discountPct: '' }))} />
                                                                </div>
                                                            </div>
                                                            <input className={inputCls} placeholder="Notes" value={editFeeForm.notes} onChange={e => setEditFeeForm(p => ({ ...p, notes: e.target.value }))} />
                                                            <p className="text-xs text-blue-500">Set either Discount % or Final Fee — the other auto-calculates.</p>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => saveFeeEdit(fee._id)} disabled={feeLoading} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">Save</button>
                                                                <button onClick={() => setEditFeeId(null)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg">Cancel</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 5-field summary */}
                                                    <div className="grid grid-cols-5 gap-1.5 text-center">
                                                        <div className="bg-gray-50 rounded-lg p-2">
                                                            <p className="text-xs text-gray-400">Base</p>
                                                            <p className="font-bold text-gray-700 text-xs">₹{fee.baseFee.toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div className="bg-amber-50 rounded-lg p-2">
                                                            <p className="text-xs text-amber-400">Disc %</p>
                                                            <p className="font-bold text-amber-700 text-xs">{fee.discountPct}%</p>
                                                        </div>
                                                        <div className="bg-blue-50 rounded-lg p-2">
                                                            <p className="text-xs text-blue-400">Final</p>
                                                            <p className="font-bold text-blue-700 text-xs">₹{fee.finalFee.toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div className="bg-green-50 rounded-lg p-2">
                                                            <p className="text-xs text-green-500">Paid</p>
                                                            <p className="font-bold text-green-700 text-xs">₹{fee.amountPaid.toLocaleString('en-IN')}</p>
                                                        </div>
                                                        <div className={`rounded-lg p-2 ${remaining > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                                                            <p className={`text-xs ${remaining > 0 ? 'text-red-400' : 'text-green-500'}`}>Left</p>
                                                            <p className={`font-bold text-xs ${remaining > 0 ? 'text-red-600' : 'text-green-700'}`}>₹{remaining.toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div className="bg-gray-100 rounded-full h-1.5">
                                                        <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <p className="text-xs text-gray-400 text-right">{pct}% paid</p>

                                                    {/* Add payment inline */}
                                                    {paymentForm?.feeId === fee._id && (
                                                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                                                            <p className="text-xs font-bold text-green-700">Add Payment</p>
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                                    <input className={`${inputCls} pl-7`} placeholder="Amount" type="number" value={paymentForm.amount} onChange={e => setPaymentForm(p => p ? { ...p, amount: e.target.value } : p)} />
                                                                </div>
                                                                <input className={`${inputCls} flex-1`} placeholder="Note (optional)" value={paymentForm.note} onChange={e => setPaymentForm(p => p ? { ...p, note: e.target.value } : p)} />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button onClick={addPayment} disabled={feeLoading || !paymentForm.amount} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50">Save</button>
                                                                <button onClick={() => setPaymentForm(null)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg">Cancel</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Payment history */}
                                                    {fee.payments.length > 0 && (
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-gray-400 font-semibold">Payment History</p>
                                                            {fee.payments.map(p => (
                                                                <div key={p._id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                                                                    <span className="text-gray-500">{new Date(p.date).toLocaleDateString('en-IN')}{p.note && ` · ${p.note}`}</span>
                                                                    <span className="font-bold text-green-600">+₹{p.amount.toLocaleString('en-IN')}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ── EDIT TAB ── */}
                            {modalTab === 'edit' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-gray-400">Edit student profile details. Changes take effect immediately.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { key: 'fullName', label: 'Full Name', placeholder: 'Full name' },
                                            { key: 'email', label: 'Email', placeholder: 'Email address' },
                                            { key: 'mobileNumber', label: 'Phone Number', placeholder: '10-digit mobile' },
                                            { key: 'rollNumber', label: 'Roll Number', placeholder: 'e.g. 01, A-12' },
                                        ].map(({ key, label, placeholder }) => (
                                            <div key={key}>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                                                <input className={inputCls} placeholder={placeholder} value={editForm[key] || ''} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Account Status</label>
                                        <select className={inputCls} value={editForm.status || selectedStudent.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                                            {['active', 'pending', 'under_review', 'rejected', 'inactive'].map(s => <option key={s} value={s}>{s === 'under_review' ? 'Under Review' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={saveEdit} disabled={editLoading}
                                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                        {editLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Edit2 className="w-4 h-4" /> Save Changes</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Reject Modal ── */}
            {rejectTarget && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div><h3 className="font-bold text-gray-900 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> Reject Documents</h3>
                                <p className="text-gray-400 text-xs mt-0.5">Select documents to reject and provide reasons</p></div>
                            <button onClick={() => setRejectTarget(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="mb-2"><p className="text-sm font-semibold text-gray-900">{rejectTarget.fullName}</p><p className="text-xs text-gray-400">{rejectTarget.email}</p></div>
                            {DOC_SLOTS_FOR_REJECT.map(({ fieldKey, label }) => (
                                <div key={fieldKey} className="space-y-2">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={rejectFields.has(fieldKey)} onChange={() => toggleRejectField(fieldKey)} className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                                        <span className="text-sm font-semibold text-gray-700">{label}</span>
                                    </label>
                                    {rejectFields.has(fieldKey) && (
                                        <input type="text" placeholder={`Reason for rejecting ${label}…`}
                                            value={rejectReasons[fieldKey] || ''} onChange={e => setRejectReasons(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm border border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 bg-red-50/50 placeholder-red-300" />
                                    )}
                                </div>
                            ))}
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setRejectTarget(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button onClick={submitReject} disabled={rejectFields.size === 0 || [...rejectFields].some(f => !rejectReasons[f]?.trim()) || actionLoading === rejectTarget._id}
                                    className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {actionLoading === rejectTarget._id ? 'Rejecting…' : `Reject ${rejectFields.size} Doc${rejectFields.size !== 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
