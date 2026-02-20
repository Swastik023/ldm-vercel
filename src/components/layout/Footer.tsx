'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icons } from '@/components/public/Icons';
import {
    FaHospital, FaLeaf, FaUserMd, FaBook,
    FaPhone, FaEnvelope, FaMapMarkerAlt, FaGraduationCap,
    FaArrowRight
} from 'react-icons/fa';

const currentYear = new Date().getFullYear();

const quickLinks = [
    { label: 'Home', path: '/' },
    { label: 'About Us', path: '/about' },
    { label: 'Courses', path: '/courses' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Notices', path: '/notices' },
    { label: 'E-Library', path: '/library' },
    { label: 'Facilities', path: '/facilities' },
    { label: 'Contact Us', path: '/contact' },
];

const collabLinks = [
    { label: 'Hospital Partners', path: '/hospital', icon: <FaHospital className="w-3.5 h-3.5" />, hoverColor: 'group-hover:text-blue-400' },
    { label: 'Ayurvedic Partners', path: '/ayurvedic-pharma', icon: <FaLeaf className="w-3.5 h-3.5" />, hoverColor: 'group-hover:text-green-400' },
    { label: 'Vaidya Saurabh Sachdeva', path: '/vaid-saurabh', icon: <FaUserMd className="w-3.5 h-3.5" />, hoverColor: 'group-hover:text-yellow-400' },
    { label: 'Academic Network', path: '/collaborations', icon: <FaBook className="w-3.5 h-3.5" />, hoverColor: 'group-hover:text-purple-400' },
];

const SectionTitle = ({ children, accent = 'bg-blue-400' }: { children: React.ReactNode; accent?: string }) => (
    <h3 className="relative text-white font-semibold text-base mb-5 pb-2.5 inline-block">
        {children}
        <span className={`absolute bottom-0 left-0 h-0.5 w-12 rounded-full ${accent}`} />
    </h3>
);

const Footer = () => {
    return (
        <footer className="bg-gradient-to-b from-[#0A1A2B] to-[#111f30] text-gray-400 relative z-[1]">
            {/* Main content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

                    {/* ── Col 1: About ── */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <img src="/ldm-college-logo.jpeg" alt="LDM College Logo" className="h-10 w-10 rounded-full ring-2 ring-white/10" />
                            <div>
                                <p className="font-bold text-white text-base leading-tight">LDM College</p>
                                <p className="text-xs text-blue-400">Excellence in Medical Education</p>
                            </div>
                        </div>
                        <p className="text-xs leading-relaxed">
                            Empowering future healthcare professionals with comprehensive paramedical education,
                            practical training, and innovative learning — in collaboration with Dr. Dharam Dev Hospital &amp; Institute.
                        </p>
                        {/* Social icons */}
                        <div className="flex gap-3 pt-1">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-white/5">
                                <Icons.Facebook className="h-4 w-4" />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-400 transition-colors p-1.5 rounded-lg hover:bg-white/5">
                                <Icons.Instagram className="h-4 w-4" />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500 transition-colors p-1.5 rounded-lg hover:bg-white/5">
                                <Icons.LinkedIn className="h-4 w-4" />
                            </a>
                        </div>
                        {/* Phone */}
                        <a href="tel:+919896607010" className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                            <FaPhone className="w-3 h-3 text-blue-400" /> +91 98-9660-7010
                        </a>
                    </div>

                    {/* ── Col 2: Quick Links ── */}
                    <div>
                        <SectionTitle accent="bg-blue-400">Quick Links</SectionTitle>
                        <ul className="space-y-2">
                            {quickLinks.map(l => (
                                <li key={l.label}>
                                    <Link href={l.path} className="group flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors">
                                        <FaArrowRight className="w-2.5 h-2.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity -ml-1 group-hover:ml-0" />
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ── Col 3: Collaborations ── */}
                    <div>
                        <SectionTitle accent="bg-teal-400">Collaborations</SectionTitle>
                        <ul className="space-y-3">
                            {collabLinks.map(l => (
                                <li key={l.label}>
                                    <Link href={l.path} className={`group flex items-center gap-2.5 text-xs text-gray-400 hover:text-white transition-colors`}>
                                        <span className={`transition-colors text-gray-500 ${l.hoverColor}`}>{l.icon}</span>
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* ── Col 4: Contact & Apply ── */}
                    <div className="space-y-4">
                        <SectionTitle accent="bg-violet-400">Get In Touch</SectionTitle>
                        <ul className="space-y-3 text-xs">
                            <li className="flex items-start gap-2.5">
                                <FaMapMarkerAlt className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                                <span>Dr. Dharam Dev Memorial Hospital, Kachhwa, Karnal-132001, Haryana</span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <FaPhone className="w-3 h-3 text-violet-400 shrink-0" />
                                <div className="flex flex-col">
                                    <a href="tel:+919416988804" className="hover:text-white transition-colors">+91 941-698-8804</a>
                                    <a href="tel:+919416257057" className="hover:text-white transition-colors">+91 941-625-7057</a>
                                </div>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <FaEnvelope className="w-3 h-3 text-violet-400 shrink-0" />
                                <a href="mailto:devhospital08@gmail.com" className="hover:text-white transition-colors">devhospital08@gmail.com</a>
                            </li>
                        </ul>

                        {/* Mini Map */}
                        <div
                            className="rounded-lg overflow-hidden h-[120px] relative cursor-pointer group mt-2"
                            onClick={() => window.open("https://www.google.com/maps/dir/?api=1&destination=29.733569974798775,76.98468427563566", '_blank')}
                        >
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3464.5348892926544!2d76.98468427563566!3d29.733569974798775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390e72fd27e13747%3A0xf6e9e5b2b85e4a0a!2sLDM%20College%20of%20Pharmacy!5e0!3m2!1sen!2sin!4v1705090168016!5m2!1sen!2sin"
                                width="100%"
                                height="100%"
                                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(80%) contrast(85%)' }}
                                allowFullScreen={false}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                                <span className="opacity-0 group-hover:opacity-100 text-white text-xs bg-black/60 px-3 py-1.5 rounded-full transition-opacity">Get Directions</span>
                            </div>
                        </div>

                        {/* Apply Now Button */}
                        <Link
                            href="/collect-info"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-violet-700 hover:to-blue-700 transition-all duration-200 shadow-md mt-2"
                        >
                            <FaGraduationCap className="w-4 h-4" /> Apply Now
                        </Link>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/5 pt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
                        <p>&copy; {currentYear} LDM College of Pharmacy. All rights reserved.</p>
                        <div className="flex gap-4">
                            <Link href="/contact" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
                            <Link href="/contact" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span>Developed by</span>
                            <motion.a href="https://linktr.ee/Jordan698" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.05 }} className="text-blue-400 font-medium hover:text-blue-300">Jordan</motion.a>
                            <span>&amp;</span>
                            <motion.a href="https://linktr.ee/swastik023" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.05 }} className="text-violet-400 font-medium hover:text-violet-300">Swastik</motion.a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
