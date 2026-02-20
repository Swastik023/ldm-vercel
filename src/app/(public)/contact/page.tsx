'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/public/Icons';

// ─── Contact Info ────────────────────────────────────────────────────────────

const contactInfo = {
    address: "Dr. Dharam Dev Memorial Hospital, Kachhwa, Karnal-132001 (Haryana)",
    phone: ["+91 941-698-8804", "+91 941-625-7057"],
    email: "devhospital08@gmail.com",
    hours: "24/7 Emergency Services",
    emergencyNumber: "+91 989-660-7010",
    whatsapp: "https://wa.me/+919896607010?text=Hi,%20I%20would%20like%20to%20get%20more%20information%20about%20LDM%20College.",
};

const SUBJECT_OPTIONS = [
    "General Enquiry",
    "Admission",
    "Academic",
    "Fees & Finance",
    "Placement",
    "Other",
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    phone?: string;
    subject?: string;
    message?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

// ─── Validation ──────────────────────────────────────────────────────────────

function validate(data: FormData): FormErrors {
    const errors: FormErrors = {};
    if (!data.name.trim()) errors.name = 'Full name is required.';
    else if (data.name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';

    if (!data.email.trim()) errors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Please enter a valid email address.';

    if (data.phone && !/^[\d\s\+\-\(\)]{7,15}$/.test(data.phone)) {
        errors.phone = 'Please enter a valid phone number.';
    }

    if (!data.subject) errors.subject = 'Please select a subject.';

    if (!data.message.trim()) errors.message = 'Message is required.';
    else if (data.message.trim().length < 20) errors.message = 'Message must be at least 20 characters.';
    else if (data.message.trim().length > 2000) errors.message = 'Message must be under 2000 characters.';

    return errors;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function InfoCard({ icon, title, content, href, color }: {
    icon: React.ReactNode;
    title: string;
    content: React.ReactNode;
    href?: string;
    color: string;
}) {
    const Tag = href ? 'a' : 'div';
    return (
        <Tag
            href={href}
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={`flex items-start gap-4 p-5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 ${href ? 'hover:bg-white/20 transition-colors cursor-pointer' : ''}`}
        >
            <div className={`mt-0.5 p-2.5 rounded-lg bg-gradient-to-br ${color} text-white shrink-0`}>
                {icon}
            </div>
            <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-0.5">{title}</p>
                <div className="text-white text-sm font-medium leading-relaxed">{content}</div>
            </div>
        </Tag>
    );
}

function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return (
        <AnimatePresence>
            <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-1.5 text-xs text-red-500 flex items-center gap-1"
            >
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {msg}
            </motion.p>
        </AnimatePresence>
    );
}

const inputBase = "w-full px-4 py-3 rounded-xl border bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200";
const inputNormal = `${inputBase} border-gray-200 focus:ring-violet-500 focus:border-violet-400`;
const inputError = `${inputBase} border-red-400 focus:ring-red-400 focus:border-red-400 bg-red-50`;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContactPage() {
    const [form, setForm] = useState<FormData>({ name: '', email: '', phone: '', subject: '', message: '' });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
    const [status, setStatus] = useState<Status>('idle');
    const [serverError, setServerError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const updated = { ...form, [name]: value };
        setForm(updated);
        // Re-validate touched field on change
        if (touched[name as keyof FormData]) {
            const fieldErrors = validate(updated);
            setErrors(prev => ({ ...prev, [name]: fieldErrors[name as keyof FormErrors] }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const fieldErrors = validate(form);
        setErrors(prev => ({ ...prev, [name]: fieldErrors[name as keyof FormErrors] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Mark all fields as touched
        setTouched({ name: true, email: true, phone: true, subject: true, message: true });

        const validationErrors = validate(form);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            // Scroll to first error
            const firstErrorKey = Object.keys(validationErrors)[0];
            document.getElementById(`field-${firstErrorKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setStatus('loading');
        setServerError('');

        try {
            const res = await fetch('/api/public/contact', {
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
            setServerError('Network error. Please check your connection and try again.');
        }
    };

    const handleReset = () => {
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
        setErrors({});
        setTouched({});
        setStatus('idle');
        setServerError('');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">

            {/* Emergency Banner */}
            <div className="bg-gradient-to-r from-violet-800 to-blue-800 text-white py-3">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-4">
                    <motion.div
                        className="flex items-center gap-3 bg-white/10 px-6 py-2 rounded-full backdrop-blur-sm"
                        whileHover={{ scale: 1.05 }}
                    >
                        <Icons.Phone className="w-5 h-5 animate-pulse" />
                        <a href={`tel:${contactInfo.emergencyNumber}`} className="font-medium hover:text-blue-100">
                            Emergency: {contactInfo.emergencyNumber}
                        </a>
                    </motion.div>
                    <motion.div
                        className="flex items-center gap-3 bg-white/10 px-6 py-2 rounded-full backdrop-blur-sm"
                        whileHover={{ scale: 1.05 }}
                    >
                        <Icons.Clock className="w-5 h-5" />
                        <span className="font-medium">{contactInfo.hours}</span>
                    </motion.div>
                </div>
            </div>

            {/* Hero */}
            <div className="relative py-16">
                <motion.div
                    className="container mx-auto px-4 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-blue-700">
                        Get in Touch
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Have a question or need more information? We're here to help.
                    </p>
                </motion.div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 pb-20">
                <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto">

                    {/* ── Left: Contact Info Panel ── */}
                    <motion.div
                        className="lg:col-span-2 bg-gradient-to-br from-violet-700 via-violet-800 to-blue-800 rounded-2xl p-8 flex flex-col gap-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Contact Information</h2>
                            <p className="text-white/60 text-sm">Reach us through any of these channels</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <InfoCard
                                icon={<Icons.MapPin className="w-5 h-5" />}
                                title="Visit Us"
                                content={contactInfo.address}
                                href={`https://maps.google.com/?q=${encodeURIComponent(contactInfo.address)}`}
                                color="from-pink-500 to-rose-600"
                            />
                            <InfoCard
                                icon={<Icons.Phone className="w-5 h-5" />}
                                title="Call Us"
                                content={
                                    <div className="flex flex-col gap-1">
                                        {contactInfo.phone.map((num, i) => (
                                            <a key={i} href={`tel:${num.replace(/[^\d+]/g, '')}`} className="hover:text-blue-200 transition-colors">{num}</a>
                                        ))}
                                    </div>
                                }
                                color="from-violet-500 to-purple-600"
                            />
                            <InfoCard
                                icon={<Icons.MessageCircle className="w-5 h-5" />}
                                title="Email Us"
                                content={contactInfo.email}
                                href={`mailto:${contactInfo.email}`}
                                color="from-blue-500 to-cyan-600"
                            />
                            <InfoCard
                                icon={<Icons.Clock className="w-5 h-5" />}
                                title="Working Hours"
                                content={contactInfo.hours}
                                color="from-emerald-500 to-teal-600"
                            />
                        </div>

                        {/* WhatsApp CTA */}
                        <a
                            href={contactInfo.whatsapp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-auto flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-colors duration-200 shadow-lg"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.56 20.16 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67ZM8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z" />
                            </svg>
                            Chat on WhatsApp
                        </a>
                    </motion.div>

                    {/* ── Right: Contact Form ── */}
                    <motion.div
                        className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <AnimatePresence mode="wait">

                            {/* ── SUCCESS STATE ── */}
                            {status === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex flex-col items-center justify-center text-center py-12 gap-6"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                                        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
                                    >
                                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <motion.path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2.5}
                                                d="M5 13l4 4L19 7"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: 0.5, delay: 0.3 }}
                                            />
                                        </svg>
                                    </motion.div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                                        <p className="text-gray-500 max-w-sm">
                                            Thank you for reaching out. Our team will get back to you within 24–48 hours.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleReset}
                                        className="text-violet-600 hover:text-violet-700 font-semibold text-sm underline underline-offset-4 transition-colors"
                                    >
                                        Send another message
                                    </button>
                                </motion.div>
                            )}

                            {/* ── FORM STATE ── */}
                            {status !== 'success' && (
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <div className="mb-7">
                                        <h2 className="text-2xl font-bold text-gray-900">Send us a Message</h2>
                                        <p className="text-gray-500 text-sm mt-1">We'll respond within 24–48 hours</p>
                                    </div>

                                    {/* Server-level error banner */}
                                    <AnimatePresence>
                                        {status === 'error' && serverError && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                className="mb-5 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl"
                                            >
                                                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                                <p className="text-red-700 text-sm">{serverError}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                                        {/* Name + Email */}
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <div id="field-name">
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Full Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    name="name"
                                                    type="text"
                                                    autoComplete="name"
                                                    placeholder="e.g. Ravi Kumar"
                                                    value={form.name}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    disabled={status === 'loading'}
                                                    className={errors.name && touched.name ? inputError : inputNormal}
                                                />
                                                <FieldError msg={touched.name ? errors.name : undefined} />
                                            </div>
                                            <div id="field-email">
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Email Address <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    name="email"
                                                    type="email"
                                                    autoComplete="email"
                                                    placeholder="you@example.com"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    disabled={status === 'loading'}
                                                    className={errors.email && touched.email ? inputError : inputNormal}
                                                />
                                                <FieldError msg={touched.email ? errors.email : undefined} />
                                            </div>
                                        </div>

                                        {/* Phone + Subject */}
                                        <div className="grid sm:grid-cols-2 gap-5">
                                            <div id="field-phone">
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Phone Number <span className="text-gray-400 text-xs">(optional)</span>
                                                </label>
                                                <input
                                                    name="phone"
                                                    type="tel"
                                                    autoComplete="tel"
                                                    placeholder="+91 98XXXXXXXX"
                                                    value={form.phone}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    disabled={status === 'loading'}
                                                    className={errors.phone && touched.phone ? inputError : inputNormal}
                                                />
                                                <FieldError msg={touched.phone ? errors.phone : undefined} />
                                            </div>
                                            <div id="field-subject">
                                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                    Subject <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="subject"
                                                    value={form.subject}
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    disabled={status === 'loading'}
                                                    className={`${errors.subject && touched.subject ? inputError : inputNormal} appearance-none`}
                                                >
                                                    <option value="" disabled>Select a subject…</option>
                                                    {SUBJECT_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                <FieldError msg={touched.subject ? errors.subject : undefined} />
                                            </div>
                                        </div>

                                        {/* Message */}
                                        <div id="field-message">
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Message <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="message"
                                                rows={5}
                                                placeholder="Please describe how we can help you…"
                                                value={form.message}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={status === 'loading'}
                                                className={`${errors.message && touched.message ? inputError : inputNormal} resize-none`}
                                            />
                                            <div className="flex justify-between items-start mt-1">
                                                <FieldError msg={touched.message ? errors.message : undefined} />
                                                <span className={`text-xs ml-auto ${form.message.length > 1800 ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {form.message.length}/2000
                                                </span>
                                            </div>
                                        </div>

                                        {/* Submit */}
                                        <motion.button
                                            type="submit"
                                            disabled={status === 'loading'}
                                            whileHover={{ scale: status !== 'loading' ? 1.01 : 1 }}
                                            whileTap={{ scale: status !== 'loading' ? 0.99 : 1 }}
                                            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold text-sm shadow-lg hover:shadow-violet-200 hover:from-violet-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {status === 'loading' ? (
                                                <>
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                    Sending…
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                    </svg>
                                                    Send Message
                                                </>
                                            )}
                                        </motion.button>

                                        <p className="text-center text-xs text-gray-400">
                                            We respect your privacy. Your data is never shared with third parties.
                                        </p>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* QR + Apply Section */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mt-12 max-w-6xl mx-auto">
                    <motion.div
                        className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center gap-3 w-full sm:w-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Scan to Apply</h3>
                        <img src="/ldm-qr-form.png" alt="Apply QR Code" className="w-36 h-36 object-contain rounded-lg" />
                        <p className="text-xs text-gray-500 text-center max-w-[160px]">Scan to apply for admission directly from your phone</p>
                    </motion.div>
                </div>
            </div>

            {/* Full Width Map */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="w-full bg-white shadow-lg"
            >
                <div className="container mx-auto px-4 text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Visit Our Campus</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Conveniently located in Kachhwa, Karnal. Our facility is easily accessible and welcomes your visit.
                    </p>
                </div>
                <div className="relative h-[460px] w-full">
                    <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent h-8 z-10" />
                    <div
                        className="relative h-full w-full cursor-pointer"
                        onClick={() => window.open("https://www.google.com/maps/dir/?api=1&destination=29.705499999999997,76.98641731744384", '_blank')}
                    >
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3470.5681886741766!2d76.98641731744384!3d29.705499999999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390e71c7c7c1a0b1%3A0x1c1c1c1c1c1c1c1c!2sDr.%20Dharam%20Dev%20Memorial%20Hospital!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
                            className="w-full h-full"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        />
                        <div className="absolute inset-0 bg-transparent hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                            <span className="opacity-0 hover:opacity-100 text-white bg-black/50 px-4 py-2 rounded-full transition-opacity duration-300">
                                Get Directions
                            </span>
                        </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white to-transparent h-8 z-10" />
                </div>
            </motion.div>
        </div>
    );
}
