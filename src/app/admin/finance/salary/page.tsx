'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusCircle, CheckCircle, X } from 'lucide-react';

interface SalaryRecord {
    _id: string;
    employee: { fullName: string; username: string; role: string };
    month: string;
    base_amount: number;
    deductions: number;
    net_amount: number;
    status: 'pending' | 'paid';
    paid_on: string | null;
    remarks: string;
}

interface StaffUser {
    _id: string;
    fullName: string;
    username: string;
    role: string;
}

function formatINR(n: number) { return `₹${n.toLocaleString('en-IN')}`; }

export default function SalaryPage() {
    const [records, setRecords] = useState<SalaryRecord[]>([]);
    const [totalPending, setTotalPending] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
    const [filterStatus, setFilterStatus] = useState('');
    const [staff, setStaff] = useState<StaffUser[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ employee: '', month: new Date().toISOString().slice(0, 7), base_amount: '', deductions: '0', remarks: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchSalary(); }, [filterMonth, filterStatus]);

    useEffect(() => {
        axios.get('/api/admin/users').then((res) => {
            const allUsers: StaffUser[] = res.data.users ?? [];
            setStaff(allUsers.filter((u) => u.role !== 'student'));
        });
    }, []);

    async function fetchSalary() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterMonth) params.set('month', filterMonth);
            if (filterStatus) params.set('status', filterStatus);
            const res = await axios.get(`/api/admin/finance/salary?${params}`);
            setRecords(res.data.records ?? []);
            setTotalPending(res.data.totalPending ?? 0);
        } catch { toast.error('Failed to load salary records'); }
        finally { setLoading(false); }
    }

    async function markPaid(id: string) {
        try {
            await axios.put(`/api/admin/finance/salary/${id}`, { action: 'mark_paid' });
            toast.success('Marked as paid');
            fetchSalary();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message ?? 'Failed');
        }
    }

    async function submitSalary() {
        if (!form.employee || !form.month || !form.base_amount) { toast.error('Fill all required fields'); return; }
        setSubmitting(true);
        try {
            await axios.post('/api/admin/finance/salary', { ...form, base_amount: Number(form.base_amount), deductions: Number(form.deductions) });
            toast.success('Salary record created');
            setShowModal(false);
            setForm({ employee: '', month: new Date().toISOString().slice(0, 7), base_amount: '', deductions: '0', remarks: '' });
            fetchSalary();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message ?? 'Failed to create');
        } finally { setSubmitting(false); }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Salary</h1>
                    <p className="text-gray-500 mt-1">Manage monthly staff salary records.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
                    <PlusCircle className="h-4 w-4" /> Add Salary
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <input type="month" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                </select>
                {totalPending > 0 && (
                    <div className="ml-auto text-sm font-semibold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">
                        Pending: {formatINR(totalPending)}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin h-6 w-6 rounded-full border-4 border-purple-500 border-t-transparent" />
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-gray-600 font-medium">Employee</th>
                                <th className="text-left px-6 py-3 text-gray-600 font-medium">Month</th>
                                <th className="text-right px-6 py-3 text-gray-600 font-medium">Base</th>
                                <th className="text-right px-6 py-3 text-gray-600 font-medium">Deductions</th>
                                <th className="text-right px-6 py-3 text-gray-600 font-medium">Net</th>
                                <th className="text-center px-6 py-3 text-gray-600 font-medium">Status</th>
                                <th className="text-center px-6 py-3 text-gray-600 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.length === 0 ? (
                                <tr><td colSpan={7} className="py-10 text-center text-gray-400">No records found for this period</td></tr>
                            ) : records.map((r) => (
                                <tr key={r._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{r.employee?.fullName}</p>
                                        <p className="text-xs text-gray-400 capitalize">{r.employee?.role}</p>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{r.month}</td>
                                    <td className="px-6 py-4 text-right text-gray-700">{formatINR(r.base_amount)}</td>
                                    <td className="px-6 py-4 text-right text-red-500">-{formatINR(r.deductions)}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatINR(r.net_amount)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${r.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {r.status === 'pending' && (
                                            <button onClick={() => markPaid(r._id)} className="flex items-center gap-1 mx-auto text-xs text-green-600 hover:text-green-700 font-medium">
                                                <CheckCircle className="h-4 w-4" /> Mark Paid
                                            </button>
                                        )}
                                        {r.status === 'paid' && r.paid_on && (
                                            <p className="text-xs text-gray-400">{new Date(r.paid_on).toLocaleDateString('en-IN')}</p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Salary Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Add Salary Record</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })}>
                                    <option value="">Select employee...</option>
                                    {staff.map((s) => <option key={s._id} value={s._id}>{s.fullName} ({s.role})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                                <input type="month" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Amount (₹) *</label>
                                    <input type="number" min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.base_amount} onChange={(e) => setForm({ ...form, base_amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deductions (₹)</label>
                                    <input type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
                                </div>
                            </div>
                            {form.base_amount && (
                                <p className="text-sm text-purple-700 font-medium bg-purple-50 px-3 py-2 rounded-lg">
                                    Net Salary: {formatINR(Number(form.base_amount) - Number(form.deductions))}
                                </p>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">Cancel</button>
                            <button onClick={submitSalary} disabled={submitting} className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                                {submitting ? 'Creating...' : 'Create Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
