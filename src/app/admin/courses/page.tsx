'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, Plus, Search, Edit2, Trash2, X,
    GraduationCap, Award, Users, ToggleLeft, ToggleRight,
    Save, AlertCircle, Tag, Upload, CheckCircle2, ChevronDown, RefreshCw
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
    eligibilitySummary: string;
    image: string;
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3 ${gradient}`}>{icon}</div>
            <p className="text-2xl font-black text-gray-900">{value}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
        </div>
    );
}

/* ── Section Divider ─────────────────────────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2 pb-1 border-b border-gray-100">{title}</h3>
            {children}
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
    const [syncing, setSyncing] = useState(false);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/admin/courses');
        const d = await res.json();
        if (d.success) setCourses(d.courses);
        setLoading(false);
    }, []);

    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"?\n\nIf students are enrolled it will be deactivated instead of deleted.`)) return;
        const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
        const d = await res.json();
        if (d.softDisabled) alert(`ℹ️ ${d.message}`);
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
        if (!confirm('Populate all 31 programs with full descriptions, syllabus and career data?')) return;
        setMigrating(true); setMigrateMsg('');
        const res = await fetch('/api/admin/courses/migrate', { method: 'POST' });
        const d = await res.json();
        setMigrateMsg(d.message || 'Done');
        setMigrating(false);
        fetchCourses();
    };

    const handleSyncPricing = async () => {
        if (!confirm('Copy existing fee data from the old pricing system into Program records?')) return;
        setSyncing(true); setMigrateMsg('');
        const res = await fetch('/api/admin/courses/migrate', { method: 'GET' });
        const d = await res.json();
        setMigrateMsg(d.message || 'Done');
        setSyncing(false);
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
                <div className="relative flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <h1 className="text-2xl font-bold">Course Management</h1>
                        </div>
                        <p className="text-blue-100 text-sm ml-[52px]">Add, edit & configure courses shown on the website</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSyncPricing} disabled={syncing}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 border border-white/20">
                            <RefreshCw className="w-4 h-4" /> {syncing ? 'Syncing…' : 'Sync Pricing'}
                        </button>
                        <button onClick={handleMigrate} disabled={migrating}
                            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 border border-white/20">
                            <Upload className="w-4 h-4" /> {migrating ? 'Populating…' : 'Populate Content'}
                        </button>
                        <button onClick={() => { setEditCourse(null); setShowForm(true); }}
                            className="px-5 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-lg">
                            <Plus className="w-4 h-4" /> Add Course
                        </button>
                    </div>
                </div>
                {migrateMsg && <p className="mt-3 text-sm text-blue-100 bg-white/10 rounded-lg px-3 py-1.5 inline-block">{migrateMsg}</p>}
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
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Course</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Code</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Duration</th>
                                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Fee (Offer)</th>
                                    <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Students</th>
                                    <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((course, idx) => (
                                    <motion.tr key={course._id}
                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${course.course_type === 'diploma' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
                                                    {course.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 leading-tight">{course.name}</p>
                                                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${course.course_type === 'diploma' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {course.course_type}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-gray-500 font-mono text-xs uppercase">{course.code}</td>
                                        <td className="px-4 py-4 text-gray-600">{course.duration_years}Y / {course.total_semesters}S</td>
                                        <td className="px-4 py-4">
                                            {course.pricing?.totalFee ? (
                                                <div>
                                                    <span className={course.pricing.isOfferActive && course.pricing.offerPrice ? 'line-through text-gray-400 text-xs' : 'font-semibold text-gray-800'}>
                                                        {fmt(course.pricing.totalFee)}
                                                    </span>
                                                    {course.pricing.isOfferActive && course.pricing.offerPrice ? (
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="font-semibold text-emerald-600">{fmt(course.pricing.offerPrice)}</span>
                                                            <span className="text-[10px] font-bold bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-full">
                                                                {Math.round(((course.pricing.totalFee - course.pricing.offerPrice) / course.pricing.totalFee) * 100)}% OFF
                                                            </span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : <span className="text-gray-300">—</span>}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 text-gray-600">
                                                <Users className="w-3.5 h-3.5 text-gray-400" /> {course.studentCount}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button onClick={() => handleToggle(course)} title={course.is_active ? 'Click to deactivate' : 'Click to activate'}>
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
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit course">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(course._id, course.name)}
                                                    className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete course">
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

/* ── Form Modal ─────────────────────────────────────────────────────────── */
function CourseFormModal({ course, onClose, onSaved }: { course: Course | null; onClose: () => void; onSaved: () => void }) {
    const isEdit = !!course;
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // ── Core fields ──────────────────────────────────────────────────────────
    const [name, setName] = useState(course?.name || '');
    const [code, setCode] = useState(course?.code || '');
    const [courseType, setCourseType] = useState<'diploma' | 'certificate'>(course?.course_type || 'diploma');
    const [durationYears, setDurationYears] = useState(course?.duration_years?.toString() || '1');
    const [totalSemesters, setTotalSemesters] = useState(course?.total_semesters?.toString() || '2');
    const [displayOrder, setDisplayOrder] = useState(course?.displayOrder?.toString() || '0');

    // ── Website content ───────────────────────────────────────────────────────
    const [description, setDescription] = useState(
        course?.description || ''
    );
    const [eligibility, setEligibility] = useState(course?.eligibilitySummary || '');
    const [image, setImage] = useState(course?.image || '');
    const [imageUploading, setImageUploading] = useState(false);
    const [imageError, setImageError] = useState('');
    const [syllabusText, setSyllabusText] = useState((course?.syllabus || []).join('\n'));
    const [careerText, setCareerText] = useState((course?.careerOptions || []).join('\n'));

    // ── Pricing ───────────────────────────────────────────────────────────────
    const p = course?.pricing || EMPTY_PRICING;
    const [totalFee, setTotalFee] = useState(p.totalFee?.toString() || '0');
    const [paymentType, setPaymentType] = useState(p.paymentType || 'one-time');
    const [scholarship, setScholarship] = useState(p.scholarshipAvailable || false);
    const [isOfferActive, setIsOfferActive] = useState(p.isOfferActive || false);
    const [offerPrice, setOfferPrice] = useState(p.offerPrice?.toString() || '');
    const [offerLabel, setOfferLabel] = useState(p.offerLabel || 'Limited Time Offer');
    const [offerValidUntil, setOfferValidUntil] = useState(p.offerValidUntil ? new Date(p.offerValidUntil).toISOString().slice(0, 16) : '');
    const [seatLimit, setSeatLimit] = useState(p.seatLimit?.toString() || '');

    const handleSave = async () => {
        if (!name.trim()) { setError('Course name is required.'); return; }
        if (!code.trim()) { setError('Course code is required.'); return; }
        if (!totalFee || Number(totalFee) <= 0) { setError('Total fee must be greater than 0.'); return; }
        if (isOfferActive && (!offerPrice || Number(offerPrice) <= 0)) {
            setError('Offer price is required when offer is active.'); return;
        }
        if (isOfferActive && offerPrice && Number(offerPrice) >= Number(totalFee)) {
            setError('Offer price must be less than the total fee.'); return;
        }

        setSaving(true); setError('');
        const body: any = {
            name: name.trim(),
            code: code.toLowerCase().trim(),
            description,
            duration_years: Number(durationYears),
            total_semesters: Number(totalSemesters),
            course_type: courseType,
            eligibilitySummary: eligibility,
            shortDescription: description, // keep shortDescription in sync
            image,
            syllabus: syllabusText.split('\n').map(s => s.trim()).filter(Boolean),
            careerOptions: careerText.split('\n').map(s => s.trim()).filter(Boolean),
            displayOrder: Number(displayOrder),
            pricing: {
                totalFee: Number(totalFee),
                paymentType,
                currency: 'INR',
                scholarshipAvailable: scholarship,
                isOfferActive,
                offerPrice: isOfferActive && offerPrice ? Number(offerPrice) : null,
                offerLabel: isOfferActive ? offerLabel : '',
                offerValidUntil: isOfferActive && offerValidUntil ? new Date(offerValidUntil) : null,
                seatLimit: isOfferActive && seatLimit ? Number(seatLimit) : null,
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

    const inp = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm';
    const lbl = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <motion.div initial={{ y: 30, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex-shrink-0 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">{isEdit ? `Edit — ${course.name}` : 'Add New Course'}</h2>
                        <p className="text-blue-200 text-xs mt-0.5">All fields marked * are required</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5 text-white/80" /></button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* 1 — Basic Details */}
                    <Section title="Basic Details">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className={lbl}>Course Name *</label>
                                <input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Diploma in Medical Lab Technology" />
                            </div>
                            <div>
                                <label className={lbl}>Course Code *{isEdit && <span className="text-gray-300 ml-1 normal-case font-normal">(locked)</span>}</label>
                                <input className={inp + (isEdit ? ' bg-gray-50 text-gray-400' : '')} value={code} onChange={e => setCode(e.target.value)} placeholder="dmlt" disabled={isEdit} />
                                {!isEdit && <p className="text-xs text-gray-400 mt-1">Short unique ID like "dmlt" or "bsc-nursing". Cannot be changed later.</p>}
                            </div>
                            <div>
                                <label className={lbl}>Course Type</label>
                                <select className={inp} value={courseType} onChange={e => setCourseType(e.target.value as any)}>
                                    <option value="diploma">Diploma</option>
                                    <option value="certificate">Certificate</option>
                                </select>
                            </div>
                            <div>
                                <label className={lbl}>Duration (Years)</label>
                                <input type="number" step="0.5" min="0.5" max="6" className={inp} value={durationYears} onChange={e => setDurationYears(e.target.value)} />
                            </div>
                            <div>
                                <label className={lbl}>Total Semesters</label>
                                <input type="number" min="1" max="12" className={inp} value={totalSemesters} onChange={e => setTotalSemesters(e.target.value)} />
                            </div>
                            <div>
                                <label className={lbl}>Display Order</label>
                                <input type="number" min="0" className={inp} value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} placeholder="0" />
                                <p className="text-xs text-gray-400 mt-1">Lower number = appears first on website.</p>
                            </div>
                        </div>
                    </Section>

                    {/* 2 — Website Content */}
                    <Section title="Website Content">
                        <div>
                            <label className={lbl}>Eligibility</label>
                            <input className={inp} value={eligibility} onChange={e => setEligibility(e.target.value)} placeholder="10+2 / 12th Pass in any stream" />
                        </div>
                        <div>
                            <label className={lbl}>Description <span className="text-gray-300 normal-case font-normal">(shown on course listing &amp; detail page)</span></label>
                            <textarea className={`${inp} h-24 resize-none`} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the course, its scope and career potential…" />
                        </div>
                        <div>
                            <label className={lbl}>Course Image</label>

                            {/* Upload Box */}
                            <label
                                htmlFor="course-img-upload"
                                className={`relative flex flex-col items-center justify-center gap-2 w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${imageUploading
                                        ? 'border-blue-300 bg-blue-50'
                                        : 'border-gray-200 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40'
                                    }`}
                            >
                                {imageUploading ? (
                                    <>
                                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-xs text-blue-600 font-medium">Uploading…</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 text-gray-400" />
                                        <p className="text-xs text-gray-500 text-center">
                                            <span className="text-blue-600 font-semibold">Click to upload</span> or drag &amp; drop<br />
                                            <span className="text-gray-400">JPG, PNG, WebP · max 3MB</span>
                                        </p>
                                    </>
                                )}
                                <input
                                    id="course-img-upload"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="sr-only"
                                    disabled={imageUploading}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setImageUploading(true);
                                        setImageError('');
                                        try {
                                            const fd = new FormData();
                                            fd.append('image', file);
                                            const res = await fetch('/api/admin/courses/upload-image', { method: 'POST', body: fd });
                                            const data = await res.json();
                                            if (data.success) {
                                                setImage(data.url);
                                            } else {
                                                setImageError(data.message || 'Upload failed.');
                                            }
                                        } catch {
                                            setImageError('Upload failed. Please try again.');
                                        } finally {
                                            setImageUploading(false);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </label>

                            {/* Error */}
                            {imageError && <p className="text-xs text-rose-500 mt-1 font-medium">{imageError}</p>}

                            {/* Preview */}
                            {image && (
                                <div className="mt-3 relative inline-block">
                                    <img src={image} alt="Course preview" className="w-40 h-24 object-cover rounded-xl border border-gray-200 shadow-sm" />
                                    <button
                                        type="button"
                                        onClick={() => { setImage(''); setImageError(''); }}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"
                                        title="Remove image"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[160px]">{image}</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className={lbl}>Syllabus Topics <span className="text-gray-300 normal-case font-normal">(one per line)</span></label>
                            <textarea className={`${inp} h-28 resize-none`} value={syllabusText} onChange={e => setSyllabusText(e.target.value)} placeholder={"Patient monitoring techniques\nVentilator management\nLab procedures…"} />
                        </div>
                        <div>
                            <label className={lbl}>Career Options <span className="text-gray-300 normal-case font-normal">(one per line)</span></label>
                            <textarea className={`${inp} h-24 resize-none`} value={careerText} onChange={e => setCareerText(e.target.value)} placeholder={"ICU Technician\nCritical Care Assistant\nHospital Lab Analyst…"} />
                        </div>
                    </Section>

                    {/* 3 — Pricing */}
                    <Section title="Pricing">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={lbl}>Total Course Fee (₹) *</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                    <input type="number" min="0" className={`${inp} pl-8`} value={totalFee} onChange={e => setTotalFee(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className={lbl}>Payment Structure</label>
                                <select className={inp} value={paymentType} onChange={e => setPaymentType(e.target.value as any)}>
                                    <option value="one-time">One-time (full upfront)</option>
                                    <option value="semester-wise">Per Semester</option>
                                    <option value="installments">Installments</option>
                                </select>
                            </div>
                        </div>

                        <button onClick={() => setScholarship(!scholarship)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${scholarship ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                            <Award className="w-4 h-4" />
                            Scholarship: {scholarship ? 'Available ✓' : 'Not available'}
                        </button>

                        {/* Offer sub-section */}
                        <div className={`rounded-2xl border p-4 space-y-4 transition-colors ${isOfferActive ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-rose-500" /> Special Offer / Discount
                                    </h4>
                                    <p className="text-xs text-gray-400 mt-0.5">Enable to show a discounted price with countdown on the website</p>
                                </div>
                                <button onClick={() => setIsOfferActive(!isOfferActive)} className="flex items-center gap-2">
                                    {isOfferActive
                                        ? <ToggleRight className="w-8 h-8 text-emerald-500" />
                                        : <ToggleLeft className="w-8 h-8 text-gray-300" />}
                                    <span className={`text-xs font-bold ${isOfferActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {isOfferActive ? 'ON' : 'OFF'}
                                    </span>
                                </button>
                            </div>

                            {isOfferActive && (
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-emerald-100">
                                    <div>
                                        <label className={lbl}>Offer Price (₹) *</label>
                                        <div className="relative">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                                            <input type="number" min="0" className={`${inp} pl-8`} value={offerPrice} onChange={e => setOfferPrice(e.target.value)} placeholder={`Less than ${totalFee || '…'}`} />
                                        </div>
                                        {offerPrice && totalFee && Number(offerPrice) < Number(totalFee) && (
                                            <p className="text-xs text-emerald-600 mt-1 font-semibold">
                                                {Math.round(((Number(totalFee) - Number(offerPrice)) / Number(totalFee)) * 100)}% discount
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className={lbl}>Offer Label</label>
                                        <input className={inp} value={offerLabel} onChange={e => setOfferLabel(e.target.value)} placeholder="Early Bird / Festival Offer" />
                                    </div>
                                    <div>
                                        <label className={lbl}>Valid Until <span className="text-gray-300 font-normal">(optional)</span></label>
                                        <input type="datetime-local" className={inp} value={offerValidUntil} onChange={e => setOfferValidUntil(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={lbl}>Seat Limit <span className="text-gray-300 font-normal">(optional)</span></label>
                                        <input type="number" min="1" className={inp} value={seatLimit} onChange={e => setSeatLimit(e.target.value)} placeholder="Leave blank = unlimited" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Section>

                    {error && (
                        <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-600 font-medium">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                    <span className="text-xs text-gray-400">* Required fields</span>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={saving}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all">
                            <Save className="w-4 h-4" /> {saving ? 'Saving…' : isEdit ? 'Update Course' : 'Create Course'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
