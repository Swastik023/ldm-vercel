'use client';

import { useEffect, useState, useCallback } from 'react';
import { courseData } from '@/data/courseData';

interface FeeRecord {
    _id: string;
    studentName: string;
    course: string;
    baseCoursePrice: number;
    discountPercent: number;
    discountAmount: number;
    finalFees: number;
    amountPaid: number;
    remainingAmount: number;
    globalOfferApplied?: string;
    payments: { amount: number; date: string; method: string }[];
    createdAt: string;
}

const INR = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const COURSES = Array.from(new Set(courseData.map(c => c.title)));

export default function AdminFeesPage() {
    const [records, setRecords] = useState<FeeRecord[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalDues, setTotalDues] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<{ status: string; course: string }>({ status: '', course: '' });
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ studentId: '', studentName: '', course: COURSES[0] || '', baseCoursePrice: '', discountPercent: '0', flatDiscount: '0', globalOfferApplied: '' });
    const [paymentForm, setPaymentForm] = useState({ recordId: '', amount: '', method: 'Cash', note: '' });
    const [showPay, setShowPay] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');

    // Live fee preview
    const base = Number(addForm.baseCoursePrice) || 0;
    const pct = Number(addForm.discountPercent) || 0;
    const flat = Number(addForm.flatDiscount) || 0;
    const discountAmt = pct > 0 ? Math.round((base * pct) / 100) : Math.min(flat, base);
    const finalFees = Math.max(0, base - discountAmt);

    const fetchRecords = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter.status) params.set('status', filter.status);
        if (filter.course) params.set('course', filter.course);
        const res = await fetch(`/api/admin/finance/fee-records?${params}`);
        const data = await res.json();
        if (data.success) { setRecords(data.records); setTotalRevenue(data.totalRevenue); setTotalDues(data.totalDues); }
        setLoading(false);
    }, [filter]);

    useEffect(() => { fetchRecords(); }, [fetchRecords]);

    const handleAddRecord = async () => {
        setSaving(true); setMsg('');
        const res = await fetch('/api/admin/finance/fee-records', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...addForm, baseCoursePrice: Number(addForm.baseCoursePrice), discountPercent: Number(addForm.discountPercent), flatDiscount: Number(addForm.flatDiscount) }),
        });
        const data = await res.json();
        if (data.success) { setShowAdd(false); fetchRecords(); } else setMsg(data.message);
        setSaving(false);
    };

    const handleAddPayment = async () => {
        setSaving(true); setMsg('');
        const res = await fetch(`/api/admin/finance/fee-records/${paymentForm.recordId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add-payment', amount: Number(paymentForm.amount), method: paymentForm.method, note: paymentForm.note }),
        });
        const data = await res.json();
        if (data.success) { setShowPay(false); fetchRecords(); } else setMsg(data.message);
        setSaving(false);
    };

    const openPayModal = (id: string) => { setPaymentForm(p => ({ ...p, recordId: id, amount: '', note: '' })); setMsg(''); setShowPay(true); };

    const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Manage student fees, discounts, and payment records.</p>
                </div>
                <button onClick={() => { setShowAdd(true); setMsg(''); }} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-blue-200 transition-all">
                    + Add Fee Record
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-xs text-gray-500 font-medium upper">Total Records</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{records.length}</p>
                </div>
                <div className="bg-green-50 rounded-2xl border border-green-200 p-5">
                    <p className="text-xs text-green-700 font-medium">Collected Revenue</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">{INR(totalRevenue)}</p>
                </div>
                <div className="bg-red-50 rounded-2xl border border-red-200 p-5">
                    <p className="text-xs text-red-700 font-medium">Pending Dues</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{INR(totalDues)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <select value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700">
                    <option value="">All Status</option>
                    <option value="paid">Fully Paid</option>
                    <option value="partial">Partial</option>
                    <option value="unpaid">Unpaid</option>
                </select>
                <input placeholder="Filter by course…" value={filter.course} onChange={e => setFilter(p => ({ ...p, course: e.target.value }))} className="px-3 py-2 rounded-xl border border-gray-200 text-sm w-52" />
            </div>

            {/* Records Table */}
            {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div> : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                    {records.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">No records found.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                                <tr>{['Student', 'Course', 'Base Price', 'Discount', 'Final Fees', 'Paid', 'Due', 'Status', ''].map(h => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {records.map(r => {
                                    const status = r.remainingAmount === 0 ? 'paid' : r.amountPaid === 0 ? 'unpaid' : 'partial';
                                    const statusCls = status === 'paid' ? 'bg-green-100 text-green-700' : status === 'unpaid' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700';
                                    return (
                                        <tr key={r._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{r.studentName}</td>
                                            <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{r.course}</td>
                                            <td className="px-4 py-3 text-gray-700">{INR(r.baseCoursePrice)}</td>
                                            <td className="px-4 py-3 text-gray-600">{r.discountPercent > 0 ? `${r.discountPercent}% (${INR(r.discountAmount)})` : '—'}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">{INR(r.finalFees)}</td>
                                            <td className="px-4 py-3 text-green-700 font-semibold">{INR(r.amountPaid)}</td>
                                            <td className="px-4 py-3 text-red-600 font-semibold">{INR(r.remainingAmount)}</td>
                                            <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusCls}`}>{status}</span></td>
                                            <td className="px-4 py-3">
                                                {status !== 'paid' && (
                                                    <button onClick={() => openPayModal(r._id)} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-100">+ Payment</button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Add Record Modal */}
            {showAdd && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold text-gray-900">Add Fee Record</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Student ID</label><input className={inputCls} placeholder="MongoDB ObjectId" value={addForm.studentId} onChange={e => setAddForm(p => ({ ...p, studentId: e.target.value }))} /></div>
                            <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Student Name (for display)</label><input className={inputCls} placeholder="Full name" value={addForm.studentName} onChange={e => setAddForm(p => ({ ...p, studentName: e.target.value }))} /></div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Course</label>
                                <select className={inputCls} value={addForm.course} onChange={e => setAddForm(p => ({ ...p, course: e.target.value }))}>
                                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div><label className="block text-xs font-medium text-gray-600 mb-1">Base Price (₹)</label><input type="number" className={inputCls} placeholder="30999" value={addForm.baseCoursePrice} onChange={e => setAddForm(p => ({ ...p, baseCoursePrice: e.target.value }))} /></div>
                            <div><label className="block text-xs font-medium text-gray-600 mb-1">Discount % (0-100)</label><input type="number" className={inputCls} min="0" max="100" value={addForm.discountPercent} onChange={e => setAddForm(p => ({ ...p, discountPercent: e.target.value }))} /></div>
                            <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">OR Flat Discount (₹) — ignored if % is set</label><input type="number" className={inputCls} placeholder="0" value={addForm.flatDiscount} onChange={e => setAddForm(p => ({ ...p, flatDiscount: e.target.value }))} /></div>
                        </div>
                        {/* Live calculator preview */}
                        {base > 0 && (
                            <div className="bg-blue-50 rounded-xl p-3 text-sm space-y-1">
                                <div className="flex justify-between text-gray-600"><span>Base Price</span><span>{INR(base)}</span></div>
                                <div className="flex justify-between text-orange-600"><span>Discount ({pct > 0 ? `${pct}%` : `₹${flat} flat`})</span><span>- {INR(discountAmt)}</span></div>
                                <div className="flex justify-between font-bold text-gray-900 border-t border-blue-200 pt-1 mt-1"><span>Final Fees</span><span>{INR(finalFees)}</span></div>
                            </div>
                        )}
                        {msg && <p className="text-red-600 text-xs">{msg}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
                            <button onClick={handleAddRecord} disabled={saving} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold disabled:opacity-60">{saving ? 'Saving…' : 'Save Record'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Payment Modal */}
            {showPay && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
                        <h2 className="text-lg font-bold text-gray-900">Add Payment</h2>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                            <input type="number" className={inputCls} placeholder="5000" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                            <select className={inputCls} value={paymentForm.method} onChange={e => setPaymentForm(p => ({ ...p, method: e.target.value }))}>
                                {['Cash', 'UPI', 'Bank Transfer', 'Online'].map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Note (optional)</label>
                            <input className={inputCls} placeholder="e.g. First installment" value={paymentForm.note} onChange={e => setPaymentForm(p => ({ ...p, note: e.target.value }))} />
                        </div>
                        {msg && <p className="text-red-600 text-xs">{msg}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setShowPay(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
                            <button onClick={handleAddPayment} disabled={saving} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-60">{saving ? 'Saving…' : 'Record Payment'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
