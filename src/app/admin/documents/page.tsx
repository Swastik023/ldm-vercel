'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaFileAlt, FaPlus, FaTimes, FaSave, FaTrash, FaEdit,
    FaCheckCircle, FaExclamationCircle, FaTimesCircle, FaClock,
    FaFilter, FaDownload, FaComment, FaEye, FaUsers,
    FaCheck, FaBan, FaSearch, FaArrowDown, FaGripVertical
} from 'react-icons/fa';

interface CustomField {
    field_id: string;
    label: string;
    field_type: string;
    is_required: boolean;
    placeholder?: string;
    options?: string[];
    max_length?: number;
    allowed_file_types?: string[];
    max_file_size_mb?: number;
    order: number;
}

interface Requirement {
    _id: string;
    title: string;
    description?: string;
    category: string;
    required_file_types: string[];
    max_file_size_mb: number;
    is_mandatory: boolean;
    due_date?: string;
    scope: { type: string; program?: any; batch?: any; students?: any[] };
    subject?: any;
    created_by?: any;
    is_active: boolean;
    custom_fields: CustomField[];
    requires_file_upload: boolean;
    createdAt: string;
}

interface Submission {
    _id: string;
    requirement: { _id: string; title: string; category: string; due_date?: string; custom_fields?: CustomField[] };
    student: { _id: string; fullName: string; email: string; username: string };
    file_url?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    form_responses?: Record<string, unknown>;
    additional_files?: any[];
    status: string;
    review?: { reviewed_by?: any; reviewed_at?: string; comment?: string };
    submitted_at: string;
    submission_history: any[];
}

const categoryLabels: Record<string, string> = {
    personal_document: '📄 Personal Document',
    academic: '🎓 Academic',
    assignment: '📝 Assignment',
    certificate: '📜 Certificate'
};

const categoryColors: Record<string, string> = {
    personal_document: 'bg-blue-100 text-blue-700',
    academic: 'bg-purple-100 text-purple-700',
    assignment: 'bg-amber-100 text-amber-700',
    certificate: 'bg-emerald-100 text-emerald-700'
};

const statusBadge: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-700', icon: <FaClock className="w-3 h-3" />, label: 'Pending' },
    approved: { color: 'bg-green-100 text-green-700', icon: <FaCheckCircle className="w-3 h-3" />, label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-700', icon: <FaTimesCircle className="w-3 h-3" />, label: 'Rejected' },
    resubmitted: { color: 'bg-indigo-100 text-indigo-700', icon: <FaFileAlt className="w-3 h-3" />, label: 'Resubmitted' }
};

function formatFileSize(bytes: number) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function generateId() {
    return 'field_' + Math.random().toString(36).substring(2, 11);
}

const fieldTypeLabels: Record<string, string> = {
    text: '📝 Text', textarea: '📄 Long Text', number: '🔢 Number',
    date: '📅 Date', dropdown: '📋 Dropdown', checkbox: '☑️ Checkbox', file: '📎 File'
};

