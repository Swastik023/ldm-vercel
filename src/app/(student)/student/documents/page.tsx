'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    FaFileAlt, FaUpload, FaCheckCircle, FaTimesCircle,
    FaClock, FaExclamationCircle, FaCloudUploadAlt,
    FaFileUpload, FaComment, FaRedo, FaTimes, FaInfoCircle
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

interface DocumentItem {
    _id: string;
    title: string;
    description?: string;
    category: string;
    required_file_types: string[];
    max_file_size_mb: number;
    is_mandatory: boolean;
    due_date?: string;
    created_by?: { fullName: string };
    subject?: { name: string; code: string };
    submission: any;
    submissionStatus: string;
    isOverdue: boolean;
    custom_fields: CustomField[];
    requires_file_upload: boolean;
}

interface GroupedDocs {
    personal_document: DocumentItem[];
    academic: DocumentItem[];
    assignment: DocumentItem[];
    certificate: DocumentItem[];
}

const categoryConfig: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
    personal_document: { label: 'Personal Documents', icon: '📄', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    academic: { label: 'Academic Documents', icon: '🎓', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    assignment: { label: 'Assignments', icon: '📝', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    certificate: { label: 'Certificates', icon: '📜', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' }
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    not_submitted: { label: 'Not Submitted', color: 'text-gray-500', bg: 'bg-gray-100', icon: <FaFileUpload className="w-3 h-3" /> },
    pending: { label: 'Under Review', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: <FaClock className="w-3 h-3" /> },
    approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100', icon: <FaCheckCircle className="w-3 h-3" /> },
    rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100', icon: <FaTimesCircle className="w-3 h-3" /> },
    resubmitted: { label: 'Resubmitted', color: 'text-indigo-700', bg: 'bg-indigo-100', icon: <FaRedo className="w-3 h-3" /> }
};

function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function StudentDocuments() {
    const { status: authStatus } = useSession();
    const router = useRouter();
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [grouped, setGrouped] = useState<GroupedDocs | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [uploadingFor, setUploadingFor] = useState<DocumentItem | null>(null);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formResponses, setFormResponses] = useState<Record<string, any>>({});
    const [additionalFiles, setAdditionalFiles] = useState<Record<string, File>>({});

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        if (authStatus === 'unauthenticated') router.push('/login');
    }, [authStatus, router]);

    const loadDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/student/documents');
            const data = await res.json();
            if (data.success) {
                setDocuments(data.documents);
                setGrouped(data.grouped);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authStatus === 'authenticated') loadDocuments();
    }, [authStatus, loadDocuments]);

    const handleUpload = async () => {
        if (!uploadingFor) return;
        const needsFile = uploadingFor.requires_file_upload !== false;
        if (needsFile && !selectedFile) return;

        // Validate required custom fields
        for (const field of (uploadingFor.custom_fields || [])) {
            if (field.is_required) {
                if (field.field_type === 'file') {
                    if (!additionalFiles[field.field_id]) {
                        showToast(`"${field.label}" is required`, 'error');
                        return;
                    }
                } else if (field.field_type === 'checkbox') {
                    // checkbox can be false, that's OK
                } else {
                    const val = formResponses[field.field_id];
                    if (val === undefined || val === null || val === '') {
                        showToast(`"${field.label}" is required`, 'error');
                        return;
                    }
                }
            }
        }

        setUploading(true);

        try {
            const formData = new FormData();
            if (selectedFile) formData.append('file', selectedFile);
            formData.append('requirementId', uploadingFor._id);

            // Attach form responses
            if (Object.keys(formResponses).length > 0) {
                formData.append('form_responses', JSON.stringify(formResponses));
            }

            // Attach additional files
            Object.entries(additionalFiles).forEach(([fieldId, file]) => {
                formData.append(`additional_file_${fieldId}`, file);
            });

            const res = await fetch('/api/student/documents/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                showToast('Document uploaded successfully!');
                setUploadingFor(null);
                setSelectedFile(null);
                setFormResponses({});
                setAdditionalFiles({});
                loadDocuments();
            } else {
                showToast(data.message || 'Upload failed', 'error');
            }
        } catch {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) validateAndSetFile(file);
    };

    const validateAndSetFile = (file: File) => {
        if (!uploadingFor) return;

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !uploadingFor.required_file_types.includes(ext)) {
            showToast(`File type .${ext} not allowed. Accepted: ${uploadingFor.required_file_types.map(t => '.' + t).join(', ')}`, 'error');
            return;
        }

        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > uploadingFor.max_file_size_mb) {
            showToast(`File too large (${sizeMB.toFixed(1)}MB). Max: ${uploadingFor.max_file_size_mb}MB`, 'error');
            return;
        }

        setSelectedFile(file);
    };

    // Stats
    const stats = {
        total: documents.length,
        submitted: documents.filter(d => d.submissionStatus !== 'not_submitted').length,
        approved: documents.filter(d => d.submissionStatus === 'approved').length,
        pending: documents.filter(d => ['pending', 'resubmitted'].includes(d.submissionStatus)).length,
        rejected: documents.filter(d => d.submissionStatus === 'rejected').length,
        notSubmitted: documents.filter(d => d.submissionStatus === 'not_submitted').length
    };

    if (authStatus === 'loading' || loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading your documents...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
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
                    <FaFileAlt className="text-violet-600" /> My Documents
                </h1>
                <p className="text-sm text-gray-500 mt-1">Upload and track your required documents</p>
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {[
                    { label: 'Total Required', value: stats.total, color: 'text-gray-900' },
                    { label: 'Approved', value: stats.approved, color: 'text-green-600' },
                    { label: 'Under Review', value: stats.pending, color: 'text-yellow-600' },
                    { label: 'Rejected', value: stats.rejected, color: 'text-red-600' },
                    { label: 'Not Submitted', value: stats.notSubmitted, color: 'text-gray-500' }
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-semibold">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Progress Bar */}
            {stats.total > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-600">Completion Progress</span>
                        <span className="text-xs font-bold text-violet-600">
                            {Math.round((stats.approved / stats.total) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-violet-500 to-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${(stats.approved / stats.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Document Categories */}
            {documents.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                    <FaFileAlt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No documents required yet</p>
                    <p className="text-sm mt-1">Your admin will assign document requirements when needed</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(grouped || {}).map(([category, docs]) => {
                        if (!docs || docs.length === 0) return null;
                        const config = categoryConfig[category];
                        return (
                            <div key={category}>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-lg">{config.icon}</span>
                                    <h2 className="text-sm font-bold text-gray-900">{config.label}</h2>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">{docs.length}</span>
                                </div>
                                <div className="space-y-3">
                                    {docs.map((doc: DocumentItem) => {
                                        const sConfig = statusConfig[doc.submissionStatus];
                                        return (
                                            <motion.div
                                                key={doc._id}
                                                layout
                                                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${doc.submissionStatus === 'rejected'
                                                    ? 'border-red-200'
                                                    : doc.submissionStatus === 'approved'
                                                        ? 'border-green-200'
                                                        : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4 p-4 flex-wrap">
                                                    {/* Status icon */}
                                                    <div className={`w-10 h-10 rounded-xl ${sConfig.bg} flex items-center justify-center ${sConfig.color}`}>
                                                        {sConfig.icon}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-[180px]">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-gray-900 text-sm">{doc.title}</p>
                                                            {doc.is_mandatory && (
                                                                <span className="text-[9px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Required</span>
                                                            )}
                                                        </div>
                                                        {doc.description && (
                                                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{doc.description}</p>
                                                        )}
                                                        {doc.subject && (
                                                            <p className="text-xs text-violet-500 mt-0.5">{doc.subject.name} ({doc.subject.code})</p>
                                                        )}
                                                    </div>

                                                    {/* File types */}
                                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                                        {doc.required_file_types.map(t => (
                                                            <span key={t} className="bg-gray-100 px-1.5 py-0.5 rounded">.{t}</span>
                                                        ))}
                                                        <span className="text-gray-300 ml-1">≤{doc.max_file_size_mb}MB</span>
                                                    </div>

                                                    {/* Due date */}
                                                    {doc.due_date && (
                                                        <span className={`flex items-center gap-1 text-xs ${doc.isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                                                            <FaClock className="w-3 h-3" />
                                                            {doc.isOverdue ? 'Overdue' : 'Due'}: {new Date(doc.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    )}

                                                    {/* Status badge */}
                                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sConfig.bg} ${sConfig.color}`}>
                                                        {sConfig.icon}
                                                        {sConfig.label}
                                                    </span>

                                                    {/* Action */}
                                                    <div className="ml-auto">
                                                        {(doc.submissionStatus === 'not_submitted' || doc.submissionStatus === 'rejected') && (
                                                            <div className="flex flex-col items-end gap-1">
                                                                {doc.isOverdue && (
                                                                    <span className="text-[10px] text-amber-600 font-semibold">⚠ Late submission</span>
                                                                )}
                                                                <button
                                                                    onClick={() => { setUploadingFor(doc); setSelectedFile(null); setFormResponses({}); setAdditionalFiles({}); }}
                                                                    className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-semibold transition-all ${doc.isOverdue
                                                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                                                                        : 'bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700'
                                                                        }`}
                                                                >
                                                                    <FaUpload className="w-3 h-3" />
                                                                    {doc.submissionStatus === 'rejected' ? 'Re-upload' : 'Submit'}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {doc.submissionStatus === 'pending' || doc.submissionStatus === 'resubmitted' ? (
                                                            <span className="text-xs text-yellow-600 font-medium">Awaiting review…</span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                {/* Rejection reason */}
                                                {doc.submissionStatus === 'rejected' && doc.submission?.review?.comment && (
                                                    <div className="px-4 pb-3">
                                                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
                                                            <FaComment className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-0.5">Rejection Reason</p>
                                                                <p className="text-xs text-red-700">{doc.submission.review.comment}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Submitted file info */}
                                                {doc.submission && doc.submissionStatus !== 'not_submitted' && (
                                                    <div className="px-4 pb-3">
                                                        <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                                                            <FaFileAlt className="w-3 h-3" />
                                                            <span className="font-medium">{doc.submission.file_name}</span>
                                                            <span>•</span>
                                                            <span>{formatFileSize(doc.submission.file_size)}</span>
                                                            <span>•</span>
                                                            <span>Submitted {new Date(doc.submission.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                                                            {doc.submission.submission_history?.length > 1 && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="text-indigo-500 font-semibold">Attempt #{doc.submission.submission_history.length}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ==================== UPLOAD MODAL ==================== */}
            <AnimatePresence>
                {uploadingFor && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                        onClick={() => { setUploadingFor(null); setSelectedFile(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-bold text-gray-900 text-lg">Upload Document</h3>
                                <button onClick={() => { setUploadingFor(null); setSelectedFile(null); }} className="p-1 text-gray-400 hover:text-gray-700">
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Requirement Info */}
                            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 mb-5">
                                <p className="font-semibold text-violet-900 text-sm">{uploadingFor.title}</p>
                                {uploadingFor.description && (
                                    <p className="text-xs text-violet-700 mt-1">{uploadingFor.description}</p>
                                )}
                                {uploadingFor.requires_file_upload !== false && (
                                    <div className="flex items-center gap-3 mt-2 text-xs text-violet-600">
                                        <span>Accepted: {uploadingFor.required_file_types.map(t => `.${t}`).join(', ')}</span>
                                        <span>•</span>
                                        <span>Max: {uploadingFor.max_file_size_mb}MB</span>
                                    </div>
                                )}
                            </div>

                            {/* Dynamic Form Fields */}
                            {uploadingFor.custom_fields?.length > 0 && (
                                <div className="space-y-4 mb-5">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Form Fields</p>
                                    {[...uploadingFor.custom_fields].sort((a, b) => a.order - b.order).map(field => (
                                        <div key={field.field_id}>
                                            <label className="text-xs font-semibold text-gray-700 mb-1 block">
                                                {field.label}
                                                {field.is_required && <span className="text-red-500 ml-0.5">*</span>}
                                            </label>

                                            {field.field_type === 'text' && (
                                                <input type="text"
                                                    value={formResponses[field.field_id] || ''}
                                                    onChange={e => setFormResponses(p => ({ ...p, [field.field_id]: e.target.value }))}
                                                    placeholder={field.placeholder || ''}
                                                    maxLength={field.max_length}
                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                />
                                            )}

                                            {field.field_type === 'textarea' && (
                                                <textarea
                                                    value={formResponses[field.field_id] || ''}
                                                    onChange={e => setFormResponses(p => ({ ...p, [field.field_id]: e.target.value }))}
                                                    placeholder={field.placeholder || ''}
                                                    maxLength={field.max_length}
                                                    rows={3}
                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                />
                                            )}

                                            {field.field_type === 'number' && (
                                                <input type="number"
                                                    value={formResponses[field.field_id] ?? ''}
                                                    onChange={e => setFormResponses(p => ({ ...p, [field.field_id]: e.target.value ? Number(e.target.value) : '' }))}
                                                    placeholder={field.placeholder || ''}
                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                />
                                            )}

                                            {field.field_type === 'date' && (
                                                <input type="date"
                                                    value={formResponses[field.field_id] || ''}
                                                    onChange={e => setFormResponses(p => ({ ...p, [field.field_id]: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                />
                                            )}

                                            {field.field_type === 'dropdown' && (
                                                <select
                                                    value={formResponses[field.field_id] || ''}
                                                    onChange={e => setFormResponses(p => ({ ...p, [field.field_id]: e.target.value }))}
                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                                                >
                                                    <option value="">Select…</option>
                                                    {field.options?.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {field.field_type === 'checkbox' && (
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox"
                                                        checked={formResponses[field.field_id] || false}
                                                        onChange={e => setFormResponses(p => ({ ...p, [field.field_id]: e.target.checked }))}
                                                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-400 w-4 h-4"
                                                    />
                                                    <span className="text-sm text-gray-600">{field.placeholder || 'Yes'}</span>
                                                </label>
                                            )}

                                            {field.field_type === 'file' && (
                                                <div>
                                                    <input type="file"
                                                        accept={field.allowed_file_types?.map(t => `.${t}`).join(',')}
                                                        onChange={e => {
                                                            const f = e.target.files?.[0];
                                                            if (f) {
                                                                if (field.max_file_size_mb && f.size / (1024 * 1024) > field.max_file_size_mb) {
                                                                    showToast(`File too large. Max: ${field.max_file_size_mb}MB`, 'error');
                                                                    return;
                                                                }
                                                                setAdditionalFiles(p => ({ ...p, [field.field_id]: f }));
                                                            }
                                                        }}
                                                        className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                                                    />
                                                    {additionalFiles[field.field_id] && (
                                                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                                            <FaCheckCircle className="w-3 h-3" />
                                                            {additionalFiles[field.field_id].name} ({formatFileSize(additionalFiles[field.field_id].size)})
                                                        </p>
                                                    )}
                                                    {field.allowed_file_types && (
                                                        <p className="text-[10px] text-gray-400 mt-1">
                                                            Accepted: {field.allowed_file_types.join(', ')}
                                                            {field.max_file_size_mb ? ` • Max: ${field.max_file_size_mb}MB` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Drop Zone (only if file upload required) */}
                            {uploadingFor.requires_file_upload !== false && (
                                <div
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver
                                        ? 'border-violet-400 bg-violet-50'
                                        : selectedFile
                                            ? 'border-green-300 bg-green-50'
                                            : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/30'
                                        }`}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept={uploadingFor.required_file_types.map(t => `.${t}`).join(',')}
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) validateAndSetFile(file);
                                        }}
                                    />

                                    {selectedFile ? (
                                        <div>
                                            <FaCheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                                            <p className="font-semibold text-gray-900 text-sm">{selectedFile.name}</p>
                                            <p className="text-xs text-gray-400 mt-1">{formatFileSize(selectedFile.size)}</p>
                                            <p className="text-xs text-violet-600 mt-2 font-medium">Click to choose a different file</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <FaCloudUploadAlt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                            <p className="font-semibold text-gray-700 text-sm">
                                                Drag & drop your file here
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Info note for resubmission */}
                            {uploadingFor.submissionStatus === 'rejected' && (
                                <div className="flex items-start gap-2 mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3">
                                    <FaInfoCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-700">
                                        Your previous submission was rejected. Your old file will be archived and this new file will replace it.
                                    </p>
                                </div>
                            )}

                            {/* Upload Button */}
                            <div className="flex items-center gap-3 mt-5">
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading || (uploadingFor.requires_file_upload !== false && !selectedFile)}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaUpload className="w-3.5 h-3.5" />
                                    {uploading ? 'Uploading…' : 'Submit'}
                                </button>
                                <button
                                    onClick={() => { setUploadingFor(null); setSelectedFile(null); setFormResponses({}); setAdditionalFiles({}); }}
                                    className="px-5 py-3 text-gray-500 hover:text-gray-700 text-sm font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
