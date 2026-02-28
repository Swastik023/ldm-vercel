'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Plus, X, Search, Edit2, Trash2, Eye, Users, UserPlus,
    MapPin, Calendar, DollarSign, ChevronDown, CheckCircle, XCircle,
    Clock, ArrowLeft, Download, Award, Filter
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface ProgramRef { _id: string; name: string; code: string; }
interface JobPosting {
    _id: string; title: string; company: string; jobType: string; location: string;
    ctc: string; description: string; skillsRequired: string[]; deadline: string;
    status: string; createdAt: string;
    eligibility: { programs: ProgramRef[]; graduationYears: number[]; min10thPct: number; min12thPct: number; };
    referral: { enabled: boolean; maxPerStudent: number; reward: string; };
    applicationCount: number; referralCount: number;
}
interface Application {
    _id: string; status: string; resumeUrl: string; resumeType: string; appliedAt: string; adminNotes: string;
    studentId: { _id: string; fullName: string; email: string; rollNumber?: string; mobileNumber?: string; };
}
interface Referral {
    _id: string; candidateName: string; candidateEmail: string; candidatePhone: string;
    resumeUrl: string; resumeType: string; status: string; rewardApproved: boolean; adminNotes: string; createdAt: string;
    referredBy: { _id: string; fullName: string; email: string; rollNumber?: string; };
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600', published: 'bg-emerald-100 text-emerald-700', closed: 'bg-red-100 text-red-600',
    applied: 'bg-blue-100 text-blue-700', shortlisted: 'bg-amber-100 text-amber-700', rejected: 'bg-red-100 text-red-600',
    selected: 'bg-emerald-100 text-emerald-700', referred: 'bg-blue-100 text-blue-700', hired: 'bg-emerald-100 text-emerald-700',
};

const JOB_TYPES = [{ v: 'fulltime', l: 'Full-time' }, { v: 'internship', l: 'Internship' }];
const LOCATIONS = [{ v: 'remote', l: 'Remote' }, { v: 'onsite', l: 'Onsite' }, { v: 'hybrid', l: 'Hybrid' }];
const CURRENT_YEAR = new Date().getFullYear();
const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - 1 + i);

