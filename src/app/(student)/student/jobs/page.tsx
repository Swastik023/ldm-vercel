'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, MapPin, Calendar, DollarSign, CheckCircle2, XCircle,
    Upload, X, Search, Clock, UserPlus, FileText, Send, AlertCircle,
    ChevronDown, Sparkles
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface ProgramRef { _id: string; name: string; code: string; }
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

const STATUS_COLORS: Record<string, string> = {
    applied: 'bg-blue-100 text-blue-700', shortlisted: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-600', selected: 'bg-emerald-100 text-emerald-700',
};

const LOCATION_ICONS: Record<string, string> = { remote: '🌐', onsite: '🏢', hybrid: '🔄' };

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
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-blue-600" /> Job Portal
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">{jobs.length} open positions</p>
            </div>

            {/* Tabs + Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                    {[
                        { key: 'all', label: 'All Jobs', count: jobs.length },
                        { key: 'eligible', label: 'Eligible', count: jobs.filter(j => j.eligibility.eligible).length },
                        { key: 'applied', label: 'My Applications', count: jobs.filter(j => j.myApplication).length },
                    ].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                            {t.label} ({t.count})
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs or skills…"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer">
                    <option value="">All Types</option>
                    <option value="fulltime">Full-time</option>
                    <option value="internship">Internship</option>
                </select>
            </div>

            {/* Job Cards */}
            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-semibold">No jobs match your filters</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map(job => (
                        <JobCard key={job._id} job={job} onApply={() => setApplyJob(job)} onRefer={() => setReferJob(job)} />
                    ))}
                </div>
            )}

            {/* Apply Modal */}
            <AnimatePresence>
                {applyJob && <ApplyModal job={applyJob} onClose={() => setApplyJob(null)} onApplied={() => { setApplyJob(null); fetchJobs(); }} />}
                {referJob && <ReferModal job={referJob} onClose={() => setReferJob(null)} onReferred={() => { setReferJob(null); fetchJobs(); }} />}
            </AnimatePresence>
        </div>
    );
}

