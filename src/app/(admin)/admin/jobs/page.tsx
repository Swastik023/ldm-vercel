'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Plus, X, Search, Edit2, Trash2, Eye, Users, UserPlus,
    MapPin, Calendar, DollarSign, ChevronDown, CheckCircle, XCircle,
    Clock, ArrowLeft, Download, Award, Filter, TrendingUp, Building2,
    GraduationCap, BarChart3
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

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    draft: { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' },
    published: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    closed: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
    applied: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    shortlisted: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    rejected: { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' },
    selected: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    referred: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    hired: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

const JOB_TYPES = [{ v: 'fulltime', l: 'Full-time' }, { v: 'internship', l: 'Internship' }];
const LOCATIONS = [{ v: 'remote', l: 'Remote' }, { v: 'onsite', l: 'Onsite' }, { v: 'hybrid', l: 'Hybrid' }];
const CURRENT_YEAR = new Date().getFullYear();
const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - 1 + i);

function StatusChip({ status }: { status: string }) {
    const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

/* ── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, gradient }: {
    icon: React.ReactNode; label: string; value: number | string; color: string; gradient: string;
}) {
    return (
        <div className={`relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm`}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-[4rem] opacity-10 ${gradient}`} />
            <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center text-white mb-3`}>
                {icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
        </div>
    );
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

    const totalApps = jobs.reduce((s, j) => s + j.applicationCount, 0);
    const totalRefs = jobs.reduce((s, j) => s + j.referralCount, 0);
    const activeJobs = jobs.filter(j => j.status === 'published').length;

    const deleteJob = async (id: string) => {
        if (!confirm('Delete this job posting?')) return;
        await fetch(`/api/admin/jobs/${id}`, { method: 'DELETE' });
        fetchJobs();
    };

    if (detailJob) return <JobDetailView job={detailJob} onBack={() => { setDetailJob(null); fetchJobs(); }} />;

    return (
        <div className="space-y-6">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl shadow-blue-600/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            Job Portal
                        </h1>
                        <p className="text-blue-100 text-sm mt-1">Manage campus recruitment drives, track applications and company partnerships.</p>
                    </div>
                    <button onClick={() => { setEditJob(null); setShowForm(true); }}
                        className="px-5 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-lg">
                        <Plus className="w-4 h-4" /> New Job
                    </button>
                </div>
            </div>

            {/* ── Stat Cards ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Briefcase className="w-5 h-5" />} label="Total Jobs Posted" value={jobs.length} color="blue" gradient="bg-gradient-to-br from-blue-500 to-blue-600" />
                <StatCard icon={<Users className="w-5 h-5" />} label="Total Applications" value={totalApps} color="emerald" gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
                <StatCard icon={<Building2 className="w-5 h-5" />} label="Active Listings" value={activeJobs} color="violet" gradient="bg-gradient-to-br from-violet-500 to-violet-600" />
                <StatCard icon={<UserPlus className="w-5 h-5" />} label="Total Referrals" value={totalRefs} color="amber" gradient="bg-gradient-to-br from-amber-500 to-amber-600" />
            </div>

            {/* ── Filters ────────────────────────────────────────────── */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by job title or company…"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer shadow-sm font-medium text-gray-700">
                    <option value="">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="closed">Closed</option>
                </select>
            </div>

            {/* ── Job Table ───────────────────────────────────────────── */}
            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-b-2 border-blue-600 rounded-full" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Briefcase className="w-14 h-14 mx-auto mb-4 text-gray-200" />
                    <p className="font-semibold text-gray-500 text-lg">No jobs found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-bold text-gray-800 text-sm">Job Listings</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Job</th>
                                    <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Type</th>
                                    <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">CTC / Stipend</th>
                                    <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Deadline</th>
                                    <th className="text-center px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Apps</th>
                                    <th className="text-center px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Refs</th>
                                    <th className="text-center px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-right px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((job, idx) => (
                                    <motion.tr key={job._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                    {job.company.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{job.title}</p>
                                                    <p className="text-gray-400 text-xs mt-0.5">{job.company}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 capitalize">{job.jobType}</span>
                                        </td>
                                        <td className="px-4 py-4 font-semibold text-gray-700">{job.ctc}</td>
                                        <td className="px-4 py-4 text-gray-500 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                {new Date(job.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Users className="w-4 h-4 text-blue-500" />
                                                <span className="font-bold text-gray-700">{job.applicationCount}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <UserPlus className="w-4 h-4 text-purple-500" />
                                                <span className="font-bold text-gray-700">{job.referralCount}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center"><StatusChip status={job.status} /></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setDetailJob(job)} className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600" title="View details"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => { setEditJob(job); setShowForm(true); }} className="p-2 hover:bg-amber-100 rounded-lg transition-colors text-amber-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => deleteJob(job._id)} className="p-2 hover:bg-rose-100 rounded-lg transition-colors text-rose-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>{showForm && <JobFormModal programs={programs} job={editJob} onClose={() => { setShowForm(false); setEditJob(null); }} onSaved={() => { setShowForm(false); setEditJob(null); fetchJobs(); }} />}</AnimatePresence>
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

    const toggleProgram = (id: string) => setEligibility(p => ({ ...p, programs: p.programs.includes(id) ? p.programs.filter(x => x !== id) : [...p.programs, id] }));
    const toggleYear = (y: number) => setEligibility(p => ({ ...p, graduationYears: p.graduationYears.includes(y) ? p.graduationYears.filter(x => x !== y) : [...p.graduationYears, y] }));

    const handleSave = async () => {
        if (!form.title || !form.company || !form.ctc || !form.description || !form.deadline) { setError('Fill in all required fields.'); return; }
        setSaving(true); setError('');
        const body = { ...form, skillsRequired: form.skillsRequired.split(',').map(s => s.trim()).filter(Boolean), eligibility, referral };
        const res = await fetch(isEdit ? `/api/admin/jobs/${job._id}` : '/api/admin/jobs', {
            method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        const data = await res.json(); setSaving(false);
        if (!data.success) { setError(data.message); return; }
        onSaved();
    };

    const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm';
    const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-6 px-4 overflow-y-auto">
            <motion.div initial={{ y: 30, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mb-8">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Job Posting' : 'Create New Job'}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Fill in the details to {isEdit ? 'update' : 'publish'} a job</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelCls}>Job Title *</label><input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Software Engineer" /></div>
                        <div><label className={labelCls}>Company *</label><input className={inputCls} value={form.company} onChange={e => set('company', e.target.value)} placeholder="e.g. TCS" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div><label className={labelCls}>Type *</label>
                            <select className={inputCls} value={form.jobType} onChange={e => set('jobType', e.target.value)}>
                                {JOB_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                            </select></div>
                        <div><label className={labelCls}>Location *</label>
                            <select className={inputCls} value={form.location} onChange={e => set('location', e.target.value)}>
                                {LOCATIONS.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
                            </select></div>
                        <div><label className={labelCls}>CTC / Stipend *</label><input className={inputCls} placeholder="₹6 LPA" value={form.ctc} onChange={e => set('ctc', e.target.value)} /></div>
                    </div>
                    <div><label className={labelCls}>Description *</label><textarea className={`${inputCls} h-28 resize-none`} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Job description, responsibilities, requirements…" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelCls}>Skills (comma separated)</label><input className={inputCls} placeholder="React, Node.js, MongoDB" value={form.skillsRequired} onChange={e => set('skillsRequired', e.target.value)} /></div>
                        <div><label className={labelCls}>Deadline *</label><input type="date" className={inputCls} value={form.deadline} onChange={e => set('deadline', e.target.value)} /></div>
                    </div>
                    <div><label className={labelCls}>Status</label>
                        <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                            <option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option>
                        </select></div>

                    {/* Eligibility */}
                    <div className="border-t border-gray-100 pt-5">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center"><GraduationCap className="w-3.5 h-3.5 text-amber-600" /></div>
                            Eligibility Rules
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className={labelCls}>Allowed Programs <span className="font-normal text-gray-400 normal-case tracking-normal">(none = all)</span></label>
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                    {programs.map(p => (
                                        <button key={p._id} onClick={() => toggleProgram(p._id)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${eligibility.programs.includes(p._id) ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm shadow-blue-100' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>
                                            {p.name}
                                        </button>
                                    ))}
                                    {programs.length === 0 && <p className="text-xs text-gray-400 italic">No programs available</p>}
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Graduation Years <span className="font-normal text-gray-400 normal-case tracking-normal">(none = all)</span></label>
                                <div className="flex flex-wrap gap-2 mt-1.5">
                                    {GRAD_YEARS.map(y => (
                                        <button key={y} onClick={() => toggleYear(y)}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${eligibility.graduationYears.includes(y) ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm shadow-blue-100' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className={labelCls}>Min 10th % <span className="font-normal text-gray-400 normal-case tracking-normal">(0 = no check)</span></label>
                                    <input type="number" min={0} max={100} className={inputCls} value={eligibility.min10thPct} onChange={e => setEligibility(p => ({ ...p, min10thPct: +e.target.value }))} /></div>
                                <div><label className={labelCls}>Min 12th % <span className="font-normal text-gray-400 normal-case tracking-normal">(0 = no check)</span></label>
                                    <input type="number" min={0} max={100} className={inputCls} value={eligibility.min12thPct} onChange={e => setEligibility(p => ({ ...p, min12thPct: +e.target.value }))} /></div>
                            </div>
                        </div>
                    </div>

                    {/* Referral */}
                    <div className="border-t border-gray-100 pt-5">
                        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center"><UserPlus className="w-3.5 h-3.5 text-purple-600" /></div>
                            Referral Configuration
                        </h3>
                        <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                            <input type="checkbox" checked={referral.enabled} onChange={e => setReferral(p => ({ ...p, enabled: e.target.checked }))}
                                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                            <span className="text-sm text-gray-700 font-medium">Enable student referrals for this job</span>
                        </label>
                        {referral.enabled && (
                            <div className="grid grid-cols-2 gap-4 mt-3">
                                <div><label className={labelCls}>Max per Student</label><input type="number" min={1} className={inputCls} value={referral.maxPerStudent} onChange={e => setReferral(p => ({ ...p, maxPerStudent: +e.target.value }))} /></div>
                                <div><label className={labelCls}>Reward (optional)</label><input className={inputCls} placeholder="₹5,000 on hire" value={referral.reward} onChange={e => setReferral(p => ({ ...p, reward: e.target.value }))} /></div>
                            </div>
                        )}
                    </div>

                    {error && <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-600 font-medium">{error}</div>}
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                    <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/25">
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
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.success) setReferrals(prev => prev.map(r => r._id === referralId ? { ...r, status, ...(rewardApproved !== undefined ? { rewardApproved } : {}) } : r));
    };

    const filteredApps = statusFilter ? applications.filter(a => a.status === statusFilter) : applications;
    const filteredRefs = statusFilter ? referrals.filter(r => r.status === statusFilter) : referrals;

    return (
        <div className="space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Jobs
            </button>

            {/* Job Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">{job.title}</h2>
                            <p className="text-blue-100 text-sm mt-0.5">{job.company} · <span className="capitalize">{job.jobType}</span> · <span className="capitalize">{job.location}</span></p>
                        </div>
                        <StatusChip status={job.status} />
                    </div>
                </div>
                <div className="px-6 py-4 flex items-center gap-6 text-sm text-gray-600 bg-gray-50/50">
                    <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-500" /><strong>{job.ctc}</strong></span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-500" />Deadline: {new Date(job.deadline).toLocaleDateString('en-IN')}</span>
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-500" /><strong>{applications.length}</strong> applications</span>
                    <span className="flex items-center gap-1.5"><UserPlus className="w-4 h-4 text-purple-500" /><strong>{referrals.length}</strong> referrals</span>
                </div>
            </div>

            {/* Tabs + Filter */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                    {(['applications', 'referrals'] as const).map(t => (
                        <button key={t} onClick={() => { setTab(t); setStatusFilter(''); }}
                            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {t === 'applications' ? `Applications (${applications.length})` : `Referrals (${referrals.length})`}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                        className="text-sm border border-gray-200 rounded-xl px-4 py-2 cursor-pointer shadow-sm font-medium">
                        <option value="">All Status</option>
                        {(tab === 'applications' ? ['applied', 'shortlisted', 'rejected', 'selected'] : ['referred', 'shortlisted', 'rejected', 'hired'])
                            .map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><div className="animate-spin w-10 h-10 border-b-2 border-blue-600 rounded-full" /></div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {tab === 'applications' ? (
                        filteredApps.length === 0 ? (
                            <div className="text-center py-16"><Users className="w-12 h-12 mx-auto mb-3 text-gray-200" /><p className="text-gray-400 font-medium">No applications yet</p></div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead><tr className="border-b border-gray-100">
                                    <th className="text-left px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Student</th>
                                    <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Roll No</th>
                                    <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Applied</th>
                                    <th className="text-center px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Resume</th>
                                    <th className="text-center px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-right px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Action</th>
                                </tr></thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredApps.map(app => (
                                        <tr key={app._id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900">{app.studentId?.fullName}</p>
                                                <p className="text-gray-400 text-xs">{app.studentId?.email}</p>
                                            </td>
                                            <td className="px-4 py-4 text-gray-600 font-medium">{app.studentId?.rollNumber || '—'}</td>
                                            <td className="px-4 py-4 text-gray-500 text-xs">{new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td className="px-4 py-4 text-center">
                                                <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                                                    <Download className="w-3.5 h-3.5" /> Resume
                                                </a>
                                            </td>
                                            <td className="px-4 py-4 text-center"><StatusChip status={app.status} /></td>
                                            <td className="px-6 py-4 text-right">
                                                <select value={app.status} onChange={e => updateAppStatus(app._id, e.target.value)}
                                                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer font-medium shadow-sm">
                                                    {['applied', 'shortlisted', 'rejected', 'selected'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )
                    ) : (
                        filteredRefs.length === 0 ? (
                            <div className="text-center py-16"><UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-200" /><p className="text-gray-400 font-medium">No referrals yet</p></div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead><tr className="border-b border-gray-100">
                                    <th className="text-left px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Candidate</th>
                                    <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Referred By</th>
                                    <th className="text-center px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Resume</th>
                                    <th className="text-center px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-center px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Reward</th>
                                    <th className="text-right px-6 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Action</th>
                                </tr></thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredRefs.map(ref => (
                                        <tr key={ref._id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900">{ref.candidateName}</p>
                                                <p className="text-gray-400 text-xs">{ref.candidateEmail} · {ref.candidatePhone}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-gray-700 font-medium">{ref.referredBy?.fullName}</p>
                                                <p className="text-gray-400 text-xs">{ref.referredBy?.rollNumber || ref.referredBy?.email}</p>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <a href={ref.resumeUrl} target="_blank" rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors">
                                                    <Download className="w-3.5 h-3.5" /> Resume
                                                </a>
                                            </td>
                                            <td className="px-4 py-4 text-center"><StatusChip status={ref.status} /></td>
                                            <td className="px-4 py-4 text-center">
                                                {ref.rewardApproved
                                                    ? <span className="text-emerald-600 text-xs font-bold flex items-center justify-center gap-1"><Award className="w-4 h-4" /> Approved</span>
                                                    : ref.status === 'hired'
                                                        ? <button onClick={() => updateRefStatus(ref._id, ref.status, true)} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">Approve Reward</button>
                                                        : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <select value={ref.status} onChange={e => updateRefStatus(ref._id, e.target.value)}
                                                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer font-medium shadow-sm">
                                                    {['referred', 'shortlisted', 'rejected', 'hired'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
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
