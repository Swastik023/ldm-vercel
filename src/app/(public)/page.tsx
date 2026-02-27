'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import HeroSlider from '@/components/public/HeroSlider';
import WhyChooseUs from '@/components/public/WhyChooseUs';
import Link from 'next/link';
import {
    FaHospital, FaUserMd, FaHandshake,
    FaGraduationCap, FaAward, FaBook, FaPhone, FaWhatsapp,
    FaArrowRight, FaClock, FaCheckCircle, FaFlask, FaBriefcaseMedical,
    FaGlobeAsia, FaStethoscope, FaStore, FaQuoteLeft, FaLeaf,
} from 'react-icons/fa';
import * as gtag from '@/lib/gtag';


// ─── Animated Counter ──────────────────────────────────────────────────────────
const Counter = ({ value }: { value: string }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (isInView && !hasAnimated.current) {
            hasAnimated.current = true;
            const numeric = parseInt(value.replace(/[^0-9]/g, ''));
            let start: number;
            const step = (ts: number) => {
                if (!start) start = ts;
                const p = Math.min((ts - start) / 2000, 1);
                setCount(Math.floor(p * numeric));
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }
    }, [isInView, value]);

    return <span ref={ref}>{count}{value.includes('+') ? '+' : value.includes('%') ? '%' : ''}</span>;
};

// ─── Data ──────────────────────────────────────────────────────────────────────
const stats = [
    { number: '15+', label: 'Courses Offered', icon: <FaBook className="w-8 h-8" /> },
    { number: '100%', label: 'Placement Support', icon: <FaBriefcaseMedical className="w-8 h-8" /> },
    { number: '2022', label: 'Established', icon: <FaAward className="w-8 h-8" /> },
    { number: '5+', label: 'Partner Hospitals', icon: <FaHospital className="w-8 h-8" /> },
];

const careerOpportunities = [
    {
        num: '01',
        title: 'Govt & Private Hospitals',
        desc: 'Secure stable and respectable positions in top-tier government and private medical facilities across the nation.',
        icon: <FaHospital className="w-7 h-7" />,
        accent: 'from-blue-500 to-blue-700',
    },
    {
        num: '02',
        title: 'Medical Tourism Abroad',
        desc: 'Leverage your skills globally. High demand for Indian paramedical professionals in international healthcare markets.',
        icon: <FaGlobeAsia className="w-7 h-7" />,
        accent: 'from-cyan-500 to-blue-600',
    },
    {
        num: '03',
        title: 'Diagnostic Labs & Emergency',
        desc: 'Join leading diagnostic chains and emergency services as a skilled technician with strong career growth.',
        icon: <FaFlask className="w-7 h-7" />,
        accent: 'from-indigo-500 to-blue-700',
    },
    {
        num: '04',
        title: 'Entrepreneurship',
        desc: 'Gain the knowledge and confidence to open your own diagnostic centre, lab, clinic, or healthcare facility.',
        icon: <FaStore className="w-7 h-7" />,
        accent: 'from-blue-600 to-indigo-700',
    },
];

const testimonials = [
    {
        name: 'Miss Priya',
        course: 'DMLT',
        placement: 'Dr Dharam Dev Hospital & Institute',
        quote: 'The practical training at LDM was a game-changer. The labs are equipped with the latest technology, which made my transition to a real hospital environment seamless.',
        initials: 'MP',
        color: 'bg-blue-600',
    },
    {
        name: 'Mr. Nishant Kumar',
        course: 'DMLT',
        placement: 'Lifecell Lab, Karnal',
        quote: 'Placement support is 100% genuine. The faculty guided me through interviews, and today I am working as a skilled lab technician with a great future ahead.',
        initials: 'NK',
        color: 'bg-indigo-600',
    },
];