export default function DocumentsAdmin() {
    const [activeTab, setActiveTab] = useState<'requirements' | 'submissions'>('requirements');
    const [requirements, setRequirements] = useState<Requirement[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null);
    const [reviewComment, setReviewComment] = useState('');
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
    const [downloadingBulk, setDownloadingBulk] = useState<string | null>(null);

    // Programs and Batches for scope dropdown
    const [programs, setPrograms] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);

    // Form state
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: 'personal_document',
        required_file_types: ['pdf', 'jpg', 'png'],
        max_file_size_mb: 5,
        is_mandatory: true,
        due_date: '',
        scopeType: 'all',
        scopeProgram: '',
        scopeBatch: '',
        scopeStudents: [] as string[],
        requires_file_upload: true,
        custom_fields: [] as CustomField[]
    });

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadRequirements = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/documents/requirements');
            const data = await res.json();
            if (data.success) setRequirements(data.requirements);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadSubmissions = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (statusFilter !== 'all') params.append('status', statusFilter);
            const res = await fetch(`/api/admin/documents/submissions?${params}`);
            const data = await res.json();
            if (data.success) {
                setSubmissions(data.submissions);
                setPagination(data.pagination);
            }
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    const loadOptions = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/academic-options');
            const data = await res.json();
            if (data.success) {
                setPrograms(data.programs || []);
                setBatches(data.batches || []);
            }
            const usersRes = await fetch('/api/admin/users?role=student');
            const usersData = await usersRes.json();
            if (usersData.success) setStudents(usersData.users || []);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        if (activeTab === 'requirements') loadRequirements();
        else loadSubmissions();
    }, [activeTab, loadRequirements, loadSubmissions]);

    useEffect(() => { loadOptions(); }, [loadOptions]);

    const resetForm = () => {
        setForm({
            title: '', description: '', category: 'personal_document',
            required_file_types: ['pdf', 'jpg', 'png'], max_file_size_mb: 5,
            is_mandatory: true, due_date: '', scopeType: 'all',
            scopeProgram: '', scopeBatch: '', scopeStudents: [],
            requires_file_upload: true, custom_fields: []
        });
        setShowCreateForm(false);
        setEditingId(null);
    };

    // Form builder helpers
    const addField = (type: string) => {
        const newField: CustomField = {
            field_id: generateId(), label: '', field_type: type,
            is_required: false, placeholder: '',
            options: type === 'dropdown' ? [''] : undefined,
            order: form.custom_fields.length
        };
        setForm(p => ({ ...p, custom_fields: [...p.custom_fields, newField] }));
    };
    const updateField = (idx: number, updates: Partial<CustomField>) => {
        setForm(p => ({ ...p, custom_fields: p.custom_fields.map((f, i) => i === idx ? { ...f, ...updates } : f) }));
    };
    const removeField = (idx: number) => {
        setForm(p => ({ ...p, custom_fields: p.custom_fields.filter((_, i) => i !== idx) }));
    };
    const addOption = (fieldIdx: number) => {
        setForm(p => ({ ...p, custom_fields: p.custom_fields.map((f, i) => i === fieldIdx ? { ...f, options: [...(f.options || []), ''] } : f) }));
    };
    const updateOption = (fieldIdx: number, optIdx: number, value: string) => {
        setForm(p => ({ ...p, custom_fields: p.custom_fields.map((f, i) => i === fieldIdx ? { ...f, options: f.options?.map((o, j) => j === optIdx ? value : o) } : f) }));
    };
    const removeOption = (fieldIdx: number, optIdx: number) => {
        setForm(p => ({ ...p, custom_fields: p.custom_fields.map((f, i) => i === fieldIdx ? { ...f, options: f.options?.filter((_, j) => j !== optIdx) } : f) }));
    };

    const handleSaveRequirement = async () => {
        if (!form.title.trim()) { showToast('Title is required', 'error'); return; }
        // Validate custom fields
        for (const f of form.custom_fields) {
            if (!f.label.trim()) { showToast('All custom fields must have labels', 'error'); return; }
        }
        setSaving(true);
        try {
            const body = {
                title: form.title,
                description: form.description,
                category: form.category,
                required_file_types: form.requires_file_upload ? form.required_file_types : [],
                max_file_size_mb: form.max_file_size_mb,
                is_mandatory: form.is_mandatory,
                due_date: form.due_date || undefined,
                scope: {
                    type: form.scopeType,
                    program: form.scopeType === 'program' ? form.scopeProgram : undefined,
                    batch: form.scopeType === 'batch' ? form.scopeBatch : undefined,
                    students: form.scopeType === 'student' ? form.scopeStudents : undefined
                },
                requires_file_upload: form.requires_file_upload,
                custom_fields: form.custom_fields.map((f, i) => ({ ...f, order: i }))
            };

            const url = editingId
                ? `/api/admin/documents/requirements/${editingId}`
                : '/api/admin/documents/requirements';

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                showToast(editingId ? 'Requirement updated!' : 'Requirement created!');
                resetForm();
                loadRequirements();
            } else {
                showToast(data.message, 'error');
            }
        } catch {
            showToast('Network error', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRequirement = async (id: string) => {
        if (!confirm('Deactivate this requirement? Students will no longer see it.')) return;
        const res = await fetch(`/api/admin/documents/requirements/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) { showToast('Requirement deactivated'); loadRequirements(); }
        else showToast(data.message, 'error');
    };

    const handleEditRequirement = (req: Requirement) => {
        setEditingId(req._id);
        setForm({
            title: req.title,
            description: req.description || '',
            category: req.category,
            required_file_types: req.required_file_types,
            max_file_size_mb: req.max_file_size_mb,
            is_mandatory: req.is_mandatory,
            due_date: req.due_date ? new Date(req.due_date).toISOString().slice(0, 16) : '',
            scopeType: req.scope.type,
            scopeProgram: req.scope.program?._id || '',
            scopeBatch: req.scope.batch?._id || '',
            scopeStudents: req.scope.students?.map((s: any) => s._id) || [],
            requires_file_upload: req.requires_file_upload ?? true,
            custom_fields: req.custom_fields || []
        });
        setShowCreateForm(true);
    };

    const handleReview = async (action: 'approve' | 'reject') => {
        if (!reviewingSubmission) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/documents/submissions/${reviewingSubmission._id}/review`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, comment: reviewComment })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Submission ${action}d!`);
                setReviewingSubmission(null);
                setReviewComment('');
                loadSubmissions(pagination.page);
            } else {
                showToast(data.message, 'error');
            }
        } catch {
            showToast('Network error', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDownload = async (submission: Submission) => {
        try {
            const res = await fetch(`/api/admin/documents/submissions/${submission._id}/download`);
            const data = await res.json();
            if (data.success) {
                window.open(data.download.url, '_blank');
            }
        } catch {
            showToast('Download failed', 'error');
        }
    };

    const handleBulkDownload = async (reqId: string) => {
        setDownloadingBulk(reqId);
        try {
            const res = await fetch('/api/admin/documents/submissions/bulk-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requirementId: reqId })
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `submissions_${reqId}.zip`;
                a.click();
                URL.revokeObjectURL(url);
                showToast('Download started!');
            } else {
                const data = await res.json();
                showToast(data.message || 'Bulk download failed', 'error');
            }
        } catch { showToast('Network error', 'error'); }
        finally { setDownloadingBulk(null); }
    };

    const toggleFileType = (type: string) => {
        setForm(prev => ({
            ...prev,
            required_file_types: prev.required_file_types.includes(type)
                ? prev.required_file_types.filter(t => t !== type)
                : [...prev.required_file_types, type]
        }));
    };

    const filteredRequirements = requirements.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const scopeLabel = (scope: any) => {
        switch (scope.type) {
            case 'all': return 'All Students';
            case 'program': return scope.program?.name || 'Program';
            case 'batch': return scope.batch?.name || 'Batch';
            case 'student': return `${scope.students?.length || 0} student(s)`;
            default: return scope.type;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
                    >
                        {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FaFileAlt className="text-violet-600" /> Document Management
                </h1>
                <p className="text-sm text-gray-500 mt-1">Create document requirements and review student submissions</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('requirements')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'requirements' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    📋 Requirements
                </button>
                <button
                    onClick={() => setActiveTab('submissions')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'submissions' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    📤 Submissions
                </button>
            </div>

            {/* ==================== REQUIREMENTS TAB ==================== */}
            {activeTab === 'requirements' && (
                <div>
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                            <input
                                type="text" placeholder="Search requirements…"
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 w-full sm:w-72"
                            />
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowCreateForm(true); }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-blue-700 transition-all"
                        >
                            <FaPlus className="w-3.5 h-3.5" /> New Requirement
                        </button>
                    </div>

                    {/* Create / Edit Form */}
                    <AnimatePresence>
                        {showCreateForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="bg-white border border-violet-200 rounded-2xl shadow-lg mb-6 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="font-bold text-gray-900">
                                            {editingId ? '✏️ Edit Requirement' : '➕ Create New Requirement'}
                                        </h3>
                                        <button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-700">
                                            <FaTimes />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Title */}
                                        <div className="sm:col-span-2">
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                                Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text" value={form.title}
                                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                placeholder="e.g. Aadhaar Card, Assignment 3"
                                            />
                                        </div>

                                        {/* Category */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Category</label>
                                            <select
                                                value={form.category}
                                                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                                            >
                                                <option value="personal_document">📄 Personal Document</option>
                                                <option value="academic">🎓 Academic</option>
                                                <option value="assignment">📝 Assignment</option>
                                                <option value="certificate">📜 Certificate</option>
                                            </select>
                                        </div>

                                        {/* Description */}
                                        <div className="sm:col-span-2 lg:col-span-3">
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Description / Instructions</label>
                                            <textarea
                                                value={form.description}
                                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                rows={2} placeholder="Instructions for students…"
                                            />
                                        </div>

                                        {/* Scope */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                                Assign To <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={form.scopeType}
                                                onChange={e => setForm(p => ({ ...p, scopeType: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                                            >
                                                <option value="all">🌐 All Students</option>
                                                <option value="program">🎓 By Program</option>
                                                <option value="batch">👥 By Batch</option>
                                                <option value="student">👤 Specific Students</option>
                                            </select>
                                        </div>

                                        {form.scopeType === 'program' && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Program</label>
                                                <select
                                                    value={form.scopeProgram}
                                                    onChange={e => setForm(p => ({ ...p, scopeProgram: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                                                >
                                                    <option value="">Select program…</option>
                                                    {programs.map((p: any) => (
                                                        <option key={p._id} value={p._id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {form.scopeType === 'batch' && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Batch</label>
                                                <select
                                                    value={form.scopeBatch}
                                                    onChange={e => setForm(p => ({ ...p, scopeBatch: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                                                >
                                                    <option value="">Select batch…</option>
                                                    {batches.map((b: any) => (
                                                        <option key={b._id} value={b._id}>{b.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {form.scopeType === 'student' && (
                                            <div className="sm:col-span-2">
                                                <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                                    Students ({form.scopeStudents.length} selected)
                                                </label>
                                                <select
                                                    multiple size={4}
                                                    value={form.scopeStudents}
                                                    onChange={e => setForm(p => ({
                                                        ...p,
                                                        scopeStudents: Array.from(e.target.selectedOptions, o => o.value)
                                                    }))}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                >
                                                    {students.map((s: any) => (
                                                        <option key={s._id} value={s._id}>{s.fullName} ({s.email})</option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-gray-400 mt-1">Hold Ctrl/Cmd to select multiple</p>
                                            </div>
                                        )}

                                        {/* File Types */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Allowed File Types</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['pdf', 'jpg', 'png', 'docx', 'xlsx'].map(type => (
                                                    <button
                                                        key={type} type="button"
                                                        onClick={() => toggleFileType(type)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${form.required_file_types.includes(type)
                                                            ? 'bg-violet-100 text-violet-700 border border-violet-200'
                                                            : 'bg-gray-50 text-gray-400 border border-gray-200'
                                                            }`}
                                                    >
                                                        .{type}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Max Size */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Max File Size (MB)</label>
                                            <input
                                                type="number" min={1} max={25} value={form.max_file_size_mb}
                                                onChange={e => setForm(p => ({ ...p, max_file_size_mb: Number(e.target.value) }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                            />
                                        </div>

                                        {/* Due Date */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Due Date (optional)</label>
                                            <input
                                                type="datetime-local" value={form.due_date}
                                                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                            />
                                        </div>

                                        {/* Mandatory Toggle */}
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs font-semibold text-gray-600">Mandatory?</label>
                                            <button
                                                type="button"
                                                onClick={() => setForm(p => ({ ...p, is_mandatory: !p.is_mandatory }))}
                                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${form.is_mandatory
                                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                                    : 'bg-gray-50 text-gray-500 border border-gray-200'
                                                    }`}
                                            >
                                                {form.is_mandatory ? '✅ Yes' : '❌ No'}
                                            </button>
                                        </div>
                                        {/* Requires File Upload */}
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs font-semibold text-gray-600">Require File Upload?</label>
                                            <button type="button"
                                                onClick={() => setForm(p => ({ ...p, requires_file_upload: !p.requires_file_upload }))}
                                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${form.requires_file_upload ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
                                            >
                                                {form.requires_file_upload ? '✅ Yes' : '❌ No (form only)'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Form Builder */}
                                    <div className="mt-6 border-t border-gray-100 pt-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-gray-900 text-sm">🛠️ Custom Form Fields <span className="text-[10px] font-normal text-gray-400">(Add fields students must fill)</span></h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {Object.entries(fieldTypeLabels).map(([type, label]) => (
                                                <button key={type} type="button" onClick={() => addField(type)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-all"
                                                >+ {label}</button>
                                            ))}
                                        </div>
                                        <div className="space-y-3">
                                            {form.custom_fields.map((field, idx) => (
                                                <div key={field.field_id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                                    <div className="flex items-start gap-3">
                                                        <FaGripVertical className="w-3 h-3 text-gray-300 mt-3 flex-shrink-0" />
                                                        <div className="flex-1 space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-semibold">{fieldTypeLabels[field.field_type]}</span>
                                                                <input type="text" value={field.label}
                                                                    onChange={e => updateField(idx, { label: e.target.value })}
                                                                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" placeholder="Field label *"
                                                                />
                                                                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                    <input type="checkbox" checked={field.is_required} onChange={e => updateField(idx, { is_required: e.target.checked })} className="rounded border-gray-300 text-violet-600 focus:ring-violet-400" /> Required
                                                                </label>
                                                                <button onClick={() => removeField(idx)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><FaTrash className="w-3 h-3" /></button>
                                                            </div>
                                                            {['text', 'textarea', 'number'].includes(field.field_type) && (
                                                                <input type="text" value={field.placeholder || ''} onChange={e => updateField(idx, { placeholder: e.target.value })}
                                                                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-400" placeholder="Placeholder text"
                                                                />
                                                            )}
                                                            {field.field_type === 'dropdown' && (
                                                                <div className="space-y-1.5">
                                                                    <p className="text-xs text-gray-400 font-semibold">Options:</p>
                                                                    {field.options?.map((opt, optIdx) => (
                                                                        <div key={optIdx} className="flex items-center gap-2">
                                                                            <input type="text" value={opt} onChange={e => updateOption(idx, optIdx, e.target.value)}
                                                                                className="flex-1 px-3 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-400" placeholder={`Option ${optIdx + 1}`}
                                                                            />
                                                                            <button onClick={() => removeOption(idx, optIdx)} className="text-gray-400 hover:text-red-500"><FaTimes className="w-3 h-3" /></button>
                                                                        </div>
                                                                    ))}
                                                                    <button onClick={() => addOption(idx)} className="text-xs text-violet-600 hover:text-violet-700 font-semibold">+ Add option</button>
                                                                </div>
                                                            )}
                                                            {field.field_type === 'file' && (
                                                                <div className="flex gap-3">
                                                                    <input type="text" value={field.allowed_file_types?.join(', ') || ''}
                                                                        onChange={e => updateField(idx, { allowed_file_types: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                                                        className="flex-1 px-3 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-400" placeholder="Allowed types (e.g. pdf, jpg)"
                                                                    />
                                                                    <input type="number" value={field.max_file_size_mb || ''}
                                                                        onChange={e => updateField(idx, { max_file_size_mb: Number(e.target.value) })}
                                                                        className="w-24 px-3 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-violet-400" placeholder="Max MB"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {form.custom_fields.length === 0 && (
                                            <p className="text-center text-xs text-gray-400 py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">No custom fields. Students will only upload a file.</p>
                                        )}
                                    </div>

                                    {/* Save / Cancel */}
                                    <div className="flex items-center gap-3 mt-6">
                                        <button
                                            onClick={handleSaveRequirement} disabled={saving}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-blue-700 transition-all disabled:opacity-70"
                                        >
                                            <FaSave /> {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
                                        </button>
                                        <button onClick={resetForm} className="px-5 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Requirements List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
                        </div>
                    ) : filteredRequirements.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <FaFileAlt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No requirements found</p>
                            <p className="text-sm mt-1">Create your first document requirement above</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredRequirements.map(req => (
                                <motion.div
                                    key={req._id} layout
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all overflow-hidden"
                                >
                                    <div className="flex items-center gap-4 p-4 flex-wrap">
                                        <div className="flex-1 min-w-[200px]">
                                            <p className="font-semibold text-gray-900 text-sm">{req.title}</p>
                                            {req.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{req.description}</p>}
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${categoryColors[req.category]}`}>
                                            {categoryLabels[req.category]}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <FaUsers className="w-3 h-3" /> {scopeLabel(req.scope)}
                                        </span>
                                        {req.due_date && (
                                            <span className={`flex items-center gap-1 text-xs ${new Date(req.due_date) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                                                <FaClock className="w-3 h-3" />
                                                {new Date(req.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        )}
                                        {req.custom_fields?.length > 0 && (
                                            <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded font-semibold">
                                                {req.custom_fields.length} custom fields
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            {req.required_file_types.map(t => (
                                                <span key={t} className="bg-gray-100 px-1.5 py-0.5 rounded">.{t}</span>
                                            ))}
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${req.is_mandatory ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {req.is_mandatory ? 'Required' : 'Optional'}
                                        </span>
                                        <div className="flex items-center gap-1 ml-auto">
                                            <button onClick={() => handleBulkDownload(req._id)}
                                                disabled={downloadingBulk === req._id}
                                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50" title="Bulk download"
                                            ><FaArrowDown className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleEditRequirement(req)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                            >
                                                <FaEdit className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDeleteRequirement(req._id)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <FaTrash className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ==================== SUBMISSIONS TAB ==================== */}
            {activeTab === 'submissions' && (
                <div>
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <FaFilter className="w-3.5 h-3.5" /> Status:
                        </div>
                        {['all', 'pending', 'resubmitted', 'approved', 'rejected'].map(s => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s
                                    ? 'bg-violet-100 text-violet-700 border border-violet-200'
                                    : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {s === 'all' ? 'All' : statusBadge[s]?.label || s}
                            </button>
                        ))}
                        <span className="ml-auto text-xs text-gray-400">{pagination.total} total submissions</span>
                    </div>

                    {/* Submissions Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <FaFileAlt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No submissions yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {submissions.map(sub => (
                                <motion.div
                                    key={sub._id} layout
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all"
                                >
                                    <div className="flex items-center gap-4 p-4 flex-wrap">
                                        <div className="flex-1 min-w-[180px]">
                                            <p className="font-semibold text-gray-900 text-sm">{sub.student?.fullName}</p>
                                            <p className="text-xs text-gray-400">{sub.student?.email}</p>
                                        </div>
                                        <div className="min-w-[140px]">
                                            <p className="text-sm text-gray-700">{sub.requirement?.title}</p>
                                            {sub.file_name && <p className="text-xs text-gray-400">{sub.file_name} • {formatFileSize(sub.file_size || 0)}</p>}
                                            {sub.form_responses && Object.keys(sub.form_responses).length > 0 && (
                                                <p className="text-xs text-violet-600 font-medium">{Object.keys(sub.form_responses).length} form fields filled</p>
                                            )}
                                        </div>
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusBadge[sub.status]?.color}`}>
                                            {statusBadge[sub.status]?.icon}
                                            {statusBadge[sub.status]?.label}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(sub.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </span>
                                        <div className="flex items-center gap-1 ml-auto">
                                            {sub.file_url && (
                                                <button onClick={() => handleDownload(sub)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Download"
                                                >
                                                    <FaDownload className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {(sub.status === 'pending' || sub.status === 'resubmitted') && (
                                                <button onClick={() => { setReviewingSubmission(sub); setReviewComment(''); }}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Review"
                                                >
                                                    <FaEye className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center gap-2 pt-4">
                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => loadSubmissions(p)}
                                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${p === pagination.page
                                                ? 'bg-violet-600 text-white'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ==================== REVIEW MODAL ==================== */}
            <AnimatePresence>
                {reviewingSubmission && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                        onClick={() => setReviewingSubmission(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="font-bold text-gray-900 text-lg mb-4">Review Submission</h3>

                            <div className="space-y-3 mb-5">
                                <div className="flex justify-between">
                                    <span className="text-xs text-gray-400">Student</span>
                                    <span className="text-sm font-medium text-gray-900">{reviewingSubmission.student?.fullName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-gray-400">Requirement</span>
                                    <span className="text-sm font-medium text-gray-900">{reviewingSubmission.requirement?.title}</span>
                                </div>
                                {reviewingSubmission.file_name && (
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-400">File</span>
                                        <button onClick={() => handleDownload(reviewingSubmission)} className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
                                            <FaDownload className="w-3 h-3" /> {reviewingSubmission.file_name}
                                        </button>
                                    </div>
                                )}
                                {reviewingSubmission.file_size && (
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-400">Size</span>
                                        <span className="text-sm text-gray-700">{formatFileSize(reviewingSubmission.file_size)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-xs text-gray-400">Submitted On</span>
                                    <span className="text-sm text-gray-700">{new Date(reviewingSubmission.submitted_at).toLocaleString('en-IN')}</span>
                                </div>
                                {reviewingSubmission.form_responses && Object.keys(reviewingSubmission.form_responses).length > 0 && (
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Form Responses</p>
                                        {reviewingSubmission.requirement?.custom_fields?.map(field => {
                                            const value = reviewingSubmission.form_responses?.[field.field_id];
                                            if (value === undefined) return null;
                                            return (
                                                <div key={field.field_id} className="flex justify-between">
                                                    <span className="text-xs text-gray-500">{field.label}</span>
                                                    <span className="text-sm text-gray-900 font-medium">
                                                        {typeof value === 'boolean' ? (value ? '✅ Yes' : '❌ No') : String(value)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {reviewingSubmission.submission_history.length > 1 && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-2 text-xs text-amber-700">
                                        ⚠️ This is submission attempt #{reviewingSubmission.submission_history.length}
                                    </div>
                                )}
                            </div>

                            {/* Comment */}
                            <div className="mb-5">
                                <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1">
                                    <FaComment className="w-3 h-3" /> Comment (optional)
                                </label>
                                <textarea
                                    value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                    rows={3} placeholder="Add a note for the student…"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleReview('approve')} disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all disabled:opacity-70"
                                >
                                    <FaCheck /> {saving ? 'Processing…' : 'Approve'}
                                </button>
                                <button
                                    onClick={() => handleReview('reject')} disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-70"
                                >
                                    <FaBan /> {saving ? 'Processing…' : 'Reject'}
                                </button>
                            </div>

                            <button
                                onClick={() => setReviewingSubmission(null)}
                                className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
