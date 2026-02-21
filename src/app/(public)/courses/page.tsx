'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { courseData } from '@/data/courseData';
import {
    FaGraduationCap, FaClock, FaArrowRight, FaCheckCircle,
    FaHospital, FaAward, FaPhone, FaWhatsapp, FaDownload,
} from 'react-icons/fa';

const regularCourses = courseData.filter(c => !['caim', 'cand', 'cap', 'cacsbc'].includes(c.id));
const certCourses = courseData.filter(c => ['caim', 'cand', 'cap', 'cacsbc'].includes(c.id));

// Duration badge colour
function badgeStyle(duration: string) {
    if (duration.includes('2.5')) return 'bg-violet-600 text-white';
    if (duration.includes('2')) return 'bg-purple-600 text-white';
    if (duration.includes('6')) return 'bg-amber-500 text-white';
    return 'bg-teal-600 text-white';
}

export default function CoursesPage() {
    const [tab, setTab] = useState<'diploma' | 'cert'>('diploma');
    const courses = tab === 'diploma' ? regularCourses : certCourses;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Hero Banner ── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#3b0f8a] via-[#4c1d95] to-[#1e3a8a] py-20 px-4">
                {/* Background orbs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

                <div className="relative max-w-5xl mx-auto text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-violet-200 text-sm font-medium mb-6">
                            <FaGraduationCap className="w-4 h-4" /> Admissions Open 2025
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
                            Build Your Career <br className="hidden sm:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">in Healthcare</span>
                        </h1>
                        <p className="text-violet-200 text-lg max-w-2xl mx-auto mb-8">
                            19+ industry-recognized programs in paramedical, Ayurvedic &amp; healthcare management — designed for real-world careers.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                            <Link
                                href="/collect-info"
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full shadow-lg hover:shadow-amber-300/40 hover:scale-105 transition-all duration-200"
                            >
                                Apply Now <FaArrowRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="/LDM-BROCHURE.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-200"
                            >
                                <FaDownload className="w-4 h-4" /> Download Brochure
                            </a>
                        </div>
                        {/* Trust badges */}
                        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-violet-200">
                            {[
                                { icon: <FaAward className="w-4 h-4 text-amber-400" />, label: 'NAAC Certified' },
                                { icon: <FaCheckCircle className="w-4 h-4 text-green-400" />, label: '98% Placement' },
                                { icon: <FaHospital className="w-4 h-4 text-blue-400" />, label: '5+ Hospital Partners' },
                                { icon: <FaGraduationCap className="w-4 h-4 text-violet-300" />, label: '19+ Programs' },
                            ].map(b => (
                                <div key={b.label} className="flex items-center gap-1.5">{b.icon}{b.label}</div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Tab Filter ── */}
            <div className="sticky top-14 z-30 bg-white shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-3 flex justify-center gap-3">
                    {[
                        { key: 'diploma', label: `Diploma Courses (${regularCourses.length})` },
                        { key: 'cert', label: `Certificate Courses (${certCourses.length})` },
                    ].map(t => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key as 'diploma' | 'cert')}
                            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${tab === t.key
                                    ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-md shadow-violet-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Course Grid ── */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.25 }}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7"
                    >
                        {courses.map((course, i) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-100 hover:-translate-y-1"
                            >
                                {/* Image */}
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={course.image}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {/* Duration badge */}
                                    <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold shadow ${badgeStyle(course.duration)}`}>
                                        {course.duration}
                                    </span>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h2 className="font-bold text-gray-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-violet-700 transition-colors">
                                        {course.title}
                                    </h2>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed flex-1">
                                        {course.description}
                                    </p>

                                    {/* Chips */}
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 px-3 py-1 rounded-full font-medium">
                                            <FaClock className="w-3 h-3" /> {course.duration}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
                                            <FaGraduationCap className="w-3 h-3" /> {course.eligibility}
                                        </span>
                                    </div>

                                    {/* CTA */}
                                    <Link
                                        href={`/courses/${course.id}`}
                                        className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-blue-700 hover:shadow-lg hover:shadow-violet-200 transition-all duration-200"
                                    >
                                        Learn More <FaArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </section>

            {/* ── Bottom CTA ── */}
            <section className="bg-gradient-to-r from-[#0a1628] to-[#0f2a4a] py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Ready to Start Your Career?</h2>
                        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                            Our admissions team is ready to guide you. Apply today or reach out directly.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/collect-info"
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
                            >
                                <FaGraduationCap /> Apply Now
                            </Link>
                            <a href="tel:+919896607010" className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-colors">
                                <FaPhone /> +91 989-660-7010
                            </a>
                            <a
                                href="https://wa.me/919896607010?text=Hi,%20I%20want%20to%20know%20more%20about%20courses%20at%20LDM%20College."
                                target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-7 py-3.5 bg-green-500 text-white font-semibold rounded-full hover:bg-green-400 transition-colors"
                            >
                                <FaWhatsapp /> WhatsApp
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
