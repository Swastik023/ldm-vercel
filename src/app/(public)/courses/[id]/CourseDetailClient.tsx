'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CourseData } from '@/data/courseData';
import { CoursePricingBlock, CoursePricingBadge } from '@/components/public/CoursePricing';
import {
    FaArrowRight, FaClock, FaGraduationCap, FaBriefcase,
    FaFlask, FaHospital, FaAward, FaCheckCircle, FaPhone, FaWhatsapp,
    FaDownload, FaStar,
} from 'react-icons/fa';

interface Props { course: CourseData; related: CourseData[]; }

// Colour themes per course duration
function getTheme(duration: string) {
    if (duration.includes('2.5')) return { from: '#4c1d95', to: '#1e3a8a', badge: 'bg-violet-600', chip: 'from-violet-600 to-blue-600' };
    if (duration.includes('2')) return { from: '#3b0764', to: '#1e40af', badge: 'bg-purple-600', chip: 'from-purple-600 to-indigo-600' };
    if (duration.includes('6')) return { from: '#78350f', to: '#065f46', badge: 'bg-amber-600', chip: 'from-amber-500 to-orange-500' };
    return { from: '#134e4a', to: '#1e3a8a', badge: 'bg-teal-600', chip: 'from-teal-600 to-blue-600' };
}

const highlights = [
    { icon: <FaFlask className="w-5 h-5" />, title: 'Hands-on Training', desc: 'Real lab & clinical exposure', color: 'text-violet-600 bg-violet-50' },
    { icon: <FaHospital className="w-5 h-5" />, title: 'Hospital Internship', desc: 'At Dr. Dharam Dev Hospital', color: 'text-blue-600 bg-blue-50' },
    { icon: <FaBriefcase className="w-5 h-5" />, title: 'Govt Job Eligible', desc: 'Recognized for govt recruitments', color: 'text-green-600 bg-green-50' },
    { icon: <FaAward className="w-5 h-5" />, title: 'NAAC Accredited', desc: 'Nationally recognized institute', color: 'text-amber-600 bg-amber-50' },
];

