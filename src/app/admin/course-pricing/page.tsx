'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { courseData } from '@/data/courseData';
import {
    FaTag, FaEdit, FaTrash, FaSave, FaTimes, FaToggleOn,
    FaToggleOff, FaPlus, FaPercent, FaRupeeSign, FaClock,
    FaCheckCircle, FaExclamationCircle,
} from 'react-icons/fa';

interface PricingRow {
    courseId: string;
    courseTitle: string;
    originalPrice: number | null;
    offerPrice: number | null;
    isOfferActive: boolean;
    offerValidUntil: string | null;
    offerLabel: string;
    seatLimit: number | null;
    hasPricing: boolean;
}

interface EditState {
    originalPrice: string;
    offerPrice: string;
    isOfferActive: boolean;
    offerValidUntil: string;
    offerLabel: string;
    seatLimit: string;
}

function fmt(n: number | null) {
    if (n == null) return '—';
    return `₹${n.toLocaleString('en-IN')}`;
}
function pct(orig: number | null, offer: number | null) {
    if (!orig || !offer || orig === 0) return 0;
    return Math.round(((orig - offer) / orig) * 100);
}
function isExpired(d: string | null) {
    if (!d) return false;
    return new Date(d) < new Date();
}

export default function CoursePricingAdmin() {
    const [rows, setRows] = useState<PricingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editState, setEditState] = useState<EditState | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [search, setSearch] = useState('');

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/course-pricing');
            const data = await res.json();
            if (data.success) setRows(data.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const startEdit = (row: PricingRow) => {
        setEditingId(row.courseId);
        setEditState({
            originalPrice: row.originalPrice?.toString() ?? '',
            offerPrice: row.offerPrice?.toString() ?? '',
            isOfferActive: row.isOfferActive,
            offerValidUntil: row.offerValidUntil
                ? new Date(row.offerValidUntil).toISOString().slice(0, 16)
                : '',
            offerLabel: row.offerLabel ?? 'Limited Time Offer',
            seatLimit: row.seatLimit?.toString() ?? '',
        });
    };

    const save = async (courseId: string) => {
        if (!editState) return;
        setSaving(true);
        try {
            const res = await fetch('/api/admin/course-pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    originalPrice: Number(editState.originalPrice),
                    offerPrice: Number(editState.offerPrice),
                    isOfferActive: editState.isOfferActive,
                    offerValidUntil: editState.offerValidUntil || null,
                    offerLabel: editState.offerLabel,
                    seatLimit: editState.seatLimit ? Number(editState.seatLimit) : null,
                }),
            });
            const data = await res.json();
            if (data.success) {
                showToast('Pricing saved!');
                setEditingId(null);
                setEditState(null);
                load();
            } else {
                showToast(data.message, 'error');
            }
        } catch {
            showToast('Network error.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const remove = async (courseId: string) => {
        if (!confirm('Remove pricing for this course?')) return;
        const res = await fetch(`/api/admin/course-pricing?courseId=${courseId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) { showToast('Pricing removed.'); load(); }
        else showToast(data.message, 'error');
    };

    const quickToggle = async (row: PricingRow) => {
        if (!row.hasPricing) return;
        const res = await fetch('/api/admin/course-pricing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...row, isOfferActive: !row.isOfferActive }),
        });
        const data = await res.json();
        if (data.success) load();
        else showToast(data.message, 'error');
    };

    const filtered = rows.filter(r =>
        r.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
        r.courseId.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                            }`}
                    >
                        {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FaTag className="text-violet-600" /> Course Pricing
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Set prices, offers, validity & seat limits for all courses.</p>
                </div>
                <input
                    type="text"
                    placeholder="Search courses…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 w-full sm:w-64"
                />
            </div>

            {/* Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Courses', value: rows.length, color: 'text-gray-900' },
                    { label: 'With Pricing', value: rows.filter(r => r.hasPricing).length, color: 'text-blue-600' },
                    { label: 'Offers Active', value: rows.filter(r => r.isOfferActive && !isExpired(r.offerValidUntil)).length, color: 'text-green-600' },
                    { label: 'Offers Expired', value: rows.filter(r => r.hasPricing && isExpired(r.offerValidUntil)).length, color: 'text-red-500' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(row => (
                        <motion.div key={row.courseId} layout
                            className={`bg-white rounded-xl border shadow-sm overflow-hidden ${editingId === row.courseId ? 'border-violet-400 shadow-violet-100' : 'border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            {/* Collapsed Row */}
                            {editingId !== row.courseId && (
                                <div className="flex items-center gap-4 p-4 flex-wrap">
                                    {/* Course name */}
                                    <div className="flex-1 min-w-[200px]">
                                        <p className="font-semibold text-gray-900 text-sm">{row.courseTitle}</p>
                                        <p className="text-xs text-gray-400 uppercase">{row.courseId}</p>
                                    </div>

                                    {/* Pricing display */}
                                    {row.hasPricing ? (
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-400">Original</p>
                                                <p className="font-bold text-gray-700">{fmt(row.originalPrice)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-400">Offer</p>
                                                <p className="font-bold text-green-600">{fmt(row.offerPrice)}</p>
                                            </div>
                                            <div className="px-2 py-1 bg-amber-100 rounded-lg text-center">
                                                <p className="text-xs text-amber-700 font-bold">{pct(row.originalPrice, row.offerPrice)}% OFF</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">No pricing set</span>
                                    )}

                                    {/* Offer status */}
                                    {row.hasPricing && (
                                        <div className="flex flex-col items-center">
                                            {isExpired(row.offerValidUntil) ? (
                                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Expired</span>
                                            ) : row.isOfferActive ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                                            ) : (
                                                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Off</span>
                                            )}
                                            {row.offerValidUntil && !isExpired(row.offerValidUntil) && (
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    until {new Date(row.offerValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 ml-auto">
                                        {row.hasPricing && (
                                            <button onClick={() => quickToggle(row)} title="Toggle offer on/off"
                                                className={`text-xl transition-colors ${row.isOfferActive && !isExpired(row.offerValidUntil) ? 'text-green-500 hover:text-green-700' : 'text-gray-300 hover:text-gray-500'}`}
                                            >
                                                {row.isOfferActive && !isExpired(row.offerValidUntil) ? <FaToggleOn /> : <FaToggleOff />}
                                            </button>
                                        )}
                                        <button onClick={() => startEdit(row)}
                                            className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                        >
                                            {row.hasPricing ? <FaEdit className="w-4 h-4" /> : <FaPlus className="w-4 h-4" />}
                                        </button>
                                        {row.hasPricing && (
                                            <button onClick={() => remove(row.courseId)}
                                                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            >
                                                <FaTrash className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Expanded Edit Form */}
                            {editingId === row.courseId && editState && (
                                <div className="p-5 border-t border-violet-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-900 text-sm">{row.courseTitle}</h3>
                                        <button onClick={() => { setEditingId(null); setEditState(null); }}
                                            className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
                                        ><FaTimes /></button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Original Price */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                                Original Price (₹) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <FaRupeeSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                                                <input type="number" min={0} value={editState.originalPrice}
                                                    onChange={e => setEditState(prev => prev ? { ...prev, originalPrice: e.target.value } : prev)}
                                                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                    placeholder="85000"
                                                />
                                            </div>
                                        </div>

                                        {/* Offer Price */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">
                                                Offer Price (₹) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <FaRupeeSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                                                <input type="number" min={0} value={editState.offerPrice}
                                                    onChange={e => setEditState(prev => prev ? { ...prev, offerPrice: e.target.value } : prev)}
                                                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                    placeholder="65000"
                                                />
                                            </div>
                                            {editState.originalPrice && editState.offerPrice && (
                                                <p className="text-xs text-green-600 mt-1 font-semibold">
                                                    {pct(Number(editState.originalPrice), Number(editState.offerPrice))}% discount
                                                </p>
                                            )}
                                        </div>

                                        {/* Offer Label */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Offer Label</label>
                                            <input type="text" value={editState.offerLabel}
                                                onChange={e => setEditState(prev => prev ? { ...prev, offerLabel: e.target.value } : prev)}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                placeholder="e.g. Early Bird, Last Few Seats"
                                            />
                                        </div>

                                        {/* Offer Valid Until */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Offer Valid Until</label>
                                            <div className="relative">
                                                <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                                                <input type="datetime-local" value={editState.offerValidUntil}
                                                    onChange={e => setEditState(prev => prev ? { ...prev, offerValidUntil: e.target.value } : prev)}
                                                    className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Leave empty for permanent offer</p>
                                        </div>

                                        {/* Seat Limit */}
                                        <div>
                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Seat Limit (optional)</label>
                                            <input type="number" min={1} value={editState.seatLimit}
                                                onChange={e => setEditState(prev => prev ? { ...prev, seatLimit: e.target.value } : prev)}
                                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                                                placeholder="e.g. 30"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">Shown as "Only X seats left"</p>
                                        </div>

                                        {/* Offer Active Toggle */}
                                        <div className="flex flex-col justify-center">
                                            <label className="text-xs font-semibold text-gray-600 mb-2 block">Offer Status</label>
                                            <button
                                                type="button"
                                                onClick={() => setEditState(prev => prev ? { ...prev, isOfferActive: !prev.isOfferActive } : prev)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${editState.isOfferActive
                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                                                    }`}
                                            >
                                                {editState.isOfferActive
                                                    ? <><FaToggleOn className="text-xl text-green-500" /> Offer Active</>
                                                    : <><FaToggleOff className="text-xl text-gray-400" /> Offer Off</>
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    {/* Save / Cancel */}
                                    <div className="flex items-center gap-3 mt-5">
                                        <button
                                            onClick={() => save(row.courseId)}
                                            disabled={saving}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-blue-700 transition-all disabled:opacity-70"
                                        >
                                            <FaSave /> {saving ? 'Saving…' : 'Save Pricing'}
                                        </button>
                                        <button onClick={() => { setEditingId(null); setEditState(null); }}
                                            className="px-5 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium"
                                        >Cancel</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
