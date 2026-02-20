'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, X, Trash2, Edit2 } from 'lucide-react';

interface Program { _id: string; name: string; code: string; }
interface Session { _id: string; name: string; }
interface FeeStructure {
    _id: string;
    program: Program;
    session: Session;
    semester: number;
    total_amount: number;
    due_date: string;
    description?: string;
    is_active?: boolean;
}

function formatINR(n: number) { return `₹${n.toLocaleString('en-IN')}`; }

export default function FeeStructuresPage() {
    const [structures, setStructures] = useState<FeeStructure[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        program: '',
        session: '',
        semester: '1',
        total_amount: '',
        due_date: '',
        description: '',
    });

    useEffect(() => {
        Promise.all([
            axios.get('/api/admin/finance/fee-structures'),
            axios.get('/api/admin/academic/programs'),
            axios.get('/api/admin/academic/sessions'),
        ]).then(([fsRes, progRes, sessRes]) => {
            setStructures(fsRes.data.structures ?? []);
            setPrograms(progRes.data.programs ?? []);
            setSessions(sessRes.data.sessions ?? []);
        }).catch(() => toast.error('Failed to load data')).finally(() => setLoading(false));
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.program || !form.session || !form.semester || !form.total_amount || !form.due_date) {
            toast.error('Please fill in all required fields');
            return;
        }
        setSubmitting(true);
        try {
            const res = await axios.post('/api/admin/finance/fee-structures', {
                ...form,
                semester: parseInt(form.semester),
                total_amount: parseFloat(form.total_amount),
            });
            if (res.data.success) {
                toast.success('Fee structure created successfully!');
                setStructures(prev => [res.data.structure, ...prev]);
                setShowModal(false);
                setForm({ program: '', session: '', semester: '1', total_amount: '', due_date: '', description: '' });
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message ?? 'Failed to create fee structure');
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Fee Structures</h1>
                    <p className="text-gray-500 mt-1">Define semester-wise fee amounts per program and session.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4" /> New Fee Structure
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-6 py-3 text-gray-600 font-medium">Program</th>
                            <th className="text-left px-6 py-3 text-gray-600 font-medium">Session</th>
                            <th className="text-center px-6 py-3 text-gray-600 font-medium">Semester</th>
                            <th className="text-right px-6 py-3 text-gray-600 font-medium">Amount</th>
                            <th className="text-left px-6 py-3 text-gray-600 font-medium">Due Date</th>
                            <th className="text-left px-6 py-3 text-gray-600 font-medium">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {structures.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-gray-400">
                                    No fee structures created yet. Click &ldquo;New Fee Structure&rdquo; to add one.
                                </td>
                            </tr>
                        ) : structures.map(fs => (
                            <tr key={fs._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-medium text-gray-900">{fs.program?.name}</p>
                                    <p className="text-xs text-gray-400">{fs.program?.code}</p>
                                </td>
                                <td className="px-6 py-4 text-gray-600">{fs.session?.name}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                                        Sem {fs.semester}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatINR(fs.total_amount)}</td>
                                <td className="px-6 py-4 text-gray-600">{new Date(fs.due_date).toLocaleDateString('en-IN')}</td>
                                <td className="px-6 py-4 text-gray-400 text-xs">{fs.description || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">New Fee Structure</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.program} onChange={e => setForm({ ...form, program: e.target.value })} required>
                                        <option value="">Choose program...</option>
                                        {programs.map(p => <option key={p._id} value={p._id}>{p.code} – {p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Session *</label>
                                    <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" value={form.session} onChange={e => setForm({ ...form, session: e.target.value })} required>
                                        <option value="">Choose session...</option>
                                        {sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                                    <input type="number" min="1" max="8" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹) *</label>
                                    <input type="number" min="1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 25000" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
                                <input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Includes tuition + hostel" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                                    {submitting ? 'Creating...' : 'Create Structure'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