function Chip({ text, color }: { text: string; color?: string }) {
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color || STATUS_COLORS[text] || 'bg-gray-100 text-gray-600'}`}>{text}</span>;
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function AdminJobsPage() {
    const [jobs, setJobs] = useState<JobPosting[]>([]);
    const [programs, setPrograms] = useState<ProgramRef[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editJob, setEditJob] = useState<JobPosting | null>(null);
    const [detailJob, setDetailJob] = useState<JobPosting | null>(null);

    const fetchJobs = useCallback(async () => {
        const res = await fetch('/api/admin/jobs'); const d = await res.json();
        if (d.success) setJobs(d.jobs);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchJobs();
        fetch('/api/public/programs').then(r => r.json()).then(d => { if (d.success) setPrograms(d.programs); });
    }, [fetchJobs]);

    const filtered = jobs.filter(j => {
        if (statusFilter && j.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
        }
        return true;
    });

    const deleteJob = async (id: string) => {
        if (!confirm('Delete this job posting?')) return;
        await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' });
        fetchJobs();
    };

    // ── Detail view (applications + referrals) ────────────────────────────
    if (detailJob) return (
        <JobDetailView job={detailJob} onBack={() => { setDetailJob(null); fetchJobs(); }} />
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Briefcase className="w-6 h-6 text-blue-600" /> Job Portal</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{jobs.length} total postings</p>
                </div>
                <button onClick={() => { setEditJob(null); setShowForm(true); }}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20">
                    <Plus className="w-4 h-4" /> New Job
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search job title or company…"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer">
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            {/* Job Table */}
            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-semibold">No jobs found</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Job</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Deadline</th>
                                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Apps</th>
                                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Refs</th>
                                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                                    <th className="text-right px-5 py-3 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(job => (
                                    <tr key={job._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-gray-900">{job.title}</p>
                                            <p className="text-gray-400 text-xs">{job.company}</p>
                                        </td>
                                        <td className="px-4 py-4 capitalize text-gray-600">{job.jobType}</td>
                                        <td className="px-4 py-4 text-gray-500">{new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 text-blue-600 font-semibold"><Users className="w-3.5 h-3.5" />{job.applicationCount}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-flex items-center gap-1 text-purple-600 font-semibold"><UserPlus className="w-3.5 h-3.5" />{job.referralCount}</span>
                                        </td>
                                        <td className="px-4 py-4 text-center"><Chip text={job.status} /></td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setDetailJob(job)} className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600" title="View"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => { setEditJob(job); setShowForm(true); }} className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => deleteJob(job._id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create/Edit Job Modal */}
            <AnimatePresence>
                {showForm && (
                    <JobFormModal
                        programs={programs}
                        job={editJob}
                        onClose={() => { setShowForm(false); setEditJob(null); }}
                        onSaved={() => { setShowForm(false); setEditJob(null); fetchJobs(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Job Form Modal ─────────────────────────────────────────────────────── */
function JobFormModal({ programs, job, onClose, onSaved }: {
    programs: ProgramRef[]; job: JobPosting | null; onClose: () => void; onSaved: () => void;
}) {
    const isEdit = !!job;
    const [form, setForm] = useState({
        title: job?.title || '', company: job?.company || '', jobType: job?.jobType || 'fulltime',
        location: job?.location || 'onsite', ctc: job?.ctc || '', description: job?.description || '',
        skillsRequired: job?.skillsRequired?.join(', ') || '', deadline: job?.deadline?.slice(0, 10) || '',
        status: job?.status || 'draft',
    });
    const [eligibility, setEligibility] = useState({
        programs: job?.eligibility?.programs?.map(p => p._id) || [] as string[],
        graduationYears: job?.eligibility?.graduationYears || [] as number[],
        min10thPct: job?.eligibility?.min10thPct || 0,
        min12thPct: job?.eligibility?.min12thPct || 0,
    });
    const [referral, setReferral] = useState({
        enabled: job?.referral?.enabled || false,
        maxPerStudent: job?.referral?.maxPerStudent || 3,
        reward: job?.referral?.reward || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

    const toggleProgram = (id: string) => {
        setEligibility(p => ({
            ...p,
            programs: p.programs.includes(id) ? p.programs.filter(x => x !== id) : [...p.programs, id],
        }));
    };
    const toggleYear = (y: number) => {
        setEligibility(p => ({
            ...p,
            graduationYears: p.graduationYears.includes(y) ? p.graduationYears.filter(x => x !== y) : [...p.graduationYears, y],
        }));
    };

    const handleSave = async () => {
        if (!form.title || !form.company || !form.ctc || !form.description || !form.deadline) {
            setError('Fill in all required fields.'); return;
        }
        setSaving(true); setError('');
        const body = {
            ...form,
            skillsRequired: form.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
            eligibility,
            referral,
        };

        const url = isEdit ? `/api/admin/jobs/${job._id}` : '/api/admin/jobs';
        const method = isEdit ? 'PATCH' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        setSaving(false);
        if (!data.success) { setError(data.message); return; }
        onSaved();
    };

    const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-8 px-4 overflow-y-auto">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mb-8">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Job' : 'Create New Job'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelCls}>Job Title *</label><input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} /></div>
                        <div><label className={labelCls}>Company *</label><input className={inputCls} value={form.company} onChange={e => set('company', e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={labelCls}>Type *</label>
                            <select className={inputCls} value={form.jobType} onChange={e => set('jobType', e.target.value)}>
                                {JOB_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Location *</label>
                            <select className={inputCls} value={form.location} onChange={e => set('location', e.target.value)}>
                                {LOCATIONS.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
                            </select>
                        </div>
                        <div><label className={labelCls}>CTC / Stipend *</label><input className={inputCls} placeholder="₹6 LPA" value={form.ctc} onChange={e => set('ctc', e.target.value)} /></div>
                    </div>
                    <div><label className={labelCls}>Description *</label><textarea className={`${inputCls} h-24 resize-none`} value={form.description} onChange={e => set('description', e.target.value)} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelCls}>Skills (comma separated)</label><input className={inputCls} placeholder="React, Node.js, MongoDB" value={form.skillsRequired} onChange={e => set('skillsRequired', e.target.value)} /></div>
                        <div><label className={labelCls}>Deadline *</label><input type="date" className={inputCls} value={form.deadline} onChange={e => set('deadline', e.target.value)} /></div>
                    </div>
                    <div>
                        <label className={labelCls}>Status</label>
                        <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    {/* Eligibility Rules */}
                    <div className="border-t border-gray-100 pt-4">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Eligibility Rules</h3>
                        <div className="space-y-3">
                            <div>
                                <label className={labelCls}>Allowed Programs <span className="font-normal text-gray-400">(none = all)</span></label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {programs.map(p => (
                                        <button key={p._id} onClick={() => toggleProgram(p._id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${eligibility.programs.includes(p._id) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Graduation Years <span className="font-normal text-gray-400">(none = all)</span></label>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {GRAD_YEARS.map(y => (
                                        <button key={y} onClick={() => toggleYear(y)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${eligibility.graduationYears.includes(y) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelCls}>Min 10th % (0 = no check)</label><input type="number" min={0} max={100} className={inputCls} value={eligibility.min10thPct} onChange={e => setEligibility(p => ({ ...p, min10thPct: +e.target.value }))} /></div>
                                <div><label className={labelCls}>Min 12th % (0 = no check)</label><input type="number" min={0} max={100} className={inputCls} value={eligibility.min12thPct} onChange={e => setEligibility(p => ({ ...p, min12thPct: +e.target.value }))} /></div>
                            </div>
                        </div>
                    </div>

                    {/* Referral Config */}
                    <div className="border-t border-gray-100 pt-4">
                        <h3 className="text-sm font-bold text-gray-700 mb-3">Referral Configuration</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={referral.enabled} onChange={e => setReferral(p => ({ ...p, enabled: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm text-gray-700 font-medium">Enable student referrals</span>
                            </label>
                            {referral.enabled && (
                                <div className="grid grid-cols-2 gap-4 pl-7">
                                    <div><label className={labelCls}>Max per Student</label><input type="number" min={1} className={inputCls} value={referral.maxPerStudent} onChange={e => setReferral(p => ({ ...p, maxPerStudent: +e.target.value }))} /></div>
                                    <div><label className={labelCls}>Reward (optional)</label><input className={inputCls} placeholder="₹5,000 on hire" value={referral.reward} onChange={e => setReferral(p => ({ ...p, reward: e.target.value }))} /></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20">
                        {saving ? 'Saving…' : (isEdit ? 'Update Job' : 'Create Job')}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ── Job Detail View (Applications + Referrals) ────────────────────────── */
function JobDetailView({ job, onBack }: { job: JobPosting; onBack: () => void }) {
    const [tab, setTab] = useState<'applications' | 'referrals'>('applications');
    const [applications, setApplications] = useState<Application[]>([]);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`/api/admin/jobs/${job._id}/applications`).then(r => r.json()),
            fetch(`/api/admin/jobs/${job._id}/referrals`).then(r => r.json()),
        ]).then(([appsD, refsD]) => {
            if (appsD.success) setApplications(appsD.applications);
            if (refsD.success) setReferrals(refsD.referrals);
        }).finally(() => setLoading(false));
    }, [job._id]);

    const updateAppStatus = async (applicationId: string, status: string) => {
        const res = await fetch(`/api/admin/jobs/${job._id}/applications`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId, status }),
        });
        const data = await res.json();
        if (data.success) setApplications(prev => prev.map(a => a._id === applicationId ? { ...a, status } : a));
    };

    const updateRefStatus = async (referralId: string, status: string, rewardApproved?: boolean) => {
        const body: any = { referralId, status };
        if (rewardApproved !== undefined) body.rewardApproved = rewardApproved;
        const res = await fetch(`/api/admin/jobs/${job._id}/referrals`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.success) setReferrals(prev => prev.map(r => r._id === referralId ? { ...r, status, ...(rewardApproved !== undefined ? { rewardApproved } : {}) } : r));
    };

    const filteredApps = statusFilter ? applications.filter(a => a.status === statusFilter) : applications;
    const filteredRefs = statusFilter ? referrals.filter(r => r.status === statusFilter) : referrals;

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-blue-600 text-sm font-semibold hover:text-blue-700">
                <ArrowLeft className="w-4 h-4" /> Back to Jobs
            </button>

            {/* Job Header */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
                        <p className="text-gray-500 text-sm mt-0.5">{job.company} · <span className="capitalize">{job.jobType}</span> · <span className="capitalize">{job.location}</span></p>
                    </div>
                    <Chip text={job.status} />
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{job.ctc}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Deadline: {new Date(job.deadline).toLocaleDateString('en-IN')}</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4" />{job.applicationCount} applications</span>
                    <span className="flex items-center gap-1"><UserPlus className="w-4 h-4" />{job.referralCount} referrals</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                <button onClick={() => { setTab('applications'); setStatusFilter(''); }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'applications' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                    Applications ({applications.length})
                </button>
                <button onClick={() => { setTab('referrals'); setStatusFilter(''); }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'referrals' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                    Referrals ({referrals.length})
                </button>
            </div>

            {/* Filter by status */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer">
                    <option value="">All</option>
                    {tab === 'applications'
                        ? ['applied', 'shortlisted', 'rejected', 'selected'].map(s => <option key={s} value={s}>{s}</option>)
                        : ['referred', 'shortlisted', 'rejected', 'hired'].map(s => <option key={s} value={s}>{s}</option>)
                    }
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-b-2 border-blue-600 rounded-full" /></div>
            ) : (
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                    {tab === 'applications' ? (
                        filteredApps.length === 0 ? (
                            <p className="text-center py-12 text-gray-400">No applications yet.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Student</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Roll No</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Applied</th>
                                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Resume</th>
                                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                                        <th className="text-right px-5 py-3 font-semibold text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredApps.map(app => (
                                        <tr key={app._id} className="hover:bg-gray-50/50">
                                            <td className="px-5 py-3">
                                                <p className="font-semibold text-gray-900">{app.studentId?.fullName}</p>
                                                <p className="text-gray-400 text-xs">{app.studentId?.email}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{app.studentId?.rollNumber || '—'}</td>
                                            <td className="px-4 py-3 text-gray-500">{new Date(app.appliedAt).toLocaleDateString('en-IN')}</td>
                                            <td className="px-4 py-3 text-center">
                                                <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100">
                                                    <Download className="w-3.5 h-3.5" /> Resume
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 text-center"><Chip text={app.status} /></td>
                                            <td className="px-5 py-3 text-right">
                                                <select value={app.status} onChange={e => updateAppStatus(app._id, e.target.value)}
                                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 cursor-pointer">
                                                    {['applied', 'shortlisted', 'rejected', 'selected'].map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    ) : (
                        filteredRefs.length === 0 ? (
                            <p className="text-center py-12 text-gray-400">No referrals yet.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Candidate</th>
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Referred By</th>
                                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Resume</th>
                                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                                        <th className="text-center px-4 py-3 font-semibold text-gray-600">Reward</th>
                                        <th className="text-right px-5 py-3 font-semibold text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredRefs.map(ref => (
                                        <tr key={ref._id} className="hover:bg-gray-50/50">
                                            <td className="px-5 py-3">
                                                <p className="font-semibold text-gray-900">{ref.candidateName}</p>
                                                <p className="text-gray-400 text-xs">{ref.candidateEmail} · {ref.candidatePhone}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-gray-700">{ref.referredBy?.fullName}</p>
                                                <p className="text-gray-400 text-xs">{ref.referredBy?.rollNumber || ref.referredBy?.email}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <a href={ref.resumeUrl} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100">
                                                    <Download className="w-3.5 h-3.5" /> Resume
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 text-center"><Chip text={ref.status} /></td>
                                            <td className="px-4 py-3 text-center">
                                                {ref.rewardApproved
                                                    ? <span className="text-emerald-600 text-xs font-semibold flex items-center justify-center gap-1"><Award className="w-3.5 h-3.5" /> Approved</span>
                                                    : ref.status === 'hired'
                                                        ? <button onClick={() => updateRefStatus(ref._id, ref.status, true)} className="text-xs text-blue-600 font-semibold hover:underline">Approve</button>
                                                        : <span className="text-gray-400 text-xs">—</span>
                                                }
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <select value={ref.status} onChange={e => updateRefStatus(ref._id, e.target.value)}
                                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 cursor-pointer">
                                                    {['referred', 'shortlisted', 'rejected', 'hired'].map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    )}
                </div>
            )}
        </div>
    );
}
