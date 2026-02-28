'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, MapPin, Calendar, DollarSign, CheckCircle2, XCircle,
    Upload, X, Search, Clock, UserPlus, FileText, Send, AlertCircle,
    ChevronDown, Sparkles, Building2, TrendingUp, ArrowRight
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface EligibilityResult { eligible: boolean; reasons: string[]; }
interface MyApp { _id: string; status: string; appliedAt: string; }
interface JobPosting {
    _id: string; title: string; company: string; jobType: string; location: string;
    ctc: string; description: string; skillsRequired: string[]; deadline: string;
    status: string; createdAt: string;
    eligibility: EligibilityResult;
    referral: { enabled: boolean; maxPerStudent: number; reward: string; };
    myApplication: MyApp | null;
    myReferralCount: number;
}

const APP_STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    applied: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    shortlisted: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
    selected: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

const LOCATION_EMOJIS: Record<string, string> = { remote: '🌐', onsite: '🏢', hybrid: '🔄' };

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function StudentJobsPage() {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [tab, setTab] = useState<'all' | 'eligible' | 'applied'>('all');
    const [applyJob, setApplyJob] = useState<JobPosting | null>(null);
    const [referJob, setReferJob] = useState<JobPosting | null>(null);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/student/jobs');
        const data = await res.json();
        if (data.success) setJobs(data.jobs);
        setLoading(false);
    }, []);

    useEffect(() => { fetchJobs(); }, [fetchJobs]);

    const eligibleCount = jobs.filter(j => j.eligibility.eligible).length;
    const appliedCount = jobs.filter(j => j.myApplication).length;

    const filtered = jobs.filter(j => {
        if (tab === 'eligible' && !j.eligibility.eligible) return false;
        if (tab === 'applied' && !j.myApplication) return false;
        if (typeFilter && j.jobType !== typeFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) ||
                j.skillsRequired.some(s => s.toLowerCase().includes(q));
        }
        return true;
    });

    return (
        <div className="space-y-6 max-w-5xl">
            {/* ── Hero Header ────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl shadow-blue-600/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <Briefcase className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl font-bold">Job Portal</h1>
                    </div>
                    <p className="text-blue-100 text-sm">{jobs.length} Open Positions for your profile</p>
                </div>
            </div>

            {/* ── Tabs ───────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
                    {[
                        { key: 'all' as const, label: 'All Jobs', count: jobs.length, icon: <Briefcase className="w-3.5 h-3.5" /> },
                        { key: 'eligible' as const, label: 'Eligible', count: eligibleCount, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                        { key: 'applied' as const, label: 'My Applications', count: appliedCount, icon: <TrendingUp className="w-3.5 h-3.5" /> },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${tab === t.key
                                ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {t.icon} {t.label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${tab === t.key ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>{t.count}</span>
                        </button>
                    ))}
                </div>
                <div className="flex-1" />
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs or skills…"
                        className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm w-56" />
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer shadow-sm font-medium text-gray-700">
                    <option value="">All Types</option>
                    <option value="fulltime">Full-time</option>
                    <option value="internship">Internship</option>
                </select>
            </div>

            {/* ── Job Cards ──────────────────────────────────────────── */}
            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-b-2 border-blue-600 rounded-full" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Briefcase className="w-14 h-14 mx-auto mb-4 text-gray-200" />
                    <p className="font-semibold text-gray-500 text-lg">No jobs match your filters</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or switching tabs</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((job, idx) => (
                        <motion.div key={job._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, type: 'spring', damping: 25 }}>
                            <JobCard job={job} onApply={() => setApplyJob(job)} onRefer={() => setReferJob(job)} />
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} onApplied={() => { setApplyJob(null); fetchJobs(); }} />}
                {referJob && <ReferModal job={referJob} onClose={() => setReferJob(null)} onReferred={() => { setReferJob(null); fetchJobs(); }} />}
            </AnimatePresence>
        </div>
    );
}

