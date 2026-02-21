'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    FaGraduationCap, FaUser, FaEnvelope, FaPhone,
    FaBookOpen, FaCheckCircle, FaWhatsapp, FaArrowRight,
    FaSpinner
} from 'react-icons/fa';

// ─── Course list ───────────────────────────────────────────────────────────────
const COURSES = [
    'Diploma in Medical Laboratory Technology (DMLT)',
    'Diploma in Operation Theatre Technology (DOTT)',
    'Diploma in Anaesthesia Technology (DAT)',
    'Diploma in Radiology & Imaging Technology (DRIT)',
    'Diploma in Critical Care Management (DCCM)',
    'Diploma in Hospital Management (DHM)',
    'Diploma in Hospital Administration (DHA)',
    'Diploma in Community Care Provider (DCP)',
    'Diploma in Emergency & Trauma Care Technician (DETC)',
    'Diploma in Health & Sanitary Inspector (DHSI)',
    'Diploma in Home Care Provider (DHCP)',
    'Diploma in Hospital Waste Management (DHWM)',
    'Diploma in Nanny Training (DNT)',
    'Diploma in Panchkarma (DP)',
    'Multipurpose Health Worker (MPHW)',
    'Certificate in Ayurveda Infertility Management (CAIM)',
    'Certificate in Ayurveda Nutrition & Dietetics (CAND)',
    'Certificate in Ayurveda Parasurgery (CAP)',
    'Certificate in Ayurvedic Cosmetology, Skin & Beauty Care (CACSBC)',
    'Other / Not Sure',
];

const QUALIFICATIONS = [
    '10th Pass',
    '12th Pass (Arts/Commerce)',
    '12th Pass (Science)',
    'Graduate',
    'BAMS / Other Medical Degree',
    'Other',
];

// ─── Types ─────────────────────────────────────────────────────────────────────
interface FormData {
    name: string;
    email: string;
    phone: string;
    course: string;
    qualification: string;
    message: string;
}
interface FormErrors { name?: string; email?: string; phone?: string; course?: string; }
type Status = 'idle' | 'loading' | 'success' | 'error';

