'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/public/Icons';
import { motion } from 'framer-motion';

const Footer = () => {
    const router = useRouter();
    const currentYear = new Date().getFullYear();

    const navigateWithScroll = (path: string) => {
        router.push(path);
        // In Next.js, scroll to top happens automatically usually, but we can force it if needed
    };

    return (
        <footer className="bg-gradient-to-b from-[#0A1A2B] to-[#1a2c3f] text-gray-300 relative z-[1] mt-8 mb-10">
            <div className="max-w-7xl mx-auto pt-8 pb-12 px-4 sm:px-6 lg:px-8">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
                    {/* About Section */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <img
                                src="/ldm-college-logo.jpeg"
                                alt="LDM College Logo"
                                className="h-10 w-10 rounded-full"
                            />
                            <div>
                                <h3 className="font-semibold text-lg text-white">LDM College</h3>
                                <p className="text-sm text-blue-400">Excellence in Medical Education</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Empowering future healthcare professionals with comprehensive medical education,
                            practical training, and innovative learning methodologies with our Experienced Doctors at Dr Dharam Dev Hospital & Institute.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                                className="text-gray-400 hover:text-blue-500 transition-colors">
                                <Icons.Facebook className="h-5 w-5" />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                                className="text-gray-400 hover:text-pink-500 transition-colors">
                                <Icons.Instagram className="h-5 w-5" />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"
                                className="text-gray-400 hover:text-blue-600 transition-colors">
                                <Icons.LinkedIn className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Collaborations Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-white text-center mb-6 relative after:content-[''] after:absolute after:w-20 after:h-0.5 after:bg-blue-400 after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:mt-2 pb-2">Our Collaborations</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                className="flex items-center space-x-2 group cursor-pointer"
                                onClick={() => navigateWithScroll('/hospital')}
                            >
                                <Icons.Stethoscope className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                <span className="text-sm text-gray-400 group-hover:text-blue-400 transition-colors">Hospital Partners</span>
                            </div>
                            <div
                                className="flex items-center space-x-2 group cursor-pointer"
                                onClick={() => navigateWithScroll('/ayurvedic-pharma')}
                            >
                                <Icons.Leaf className="h-4 w-4 text-gray-400 group-hover:text-green-400 transition-colors" />
                                <span className="text-sm text-gray-400 group-hover:text-green-400 transition-colors">Ayurvedic Partners</span>
                            </div>
                            <div
                                className="flex items-center space-x-2 group cursor-pointer"
                                onClick={() => navigateWithScroll('/vaid-saurabh')}
                            >
                                <Icons.Award className="h-4 w-4 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                                <span className="text-sm text-gray-400 group-hover:text-yellow-400 transition-colors">Vaidya Saurabh Sachdeva</span>
                            </div>
                            <div
                                className="flex items-center space-x-2 group cursor-pointer"
                                onClick={() => navigateWithScroll('/collaborations')}
                            >
                                <Icons.BookOpen className="h-4 w-4 text-gray-400 group-hover:text-purple-400 transition-colors" />
                                <span className="text-sm text-gray-400 group-hover:text-purple-400 transition-colors">Academic Partners</span>
                            </div>
                        </div>
                    </div>

                    {/* Map Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg text-white">Location</h3>
                        <div
                            className="rounded-lg overflow-hidden bg-gray-900 h-[200px] relative cursor-pointer"
                            onClick={() => {
                                const url = "https://www.google.com/maps/dir/?api=1&destination=29.733569974798775,76.98468427563566&destination_place_id=ChIJR6MTJ_1yDTkRCkpe+LLl6fY";
                                window.open(url, '_blank');
                            }}
                        >
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3464.5348892926544!2d76.98468427563566!3d29.733569974798775!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390e72fd27e13747%3A0xf6e9e5b2b85e4a0a!2sLDM%20College%20of%20Pharmacy!5e0!3m2!1sen!2sin!4v1705090168016!5m2!1sen!2sin&maptype=roadmap&style=night"
                                width="100%"
                                height="100%"
                                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(85%)' }}
                                allowFullScreen={false}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="transition-all duration-300 hover:filter-none relative"
                            />
                            <div className="absolute inset-0 bg-transparent hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                <span className="opacity-0 hover:opacity-100 text-white bg-black/50 px-4 py-2 rounded-full transition-opacity duration-300">
                                    Get Directions
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800 mb-4"></div>

                {/* Bottom Section */}
                <div className="pt-4">
                    <div className="flex flex-col items-center">
                        {/* Copyright and Links */}
                        <div className="flex flex-wrap items-center justify-center gap-4 w-full text-sm text-gray-500">
                            <p>
                                &copy; {currentYear} LDM College. All rights reserved.
                            </p>
                            <div className="h-4 w-px bg-gradient-to-b from-gray-500/50 to-gray-600/50 mx-2"></div>
                            <div className="flex items-center space-x-4">
                                <Link href="/contact" className="hover:text-gray-300 transition-colors">
                                    Privacy Policy  -  Terms of Service
                                </Link>
                            </div>
                        </div>

                        {/* Developers */}
                        <div className="flex items-center justify-center space-x-3 text-sm">
                            <span className="text-gray-400 font-medium">Developed  by  </span>
                            <div className="flex items-center space-x-3">
                                <motion.a
                                    href="https://linktr.ee/Jordan698"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <span className="font-medium text-developer-awanish">
                                        Jordan
                                    </span>
                                </motion.a>
                                <span className="text-gray-600 opacity-50">&</span>
                                <motion.a
                                    href="https://linktr.ee/swastik023"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <span className="font-medium text-developer-swastik">
                                        Swastik
                                    </span>
                                </motion.a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
