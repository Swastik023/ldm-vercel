'use client';

import { useEffect, useState } from 'react';

interface Payment { amount: number; date: string; method: string; note?: string; }
interface FeeRecord {
    course: string;
    baseCoursePrice: number;
    discountPercent: number;
    discountAmount: number;
    finalFees: number;
    amountPaid: number;
    remainingAmount: number;
    globalOfferApplied?: string;
    payments: Payment[];
}

const INR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function StudentFeesPage() {
    const [record, setRecord] = useState<FeeRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetch('/api/student/fees')
            .then(r => r.json())
            .then(d => { if (d.success) setRecord(d.record); if (!d.record) setMsg(d.message || 'No fee record found.'); setLoading(false); })
            .catch(() => { setMsg('Failed to load. Please try again.'); setLoading(false); });
    }, []);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
    if (!record) return (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-gray-600 font-medium">{msg}</p>
        </div>
    );

    const paidPercent = Math.min(100, Math.round((record.amountPaid / record.finalFees) * 100));
    const status = record.remainingAmount === 0 ? 'Fully Paid' : record.amountPaid === 0 ? 'Unpaid' : 'Partial';
    const statusCls = status === 'Fully Paid' ? 'bg-green-100 text-green-700' : status === 'Unpaid' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700';

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">My Fee Details</h1>
                <p className="text-gray-500 text-sm mt-1">Your fee structure and payment history.</p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                <div className="flex items-start justify-between mb-4">
                    <div><p className="text-white/70 text-sm">Course</p><p className="font-bold text-lg leading-snug mt-0.5">{record.course}</p></div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCls}`}>{status}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-white/60 text-xs">Base Price</p><p className="font-bold">{INR(record.baseCoursePrice)}</p></div>
                    <div><p className="text-white/60 text-xs">Discount</p><p className="font-bold text-yellow-300">{record.discountPercent > 0 ? `${record.discountPercent}%` : '—'}</p></div>
                    <div><p className="text-white/60 text-xs">Final Fees</p><p className="font-bold text-green-300">{INR(record.finalFees)}</p></div>
                </div>
                {record.globalOfferApplied && <div className="mt-3 px-3 py-1.5 bg-white/10 rounded-lg text-xs text-white/80">🎉 Offer: {record.globalOfferApplied}</div>}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex justify-between text-sm mb-2"><span className="text-gray-600">Amount Paid</span><span className="font-bold text-green-600">{INR(record.amountPaid)}</span></div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ width: `${paidPercent}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500"><span>{paidPercent}% paid</span><span className="text-red-500 font-semibold">Due: {INR(record.remainingAmount)}</span></div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-900 mb-4">Payment History</h2>
                {record.payments.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">No payments recorded yet.</p> : (
                    <div className="space-y-3">
                        {record.payments.map((p, i) => (
                            <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">{INR(p.amount)}</p>
                                    <p className="text-xs text-gray-500">{p.method} · {new Date(p.date).toLocaleDateString('en-IN')}</p>
                                    {p.note && <p className="text-xs text-gray-400 italic">{p.note}</p>}
                                </div>
                                <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-semibold">{p.method}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
