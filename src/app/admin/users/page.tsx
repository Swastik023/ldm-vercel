'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { User, Trash2, Mail, Search, Plus, Eye, EyeOff, X, GraduationCap } from 'lucide-react';

interface UserData {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    role: 'admin' | 'student' | 'teacher' | 'employee';
    status: 'active' | 'inactive' | 'suspended';
    createdAt: string;
    session?: { _id: string; name: string };
    batch?: { _id: string; name: string };
}

interface AcademicOption { _id: string; name: string; session?: { name: string }; program?: { name: string; code: string } }

const emptyForm = { username: '', email: '', password: '', fullName: '', role: 'student', sessionId: '', batchId: '' };

const roleBadge = (role: string) => {
    const m: Record<string, string> = { admin: 'bg-purple-100 text-purple-700', teacher: 'bg-blue-100 text-blue-700', employee: 'bg-cyan-100 text-cyan-700', student: 'bg-green-100 text-green-700' };
    return m[role] || 'bg-gray-100 text-gray-700';
};
const statusBadge = (s: string) => {
    const m: Record<string, string> = { active: 'bg-green-100 text-green-700 border-green-200', inactive: 'bg-gray-100 text-gray-600 border-gray-200', suspended: 'bg-red-100 text-red-600 border-red-200' };
    return m[s] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export default function ManageUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const [sessions, setSessions] = useState<AcademicOption[]>([]);
    const [batches, setBatches] = useState<AcademicOption[]>([]);
    const [academicLoaded, setAcademicLoaded] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (data.success) setUsers(data.users);
            else toast.error(data.message || 'Failed to load users');
        } catch { toast.error('Network error fetching users'); }
        finally { setLoading(false); }
    }, []);

    // Fetch sessions/batches only when form opens and role = student
    const fetchAcademicOptions = useCallback(async () => {
        if (academicLoaded) return;
        try {
            const res = await fetch('/api/admin/academic-options');
            const data = await res.json();
            if (data.success) {
                setSessions(data.sessions || []);
                setBatches(data.batches || []);
                setAcademicLoaded(true);
            }
        } catch { /* silently fail */ }
    }, [academicLoaded]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // When form opens and role is student, load options
    useEffect(() => {
        if (showForm && formData.role === 'student') fetchAcademicOptions();
    }, [showForm, formData.role, fetchAcademicOptions]);

    // Filter batches by selected session
    const filteredBatches = formData.sessionId
        ? batches.filter((b: any) => {
            const bSessionId = typeof b.session === 'object' ? b.session?._id : b.session;
            return bSessionId === formData.sessionId;
        })
        : batches;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('User created successfully!');
                setFormData(emptyForm);
                setShowForm(false);
                fetchUsers();
            } else {
                toast.error(data.message || 'Failed to create user');
            }
        } catch { toast.error('Network error creating user'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { toast.success('User deleted'); setUsers(prev => prev.filter(u => u._id !== id)); }
            else toast.error(data.message || 'Failed to delete');
        } catch { toast.error('Network error deleting user'); }
    };

    const filtered = users.filter(u => {
        const matchSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const roleCounts = { all: users.length, student: 0, teacher: 0, employee: 0, admin: 0 };
    users.forEach(u => { if (u.role in roleCounts) roleCounts[u.role as keyof typeof roleCounts]++; });

    const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none bg-white";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Add and manage students, teachers, and staff.</p>
                </div>
                <button onClick={() => setShowForm(p => !p)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm text-sm font-medium">
                    {showForm ? <X size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'Add User'}
                </button>
            </div>

            {/* Role Tabs */}
            <div className="flex flex-wrap gap-2">
                {(['all', 'student', 'teacher', 'employee', 'admin'] as const).map(role => (
                    <button key={role} onClick={() => setRoleFilter(role)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${roleFilter === role ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                        {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1) + 's'} <span className="opacity-70">({roleCounts[role]})</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Form */}
                {showForm && (
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 sticky top-6">
                            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="p-2 bg-blue-100 text-blue-600 rounded-lg"><User size={16} /></span>
                                Add New User
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-3.5">
                                <div>
                                    <label className={labelClass}>Full Name *</label>
                                    <input className={inputClass} placeholder="John Doe" required value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Username *</label>
                                    <input className={inputClass} placeholder="johndoe" required value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Email *</label>
                                    <input className={inputClass} type="email" placeholder="john@example.com" required value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Password *</label>
                                    <div className="relative">
                                        <input className={inputClass + ' pr-10'} type={showPassword ? 'text' : 'password'}
                                            placeholder="Min. 6 characters" required minLength={6} value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                        <button type="button" onClick={() => setShowPassword(p => !p)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Role *</label>
                                    <select className={inputClass} value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value, sessionId: '', batchId: '' })}>
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="employee">Employee</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                {/* Student-only: Session + Batch */}
                                {formData.role === 'student' && (
                                    <div className="border-t border-dashed border-gray-200 pt-3.5 space-y-3.5">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                            <GraduationCap size={14} /> Enrollment Details
                                        </div>
                                        <div>
                                            <label className={labelClass}>Session</label>
                                            <select className={inputClass} value={formData.sessionId}
                                                onChange={e => setFormData({ ...formData, sessionId: e.target.value, batchId: '' })}>
                                                <option value="">— Select Session —</option>
                                                {sessions.map(s => (
                                                    <option key={s._id} value={s._id}>{s.name}</option>
                                                ))}
                                            </select>
                                            {sessions.length === 0 && (
                                                <p className="text-xs text-amber-600 mt-1">No active sessions found. Create one in Academic Config.</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className={labelClass}>Batch</label>
                                            <select className={inputClass} value={formData.batchId}
                                                onChange={e => setFormData({ ...formData, batchId: e.target.value })}
                                                disabled={!formData.sessionId}>
                                                <option value="">— Select Batch —</option>
                                                {filteredBatches.map((b: any) => (
                                                    <option key={b._id} value={b._id}>
                                                        {b.name}{b.program ? ` (${b.program.code || b.program.name})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {formData.sessionId && filteredBatches.length === 0 && (
                                                <p className="text-xs text-amber-600 mt-1">No batches for this session. Create one in Batches.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button type="submit" disabled={submitting}
                                    className="w-full bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition font-medium text-sm disabled:opacity-60 mt-1">
                                    {submitting ? 'Creating...' : 'Create User'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* User List */}
                <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
                    {/* Search */}
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 mb-4">
                        <Search className="text-gray-400 flex-shrink-0" size={17} />
                        <input type="text" placeholder="Search by name, email, or username..."
                            className="bg-transparent outline-none flex-1 text-gray-700 text-sm"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>}
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400 text-sm">Loading users...</div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Enrollment</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filtered.map(u => (
                                        <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                                                        {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-semibold text-gray-900">{u.fullName}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} />{u.email}</div>
                                                        <div className="text-xs text-gray-400">@{u.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${roleBadge(u.role)}`}>{u.role}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {u.role === 'student' ? (
                                                    <div className="text-xs text-gray-600 space-y-0.5">
                                                        {u.session ? <div className="flex items-center gap-1"><span className="text-gray-400">Session:</span> {u.session.name}</div> : <span className="text-gray-400">—</span>}
                                                        {u.batch && <div className="flex items-center gap-1"><span className="text-gray-400">Batch:</span> {u.batch.name}</div>}
                                                    </div>
                                                ) : <span className="text-xs text-gray-400">—</span>}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusBadge(u.status)}`}>{u.status}</span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                                <button onClick={() => handleDelete(u._id, u.fullName)}
                                                    className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete user">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filtered.length === 0 && (
                                <div className="p-12 text-center text-gray-500 text-sm">
                                    {searchTerm || roleFilter !== 'all' ? 'No users match your search.' : 'No users yet. Add the first one!'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
