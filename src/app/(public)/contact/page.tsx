'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '@/components/public/Icons';
import { useRouter } from 'next/navigation';

const contactInfo = {
    address: "Dr. Dharam Dev Memorial Hospital, Kachhwa, Karnal-132001 (Haryana)",
    phone: ["+91 941-698-8804", "+91 941-625-7057"],
    email: "devhospital08@gmail.com",
    hours: "24/7 Emergency Services",
    emergencyNumber: "+91 989-660-7010"
};

const ContactPage: React.FC = () => {
    const router = useRouter();
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const togglePopup = () => setIsPopupOpen(!isPopupOpen);

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Emergency Banner */}
                <div className="bg-gradient-to-r from-violet-800 to-blue-800 text-white py-3">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                            <motion.div
                                className="flex items-center gap-3 bg-white/10 px-6 py-2 rounded-full backdrop-blur-sm"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <Icons.Phone className="w-5 h-5 animate-pulse" />
                                <a href={`tel:${contactInfo.emergencyNumber}`} className="font-medium hover:text-blue-100">
                                    Emergency: {contactInfo.emergencyNumber}
                                </a>
                            </motion.div>
                            <motion.div
                                className="flex items-center gap-3 bg-white/10 px-6 py-2 rounded-full backdrop-blur-sm"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            >
                                <Icons.Clock className="w-5 h-5" />
                                <span className="font-medium">{contactInfo.hours}</span>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Hero Section */}
                <div className="relative py-16">
                    <motion.div
                        className="container mx-auto px-4 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-800 to-blue-800">
                            Get in Touch
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            We're here to help and answer any questions you might have.
                            Feel free to reach out to us.
                        </p>
                    </motion.div>
                </div>

                {/* Contact Information and QR Code Section */}
                <div className="container mx-auto px-4 py-12">
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Contact Cards */}
                        <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
                            {[
                                {
                                    icon: <Icons.MapPin className="w-6 h-6" />,
                                    title: "Visit Us",
                                    content: contactInfo.address,
                                    color: "from-pink-500 to-rose-500",
                                    href: `https://maps.google.com/?q=${encodeURIComponent(contactInfo.address)}`
                                },
                                {
                                    icon: <Icons.Phone className="w-6 h-6" />,
                                    title: "Call Us",
                                    content: (
                                        <div className="space-y-1">
                                            {contactInfo.phone.map((num, i) => (
                                                <a key={i} href={`tel:${num.replace(/[^\d+]/g, '')}`} className="block hover:text-blue-600">
                                                    {num}
                                                </a>
                                            ))}
                                        </div>
                                    ),
                                    color: "from-violet-500 to-purple-500",
                                },
                                {
                                    icon: <Icons.MessageCircle className="w-6 h-6" />, // Changed from Mail to MessageCircle
                                    title: "Email Us",
                                    content: contactInfo.email,
                                    color: "from-blue-500 to-cyan-500",
                                    href: `mailto:${contactInfo.email}`
                                },
                                {
                                    icon: <Icons.Clock className="w-6 h-6" />,
                                    title: "Working Hours",
                                    content: contactInfo.hours,
                                    color: "from-emerald-500 to-teal-500",
                                }
                            ].map((item, index) => (
                                <motion.a
                                    key={index}
                                    href={item.href}
                                    className={`block p-6 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${item.color} text-white mb-4`}>
                                        {item.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                                    <div className="text-gray-600">{item.content}</div>
                                </motion.a>
                            ))}
                        </div>

                        {/* QR Code Section */}
                        <motion.div
                            className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Scan to Connect</h3>
                            <div className="bg-white p-3 rounded-xl shadow-md">
                                <img
                                    src="/ldm-qr-form.png"
                                    alt="Contact QR Code"
                                    className="w-48 h-48 object-contain"
                                />
                            </div>
                            <p className="text-sm text-gray-600 mt-4 text-center">
                                Scan this QR code for apply to the course  directly from your phone
                            </p>
                        </motion.div>

                        {/* Contact Buttons Sections */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto col-span-3">
                            <motion.button
                                onClick={togglePopup}
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="text-lg font-semibold flex items-center justify-center whitespace-nowrap">
                                    <Icons.MessageCircle className="w-5 h-5 mr-2" />
                                    Contact Us Now
                                </span>
                            </motion.button>

                            <a
                                href="https://wa.me/+919896607010?text=Hi,%20I%20would%20like%20to%20schedule%20an%20appointment%20for%20admission%20counseling."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center group"
                            >
                                <span className="text-lg font-semibold flex items-center whitespace-nowrap">
                                    {/* WhatsApp SVG */}
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.56 20.16 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.05 3.67ZM8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z" />
                                    </svg>
                                    WhatsApp
                                    <Icons.ArrowUpRight className="ml-2 h-5 w-5 transform transition-transform group-hover:translate-x-1" />
                                </span>
                            </a>

                            <motion.button
                                onClick={() => router.push('/collect-info')}
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="text-lg font-semibold flex items-center justify-center whitespace-nowrap">
                                    {/* Send Icon alternative */}
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                    Apply
                                </span>
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Full Width Map Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="w-full bg-white shadow-lg mt-12"
                >
                    <div className="container mx-auto px-4 text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Visit Our Hospital</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            We are conveniently located in Kachhwa, Karnal. Our facility is easily accessible and we welcome your visit.
                        </p>
                    </div>
                    <div className="relative h-[500px] w-full">
                        <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent h-8 z-10"></div>
                        <div
                            className="relative h-full w-full cursor-pointer"
                            onClick={() => {
                                const url = "https://www.google.com/maps/dir/?api=1&destination=29.705499999999997,76.98641731744384&destination_place_id=0x390e71c7c7c1a0b1:0x1c1c1c1c1c1c1c1c";
                                window.open(url, '_blank');
                            }}
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
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white to-transparent h-8 z-10"></div>
                    </div>
                </motion.div>

                {/* Simple Popup Implementation */}
                <AnimatePresence>
                    {isPopupOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={togglePopup}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white rounded-xl p-8 max-w-md w-full relative"
                            >
                                <button
                                    onClick={togglePopup}
                                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                                <h3 className="text-2xl font-bold mb-4">Contact Us</h3>
                                <p className="text-gray-600 mb-4">Please feel free to reach out to us directly or fill out the form below (coming soon).</p>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <Icons.Phone className="w-5 h-5 text-blue-600 mr-3" />
                                        <span>{contactInfo.emergencyNumber}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Icons.MessageCircle className="w-5 h-5 text-blue-600 mr-3" />
                                        <span>{contactInfo.email}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </>
    );
};

export default ContactPage;