function validate(d: FormData): FormErrors {
    const e: FormErrors = {};
    if (!d.name.trim()) e.name = 'Full name is required.';
    if (!d.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'Valid email is required.';
    if (!d.phone.trim() || !/^[\d\s\+\-\(\)]{7,15}$/.test(d.phone)) e.phone = 'Valid phone number is required.';
    if (!d.course) e.course = 'Please select a course.';
    return e;
}

const inputCls = (err?: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${err ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200 bg-white focus:ring-violet-500 focus:border-violet-400'
    }`;

function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return (
        <AnimatePresence>
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-1 text-xs text-red-500 flex items-center gap-1"
            >
                {msg}
            </motion.p>
        </AnimatePresence>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function CollectInfo() {
    const [form, setForm] = useState<FormData>({ name: '', email: '', phone: '', course: '', qualification: '', message: '' });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
    const [status, setStatus] = useState<Status>('idle');
    const [serverError, setServerError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const updated = { ...form, [name]: value };
        setForm(updated);
        if (touched[name as keyof FormData]) {
            setErrors(prev => ({ ...prev, [name]: validate(updated)[name as keyof FormErrors] }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => ({ ...prev, [name]: validate(form)[name as keyof FormErrors] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ name: true, email: true, phone: true, course: true });
        const errs = validate(form);
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        setStatus('loading');
        setServerError('');
        try {
            const res = await fetch('/api/public/admission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setStatus('success');
            } else {
                setStatus('error');
                setServerError(data.message || 'Something went wrong. Please try again.');
            }
        } catch {
            setStatus('error');
            setServerError('Network error. Please call us directly.');
        }
    };

    const handleReset = () => {
        setForm({ name: '', email: '', phone: '', course: '', qualification: '', message: '' });
        setErrors({}); setTouched({}); setStatus('idle'); setServerError('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-4">
                        <FaGraduationCap className="w-4 h-4" /> Admissions Open 2025
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                        Apply for a <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">Course</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        Fill in the form below — our admissions team will contact you within 24 hours.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-5 gap-8">
                    {/* ── Left Info Panel ── */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                        className="lg:col-span-2 space-y-4"
                    >
                        {/* Info cards */}
                        {[
                            { icon: <FaBookOpen className="w-5 h-5" />, title: '19+ Courses', desc: 'Paramedical, Ayurvedic, and healthcare management programs', color: 'from-violet-500 to-purple-600' },
                            { icon: <FaCheckCircle className="w-5 h-5" />, title: '98% Placement', desc: 'Industry tie-ups with hospitals and healthcare institutions', color: 'from-blue-500 to-cyan-600' },
                            { icon: <FaGraduationCap className="w-5 h-5" />, title: 'NAAC Accredited', desc: 'Recognized by national accreditation bodies and universities', color: 'from-emerald-500 to-teal-600' },
                        ].map(c => (
                            <div key={c.title} className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c.color} text-white shrink-0`}>{c.icon}</div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">{c.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
                                </div>
                            </div>
                        ))}

                        {/* Direct contact */}
                        <div className="bg-gradient-to-br from-violet-700 to-blue-700 rounded-2xl p-5 text-white">
                            <p className="font-semibold mb-3 text-sm">Prefer to talk directly?</p>
                            <a href="tel:+919896607010" className="flex items-center gap-2 text-sm hover:text-violet-200 transition-colors mb-2">
                                <FaPhone className="w-3.5 h-3.5" /> +91 989-660-7010
                            </a>
                            <a
                                href="https://wa.me/919896607010?text=Hi,%20I%20want%20to%20enquire%20about%20admissions%20at%20LDM%20College."
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm mt-3 py-2.5 px-4 bg-green-500 hover:bg-green-400 rounded-xl font-semibold transition-colors"
                            >
                                <FaWhatsapp className="w-4 h-4" /> Chat on WhatsApp
                            </a>
                        </div>

                        <Link href="/courses" className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl border-2 border-violet-200 text-violet-700 font-medium text-sm hover:bg-violet-50 transition-colors">
                            Browse all courses <FaArrowRight className="w-3 h-3" />
                        </Link>
                    </motion.div>

                    {/* ── Right: Form ── */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                        className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
                    >
                        <AnimatePresence mode="wait">
                            {/* ── SUCCESS ── */}
                            {status === 'success' && (
                                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center text-center py-12 gap-5"
                                >
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
                                    >
                                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <motion.path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"
                                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.2 }} />
                                        </svg>
                                    </motion.div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Received!</h3>
                                        <p className="text-gray-500 max-w-xs text-sm">
                                            Thank you for your interest in LDM College. Our admissions team will contact you within 24 hours.
                                        </p>
                                    </div>
                                    <div className="flex gap-3 flex-wrap justify-center">
                                        <button onClick={handleReset} className="text-violet-600 hover:text-violet-700 font-semibold text-sm underline underline-offset-4">
                                            Submit another
                                        </button>
                                        <Link href="/courses" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                                            Browse courses <FaArrowRight className="w-3 h-3" />
                                        </Link>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── FORM ── */}
                            {status !== 'success' && (
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Course Application Form</h2>
                                        <p className="text-gray-400 text-sm mt-1">Fields marked <span className="text-red-500">*</span> are required</p>
                                    </div>

                                    {/* Server error */}
                                    <AnimatePresence>
                                        {status === 'error' && serverError && (
                                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
                                            >
                                                <p className="text-red-700 text-sm">{serverError}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                                        {/* Name + Phone */}
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Full Name <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                    <input name="name" type="text" autoComplete="name" placeholder="e.g. Ravi Kumar"
                                                        value={form.name} onChange={handleChange} onBlur={handleBlur} disabled={status === 'loading'}
                                                        className={`${inputCls(touched.name ? errors.name : undefined)} pl-10`}
                                                    />
                                                </div>
                                                <FieldError msg={touched.name ? errors.name : undefined} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Phone Number <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                    <input name="phone" type="tel" autoComplete="tel" placeholder="+91 98XXXXXXXX"
                                                        value={form.phone} onChange={handleChange} onBlur={handleBlur} disabled={status === 'loading'}
                                                        className={`${inputCls(touched.phone ? errors.phone : undefined)} pl-10`}
                                                    />
                                                </div>
                                                <FieldError msg={touched.phone ? errors.phone : undefined} />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Email Address <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                <input name="email" type="email" autoComplete="email" placeholder="you@example.com"
                                                    value={form.email} onChange={handleChange} onBlur={handleBlur} disabled={status === 'loading'}
                                                    className={`${inputCls(touched.email ? errors.email : undefined)} pl-10`}
                                                />
                                            </div>
                                            <FieldError msg={touched.email ? errors.email : undefined} />
                                        </div>

                                        {/* Course + Qualification */}
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Preferred Course <span className="text-red-500">*</span>
                                                </label>
                                                <select name="course" value={form.course} onChange={handleChange} onBlur={handleBlur}
                                                    disabled={status === 'loading'}
                                                    className={`${inputCls(touched.course ? errors.course : undefined)} appearance-none`}
                                                >
                                                    <option value="">Select a course…</option>
                                                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <FieldError msg={touched.course ? errors.course : undefined} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Current Qualification
                                                </label>
                                                <select name="qualification" value={form.qualification} onChange={handleChange}
                                                    disabled={status === 'loading'}
                                                    className={`${inputCls()} appearance-none`}
                                                >
                                                    <option value="">Select qualification…</option>
                                                    {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Message */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Any Questions / Comments <span className="text-gray-400 text-xs">(optional)</span>
                                            </label>
                                            <textarea name="message" rows={3} placeholder="Ask us anything about fees, duration, placement…"
                                                value={form.message} onChange={handleChange} disabled={status === 'loading'}
                                                className={`${inputCls()} resize-none`}
                                            />
                                        </div>

                                        {/* Submit */}
                                        <motion.button type="submit" disabled={status === 'loading'}
                                            whileHover={{ scale: status !== 'loading' ? 1.01 : 1 }}
                                            whileTap={{ scale: status !== 'loading' ? 0.99 : 1 }}
                                            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm shadow-lg hover:shadow-violet-200 hover:from-violet-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {status === 'loading'
                                                ? <><FaSpinner className="w-4 h-4 animate-spin" /> Submitting…</>
                                                : <><FaGraduationCap className="w-4 h-4" /> Submit Application</>
                                            }
                                        </motion.button>

                                        <p className="text-center text-xs text-gray-400">
                                            Our team will review your application and reach out within 24 hours.
                                        </p>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
