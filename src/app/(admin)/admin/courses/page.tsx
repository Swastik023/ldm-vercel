'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Plus, Search, Edit2, Trash2, X, ChevronDown,
    GraduationCap, Award, DollarSign, Users, ToggleLeft, ToggleRight,
    Save, AlertCircle, Sparkles, Tag, Clock, Briefcase, CheckCircle2,
    Upload
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────── */
interface Pricing {
    totalFee: number;
    paymentType: 'one-time' | 'semester-wise' | 'installments';
    offerPrice: number | null;
    isOfferActive: boolean;
    offerValidUntil: string | null;
    offerLabel: string;
    seatLimit: number | null;
    currency: string;
    scholarshipAvailable: boolean;
}

interface Course {
    _id: string;
    name: string;
    code: string;
    description: string;
    duration_years: number;
    total_semesters: number;
    course_type: 'diploma' | 'certificate';
    is_active: boolean;
    shortDescription: string;
    image: string;
    eligibilitySummary: string;
    syllabus: string[];
    careerOptions: string[];
    displayOrder: number;
    pricing: Pricing;
    studentCount: number;
}

const EMPTY_PRICING: Pricing = {
    totalFee: 0, paymentType: 'one-time', offerPrice: null,
    isOfferActive: false, offerValidUntil: null, offerLabel: 'Limited Time Offer',
    seatLimit: null, currency: 'INR', scholarshipAvailable: false,
};

function fmt(n: number) { return `₹${n.toLocaleString('en-IN')}`; }

/* ── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, gradient }: { icon: React.ReactNode; label: string; value: number; gradient: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 -translate-y-1/3 translate-x-1/3 rounded-full opacity-10 bg-current" />
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 ${gradient}`}>
                {icon}
            </div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
        </div>
    );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editCourse, setEditCourse] = useState<Course | null>(null);
    const [migrating, setMigrating] = useState(false);
    const [migrateMsg, setMigrateMsg] = useState('');

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/courses');
        const d = await res.json();
        if (d.success) setCourses(d.courses);
        setLoading(false);
    }, []);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? If students are enrolled, it will be deactivated instead.`)) return;
        const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
        const d = await res.json();
        if (d.softDisabled) alert(d.message);
        fetchCourses();
    };

    const handleToggle = async (course: Course) => {
        await fetch(`/api/admin/courses/${course._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !course.is_active }),
        });
        fetchCourses();
    };

    const handleMigrate = async () => {
        if (!confirm('This will import courses from the hardcoded data into the database. Continue?')) return;
        setMigrating(true); setMigrateMsg('');
        const res = await fetch('/api/admin/courses/migrate', { method: 'POST' });
        const d = await res.json();
        setMigrateMsg(d.message || 'Done');
        setMigrating(false);
        fetchCourses();
    };

    const filtered = courses.filter(c => {
        if (typeFilter && c.course_type !== typeFilter) return false;
        if (statusFilter === 'active' && !c.is_active) return false;
        if (statusFilter === 'inactive' && c.is_active) return false;
        if (search) {
            const q = search.toLowerCase();
            return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
        }
        return true;
    });

    const totalActive = courses.filter(c => c.is_active).length;
    const diplomas = courses.filter(c => c.course_type === 'diploma').length;
    const certificates = courses.filter(c => c.course_type === 'certificate').length;

    return (
        <div className="space-y-6 max-w-6xl">
            {/* ── Hero Header ──────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 text-white shadow-xl shadow-blue-600/20">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <h1 className="text-2xl font-bold">Course Management</h1>
                        </div>
                        <p className="text-blue-100 text-sm">Configure courses, pricing, and website display</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleMigrate} disabled={migrating}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 border border-white/20">
                            <Upload className="w-4 h-4" /> {migrating ? 'Importing…' : 'Import Legacy'}
                        </button>
                        <button onClick={() => { setEditCourse(null); setShowForm(true); }}
                            className="px-5 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-lg">
                            <Plus className="w-4 h-4" /> Add Course
                        </button>
                    </div>
                </div>
                {migrateMsg && <p className="mt-2 text-sm text-blue-100 bg-white/10 rounded-lg px-3 py-1.5 inline-block">{migrateMsg}</p>}
            </div>

            {/* ── Stats ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<BookOpen className="w-5 h-5" />} label="Total Courses" value={courses.length} gradient="bg-gradient-to-br from-blue-500 to-blue-600" />
                <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Active" value={totalActive} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" />
                <StatCard icon={<GraduationCap className="w-5 h-5" />} label="Diplomas" value={diplomas} gradient="bg-gradient-to-br from-violet-500 to-violet-600" />
                <StatCard icon={<Award className="w-5 h-5" />} label="Certificates" value={certificates} gradient="bg-gradient-to-br from-amber-500 to-amber-600" />
            </div>

            {/* ── Filters ──────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses…"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm" />
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer shadow-sm font-medium text-gray-700">
                    <option value="">All Types</option>
                    <option value="diploma">Diploma</option>
                    <option value="certificate">Certificate</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm cursor-pointer shadow-sm font-medium text-gray-700">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {/* ── Table ────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-b-2 border-blue-600 rounded-full" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <BookOpen className="w-14 h-14 mx-auto mb-4 text-gray-200" />
                    <p className="font-semibold text-gray-500 text-lg">No courses found</p>
                    <p className="text-gray-400 text-sm mt-1">Try a different search or add a new course</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Course</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Code</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Duration</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Fee</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Offer</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Students</th>
                                    <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((course, idx) => (
                                    <motion.tr key={course._id}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03, type: 'spring', damping: 25 }}
                                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${course.course_type === 'diploma'
                                                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                                        : 'bg-gradient-to-br from-amber-500 to-orange-600'
                                                    }`}>{course.name.charAt(0)}</div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 leading-tight">{course.name}</p>
                                                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${course.course_type === 'diploma'
                                                            ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                                                        }`}>{course.course_type}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-500 font-mono text-xs uppercase">{course.code}</td>
                                        <td className="px-4 py-4 text-gray-600">{course.duration_years}Y / {course.total_semesters}S</td>
                                        <td className="px-4 py-4 font-semibold text-gray-800">
                                            {course.pricing?.totalFee ? fmt(course.pricing.totalFee) : '—'}
                                        </td>
                                        <td className="px-4 py-4">
                                            {course.pricing?.isOfferActive && course.pricing.offerPrice ? (
                                                <div>
                                                    <span className="font-semibold text-emerald-600">{fmt(course.pricing.offerPrice)}</span>
                                                    <span className="ml-1 text-[10px] font-bold bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-full">
                                                        {course.pricing.totalFee > 0 ? Math.round(((course.pricing.totalFee - course.pricing.offerPrice) / course.pricing.totalFee) * 100) : 0}% OFF
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="flex items-center gap-1.5 text-gray-600">
                                                <Users className="w-3.5 h-3.5 text-gray-400" /> {course.studentCount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button onClick={() => handleToggle(course)}
                                                className="inline-flex items-center gap-1.5 transition-colors">
                                                {course.is_active ? (
                                                    <ToggleRight className="w-7 h-7 text-emerald-500" />
                                                ) : (
                                                    <ToggleLeft className="w-7 h-7 text-gray-300" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => { setEditCourse(course); setShowForm(true); }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(course._id, course.name)}
                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Form Modal ──────────────────────────────────────── */}
            <AnimatePresence>
                {showForm && (
                    <CourseFormModal
                        course={editCourse}
                        onClose={() => { setShowForm(false); setEditCourse(null); }}
                        onSaved={() => { setShowForm(false); setEditCourse(null); fetchCourses(); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Form Modal Component ───────────────────────────────────────────────── */
function CourseFormModal({ course, onClose, onSaved }: { course: Course | null; onClose: () => void; onSaved: () => void }) {
    const isEdit = !!course;
    const [tab, setTab] = useState<'basic' | 'website' | 'pricing'>('basic');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [name, setName] = useState(course?.name || '');
    const [code, setCode] = useState(course?.code || '');
    const [description, setDescription] = useState(course?.description || '');
    const [durationYears, setDurationYears] = useState(course?.duration_years?.toString() || '1');
    const [totalSemesters, setTotalSemesters] = useState(course?.total_semesters?.toString() || '2');
    const [courseType, setCourseType] = useState<'diploma' | 'certificate'>(course?.course_type || 'diploma');
    const [eligibility, setEligibility] = useState(course?.eligibilitySummary || '');
    const [shortDesc, setShortDesc] = useState(course?.shortDescription || '');
    const [image, setImage] = useState(course?.image || '');
    const [syllabusText, setSyllabusText] = useState((course?.syllabus || []).join('\n'));
    const [careerText, setCareerText] = useState((course?.careerOptions || []).join('\n'));
    const [displayOrder, setDisplayOrder] = useState(course?.displayOrder?.toString() || '0');

    // Pricing state
    const p = course?.pricing || EMPTY_PRICING;
    const [totalFee, setTotalFee] = useState(p.totalFee?.toString() || '0');
    const [paymentType, setPaymentType] = useState(p.paymentType || 'one-time');
    const [offerPrice, setOfferPrice] = useState(p.offerPrice?.toString() || '');
    const [isOfferActive, setIsOfferActive] = useState(p.isOfferActive || false);
    const [offerValidUntil, setOfferValidUntil] = useState(p.offerValidUntil ? new Date(p.offerValidUntil).toISOString().slice(0, 16) : '');
    const [offerLabel, setOfferLabel] = useState(p.offerLabel || 'Limited Time Offer');
    const [seatLimit, setSeatLimit] = useState(p.seatLimit?.toString() || '');
    const [currency, setCurrency] = useState(p.currency || 'INR');
    const [scholarship, setScholarship] = useState(p.scholarshipAvailable || false);

    const handleSave = async () => {
        if (!name || !code) { setError('Name and Code are required.'); return; }
        setSaving(true); setError('');

        const body: any = {
            name, code: code.toLowerCase().trim(), description,
            duration_years: Number(durationYears),
            total_semesters: Number(totalSemesters),
            course_type: courseType,
            eligibilitySummary: eligibility,
            shortDescription: shortDesc,
            image,
            syllabus: syllabusText.split('\n').map(s => s.trim()).filter(Boolean),
            careerOptions: careerText.split('\n').map(s => s.trim()).filter(Boolean),
            displayOrder: Number(displayOrder),
            pricing: {
                totalFee: Number(totalFee) || 0,
                paymentType,
                offerPrice: offerPrice ? Number(offerPrice) : null,
                isOfferActive,
                offerValidUntil: offerValidUntil ? new Date(offerValidUntil) : null,
                offerLabel,
                seatLimit: seatLimit ? Number(seatLimit) : null,
                currency,
                scholarshipAvailable: scholarship,
            },
        };

        const url = isEdit ? `/api/admin/courses/${course._id}` : '/api/admin/courses';
        const method = isEdit ? 'PATCH' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const d = await res.json();
        setSaving(false);
        if (!d.success) { setError(d.message); return; }
        onSaved();
    };

    const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm';
    const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

    const tabs = [
        { key: 'basic' as const, label: 'Basic Info', icon: <BookOpen className="w-3.5 h-3.5" /> },
        { key: 'website' as const, label: 'Website', icon: <Sparkles className="w-3.5 h-3.5" /> },
        { key: 'pricing' as const, label: 'Pricing', icon: <DollarSign className="w-3.5 h-3.5" /> },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <motion.div initial={{ y: 30, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Gradient Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">{isEdit ? 'Edit Course' : 'New Course'}</h2>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5 text-white/80" /></button>
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-1 mt-4">
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${tab === t.key ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                                    }`}>
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* ── Basic Info Tab ──────────────────── */}
                    {tab === 'basic' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className={labelCls}>Course Name *</label>
                                    <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Diploma in Medical Lab Technology" />
                                </div>
                                <div>
                                    <label className={labelCls}>Course Code *</label>
                                    <input className={inputCls} value={code} onChange={e => setCode(e.target.value)} placeholder="dmlt" disabled={isEdit} />
                                </div>
                                <div>
                                    <label className={labelCls}>Course Type</label>
                                    <select className={inputCls} value={courseType} onChange={e => setCourseType(e.target.value as any)}>
                                        <option value="diploma">Diploma</option>
                                        <option value="certificate">Certificate</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Duration (Years)</label>
                                    <input type="number" step="0.5" min="0.5" className={inputCls} value={durationYears} onChange={e => setDurationYears(e.target.value)} />
                                </div>
                                <div>
                                    <label className={labelCls}>Total Semesters</label>
                                    <input type="number" min="1" className={inputCls} value={totalSemesters} onChange={e => setTotalSemesters(e.target.value)} />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelCls}>Eligibility</label>
                                    <input className={inputCls} value={eligibility} onChange={e => setEligibility(e.target.value)} placeholder="12th Pass" />
                                </div>
                                <div className="col-span-2">
                                    <label className={labelCls}>Full Description</label>
                                    <textarea className={`${inputCls} h-28 resize-none`} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detailed course description…" />
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── Website Tab ──────────────────────── */}
                    {tab === 'website' && (
                        <>
                            <div>
                                <label className={labelCls}>Short Description (Website)</label>
                                <textarea className={`${inputCls} h-20 resize-none`} value={shortDesc} onChange={e => setShortDesc(e.target.value)} placeholder="Brief description for course cards" />
                            </div>
                            <div>
                                <label className={labelCls}>Image URL</label>
                                <input className={inputCls} value={image} onChange={e => setImage(e.target.value)} placeholder="/course_img/dmlt.jpeg" />
                                {image && <img src={image} alt="Preview" className="mt-2 w-32 h-20 object-cover rounded-lg border" />}
                            </div>
                            <div>
                                <label className={labelCls}>Display Order</label>
                                <input type="number" className={inputCls} value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} placeholder="0" />
                            </div>
                            <div>
                                <label className={labelCls}>Syllabus Topics (one per line)</label>
                                <textarea className={`${inputCls} h-28 resize-none`} value={syllabusText} onChange={e => setSyllabusText(e.target.value)} placeholder="Patient monitoring techniques\nVentilator management\n..." />
                            </div>
                            <div>
                                <label className={labelCls}>Career Options (one per line)</label>
                                <textarea className={`${inputCls} h-28 resize-none`} value={careerText} onChange={e => setCareerText(e.target.value)} placeholder="ICU Technician\nCritical Care Assistant\n..." />
                            </div>
                        </>
                    )}

                    {/* ── Pricing Tab ─────────────────────── */}
                    {tab === 'pricing' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Total Course Fee</label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                        <input type="number" className={`${inputCls} pl-8`} value={totalFee} onChange={e => setTotalFee(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelCls}>Payment Type</label>
                                    <select className={inputCls} value={paymentType} onChange={e => setPaymentType(e.target.value as any)}>
                                        <option value="one-time">One-time</option>
                                        <option value="semester-wise">Semester-wise</option>
                                        <option value="installments">Installments</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Currency</label>
                                    <select className={inputCls} value={currency} onChange={e => setCurrency(e.target.value)}>
                                        <option value="INR">₹ INR</option>
                                        <option value="USD">$ USD</option>
                                    </select>
                                </div>
                                <div className="flex items-end pb-1">
                                    <button onClick={() => setScholarship(!scholarship)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${scholarship ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-500'
                                            }`}>
                                        <Award className="w-4 h-4" />
                                        Scholarship {scholarship ? 'Available' : 'N/A'}
                                    </button>
                                </div>
                            </div>

                            {/* Offer Section */}
                            <div className="mt-4 border border-gray-100 rounded-2xl p-4 space-y-4 bg-gray-50/50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-rose-500" /> Special Offer
                                    </h3>
                                    <button onClick={() => setIsOfferActive(!isOfferActive)}
                                        className="flex items-center gap-2">
                                        {isOfferActive ? (
                                            <ToggleRight className="w-7 h-7 text-emerald-500" />
                                        ) : (
                                            <ToggleLeft className="w-7 h-7 text-gray-300" />
                                        )}
                                        <span className={`text-xs font-semibold ${isOfferActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                            {isOfferActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </button>
                                </div>
                                {isOfferActive && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>Offer Price</label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                                <input type="number" className={`${inputCls} pl-8`} value={offerPrice} onChange={e => setOfferPrice(e.target.value)} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Offer Label</label>
                                            <input className={inputCls} value={offerLabel} onChange={e => setOfferLabel(e.target.value)} placeholder="Early Bird" />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Valid Until</label>
                                            <input type="datetime-local" className={inputCls} value={offerValidUntil} onChange={e => setOfferValidUntil(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Seat Limit</label>
                                            <input type="number" className={inputCls} value={seatLimit} onChange={e => setSeatLimit(e.target.value)} placeholder="Unlimited" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-600 font-medium">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                    <button onClick={handleSave} disabled={saving}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all">
                        <Save className="w-4 h-4" /> {saving ? 'Saving…' : isEdit ? 'Update Course' : 'Create Course'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
