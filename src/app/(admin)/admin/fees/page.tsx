'use client';

import { useEffect, useState } from 'react';
import { IndianRupee, RefreshCw, Users, TrendingDown, AlertCircle, CheckCircle2, Edit2, X, Search } from 'lucide-react';

interface Course {
    _id: string;
    courseId: string;
    courseTitle: string;
    originalPrice: number;
    offerPrice: number;
    isOfferActive: boolean;
    effectivePrice: number;
    linkedStudents: number;
}

interface Batch { _id: string; name: string; }

const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');

export default function AdminFeesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Edit base fee modal
    const [editCourse, setEditCourse] = useState<Course | null>(null);
    const [newBaseFee, setNewBaseFee] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [editMsg, setEditMsg] = useState('');

    // Bulk assign modal
    const [assignCourse, setAssignCourse] = useState<Course | null>(null);
    const [assignForm, setAssignForm] = useState({ batchId: '', feeLabel: 'Annual Fee', academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, discountPct: '0' });
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignMsg, setAssignMsg] = useState('');

    const fetchData = async () => {
        setLoading(true);
        const [cRes, bRes] = await Promise.all([
            fetch('/api/admin/fees/course'),
            fetch('/api/public/batches'),
        ]);
        const cData = await cRes.json();
        const bData = await bRes.json();
        if (cData.success) setCourses(cData.courses);
        if (bData.success) setBatches(bData.batches);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleUpdateBaseFee = async () => {
        if (!editCourse || !newBaseFee) return;
        setEditLoading(true); setEditMsg('');
        const res = await fetch('/api/admin/fees/course', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId: editCourse.courseId, newBaseFee: Number(newBaseFee) }),
        });
        const d = await res.json();
        setEditMsg(d.message || (d.success ? 'Updated!' : 'Error'));
        if (d.success) { fetchData(); setTimeout(() => setEditCourse(null), 1500); }
        setEditLoading(false);
    };

    const handleBulkAssign = async () => {
        if (!assignCourse) return;
        setAssignLoading(true); setAssignMsg('');
        const res = await fetch('/api/admin/fees/course', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId: assignCourse.courseId, ...assignForm }),
        });
        const d = await res.json();
        setAssignMsg(d.message || (d.success ? 'Done!' : 'Error'));
        if (d.success) fetchData();
        setAssignLoading(false);
    };

    const filtered = courses.filter(c => c.courseTitle.toLowerCase().includes(search.toLowerCase()) || c.courseId.includes(search));

    const inputCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
                    <p className="text-gray-500 text-sm">Manage course fees and student fee assignments</p>
                </div>
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Total Courses</p>
                    <p className="text-2xl font-black text-gray-900">{courses.length}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Students Assigned</p>
                    <p className="text-2xl font-black text-gray-900">{courses.reduce((s, c) => s + c.linkedStudents, 0)}</p>
                </div>
                <div className="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm p-4">
                    <p className="text-blue-400 text-xs font-semibold uppercase tracking-wide mb-1">Offer Active</p>
                    <p className="text-2xl font-black text-blue-700">{courses.filter(c => c.isOfferActive).length}</p>
                </div>
                <div className="bg-green-50 rounded-2xl border border-green-100 shadow-sm p-4">
                    <p className="text-green-400 text-xs font-semibold uppercase tracking-wide mb-1">Avg. Course Fee</p>
                    <p className="text-xl font-black text-green-700">{courses.length ? fmt(Math.round(courses.reduce((s, c) => s + c.effectivePrice, 0) / courses.length)) : '—'}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Course table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400"><IndianRupee className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No courses found. Add pricing in Course Pricing admin page.</p></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Course</th>
                                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Base Fee</th>
                                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Offer Price</th>
                                <th className="text-right px-5 py-3.5 font-semibold text-gray-600">Effective</th>
                                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Students</th>
                                <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Offer</th>
                                <th className="px-5 py-3.5" />
                            </tr></thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(course => (
                                    <tr key={course._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-gray-900">{course.courseTitle}</p>
                                            <p className="text-gray-400 text-xs mt-0.5 font-mono">{course.courseId}</p>
                                        </td>
                                        <td className="px-5 py-4 text-right font-bold text-gray-900">{fmt(course.originalPrice)}</td>
                                        <td className="px-5 py-4 text-right text-gray-500">{fmt(course.offerPrice)}</td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={`font-black ${course.isOfferActive ? 'text-green-600' : 'text-gray-900'}`}>{fmt(course.effectivePrice)}</span>
                                            {course.isOfferActive && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">OFFER</span>}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className="flex items-center justify-center gap-1 text-indigo-700 font-bold"><Users className="w-3.5 h-3.5" />{course.linkedStudents}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {course.isOfferActive
                                                ? <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full font-semibold">Active</span>
                                                : <span className="text-xs text-gray-300">Off</span>}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 justify-end">
                                                <button onClick={() => { setEditCourse(course); setNewBaseFee(String(course.originalPrice)); setEditMsg(''); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                                    <Edit2 className="w-3 h-3" /> Update Fee
                                                </button>
                                                <button onClick={() => { setAssignCourse(course); setAssignMsg(''); }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                                                    <Users className="w-3 h-3" /> Assign
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Update Base Fee Modal ── */}
            {editCourse && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-900">Update Course Base Fee</h3>
                                <p className="text-gray-400 text-xs mt-0.5">{editCourse.courseTitle}</p>
                            </div>
                            <button onClick={() => setEditCourse(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs">Current Base Fee</p><p className="font-bold text-gray-900">{fmt(editCourse.originalPrice)}</p></div>
                                <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs">Linked Students</p><p className="font-bold text-gray-900">{editCourse.linkedStudents}</p></div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Base Fee (₹)</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input className={`${inputCls} pl-9`} type="number" placeholder="e.g. 90000" value={newBaseFee} onChange={e => setNewBaseFee(e.target.value)} />
                                </div>
                            </div>
                            {editCourse.linkedStudents > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>This will update the base fee for <strong>{editCourse.linkedStudents} student fee records</strong>. Each student&apos;s existing discount % will be respected when recalculating their final fee.</span>
                                </div>
                            )}
                            {editMsg && (
                                <div className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${editMsg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                                    {editMsg.includes('Error') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {editMsg}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button onClick={() => setEditCourse(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button onClick={handleUpdateBaseFee} disabled={editLoading || !newBaseFee}
                                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                                    {editLoading ? 'Updating…' : 'Update Fee'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Bulk Assign Modal ── */}
            {assignCourse && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-900">Bulk Assign Fee</h3>
                                <p className="text-gray-400 text-xs mt-0.5">{assignCourse.courseTitle} · {fmt(assignCourse.effectivePrice)}</p>
                            </div>
                            <button onClick={() => setAssignCourse(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fee Label</label>
                                    <input className={inputCls} placeholder="e.g. Annual Fee" value={assignForm.feeLabel} onChange={e => setAssignForm(p => ({ ...p, feeLabel: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Academic Year</label>
                                    <input className={inputCls} placeholder="e.g. 2024-25" value={assignForm.academicYear} onChange={e => setAssignForm(p => ({ ...p, academicYear: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Batch <span className="text-red-400">*</span> (required)</label>
                                <select className={inputCls} value={assignForm.batchId} onChange={e => setAssignForm(p => ({ ...p, batchId: e.target.value }))}>
                                    <option value="">— Select a batch —</option>
                                    {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                </select>
                                {!assignForm.batchId && <p className="text-xs text-amber-600 mt-1">⚠ You must select a batch to avoid assigning fees to all students.</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Scholarship / Discount % (optional)</label>
                                <div className="relative">
                                    <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input className={`${inputCls} pl-9`} type="number" min="0" max="100" placeholder="0" value={assignForm.discountPct} onChange={e => setAssignForm(p => ({ ...p, discountPct: e.target.value }))} />
                                </div>
                                {Number(assignForm.discountPct) > 0 && (
                                    <p className="text-xs text-green-600 mt-1">Final fee: {fmt(Math.round(assignCourse.effectivePrice - (assignCourse.effectivePrice * Number(assignForm.discountPct)) / 100))}</p>
                                )}
                            </div>
                            {assignMsg && (
                                <div className={`flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${assignMsg.toLowerCase().includes('error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                                    {assignMsg.toLowerCase().includes('error') ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />} {assignMsg}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button onClick={() => setAssignCourse(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button onClick={handleBulkAssign} disabled={assignLoading || !assignForm.batchId}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                                    {assignLoading ? 'Assigning…' : 'Assign Fees'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
