'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    FaFileAlt, FaPlus, FaTimes, FaSave, FaTrash, FaEdit,
    FaCheckCircle, FaExclamationCircle, FaTimesCircle, FaClock,
    FaFilter, FaDownload, FaComment, FaEye, FaCheck, FaBan,
    FaSearch, FaArrowDown, FaGripVertical
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
    is_active: boolean;
    custom_fields: CustomField[];
    requires_file_upload: boolean;
    createdAt: string;
}

interface Submission {
    _id: string;
    requirement: { _id: string; title: string; category: string; custom_fields: CustomField[] };
    student: { _id: string; fullName: string; email: string };
    file_url?: string;
    file_name?: string;
    file_size?: number;
    form_responses?: Record<string, unknown>;
    additional_files?: any[];
    status: string;
    review?: { reviewed_by?: any; reviewed_at?: string; comment?: string };
    submitted_at: string;
    submission_history: any[];
}

// assignment is an active class assignment in the academic system
interface TeacherAssignment {
    id: string;
    subject_name: string;
    subject_code: string;
    batch_name?: string;
    section: string;
}

const statusBadge: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: 'bg-yellow-100 text-yellow-700', icon: <FaClock className="w-3 h-3" />, label: 'Pending' },
    approved: { color: 'bg-green-100 text-green-700', icon: <FaCheckCircle className="w-3 h-3" />, label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-700', icon: <FaTimesCircle className="w-3 h-3" />, label: 'Rejected' },
    resubmitted: { color: 'bg-indigo-100 text-indigo-700', icon: <FaFileAlt className="w-3 h-3" />, label: 'Resubmitted' }
};

