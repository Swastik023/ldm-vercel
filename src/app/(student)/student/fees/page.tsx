'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AlertCircle } from 'lucide-react';

interface FeeRecord {
    _id: string;
    fee_structure: {
        total_amount: number;
        semester: number;
        description: string;
        due_date: string;
        program: { name: string; code: string };
        session: { name: string };
    } | null;
    amount_paid: number;
    remaining: number;
    status: 'unpaid' | 'partial' | 'paid';
    isOverdue: boolean;
    payments: {
        _id: string;
        amount: number;
        paid_on: string;
        mode: string;
        receipt_no: string;
    }[];
}

function formatINR(n: number) { return `₹${n.toLocaleString('en-IN')}`; }

export default function StudentFeesPage() {
    const [records, setRecords] = useState<FeeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        axios.get('/api/student/finance/payments')
            .then((res) => setRecords(res.data.payments ?? []))
            .catch(() => toast.error('Failed to load fee data'))
            .finally(() => setLoading(false));
    }, []);

    const totalDue = records.reduce((s, r) => s + (r.fee_structure?.total_amount ?? 0), 0);
    const totalPaid = records.reduce((s, r) => s + r.amount_paid, 0);
    const totalRemaining = records.reduce((s, r) => s + r.remaining, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">My Fees</h1>
                <p className="text-gray-500 mt-1">View your fee payment status and transaction history.</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Fee', value: formatINR(totalDue), color: 'text-gray-900', bg: 'bg-gray-50' },
                    { label: 'Amount Paid', value: formatINR(totalPaid), color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Balance Due', value: formatINR(totalRemaining), color: totalRemaining > 0 ? 'text-red-600' : 'text-green-600', bg: totalRemaining > 0 ? 'bg-red-50' : 'bg-green-50' },
                ].map((c) => (
                    <div key={c.label} className={`${c.bg} rounded-xl p-5 border border-gray-200`}>
                        <p className="text-sm text-gray-500">{c.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                    </div>
                ))}
            </div>

            {records.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-48 text-gray-400">
                    No fee records assigned yet. Contact the admin.
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-gray-600 font-medium">Course / Semester</th>
                                <th className="text-left px-6 py-3 text-gray-600 font-medium">Session</th>
                                <th className="text-right px-6 py-3 text-gray-600 font-medium">Total</th>
                                <th className="text-right px-6 py-3 text-gray-600 font-medium">Paid</th>
                                <th className="text-right px-6 py-3 text-gray-600 font-medium">Remaining</th>
                                <th className="text-center px-6 py-3 text-gray-600 font-medium">Status</th>
                                <th className="text-right px-6 py-3 text-gray-600 font-medium">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {records.map((r) => (
                                <React.Fragment key={r._id}>
                                    <tr
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                                    >
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-gray-900">{r.fee_structure?.program?.name}</p>
                                            <p className="text-xs text-gray-400">Sem {r.fee_structure?.semester} · {r.fee_structure?.description}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">{r.fee_structure?.session?.name}</td>
                                        <td className="px-6 py-4 text-right text-gray-700">{formatINR(r.fee_structure?.total_amount ?? 0)}</td>
                                        <td className="px-6 py-4 text-right text-green-600">{formatINR(r.amount_paid)}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-red-600">{formatINR(r.remaining)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${r.status === 'paid' ? 'bg-green-100 text-green-700' : r.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                {r.isOverdue && r.status !== 'paid' && <AlertCircle className="h-3 w-3" />}
                                                {r.status}
                                                {r.isOverdue && r.status !== 'paid' && ' · Overdue'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500 text-xs">
                                            {r.fee_structure?.due_date ? new Date(r.fee_structure.due_date).toLocaleDateString('en-IN') : '—'}
                                        </td>
                                    </tr>
                                    {expanded === r._id && r.payments.length > 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 pb-4 bg-blue-50">
                                                <div className="rounded-lg overflow-hidden border border-blue-100 mt-1">
                                                    <table className="w-full text-xs">
                                                        <thead className="bg-blue-100">
                                                            <tr>
                                                                <th className="text-left px-4 py-2 text-blue-700">Date</th>
                                                                <th className="text-left px-4 py-2 text-blue-700">Mode</th>
                                                                <th className="text-left px-4 py-2 text-blue-700">Receipt #</th>
                                                                <th className="text-right px-4 py-2 text-blue-700">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-blue-100 bg-white">
                                                            {r.payments.map((p) => (
                                                                <tr key={p._id}>
                                                                    <td className="px-4 py-2 text-gray-600">{new Date(p.paid_on).toLocaleDateString('en-IN')}</td>
                                                                    <td className="px-4 py-2 text-gray-600 capitalize">{p.mode}</td>
                                                                    <td className="px-4 py-2 text-gray-600">{p.receipt_no}</td>
                                                                    <td className="px-4 py-2 text-right font-medium text-gray-900">{formatINR(p.amount)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