export default function CourseDetailClient({ course, related }: Props) {
    const theme = getTheme(course.duration);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Hero ── */}
            <section
                className="relative overflow-hidden py-16 px-4"
                style={{ background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)` }}
            >
                {/* Background blobs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-black/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

                <div className="relative max-w-7xl mx-auto">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-6">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <span>/</span>
                        <Link href="/courses" className="hover:text-white transition-colors">Courses</Link>
                        <span>/</span>
                        <span className="text-white font-medium truncate">{course.title}</span>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-10 items-center">
                        {/* Left — text */}
                        <div className="lg:col-span-3">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-4 ${theme.badge}`}>
                                    {course.duration} Program
                                </span>
                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                                    {course.title}
                                </h1>
                                <p className="text-white/70 text-base leading-relaxed mb-7 max-w-xl">
                                    {course.description.slice(0, 220)}…
                                </p>

                                {/* Quick facts row */}
                                <div className="flex flex-wrap gap-5 mb-8">
                                    {[
                                        { icon: <FaClock className="w-4 h-4" />, label: course.duration, sub: 'Duration' },
                                        { icon: <FaGraduationCap className="w-4 h-4" />, label: course.eligibility, sub: 'Eligibility' },
                                        { icon: <FaBriefcase className="w-4 h-4" />, label: `${course.career.length} Paths`, sub: 'Career Options' },
                                    ].map(f => (
                                        <div key={f.sub} className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-white/10 text-white">{f.icon}</div>
                                            <div>
                                                <p className="text-white font-semibold text-sm">{f.label}</p>
                                                <p className="text-white/50 text-xs">{f.sub}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* CTAs */}
                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href="/collect-info"
                                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full shadow-lg hover:scale-105 hover:shadow-amber-400/40 transition-all duration-200"
                                    >
                                        Apply Now <FaArrowRight className="w-4 h-4" />
                                    </Link>
                                    <a
                                        href="/LDM-BROCHURE.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-white/40 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-200"
                                    >
                                        <FaDownload className="w-4 h-4" /> Download Syllabus
                                    </a>
                                </div>
                            </motion.div>
                        </div>

                        {/* Right — image + floating rating */}
                        <motion.div
                            className="lg:col-span-2 relative hidden lg:block"
                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                        >
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                <img src={course.image} alt={course.title} className="w-full h-72 object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                            </div>
                            {/* Floating rating card */}
                            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">4.8</p>
                                    <div className="flex text-amber-400 text-xs gap-0.5">
                                        {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">Student Rating</p>
                                </div>
                            </div>
                            {/* Floating enrollment card */}
                            <div className="absolute -top-5 -right-5 bg-white rounded-2xl shadow-xl p-3">
                                <p className="text-lg font-bold text-violet-600">500+</p>
                                <p className="text-xs text-gray-400">Enrolled</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Highlights Strip ── */}
            <section className="bg-white border-b border-gray-100 py-8 px-4 shadow-sm">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
                    {highlights.map((h, i) => (
                        <motion.div
                            key={h.title}
                            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100"
                        >
                            <div className={`p-2.5 rounded-xl ${h.color} shrink-0`}>{h.icon}</div>
                            <div>
                                <p className="font-semibold text-gray-900 text-sm">{h.title}</p>
                                <p className="text-xs text-gray-500">{h.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── Main Content ── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: About + Syllabus + Careers */}
                    <div className="lg:col-span-2 space-y-7">
                        {/* About */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-4">About This Course</h2>
                            <p className="text-gray-600 leading-relaxed">{course.description}</p>
                        </motion.div>

                        {/* Syllabus */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-5">Course Syllabus</h2>
                            <div className="space-y-3">
                                {course.syllabus.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-violet-50 transition-colors group">
                                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-white text-xs font-bold shrink-0">
                                            {String(i + 1).padStart(2, '0')}
                                        </div>
                                        <div className="flex items-center justify-between w-full">
                                            <p className="text-sm text-gray-700 font-medium">{item}</p>
                                            <FaCheckCircle className="w-4 h-4 text-green-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Career Opportunities */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7"
                        >
                            <h2 className="text-xl font-bold text-gray-900 mb-5">Career Opportunities</h2>
                            <div className="flex flex-wrap gap-3">
                                {course.career.map((job, i) => (
                                    <span
                                        key={i}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white bg-gradient-to-r ${theme.chip} shadow-sm`}
                                    >
                                        <FaBriefcase className="w-3 h-3" /> {job}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Sticky Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-20 space-y-5">
                            {/* Pricing Block — shown first for marketing impact */}
                            <CoursePricingBlock courseId={course.id} />

                            {/* Apply Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6"
                            >
                                <div className="text-center mb-5">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-3">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Admissions Open
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">2025 Batch</p>
                                    <p className="text-gray-400 text-sm">Limited seats available</p>
                                </div>

                                <Link
                                    href="/collect-info"
                                    className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r ${theme.chip} text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-[1.01] transition-all mb-3`}
                                >
                                    <FaGraduationCap /> Apply Now →
                                </Link>
                                <a
                                    href={`https://wa.me/919896607010?text=Hi,%20I%20want%20to%20enquire%20about%20${encodeURIComponent(course.title)}%20at%20LDM%20College.`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-green-50 text-green-700 font-semibold text-sm border border-green-200 hover:bg-green-100 transition-colors"
                                >
                                    <FaWhatsapp className="w-4 h-4" /> Chat on WhatsApp
                                </a>

                                <div className="border-t border-gray-100 mt-5 pt-4">
                                    <a href="tel:+919896607010" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                                        <FaPhone className="w-3 h-3" /> +91 989-660-7010
                                    </a>
                                </div>
                            </motion.div>

                            {/* Quick Facts Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                            >
                                <h3 className="font-bold text-gray-900 mb-4">Quick Facts</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Duration', value: course.duration },
                                        { label: 'Eligibility', value: course.eligibility },
                                        { label: 'Type', value: course.id.startsWith('c') ? 'Certificate' : 'Diploma' },
                                        { label: 'Mode', value: 'Full-time' },
                                        { label: 'Career Options', value: `${course.career.length} paths` },
                                    ].map(f => (
                                        <div key={f.label} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">{f.label}</span>
                                            <span className="font-semibold text-gray-900">{f.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Related Courses ── */}
            {related.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Related Courses</h2>
                        <Link href="/courses" className="text-violet-600 text-sm font-semibold hover:text-violet-800 flex items-center gap-1">
                            All Courses <FaArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {related.map((c, i) => (
                            <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1 flex flex-col"
                            >
                                <div className="h-36 overflow-hidden">
                                    <img src={c.image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <p className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">{c.title}</p>
                                    <div className="flex gap-2 mb-3">
                                        <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full">{c.duration}</span>
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full truncate">{c.eligibility}</span>
                                    </div>
                                    <CoursePricingBadge courseId={c.id} className="mb-3" />
                                    <Link href={`/courses/${c.id}`} className="mt-auto text-center text-sm font-semibold text-violet-600 hover:text-violet-800 flex items-center justify-center gap-1 transition-colors">
                                        View Course <FaArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
