'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, PlusCircle, X } from 'lucide-react';

interface Student {
    _id: string;
    fullName: string;
    username: string;
    email: string;
}

interface FeeStructure {
    _id: string;
    total_amount: number;
    semester: number;
    description: string;
    due_date: string;
    program: { name: string; code: string };
    session: { name: string };
}

interface PaymentRecord {
    _id: string;
    fee_structure: FeeStructure | null;
    amount_paid: number;
    remaining: number;
    status: 'unpaid' | 'partial' | 'paid';
    payments: {
        _id: string;
        amount: number;
        paid_on: string;
        mode: string;
        receipt_no: string;
        remarks: string;
    }[];
}

function formatINR(n: number) { return `₹${n.toLocaleString('en-IN')}`; }
function statusBadge(status: string) {
    const map: Record<string, string> = {
        paid: 'bg-green-100 text-green-700',
        partial: 'bg-yellow-100 text-yellow-700',
        unpaid: 'bg-red-100 text-red-700',
    };
    return `inline-flex px-2 py-1 rounded-full text-xs font-medium ${map[status] ?? ''}`;
}

export default function PaymentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        fee_structure_id: '',
        amount: '',
        mode: 'cash',
        receipt_no: '',
        paid_on: new Date().toISOString().split('T')[0],
        remarks: '',
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        axios.get('/api/admin/users?role=student').then((res) => {
            setStudents(res.data.users ?? []);
        });
        axios.get('/api/admin/finance/fee-structures').then((res) => {
            setFeeStructures(res.data.structures ?? []);
        });
    }, []);

    async function fetchStudentPayments(student: Student) {
        setSelectedStudent(student);
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/finance/payments/${student._id}`);
            setPayments(res.data.payments ?? []);
        } catch {
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    }

    async function submitPayment() {
        if (!form.fee_structure_id || !form.amount || !form.receipt_no || !form.paid_on) {
            toast.error('Please fill all required fields');
            return;
        }
        if (!selectedStudent) return;
        setSubmitting(true);
        try {
            await axios.post(`/api/admin/finance/payments/${selectedStudent._id}`, {
                ...form,
                amount: Number(form.amount),
            });
            toast.success('Payment recorded!');
            setShowModal(false);
            setForm({ fee_structure_id: '', amount: '', mode: 'cash', receipt_no: '', paid_on: new Date().toISOString().split('T')[0], remarks: '' });
            fetchStudentPayments(selectedStudent);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            toast.error(error?.response?.data?.message ?? 'Failed to record payment');
        } finally {
            setSubmitting(false);
        }
    }

    const filtered = students.filter(
        (s) =>
            s.fullName.toLowerCase().includes(search.toLowerCase()) ||
            s.username.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Fee Payments</h1>
                <p className="text-gray-500 mt-1">Search a student to view or record fee payments.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Student List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Search students..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                        {filtered.map((s) => (
                            <li
                                key={s._id}
                                onClick={() => fetchStudentPayments(s)}
                                className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${selectedStudent?._id === s._id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                            >
                                <p className="font-medium text-gray-900 text-sm">{s.fullName}</p>
                                <p className="text-xs text-gray-400">@{s.username}</p>
                            </li>
                        ))}
                        {filtered.length === 0 && (
                            <li className="px-4 py-8 text-center text-gray-400 text-sm">No students found</li>
                        )}
                    </ul>
                </div>

                {/* Payment Detail */}
                <div className="lg:col-span-2 space-y-4">
                    {!selectedStudent ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center h-64 text-gray-400">
                            Select a student to view payments
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">{selectedStudent.fullName}</h2>
                                    <p className="text-sm text-gray-400">@{selectedStudent.username}</p>
                                </div>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    <PlusCircle className="h-4 w-4" /> Add Payment
                                </button>
                            </div>

                            {loading ? (
                                <div className="bg-white rounded-xl border p-12 flex items-center justify-center">
                                    <div className="animate-spin h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent" />
                                </div>
                            ) : payments.length === 0 ? (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center h-40 text-gray-400">
                                    No fee records found for this student
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-gray-600 font-medium">Course / Sem</th>
                                                <th className="text-right px-4 py-3 text-gray-600 font-medium">Total</th>
                                                <th className="text-right px-4 py-3 text-gray-600 font-medium">Paid</th>
                                                <th className="text-right px-4 py-3 text-gray-600 font-medium">Remaining</th>
                                                <th className="text-center px-4 py-3 text-gray-600 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {payments.map((p) => (
                                                <tr key={p._id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <p className="font-medium text-gray-900">{p.fee_structure?.program?.name}</p>
                                                        <p className="text-xs text-gray-400">Sem {p.fee_structure?.semester} · {p.fee_structure?.description}</p>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-700">{formatINR(p.fee_structure?.total_amount ?? 0)}</td>
                                                    <td className="px-4 py-3 text-right text-green-600">{formatINR(p.amount_paid)}</td>
                                                    <td className="px-4 py-3 text-right text-red-600 font-semibold">{formatINR(p.remaining)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={statusBadge(p.status)}>{p.status}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Add Payment Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Record Payment</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Structure *</label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    value={form.fee_structure_id}
                                    onChange={(e) => setForm({ ...form, fee_structure_id: e.target.value })}
                                >
                                    <option value="">Select fee...</option>
                                    {feeStructures.map((fs) => (
                                        <option key={fs._id} value={fs._id}>
                                            {fs.program?.name} · Sem {fs.semester} · {formatINR(fs.total_amount)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                                    <input type="number" min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                                        <option value="cash">Cash</option>
                                        <option value="online">Online</option>
                                        <option value="cheque">Cheque</option>
                                        <option value="DD">Demand Draft</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt No. *</label>
                                    <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.receipt_no} onChange={(e) => setForm({ ...form, receipt_no: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                    <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.paid_on} onChange={(e) => setForm({ ...form, paid_on: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                            </div>
                        </div>
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button onClick={submitPayment} disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                                {submitting ? 'Recording...' : 'Record Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
