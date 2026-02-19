'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, X } from 'lucide-react';

const CATEGORIES = ['utilities', 'maintenance', 'supplies', 'events', 'salary', 'other'];

interface Expense {
    _id: string;
    title: string;
    amount: number;
    category: string;
    paid_on: string;
    paid_to: string;
    remarks: string;
    recorded_by: { fullName: string };
}

function formatINR(n: number) { return `₹${n.toLocaleString('en-IN')}`; }

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filterMonth, setFilterMonth] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [form, setForm] = useState({
        title: '', amount: '', category: 'utilities', paid_on: new Date().toISOString().split('T')[0], paid_to: '', remarks: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { fetchExpenses(); }, [filterMonth, filterCategory]);

    async function fetchExpenses() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterMonth) params.set('month', filterMonth);
            if (filterCategory) params.set('category', filterCategory);
            const res = await axios.get(`/api/admin/finance/expenses?${params}`);
            setExpenses(res.data.expenses ?? []);
            setTotal(res.data.total ?? 0);
        } catch { toast.error('Failed to load expenses'); }
        finally { setLoading(false); }
    }

    async function submitExpense() {
        if (!form.title || !form.amount || !form.paid_to || !form.paid_on) { toast.error('Please fill required fields'); return; }
        setSubmitting(true);
        try {
            await axios.post('/api/admin/finance/expenses', { ...form, amount: Number(form.amount) });
            toast.success('Expense recorded!');
            setShowModal(false);
            setForm({ title: '', amount: '', category: 'utilities', paid_on: new Date().toISOString().split('T')[0], paid_to: '', remarks: '' });
            fetchExpenses();
        } catch { toast.error('Failed to record expense'); }
        finally { setSubmitting(false); }
    }

    async function deleteExpense(id: string) {
        if (!confirm('Delete this expense?')) return;
        try {
            await axios.delete(`/api/admin/finance/expenses/${id}`);
            toast.success('Deleted');
            fetchExpenses();
        } catch { toast.error('Failed to delete'); }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
                    <p className="text-gray-500 mt-1">Track all college operating expenses.</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700">
                    <PlusCircle className="h-4 w-4" /> Add Expense
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <input type="month" className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
                <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="ml-auto text-lg font-semibold text-orange-600">Total: {formatINR(total)}</div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin h-6 w-6 rounded-full border-4 border-orange-500 border-t-transparent" />
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-gray-600 font-medium">Title / Paid To</th>
                                <th className="text-left px-6 py-3 text-gray-600 font-medium">Category</th>
                                <th className="text-left px-6 py-3 text-gray-600 font-medium">Date</th>
                                <th className="text-right px-6 py-3 text-gray-600 font-medium">Amount</th>
                                <th className="text-center px-6 py-3 text-gray-600 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {expenses.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No expenses found</td></tr>
                            ) : expenses.map((e) => (
                                <tr key={e._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{e.title}</p>
                                        <p className="text-xs text-gray-400">To: {e.paid_to} {e.remarks && `· ${e.remarks}`}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs capitalize">{e.category}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{new Date(e.paid_on).toLocaleDateString('en-IN')}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatINR(e.amount)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => deleteExpense(e._id)} className="text-red-400 hover:text-red-600 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Expense Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Add Expense</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                                    <input type="number" min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                    <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.paid_on} onChange={(e) => setForm({ ...form, paid_on: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid To *</label>
                                    <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.paid_to} onChange={(e) => setForm({ ...form, paid_to: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                            <button onClick={submitExpense} disabled={submitting} className="flex-1 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50">
                                {submitting ? 'Saving...' : 'Save Expense'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