const collaborations = [
    {
        num: '01',
        title: 'Hospital Partners',
        desc: 'Clinical training at Dr. Dharam Dev Memorial Hospital — hands-on experience with modern ICU, OT, and ward facilities.',
        link: '/hospital',
        icon: <FaHospital className="w-8 h-8" />,
        accent: 'from-blue-500 to-indigo-600',
        cardBg: 'bg-blue-900/40',
        border: 'border-blue-400/30',
    },
    {
        num: '02',
        title: 'Ayurvedic Partners',
        desc: 'Research & manufacturing exposure in Ayurvedic pharmaceuticals — quality control, production, and R&D.',
        link: '/ayurvedic-pharma',
        icon: <FaLeaf className="w-8 h-8" />,
        accent: 'from-emerald-500 to-teal-600',
        cardBg: 'bg-emerald-900/40',
        border: 'border-emerald-400/30',
    },
    {
        num: '03',
        title: 'Expert Mentors',
        desc: 'Guided by Vaidya Saurabh Sachdeva — 15+ years of Ayurvedic expertise, personalized mentorship & clinical case studies.',
        link: '/vaid-saurabh',
        icon: <FaUserMd className="w-8 h-8" />,
        accent: 'from-violet-500 to-purple-600',
        cardBg: 'bg-violet-900/40',
        border: 'border-violet-400/30',
    },
];

const popularCourses = [
    { id: 'dmlt', title: 'B.Voc in Medical Laboratory Technology', abbr: 'B.Voc MLT', duration: '3 Years', eligibility: '12th Pass (Science)', borderColor: 'border-blue-600', badgeColor: 'bg-blue-100 text-blue-700' },
    { id: 'drit', title: 'B.Voc in Radiology & Imaging Technology', abbr: 'B.Voc RIT', duration: '3 Years', eligibility: '12th Pass (Science)', borderColor: 'border-indigo-500', badgeColor: 'bg-indigo-100 text-indigo-700' },
    { id: 'dott', title: 'B.Voc in Operation Theatre Technology', abbr: 'B.Voc OT', duration: '3 Years', eligibility: '12th Pass (Science)', borderColor: 'border-cyan-500', badgeColor: 'bg-cyan-100 text-cyan-700' },
    { id: 'dpt', title: 'Diploma in Physiotherapy (DPT)', abbr: 'DPT', duration: '2 Years', eligibility: '12th Pass (Science)', borderColor: 'border-teal-500', badgeColor: 'bg-teal-100 text-teal-700' },
];

const certificates = [
    { title: 'NAAC Certificate', desc: 'National Assessment & Accreditation', file: '/CERTIFICATE/1  NAAC_CERTIFICATE__2022.pdf', icon: <FaAward className="w-5 h-5 text-blue-600" />, color: 'text-blue-600' },
    { title: 'University Approvals', desc: 'Official University Recognition', file: '/CERTIFICATE/2 UNIVERSITY APPROVALS.pdf', icon: <FaGraduationCap className="w-5 h-5 text-green-600" />, color: 'text-green-600' },
    { title: 'Authorization Letter', desc: 'Official Authorization Document', file: '/CERTIFICATE/Authorization Letter (2) (1)_230112_140148.pdf', icon: <FaCheckCircle className="w-5 h-5 text-purple-600" />, color: 'text-purple-600' },
    { title: 'LDM Affiliation', desc: 'Institute Affiliation Certificate', file: '/CERTIFICATE/LDM AFFILATION CERTIFICATE.pdf', icon: <FaAward className="w-5 h-5 text-amber-600" />, color: 'text-amber-600' },
];

