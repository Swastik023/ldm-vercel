'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { User, Trash2, Mail, Search, Plus, Eye, EyeOff, X, GraduationCap, Pencil, Phone, BookOpen, Calendar, ChevronRight } from 'lucide-react';

interface UserData {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    mobileNumber?: string;
    role: 'admin' | 'student' | 'teacher' | 'employee';
    status: 'active' | 'inactive' | 'suspended' | 'pending' | 'under_review' | 'rejected';
    createdAt: string;
    rollNumber?: string;
    semester?: number;
    joiningMonth?: string;
    joiningYear?: number;
    courseEndDate?: string;
    isProfileComplete?: boolean;
    isEmailVerified?: boolean;
    session?: { _id: string; name: string };
    batch?: { _id: string; name: string; program?: { name: string; code: string } };
    programId?: { _id: string; name: string; code: string };
}

interface AcademicOption { _id: string; name: string; intakeMonth?: string; joiningYear?: number; session?: { name: string }; program?: { name: string; code: string } }



const emptyForm = { username: '', email: '', password: '', fullName: '', role: 'student', filterMonth: '', filterYear: '', batchId: '' };

const roleBadge = (role: string) => {
    const m: Record<string, string> = { admin: 'bg-purple-100 text-purple-700', teacher: 'bg-blue-100 text-blue-700', employee: 'bg-cyan-100 text-cyan-700', student: 'bg-green-100 text-green-700' };
    return m[role] || 'bg-gray-100 text-gray-700';
};
const statusBadge = (s: string) => {
    const m: Record<string, string> = {
        active: 'bg-green-100 text-green-700 border-green-200',
        inactive: 'bg-gray-100 text-gray-600 border-gray-200',
        suspended: 'bg-red-100 text-red-600 border-red-200',
        pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        under_review: 'bg-blue-100 text-blue-700 border-blue-200',
        rejected: 'bg-red-100 text-red-700 border-red-200',
    };
    return m[s] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const semesterLabel = (n?: number) => {
    if (!n) return '—';
    const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
    return `${n}${suffix} Sem`;
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
    const [batches, setBatches] = useState<AcademicOption[]>([]);
    const [academicLoaded, setAcademicLoaded] = useState(false);

    // Edit slide-over state
    const [editUser, setEditUser] = useState<UserData | null>(null);
    const [editForm, setEditForm] = useState<Partial<UserData> & { batchId?: string; sessionId?: string }>({});
    const [editSubmitting, setEditSubmitting] = useState(false);

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

    const fetchAcademicOptions = useCallback(async () => {
        if (academicLoaded) return;
        try {
            const res = await fetch('/api/admin/academic-options');
            const data = await res.json();
            if (data.success) {
                setBatches(data.batches || []);
                setAcademicLoaded(true);
            }
        } catch { }
    }, [academicLoaded]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    useEffect(() => {
        if (showForm && formData.role === 'student') fetchAcademicOptions();
    }, [showForm, formData.role, fetchAcademicOptions]);

    useEffect(() => {
        if (editUser) fetchAcademicOptions();
    }, [editUser, fetchAcademicOptions]);

    // Filter batches by intake month and/or joining year
    const filteredBatches = batches.filter((b: any) => {
        if (formData.filterMonth && b.intakeMonth !== formData.filterMonth) return false;
        if (formData.filterYear && b.joiningYear !== Number(formData.filterYear)) return false;
        return true;
    });

    // Derive available years from all batches
    const availableYears = [...new Set(batches.map((b: any) => b.joiningYear))].filter(Boolean).sort((a, b) => (b as number) - (a as number));

    // Open edit drawer and pre-fill form
    const openEdit = (u: UserData) => {
        setEditUser(u);
        setEditForm({
            fullName: u.fullName,
            email: u.email,
            mobileNumber: u.mobileNumber || '',
            rollNumber: u.rollNumber || '',
            semester: u.semester,
            status: u.status,
            role: u.role,
            batchId: (u.batch as any)?._id || (u.batch as any) || '',
            sessionId: (u.session as any)?._id || (u.session as any) || '',
        });
    };

    const handleEditSave = async () => {
        if (!editUser) return;
        setEditSubmitting(true);
        try {
            const payload: Record<string, unknown> = {
                fullName: editForm.fullName,
                email: editForm.email,
                mobileNumber: editForm.mobileNumber,
                rollNumber: editForm.rollNumber,
                semester: editForm.semester ? Number(editForm.semester) : null,
                status: editForm.status,
                role: editForm.role,
                ...(editForm.batchId ? { batch: editForm.batchId } : {}),
                ...(editForm.sessionId ? { session: editForm.sessionId } : {}),
            };
            const res = await fetch(`/api/admin/users?id=${editUser._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('User updated successfully!');
                setEditUser(null);
                fetchUsers();
            } else {
                toast.error(data.message || 'Failed to update');
            }
        } catch { toast.error('Network error'); }
        finally { setEditSubmitting(false); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('User created successfully!');
                setFormData(emptyForm);
                setShowForm(false);
                fetchUsers();
            } else { toast.error(data.message || 'Failed to create user'); }
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
        const matchSearch =
            u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.rollNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
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
                                        onChange={e => setFormData({ ...formData, role: e.target.value, filterMonth: '', filterYear: '', batchId: '' })}>
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="employee">Employee</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                {formData.role === 'student' && (
                                    <div className="border-t border-dashed border-gray-200 pt-3.5 space-y-3.5">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wide">
                                            <GraduationCap size={14} /> Enrollment Details
                                        </div>
                                        {/* Intake Month + Year filters */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className={labelClass}>Intake Month</label>
                                                <select className={inputClass} value={formData.filterMonth}
                                                    onChange={e => setFormData({ ...formData, filterMonth: e.target.value, batchId: '' })}>
                                                    <option value="">All Months</option>
                                                    <option value="January">January</option>
                                                    <option value="July">July</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={labelClass}>Joining Year</label>
                                                <select className={inputClass} value={formData.filterYear}
                                                    onChange={e => setFormData({ ...formData, filterYear: e.target.value, batchId: '' })}>
                                                    <option value="">All Years</option>
                                                    {availableYears.map(y => <option key={y as number} value={y as number}>{y as number}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Batch</label>
                                            <select className={inputClass} value={formData.batchId}
                                                onChange={e => setFormData({ ...formData, batchId: e.target.value })}>
                                                <option value="">— Select Batch —</option>
                                                {filteredBatches.map((b: any) => (
                                                    <option key={b._id} value={b._id}>
                                                        {b.name}{b.program ? ` (${b.program.code || b.program.name})` : ''}
                                                        {b.intakeMonth ? ` · ${b.intakeMonth} ${b.joiningYear}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                            {filteredBatches.length === 0 && (formData.filterMonth || formData.filterYear) && (
                                                <p className="text-xs text-amber-600 mt-1">No batches found for selected filters.</p>
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

                {/* User Table */}
                <div className={showForm ? 'lg:col-span-2' : 'lg:col-span-3'}>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 mb-4">
                        <Search className="text-gray-400 flex-shrink-0" size={17} />
                        <input type="text" placeholder="Search by name, email, username, or roll no…"
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
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                                                        {u.fullName?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{u.fullName}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10} />{u.email}</div>
                                                        {u.mobileNumber && <div className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{u.mobileNumber}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${roleBadge(u.role)}`}>{u.role}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {u.role === 'student' ? (
                                                    <div className="text-xs text-gray-600 space-y-0.5">
                                                        {u.rollNumber && <div className="flex items-center gap-1"><span className="text-gray-400">Roll:</span> <span className="font-mono font-semibold">{u.rollNumber}</span></div>}
                                                        {u.semester && <div className="flex items-center gap-1"><span className="text-gray-400">Sem:</span> {semesterLabel(u.semester)}</div>}
                                                        {u.batch && <div className="flex items-center gap-1"><span className="text-gray-400">Batch:</span> {(u.batch as any).name || u.batch}</div>}
                                                        {u.session && <div className="flex items-center gap-1"><span className="text-gray-400">Session:</span> {(u.session as any).name || u.session}</div>}
                                                        {!u.rollNumber && !u.batch && <span className="text-gray-400">—</span>}
                                                    </div>
                                                ) : <span className="text-xs text-gray-400">—</span>}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusBadge(u.status)}`}>{u.status}</span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(u)}
                                                        className="text-blue-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Edit user">
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button onClick={() => handleDelete(u._id, u.fullName)}
                                                        className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete user">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
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

            {/* ── Edit Slide-Over ───────────────────────────────────────────────── */}
            {editUser && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div className="flex-1 bg-black/40" onClick={() => setEditUser(null)} />
                    {/* Panel */}
                    <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center text-blue-700 font-bold">
                                    {editUser.fullName?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900 text-base">{editUser.fullName}</h2>
                                    <p className="text-xs text-gray-400">@{editUser.username} · {editUser.role}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditUser(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><X size={18} /></button>
                        </div>

                        {/* Fields */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                            {/* Read-only info */}
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-xs text-gray-500 space-y-1.5">
                                <p className="flex justify-between"><span>Registered</span><span className="font-mono">{new Date(editUser.createdAt).toLocaleDateString('en-IN')}</span></p>
                                <p className="flex justify-between"><span>Email Verified</span><span className={editUser.isEmailVerified ? 'text-green-600 font-semibold' : 'text-red-500'}>{editUser.isEmailVerified ? '✓ Yes' : '✗ No'}</span></p>
                                <p className="flex justify-between"><span>Profile Complete</span><span className={editUser.isProfileComplete ? 'text-green-600 font-semibold' : 'text-yellow-600'}>{editUser.isProfileComplete ? '✓ Yes' : 'Incomplete'}</span></p>
                                <p className="flex justify-between"><span>Username</span><span className="font-mono">@{editUser.username}</span></p>
                                {editUser.joiningMonth && <p className="flex justify-between"><span>Joined</span><span>{editUser.joiningMonth} {editUser.joiningYear}</span></p>}
                                {editUser.courseEndDate && <p className="flex justify-between"><span>Course Ends</span><span>{new Date(editUser.courseEndDate).toLocaleDateString('en-IN')}</span></p>}
                            </div>

                            {/* Editable section header */}
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-widest">
                                <Pencil size={11} /> Editable Fields
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className={labelClass}>Full Name</label>
                                    <input className={inputClass} value={editForm.fullName || ''} onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelClass}>Email</label>
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input className={inputClass + ' pl-8'} type="email" value={editForm.email || ''} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Mobile Number</label>
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input className={inputClass + ' pl-8'} maxLength={10} inputMode="tel" value={editForm.mobileNumber || ''} onChange={e => setEditForm(p => ({ ...p, mobileNumber: e.target.value }))} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Status</label>
                                    <select className={inputClass} value={editForm.status || ''} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as any }))}>
                                        {['active', 'inactive', 'suspended', 'pending', 'under_review', 'rejected'].map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Role</label>
                                    <select className={inputClass} value={editForm.role || ''} onChange={e => setEditForm(p => ({ ...p, role: e.target.value as any }))}>
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="employee">Employee</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                {/* Student-specific fields */}
                                {editForm.role === 'student' && (
                                    <>
                                        <div>
                                            <label className={labelClass}><span className="flex items-center gap-1"><BookOpen size={12} /> Roll Number</span></label>
                                            <input className={inputClass + ' font-mono'} value={editForm.rollNumber || ''} onChange={e => setEditForm(p => ({ ...p, rollNumber: e.target.value }))} placeholder="e.g. 01, A-12" />
                                        </div>
                                        <div>
                                            <label className={labelClass}><span className="flex items-center gap-1"><Calendar size={12} /> Semester</span></label>
                                            <select className={inputClass} value={editForm.semester || ''} onChange={e => setEditForm(p => ({ ...p, semester: e.target.value ? Number(e.target.value) : undefined }))}>
                                                <option value="">— Not Set —</option>
                                                {Array.from({ length: 10 }, (_, i) => i + 1).map(s => (
                                                    <option key={s} value={s}>
                                                        {s === 1 ? '1st' : s === 2 ? '2nd' : s === 3 ? '3rd' : `${s}th`} Semester
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Intake — Batch</label>
                                            <select className={inputClass} value={editForm.batchId || ''} onChange={e => setEditForm(p => ({ ...p, batchId: e.target.value }))}>
                                                <option value="">— Select Batch —</option>
                                                {batches.map((b: any) => (
                                                    <option key={b._id} value={b._id}>
                                                        {b.name}{b.program ? ` (${b.program.code})` : ''}
                                                        {b.intakeMonth ? ` · ${b.intakeMonth} ${b.joiningYear}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={handleEditSave} disabled={editSubmitting}
                                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                                {editSubmitting ? 'Saving…' : <><span>Save Changes</span><ChevronRight size={15} /></>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