/* ── Job Card ───────────────────────────────────────────────────────────── */
function JobCard({ job, onApply, onRefer }: { job: JobPosting; onApply: () => void; onRefer: () => void }) {
    const [showDetails, setShowDetails] = useState(false);
    const isPastDeadline = new Date(job.deadline) < new Date();
    const canApply = job.eligibility.eligible && !job.myApplication && !isPastDeadline;
    const canRefer = job.referral?.enabled && !isPastDeadline;

    return (
        <div className={`bg-white rounded-2xl shadow-md border ${job.eligibility.eligible ? 'border-gray-100' : 'border-red-100'} overflow-hidden transition-all hover:shadow-lg`}>
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    {/* Title + meta */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                            {/* Eligibility badge */}
                            {job.eligibility.eligible ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                    <CheckCircle2 className="w-3 h-3" /> Eligible
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                                    <XCircle className="w-3 h-3" /> Not Eligible
                                </span>
                            )}
                            {job.myApplication && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[job.myApplication.status]}`}>
                                    {job.myApplication.status.charAt(0).toUpperCase() + job.myApplication.status.slice(1)}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm mt-1">{job.company}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">{LOCATION_ICONS[job.location] || '📍'} <span className="capitalize">{job.location}</span></span>
                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.ctc}</span>
                            <span className="flex items-center gap-1 capitalize"><Briefcase className="w-3 h-3" />{job.jobType}</span>
                            <span className={`flex items-center gap-1 ${isPastDeadline ? 'text-red-500' : ''}`}>
                                <Calendar className="w-3 h-3" />{isPastDeadline ? 'Closed' : `Due ${new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                            </span>
                            {job.referral?.enabled && (
                                <span className="flex items-center gap-1 text-purple-600"><Sparkles className="w-3 h-3" />Referral{job.referral.reward ? `: ${job.referral.reward}` : ''}</span>
                            )}
                        </div>
                        {/* Skills */}
                        {job.skillsRequired.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {job.skillsRequired.map(s => (
                                    <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">{s}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                        {canApply ? (
                            <button onClick={onApply}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-colors">
                                Apply Now
                            </button>
                        ) : job.myApplication ? (
                            <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-semibold cursor-default">Applied ✓</span>
                        ) : (
                            <span className="px-4 py-2 bg-gray-100 text-gray-400 rounded-xl text-sm font-semibold cursor-not-allowed">Apply</span>
                        )}
                        {canRefer && (
                            <button onClick={onRefer}
                                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1 justify-center">
                                <UserPlus className="w-3.5 h-3.5" /> Refer
                            </button>
                        )}
                    </div>
                </div>

                {/* Not eligible reasons */}
                {!job.eligibility.eligible && job.eligibility.reasons.length > 0 && (
                    <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                        <p className="text-xs font-semibold text-red-600 mb-1">Why not eligible:</p>
                        <ul className="text-xs text-red-500 space-y-0.5">
                            {job.eligibility.reasons.map((r, i) => <li key={i}>• {r}</li>)}
                        </ul>
                    </div>
                )}

                {/* Expandable description */}
                <button onClick={() => setShowDetails(!showDetails)}
                    className="mt-3 text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
                    {showDetails ? 'Hide' : 'View'} Details
                    <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                    {showDetails && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden">
                            <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">{job.description}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
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
        const fd = new FormData();
        fd.append('resume', resume);
        const res = await fetch(`/api/student/jobs/${job._id}/apply`, { method: 'POST', body: fd });
        const data = await res.json();
        setLoading(false);
        if (!data.success) { setError(data.message); return; }
        onApplied();
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Apply to {job.title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
                        <p className="font-semibold">{job.company}</p>
                        <p className="text-blue-500 text-xs">{job.ctc} · {job.location} · {job.jobType}</p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Upload Resume <span className="text-red-400">*</span></p>
                        {resume ? (
                            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                                <FileText className="w-5 h-5 text-emerald-600" />
                                <span className="text-sm text-emerald-700 font-medium flex-1 truncate">{resume.name}</span>
                                <button onClick={() => setResume(null)} className="text-emerald-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                                <Upload className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-500">Click to upload (PDF/Image, max 5MB)</span>
                                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={e => { if (e.target.files?.[0]) setResume(e.target.files[0]); }} />
                            </label>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
                    <button onClick={handleApply} disabled={!resume || loading}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/20">
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
        fd.append('candidateName', name);
        fd.append('candidateEmail', email);
        fd.append('candidatePhone', phone);
        fd.append('resume', resume);
        const res = await fetch(`/api/student/jobs/${job._id}/refer`, { method: 'POST', body: fd });
        const data = await res.json();
        setLoading(false);
        if (!data.success) { setError(data.message); return; }
        onReferred();
    };

    const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><UserPlus className="w-5 h-5 text-purple-600" /> Refer Candidate</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-sm">
                        <p className="font-semibold text-purple-700">{job.title} at {job.company}</p>
                        {job.referral?.reward && <p className="text-purple-500 text-xs mt-0.5">🎁 Reward: {job.referral.reward}</p>}
                        <p className="text-purple-400 text-xs">Referrals used: {job.myReferralCount}/{job.referral?.maxPerStudent || 3}</p>
                    </div>

                    <div><label className="block text-xs font-semibold text-gray-500 mb-1.5">Candidate Name *</label><input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
                    <div><label className="block text-xs font-semibold text-gray-500 mb-1.5">Email *</label><input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="candidate@email.com" /></div>
                    <div><label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone *</label><input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile" maxLength={10} inputMode="tel" /></div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Resume *</label>
                        {resume ? (
                            <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                                <FileText className="w-5 h-5 text-purple-600" />
                                <span className="text-sm text-purple-700 font-medium flex-1 truncate">{resume.name}</span>
                                <button onClick={() => setResume(null)} className="text-purple-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center gap-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl py-5 cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-colors">
                                <Upload className="w-5 h-5 text-gray-400" />
                                <span className="text-sm text-gray-500">Upload candidate resume</span>
                                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={e => { if (e.target.files?.[0]) setResume(e.target.files[0]); }} />
                            </label>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Cancel</button>
                    <button onClick={handleRefer} disabled={loading}
                        className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-600/20">
                        <Send className="w-4 h-4" /> {loading ? 'Submitting…' : 'Submit Referral'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