/* ── Job Card ───────────────────────────────────────────────────────────── */
function JobCard({ job, onApply, onRefer }: { job: JobPosting; onApply: () => void; onRefer: () => void }) {
    const [open, setOpen] = useState(false);
    const isPast = new Date(job.deadline) < new Date();
    const canApply = job.eligibility.eligible && !job.myApplication && !isPast;
    const canRefer = job.referral?.enabled && !isPast;

    return (
        <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${job.eligibility.eligible ? 'border-gray-100' : 'border-rose-100'}`}>
            <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    {/* Company Avatar */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${job.eligibility.eligible
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                        {job.company.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                            {job.eligibility.eligible ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3" /> Eligible
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                    <XCircle className="w-3 h-3" /> Not Eligible
                                </span>
                            )}
                            {job.myApplication && (() => {
                                const s = APP_STATUS_STYLES[job.myApplication.status] || APP_STATUS_STYLES.applied;
                                return (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                        {job.myApplication.status.charAt(0).toUpperCase() + job.myApplication.status.slice(1)}
                                    </span>
                                );
                            })()}
                        </div>
                        <p className="text-gray-500 text-sm font-medium">{job.company}</p>

                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5 font-medium">
                                {LOCATION_EMOJIS[job.location] || <MapPin className="w-3.5 h-3.5" />}
                                <span className="capitalize">{job.location}</span>
                            </span>
                            <span className="flex items-center gap-1.5 font-semibold text-gray-700">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> {job.ctc}
                            </span>
                            <span className="flex items-center gap-1.5 capitalize">
                                <Briefcase className="w-3.5 h-3.5 text-blue-500" /> {job.jobType}
                            </span>
                            <span className={`flex items-center gap-1.5 ${isPast ? 'text-rose-500' : ''}`}>
                                <Calendar className="w-3.5 h-3.5" />
                                {isPast ? 'Closed' : `Due ${new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                            </span>
                            {job.referral?.enabled && (
                                <span className="flex items-center gap-1.5 text-purple-600 font-semibold">
                                    <Sparkles className="w-3.5 h-3.5" /> Referral{job.referral.reward ? ` · ${job.referral.reward}` : ''}
                                </span>
                            )}
                        </div>

                        {/* Skills */}
                        {job.skillsRequired.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {job.skillsRequired.map(s => (
                                    <span key={s} className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium border border-gray-100">{s}</span>
                                ))}
                            </div>
                        )}

                        {/* Not eligible reasons */}
                        {!job.eligibility.eligible && job.eligibility.reasons.length > 0 && (
                            <div className="mt-3 bg-rose-50/70 border border-rose-100 rounded-xl px-4 py-2.5">
                                <p className="text-xs font-bold text-rose-600 mb-1">Why not eligible:</p>
                                <ul className="text-xs text-rose-500 space-y-0.5">
                                    {job.eligibility.reasons.map((r, i) => <li key={i}>• {r}</li>)}
                                </ul>
                            </div>
                        )}

                        {/* Expand description */}
                        <button onClick={() => setOpen(!open)}
                            className="mt-3 text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1 transition-colors">
                            {open ? 'Hide' : 'View'} Details
                            <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {open && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden">
                                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">{job.description}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                        {canApply ? (
                            <button onClick={onApply}
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2">
                                Apply Now <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        ) : job.myApplication ? (
                            <span className="px-5 py-2.5 bg-gray-50 text-gray-500 rounded-xl text-sm font-semibold cursor-default border border-gray-200">Applied ✓</span>
                        ) : (
                            <span className="px-5 py-2.5 bg-gray-50 text-gray-300 rounded-xl text-sm font-semibold cursor-not-allowed border border-gray-100">Apply</span>
                        )}
                        {canRefer && (
                            <button onClick={onRefer}
                                className="px-5 py-2.5 bg-purple-50 text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-2 justify-center">
                                <UserPlus className="w-3.5 h-3.5" /> Refer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Apply Modal ────────────────────────────────────────────────────────── */
function ApplyModal({ job, onClose, onApplied }: { job: JobPosting; onClose: () => void; onApplied: () => void }) {
    const [resume, setResume] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleApply = async () => {
        if (!resume) { setError('Please upload your resume.'); return; }
        setLoading(true); setError('');
        const fd = new FormData(); fd.append('resume', resume);
        const res = await fetch(`/api/student/jobs/${job._id}/apply`, { method: 'POST', body: fd });
        const data = await res.json(); setLoading(false);
        if (!data.success) { setError(data.message); return; }
        onApplied();
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <motion.div initial={{ y: 30, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">Apply to Job</h2>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5 text-white/80" /></button>
                    </div>
                    <p className="text-blue-100 text-sm mt-1">{job.title} at {job.company}</p>
                </div>

                <div className="p-6 space-y-5">
                    {/* Job summary */}
                    <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <DollarSign className="w-4 h-4 text-emerald-500" /><strong className="text-gray-700">{job.ctc}</strong>
                        <span className="text-gray-300">·</span>
                        <span className="capitalize">{job.location}</span>
                        <span className="text-gray-300">·</span>
                        <span className="capitalize">{job.jobType}</span>
                    </div>

                    {/* Resume upload */}
                    <div>
                        <p className="text-sm font-bold text-gray-700 mb-2">Upload Resume <span className="text-rose-400">*</span></p>
                        {resume ? (
                            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                                <FileText className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm text-emerald-700 font-medium flex-1 truncate">{resume.name}</span>
                                <button onClick={() => setResume(null)} className="text-emerald-400 hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                                <Upload className="w-8 h-8 text-gray-300" />
                                <span className="text-sm text-gray-500 font-medium">Click to upload resume</span>
                                <span className="text-xs text-gray-400">PDF or Image, max 5MB</span>
                                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={e => { if (e.target.files?.[0]) setResume(e.target.files[0]); }} />
                            </label>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-600 font-medium">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button onClick={handleApply} disabled={!resume || loading}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all">
                        <Send className="w-4 h-4" /> {loading ? 'Submitting…' : 'Submit Application'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ── Refer Modal ────────────────────────────────────────────────────────── */
function ReferModal({ job, onClose, onReferred }: { job: JobPosting; onClose: () => void; onReferred: () => void }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [resume, setResume] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRefer = async () => {
        if (!name || !email || !phone || !resume) { setError('All fields and resume are required.'); return; }
        setLoading(true); setError('');
        const fd = new FormData();
        fd.append('candidateName', name); fd.append('candidateEmail', email);
        fd.append('candidatePhone', phone); fd.append('resume', resume);
        const res = await fetch(`/api/student/jobs/${job._id}/refer`, { method: 'POST', body: fd });
        const data = await res.json(); setLoading(false);
        if (!data.success) { setError(data.message); return; }
        onReferred();
    };

    const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-sm';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <motion.div initial={{ y: 30, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-purple-600 to-violet-700 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2"><UserPlus className="w-5 h-5" /> Refer Candidate</h2>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5 text-white/80" /></button>
                    </div>
                    <p className="text-purple-100 text-sm mt-1">{job.title} at {job.company}</p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Referral info */}
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-sm">
                        {job.referral?.reward && <p className="text-purple-700 font-semibold">🎁 Reward: {job.referral.reward}</p>}
                        <p className="text-purple-500 text-xs mt-0.5">Referrals: {job.myReferralCount} / {job.referral?.maxPerStudent || 3} used</p>
                    </div>

                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Candidate Name *</label><input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email *</label><input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="candidate@email.com" /></div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone *</label><input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile" maxLength={10} inputMode="tel" /></div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Resume *</label>
                        {resume ? (
                            <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                                <FileText className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-purple-700 font-medium flex-1 truncate">{resume.name}</span>
                                <button onClick={() => setResume(null)} className="text-purple-400 hover:text-rose-500 transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all">
                                <Upload className="w-6 h-6 text-gray-300" />
                                <span className="text-sm text-gray-500 font-medium">Upload candidate resume</span>
                                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={e => { if (e.target.files?.[0]) setResume(e.target.files[0]); }} />
                            </label>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-600 font-medium">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button onClick={handleRefer} disabled={loading}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-violet-700 text-white rounded-xl text-sm font-bold hover:from-purple-700 hover:to-violet-800 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all">
                        <Send className="w-4 h-4" /> {loading ? 'Submitting…' : 'Submit Referral'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