const fieldTypeLabels: Record<string, string> = {
    text: '📝 Text',
    textarea: '📄 Long Text',
    number: '🔢 Number',
    date: '📅 Date',
    dropdown: '📋 Dropdown',
    checkbox: '☑️ Checkbox',
    file: '📎 File Upload'
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

export default function TeacherDocuments() {
    const { status: authStatus } = useSession();
    const router = useRouter();
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
    const [statusFilter, setStatusFilter] = useState('all');
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
    const [downloadingBulk, setDownloadingBulk] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        title: '', description: '',
        required_file_types: ['pdf', 'jpg', 'png'],
        max_file_size_mb: 5,
        is_mandatory: true, due_date: '',
        scopeType: 'all',
        scopeBatch: '',
        requires_file_upload: true,
        custom_fields: [] as CustomField[]
    });

    // Teacher's class list for scope
    const [classes, setClasses] = useState<TeacherAssignment[]>([]);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        if (authStatus === 'unauthenticated') router.push('/login');
    }, [authStatus, router]);

    // Load teacher's classes
    useEffect(() => {
        if (authStatus !== 'authenticated') return;
        fetch('/api/teacher/dashboard').then(r => r.json()).then(data => {
            if (data.success) setClasses(data.classes || []);
        });
    }, [authStatus]);

    const loadRequirements = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/teacher/documents/requirements');
            const data = await res.json();
            if (data.success) setRequirements(data.requirements);
        } finally { setLoading(false); }
    }, []);

    const loadSubmissions = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (statusFilter !== 'all') params.append('status', statusFilter);
            const res = await fetch(`/api/teacher/documents/submissions?${params}`);
            const data = await res.json();
            if (data.success) {
                setSubmissions(data.submissions);
                setPagination(data.pagination);
            }
        } finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => {
        if (authStatus !== 'authenticated') return;
        if (activeTab === 'requirements') loadRequirements();
        else loadSubmissions();
    }, [activeTab, authStatus, loadRequirements, loadSubmissions]);

    const resetForm = () => {
        setForm({
            title: '', description: '',
            required_file_types: ['pdf', 'jpg', 'png'],
            max_file_size_mb: 5,
            is_mandatory: true, due_date: '',
            scopeType: 'all', scopeBatch: '',
            requires_file_upload: true,
            custom_fields: []
        });
        setShowCreateForm(false);
        setEditingId(null);
    };

    // ---- FORM BUILDER HELPERS ----
    const addField = (type: string) => {
        const newField: CustomField = {
            field_id: generateId(),
            label: '',
            field_type: type,
            is_required: false,
            placeholder: '',
            options: type === 'dropdown' ? [''] : undefined,
            order: form.custom_fields.length
        };
        setForm(p => ({ ...p, custom_fields: [...p.custom_fields, newField] }));
    };

    const updateField = (idx: number, updates: Partial<CustomField>) => {
        setForm(p => ({
            ...p,
            custom_fields: p.custom_fields.map((f, i) => i === idx ? { ...f, ...updates } : f)
        }));
    };

    const removeField = (idx: number) => {
        setForm(p => ({ ...p, custom_fields: p.custom_fields.filter((_, i) => i !== idx) }));
    };

    const addOption = (fieldIdx: number) => {
        setForm(p => ({
            ...p,
            custom_fields: p.custom_fields.map((f, i) =>
                i === fieldIdx ? { ...f, options: [...(f.options || []), ''] } : f
            )
        }));
    };

    const updateOption = (fieldIdx: number, optIdx: number, value: string) => {
        setForm(p => ({
            ...p,
            custom_fields: p.custom_fields.map((f, i) =>
                i === fieldIdx
                    ? { ...f, options: f.options?.map((o, j) => j === optIdx ? value : o) }
                    : f
            )
        }));
    };

    const removeOption = (fieldIdx: number, optIdx: number) => {
        setForm(p => ({
            ...p,
            custom_fields: p.custom_fields.map((f, i) =>
                i === fieldIdx
                    ? { ...f, options: f.options?.filter((_, j) => j !== optIdx) }
                    : f
            )
        }));
    };

    // ---- SAVE ----
    const handleSave = async () => {
        if (!form.title.trim()) { showToast('Title is required', 'error'); return; }
        // Validate custom fields have labels
        for (const f of form.custom_fields) {
            if (!f.label.trim()) { showToast('All form fields must have labels', 'error'); return; }
        }
        setSaving(true);
        try {
            const body = {
                title: form.title,
                description: form.description,
                category: 'assignment',
                required_file_types: form.requires_file_upload ? form.required_file_types : [],
                max_file_size_mb: form.max_file_size_mb,
                is_mandatory: form.is_mandatory,
                due_date: form.due_date || undefined,
                scope: { type: form.scopeType, batch: form.scopeType === 'batch' ? form.scopeBatch : undefined },
                requires_file_upload: form.requires_file_upload,
                custom_fields: form.custom_fields.map((f, i) => ({ ...f, order: i }))
            };

            const url = editingId
                ? `/api/teacher/documents/requirements/${editingId}`
                : '/api/teacher/documents/requirements';

            const res = await fetch(url, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.success) {
                showToast(editingId ? 'Updated!' : 'Created!');
                resetForm();
                loadRequirements();
            } else showToast(data.message, 'error');
        } catch { showToast('Network error', 'error'); }
        finally { setSaving(false); }
    };

    const handleEdit = (req: Requirement) => {
        setEditingId(req._id);
        setForm({
            title: req.title, description: req.description || '',
            required_file_types: req.required_file_types,
            max_file_size_mb: req.max_file_size_mb,
            is_mandatory: req.is_mandatory,
            due_date: req.due_date ? new Date(req.due_date).toISOString().slice(0, 16) : '',
            scopeType: req.scope.type,
            scopeBatch: req.scope.batch?._id || '',
            requires_file_upload: req.requires_file_upload,
            custom_fields: req.custom_fields || []
        });
        setShowCreateForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deactivate this requirement?')) return;
        const res = await fetch(`/api/teacher/documents/requirements/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) { showToast('Deactivated'); loadRequirements(); }
        else showToast(data.message, 'error');
    };

    const handleReview = async (action: 'approve' | 'reject') => {
        if (!reviewingSubmission) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/teacher/documents/submissions/${reviewingSubmission._id}/review`, {
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
            } else showToast(data.message, 'error');
        } catch { showToast('Network error', 'error'); }
        finally { setSaving(false); }
    };

    const handleDownload = async (sub: Submission) => {
        try {
            const res = await fetch(`/api/teacher/documents/submissions/${sub._id}/download`);
            const data = await res.json();
            if (data.success) window.open(data.download.url, '_blank');
        } catch { showToast('Download failed', 'error'); }
    };

    const handleBulkDownload = async (reqId: string) => {
        setDownloadingBulk(reqId);
        try {
            const res = await fetch('/api/teacher/documents/submissions/bulk-download', {
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
                showToast(data.message || 'Download failed', 'error');
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

    if (authStatus === 'loading' || (authStatus === 'authenticated' && loading && requirements.length === 0 && submissions.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading...</p>
            </div>
        );
    }

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
                    <FaFileAlt className="text-amber-600" /> Assignment Manager
                </h1>
                <p className="text-sm text-gray-500 mt-1">Create assignments with custom forms, review student submissions</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('requirements')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'requirements' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    📋 My Assignments
                </button>
                <button
                    onClick={() => setActiveTab('submissions')}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'submissions' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    📤 Student Submissions
                </button>
            </div>

            {/* ==================== REQUIREMENTS TAB ==================== */}
            {activeTab === 'requirements' && (
                <div>
                    <div className="flex justify-end mb-5">
                        <button
                            onClick={() => { resetForm(); setShowCreateForm(true); }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all"
                        >
                            <FaPlus className="w-3.5 h-3.5" /> New Assignment
                        </button>
                    </div>

                    {/* Create / Edit Form */}
                    <AnimatePresence>
                        {showCreateForm && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="bg-white border border-amber-200 rounded-2xl shadow-lg mb-6 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="font-bold text-gray-900">
                                            {editingId ? '✏️ Edit Assignment' : '➕ Create Assignment'}
                                        </h3>
                                        <button onClick={resetForm} className="p-1 text-gray-400 hover:text-gray-700"><FaTimes /></button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Title */}
                                        <div className="sm:col-span-2">
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                                Title <span className="text-red-500">*</span>
                                            </label>
                                            <input type="text" value={form.title}
                                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                placeholder="e.g. Assignment 3 — Case Study"
                                            />
                                        </div>

                                        {/* Scope */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Assign To</label>
                                            <select value={form.scopeType}
                                                onChange={e => setForm(p => ({ ...p, scopeType: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                            >
                                                <option value="all">🌐 All Students</option>
                                                <option value="batch">👥 By Batch</option>
                                            </select>
                                        </div>

                                        {/* Description */}
                                        <div className="sm:col-span-2 lg:col-span-3">
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Instructions</label>
                                            <textarea value={form.description}
                                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                rows={2} placeholder="Detailed instructions for students…"
                                            />
                                        </div>

                                        {/* Due Date */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Due Date</label>
                                            <input type="datetime-local" value={form.due_date}
                                                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                            />
                                        </div>

                                        {/* Requires File Upload */}
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs font-semibold text-gray-600">Require File Upload?</label>
                                            <button type="button"
                                                onClick={() => setForm(p => ({ ...p, requires_file_upload: !p.requires_file_upload }))}
                                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${form.requires_file_upload
                                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                                    : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
                                            >
                                                {form.requires_file_upload ? '✅ Yes' : '❌ No (form only)'}
                                            </button>
                                        </div>

                                        {/* Mandatory */}
                                        <div className="flex items-center gap-3">
                                            <label className="text-xs font-semibold text-gray-600">Mandatory?</label>
                                            <button type="button"
                                                onClick={() => setForm(p => ({ ...p, is_mandatory: !p.is_mandatory }))}
                                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${form.is_mandatory
                                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                                    : 'bg-gray-50 text-gray-500 border border-gray-200'}`}
                                            >
                                                {form.is_mandatory ? '✅ Yes' : '❌ No'}
                                            </button>
                                        </div>

                                        {/* File Types (only if file upload required) */}
                                        {form.requires_file_upload && (
                                            <div>
                                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Allowed File Types</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {['pdf', 'jpg', 'png', 'docx', 'xlsx'].map(type => (
                                                        <button key={type} type="button" onClick={() => toggleFileType(type)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${form.required_file_types.includes(type)
                                                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                                : 'bg-gray-50 text-gray-400 border border-gray-200'}`}
                                                        >.{type}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* ====== FORM BUILDER ====== */}
                                    <div className="mt-6 border-t border-gray-100 pt-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                🛠️ Custom Form Fields
                                                <span className="text-[10px] font-normal text-gray-400">
                                                    (Add fields students must fill out)
                                                </span>
                                            </h4>
                                        </div>

                                        {/* Add Field Buttons */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {Object.entries(fieldTypeLabels).map(([type, label]) => (
                                                <button key={type} type="button" onClick={() => addField(type)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-all"
                                                >
                                                    + {label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Field List */}
                                        <div className="space-y-3">
                                            {form.custom_fields.map((field, idx) => (
                                                <div key={field.field_id}
                                                    className="bg-gray-50 border border-gray-200 rounded-xl p-4"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <FaGripVertical className="w-3 h-3 text-gray-300 mt-3 flex-shrink-0" />
                                                        <div className="flex-1 space-y-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold">
                                                                    {fieldTypeLabels[field.field_type]}
                                                                </span>
                                                                <input
                                                                    type="text" value={field.label}
                                                                    onChange={e => updateField(idx, { label: e.target.value })}
                                                                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                                    placeholder="Field label *"
                                                                />
                                                                <label className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                    <input type="checkbox" checked={field.is_required}
                                                                        onChange={e => updateField(idx, { is_required: e.target.checked })}
                                                                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-400"
                                                                    />
                                                                    Required
                                                                </label>
                                                                <button onClick={() => removeField(idx)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                                                ><FaTrash className="w-3 h-3" /></button>
                                                            </div>

                                                            {/* Placeholder */}
                                                            {['text', 'textarea', 'number'].includes(field.field_type) && (
                                                                <input type="text" value={field.placeholder || ''}
                                                                    onChange={e => updateField(idx, { placeholder: e.target.value })}
                                                                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                                    placeholder="Placeholder text (optional)"
                                                                />
                                                            )}

                                                            {/* Dropdown Options */}
                                                            {field.field_type === 'dropdown' && (
                                                                <div className="space-y-1.5">
                                                                    <p className="text-xs text-gray-400 font-semibold">Options:</p>
                                                                    {field.options?.map((opt, optIdx) => (
                                                                        <div key={optIdx} className="flex items-center gap-2">
                                                                            <input type="text" value={opt}
                                                                                onChange={e => updateOption(idx, optIdx, e.target.value)}
                                                                                className="flex-1 px-3 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                                                placeholder={`Option ${optIdx + 1}`}
                                                                            />
                                                                            <button onClick={() => removeOption(idx, optIdx)}
                                                                                className="text-gray-400 hover:text-red-500"
                                                                            ><FaTimes className="w-3 h-3" /></button>
                                                                        </div>
                                                                    ))}
                                                                    <button onClick={() => addOption(idx)}
                                                                        className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
                                                                    >+ Add option</button>
                                                                </div>
                                                            )}

                                                            {/* File field settings */}
                                                            {field.field_type === 'file' && (
                                                                <div className="flex gap-3">
                                                                    <input type="text" value={field.allowed_file_types?.join(', ') || ''}
                                                                        onChange={e => updateField(idx, {
                                                                            allowed_file_types: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                                                        })}
                                                                        className="flex-1 px-3 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                                        placeholder="Allowed types (e.g. pdf, jpg)"
                                                                    />
                                                                    <input type="number" value={field.max_file_size_mb || ''}
                                                                        onChange={e => updateField(idx, { max_file_size_mb: Number(e.target.value) })}
                                                                        className="w-24 px-3 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                                        placeholder="Max MB"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {form.custom_fields.length === 0 && (
                                            <p className="text-center text-xs text-gray-400 py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                No custom fields added. Students will only upload a file.
                                            </p>
                                        )}
                                    </div>

                                    {/* Save */}
                                    <div className="flex items-center gap-3 mt-6">
                                        <button onClick={handleSave} disabled={saving}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-70"
                                        >
                                            <FaSave /> {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
                                        </button>
                                        <button onClick={resetForm} className="px-5 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Requirements List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" />
                        </div>
                    ) : requirements.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <FaFileAlt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No assignments created yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requirements.map(req => (
                                <motion.div key={req._id} layout
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 transition-all"
                                >
                                    <div className="flex items-center gap-4 p-4 flex-wrap">
                                        <div className="flex-1 min-w-[200px]">
                                            <p className="font-semibold text-gray-900 text-sm">{req.title}</p>
                                            {req.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{req.description}</p>}
                                        </div>
                                        {req.custom_fields.length > 0 && (
                                            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-semibold">
                                                {req.custom_fields.length} custom fields
                                            </span>
                                        )}
                                        {req.due_date && (
                                            <span className={`flex items-center gap-1 text-xs ${new Date(req.due_date) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                                                <FaClock className="w-3 h-3" />
                                                {new Date(req.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1 ml-auto">
                                            <button onClick={() => handleBulkDownload(req._id)}
                                                disabled={downloadingBulk === req._id}
                                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                                                title="Bulk download submissions"
                                            >
                                                <FaArrowDown className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleEdit(req)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                            ><FaEdit className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleDelete(req._id)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            ><FaTrash className="w-3.5 h-3.5" /></button>
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
                    <div className="flex flex-wrap items-center gap-3 mb-5">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <FaFilter className="w-3.5 h-3.5" /> Status:
                        </div>
                        {['all', 'pending', 'resubmitted', 'approved', 'rejected'].map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                    : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300'}`}
                            >
                                {s === 'all' ? 'All' : statusBadge[s]?.label || s}
                            </button>
                        ))}
                        <span className="ml-auto text-xs text-gray-400">{pagination.total} total</span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" />
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <FaFileAlt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No submissions yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {submissions.map(sub => (
                                <motion.div key={sub._id} layout
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
                                                <p className="text-xs text-amber-600 font-medium">{Object.keys(sub.form_responses).length} form fields filled</p>
                                            )}
                                        </div>
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusBadge[sub.status]?.color}`}>
                                            {statusBadge[sub.status]?.icon} {statusBadge[sub.status]?.label}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(sub.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </span>
                                        <div className="flex items-center gap-1 ml-auto">
                                            {sub.file_url && (
                                                <button onClick={() => handleDownload(sub)}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Download"
                                                ><FaDownload className="w-3.5 h-3.5" /></button>
                                            )}
                                            {(sub.status === 'pending' || sub.status === 'resubmitted') && (
                                                <button onClick={() => { setReviewingSubmission(sub); setReviewComment(''); }}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" title="Review"
                                                ><FaEye className="w-3.5 h-3.5" /></button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center gap-2 pt-4">
                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                                        <button key={p} onClick={() => loadSubmissions(p)}
                                            className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${p === pagination.page ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                        >{p}</button>
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
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="font-bold text-gray-900 text-lg mb-4">Review Submission</h3>

                            <div className="space-y-3 mb-5">
                                <div className="flex justify-between">
                                    <span className="text-xs text-gray-400">Student</span>
                                    <span className="text-sm font-medium text-gray-900">{reviewingSubmission.student?.fullName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-gray-400">Assignment</span>
                                    <span className="text-sm font-medium text-gray-900">{reviewingSubmission.requirement?.title}</span>
                                </div>
                                {reviewingSubmission.file_name && (
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-400">File</span>
                                        <button onClick={() => handleDownload(reviewingSubmission)}
                                            className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            <FaDownload className="w-3 h-3" /> {reviewingSubmission.file_name}
                                        </button>
                                    </div>
                                )}

                                {/* Form Responses */}
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
                            </div>

                            {/* Comment */}
                            <div className="mb-5">
                                <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1">
                                    <FaComment className="w-3 h-3" /> Comment (optional)
                                </label>
                                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    rows={3} placeholder="Add a note for the student…"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button onClick={() => handleReview('approve')} disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-all disabled:opacity-70"
                                ><FaCheck /> {saving ? 'Processing…' : 'Approve'}</button>
                                <button onClick={() => handleReview('reject')} disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-70"
                                ><FaBan /> {saving ? 'Processing…' : 'Reject'}</button>
                            </div>
                            <button onClick={() => setReviewingSubmission(null)}
                                className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium"
                            >Cancel</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
