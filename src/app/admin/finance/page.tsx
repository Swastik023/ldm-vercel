'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Wallet, TrendingUp, TrendingDown, AlertCircle, Clock } from 'lucide-react';

interface DashboardStats {
    totalRevenue: number;
    totalExpenses: number;
    totalSalaryPaid: number;
    totalSpend: number;
    netBalance: number;
    totalPendingFees: number;
    totalSalaryPending: number;
}

interface PendingPayment {
    _id: string;
    student: { fullName: string; username: string };
    fee_structure: {
        description: string;
        semester: number;
        total_amount: number;
        program: { name: string };
    } | null;
    amount_paid: number;
    status: string;
}

function formatINR(amount: number) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

export default function FinanceDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [pending, setPending] = useState<PendingPayment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    async function fetchDashboard() {
        try {
            setLoading(true);
            const res = await axios.get('/api/admin/finance/dashboard');
            setStats(res.data.stats);
            setPending(res.data.pendingTop5);
        } catch {
            toast.error('Failed to load finance data');
        } finally {
            setLoading(false);
        }
    }

    const statCards = stats ? [
        {
            title: 'Total Revenue',
            value: formatINR(stats.totalRevenue),
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50',
            border: 'border-green-200',
        },
        {
            title: 'Total Expenditure',
            value: formatINR(stats.totalSpend),
            icon: TrendingDown,
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
        },
        {
            title: 'Net Balance',
            value: formatINR(stats.netBalance),
            icon: Wallet,
            color: stats.netBalance >= 0 ? 'text-blue-600' : 'text-red-600',
            bg: stats.netBalance >= 0 ? 'bg-blue-50' : 'bg-red-50',
            border: stats.netBalance >= 0 ? 'border-blue-200' : 'border-red-200',
        },
        {
            title: 'Pending Fees',
            value: formatINR(stats.totalPendingFees),
            icon: AlertCircle,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            border: 'border-orange-200',
        },
        {
            title: 'Pending Salaries',
            value: formatINR(stats.totalSalaryPending),
            icon: Clock,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            border: 'border-purple-200',
        },
    ] : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
                <p className="text-gray-500 mt-1">Overview of college revenue, expenses, and pending obligations.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {statCards.map((card) => (
                    <div
                        key={card.title}
                        className={`bg-white rounded-xl border ${card.border} shadow-sm p-5 flex flex-col gap-3`}
                    >
                        <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                            <card.icon className={`h-5 w-5 ${card.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pending Fees Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Pending Fee Payments (Top 5)</h2>
                    <p className="text-sm text-gray-500 mt-1">Students with outstanding fee balance</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-gray-600 font-medium">Student</th>
                                <th className="text-left px-6 py-3 text-gray-600 font-medium">Program / Semester</th>
                                <th className="text-right px-6 py-3 text-gray-600 font-medium">Total Fee</th>
                                <th className="text-right px-6 py-3 text-gray-600 font-medium">Paid</th>
                                <th className="text-right px-6 py-3 text-gray-600 font-medium">Remaining</th>
                                <th className="text-center px-6 py-3 text-gray-600 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pending.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">
                                        No pending fees 🎉
                                    </td>
                                </tr>
                            ) : (
                                pending.map((p) => {
                                    const total = p.fee_structure?.total_amount ?? 0;
                                    const remaining = total - p.amount_paid;
                                    return (
                                        <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {p.student?.fullName}
                                                <div className="text-xs text-gray-400">@{p.student?.username}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {p.fee_structure?.program?.name}
                                                <div className="text-xs text-gray-400">Semester {p.fee_structure?.semester}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right text-gray-700">{formatINR(total)}</td>
                                            <td className="px-6 py-4 text-right text-green-600">{formatINR(p.amount_paid)}</td>
                                            <td className="px-6 py-4 text-right text-red-600 font-semibold">{formatINR(remaining)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${p.status === 'partial'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { href: '/admin/finance/fee-structures', label: 'Fee Structures', color: 'bg-blue-600' },
                    { href: '/admin/finance/payments', label: 'Payments', color: 'bg-green-600' },
                    { href: '/admin/finance/expenses', label: 'Expenses', color: 'bg-orange-600' },
                    { href: '/admin/finance/salary', label: 'Salary', color: 'bg-purple-600' },
                ].map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        className={`${link.color} text-white text-center py-3 px-4 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity`}
                    >
                        {link.label}
                    </a>
                ))}
            </div>
        </div>
    );
}