// ─── Page Component ────────────────────────────────────────────────────────────
export default function HomePage() {
    return (
        <>
            {/* ── Hero ── */}
            <HeroSlider />

            {/* ── Stats Strip ── */}
            <section className="py-14 bg-gradient-to-r from-blue-50 via-white to-purple-50" aria-label="Statistics">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                className="relative group"
                            >
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-10 group-hover:opacity-25 transition-all duration-500" />
                                <div className="relative bg-white p-6 rounded-xl shadow hover:shadow-md transition-all duration-300 flex flex-col items-center text-center">
                                    <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-3">
                                        {stat.icon}
                                    </div>
                                    <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        <Counter value={stat.number} />
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1 font-medium">{stat.label}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Collaborations Spotlight ── */}
            <section className="py-20 bg-gradient-to-br from-[#0a1628] via-[#0f2a4a] to-[#0d3d3d]" aria-label="Collaborations">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-teal-300 text-sm font-medium mb-4 border border-white/10">
                            <FaHandshake className="w-4 h-4" />
                            Strategic Partnerships
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Our Strategic <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-300">Collaborations</span></h2>
                        <p className="text-white/60 text-lg max-w-2xl mx-auto">Partnering with industry leaders to provide world-class practical training</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {collaborations.map((c, i) => (
                            <motion.div
                                key={c.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.5 }}
                                className={`relative group p-6 rounded-2xl border ${c.border} ${c.cardBg} backdrop-blur-sm hover:scale-[1.02] transition-transform duration-300`}
                            >
                                {/* Number badge */}
                                <div className="absolute top-5 right-5 text-5xl font-black text-white/5 select-none">{c.num}</div>

                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${c.accent} text-white mb-5 shadow-lg`}>
                                    {c.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{c.title}</h3>
                                <p className="text-white/60 text-sm leading-relaxed mb-6">{c.desc}</p>
                                <Link
                                    href={c.link}
                                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r ${c.accent} text-white text-sm font-semibold hover:shadow-lg transition-shadow`}
                                >
                                    Learn More <FaArrowRight className="w-3 h-3" />
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        className="text-center mt-10"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <Link href="/collaborations" className="inline-flex items-center gap-2 text-teal-300 hover:text-teal-200 text-sm font-medium transition-colors">
                            View all partnerships <FaArrowRight className="w-3 h-3" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── Courses Preview ── */}
            <section className="py-16 bg-white" aria-label="Popular Courses">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4"
                    >
                        <div>
                            <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-2">Programs</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Our Popular Courses</h2>
                        </div>
                        <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-violet-600 font-semibold hover:text-violet-800 transition-colors whitespace-nowrap">
                            View all courses <FaArrowRight className="w-3 h-3" />
                        </Link>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {popularCourses.map((c, i) => (
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`group bg-white rounded-xl border-l-4 ${c.borderColor} border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${c.badgeColor}`}>{c.abbr}</span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1"><FaClock className="w-3 h-3" />{c.duration}</span>
                                </div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-2 leading-tight flex-1">{c.title}</h3>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
                                    <FaGraduationCap className="w-3 h-3" /> {c.eligibility}
                                </div>
                                <Link
                                    href={`/courses/${c.id}`}
                                    className="mt-auto text-center py-2 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white text-xs font-semibold hover:shadow-md hover:shadow-violet-200 transition-shadow"
                                >
                                    View Course
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Trust / Certifications Strip ── */}
            <section className="py-10 bg-gray-50 border-y border-gray-200" aria-label="Accreditations">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">Officially Recognized &amp; Accredited</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {certificates.map((cert, i) => (
                            <motion.a
                                key={cert.title}
                                href={cert.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                            >
                                <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-white transition-colors">
                                    {cert.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">{cert.title}</p>
                                    <p className="text-xs text-gray-400">{cert.desc}</p>
                                </div>
                                <span className={`text-xs font-medium ${cert.color} ml-2 opacity-0 group-hover:opacity-100 transition-opacity`}>View →</span>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Career Opportunities ── */}
            <section className="py-20 bg-gradient-to-br from-[#0a1628] via-[#0d2a54] to-[#0f1f4a]" aria-label="Career Opportunities">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-blue-300 text-sm font-medium mb-4 border border-white/10">
                            <FaBriefcaseMedical className="w-4 h-4" />
                            Career Pathways
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Unlock Diverse <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">Career Paths</span></h2>
                        <p className="text-white/60 text-lg max-w-2xl mx-auto">Our comprehensive curriculum prepares you for various roles in the rapidly growing healthcare sector.</p>
                    </motion.div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {careerOpportunities.map((c, i) => (
                            <motion.div
                                key={c.num}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12, duration: 0.5 }}
                                className="relative group p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:scale-[1.03] transition-all duration-300"
                            >
                                <div className="absolute top-4 right-4 text-5xl font-black text-white/5 select-none">{c.num}</div>
                                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${c.accent} text-white mb-5 shadow-lg`}>
                                    {c.icon}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{c.title}</h3>
                                <p className="text-white/55 text-sm leading-relaxed">{c.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Welcome / About Section ── */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid md:grid-cols-2 gap-12 items-center"
                    >
                        <div>
                            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">About Us</p>
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5">Building the Future of Healthcare</h2>
                            <p className="text-gray-600 mb-2 leading-relaxed">
                                <strong>Mission:</strong> To create competent healthcare professionals who are industry-ready, ethically strong, and community-focused.
                            </p>
                            <p className="text-gray-600 mb-4 leading-relaxed">
                                <strong>Vision:</strong> To bridge the gap between demand and supply in healthcare services by skilling the youth of India.
                            </p>
                            <ul className="space-y-2 mb-7">
                                {['Industry-aligned curriculum', 'Hands-on clinical training', 'Expert medical faculty', '100% Placement Support'].map(pt => (
                                    <li key={pt} className="flex items-center gap-2 text-sm text-gray-700">
                                        <FaCheckCircle className="w-4 h-4 text-green-500 shrink-0" /> {pt}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-blue-700 font-semibold italic mb-6">&ldquo;Skilling Youth, Serving Society.&rdquo;</p>
                            <Link href="/courses" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-200 transition-shadow">
                                Explore All 15 Courses <FaArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="rounded-2xl overflow-hidden shadow-2xl">
                                <img src="/home/Home-about.jpeg" alt="LDM Campus" className="object-cover w-full h-72 md:h-96" />
                            </div>
                            <div className="absolute -bottom-5 -right-5 w-28 h-28 bg-blue-100 rounded-full -z-10" />
                            <div className="absolute -top-5 -left-5 w-20 h-20 bg-indigo-100 rounded-full -z-10" />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── E-Library CTA Banner ── */}
            <section className="py-2 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-700 rounded-2xl px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-violet-200"
                    >
                        <div className="flex items-start gap-5">
                            <div className="p-4 rounded-xl bg-white/10 shrink-0">
                                <FaBook className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Explore Our Free E-Library</h2>
                                <p className="text-violet-200 text-sm max-w-lg">
                                    Access 50+ academic documents, study materials, and research papers — no login required.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/library"
                            className="shrink-0 inline-flex items-center gap-2 px-7 py-3.5 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-colors shadow-lg whitespace-nowrap"
                        >
                            Open Library <FaArrowRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* ── Testimonials ── */}
            <section className="py-20 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50" aria-label="Student Testimonials">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
                            <FaStethoscope className="w-4 h-4" />
                            Student Success Stories
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">What Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Alumni Say</span></h2>
                    </motion.div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={t.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="bg-white rounded-2xl p-8 shadow-lg border border-blue-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <FaQuoteLeft className="w-8 h-8 text-blue-200 mb-4" />
                                <p className="text-gray-600 italic leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                                        {t.initials}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{t.name}</p>
                                        <p className="text-sm text-blue-600 font-medium">{t.course} Graduate</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Working at {t.placement}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Why Choose Us ── */}
            <WhyChooseUs />

            {/* ── Call to Action ── */}
            <section className="py-16 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-700">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Ready to Start Your Journey?</h2>
                    <p className="text-white/70 mb-8 max-w-xl mx-auto">Join hundreds of students building successful careers in healthcare</p>
                    <p className="text-white/80 text-lg font-medium mb-2">Dr. Dharam Dev Hospital &amp; Institute, Kachhwa, Karnal-132001</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/collect-info" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-lg">
                            <FaGraduationCap /> Apply Now
                        </Link>
                        <a href="tel:+918957570000" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
                            <FaPhone /> +91 8957570000
                        </a>
                        <a href="https://wa.me/918957570000" target="_blank" rel="noopener noreferrer" onClick={() => gtag.event.whatsappClick('homepage_cta')} className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-400 transition-colors">
                            <FaWhatsapp /> WhatsApp
                        </a>
                    </div>
                </motion.div>
            </section>

            {/* Floating WhatsApp Button */}
            <a
                href="https://wa.me/918957570000"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => gtag.event.whatsappClick('homepage_float')}
                className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-400 text-white p-4 rounded-full shadow-xl z-50 transition-transform hover:scale-110"
                aria-label="Chat on WhatsApp"
            >
                <FaWhatsapp className="w-6 h-6" />
            </a>
        </>
    );
}
