'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Icons } from '@/components/public/Icons';
import { useState } from 'react';

const Collaborations = () => {
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
    const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);

    const collaborations = [
        {
            title: "Hospital Partners",
            description: "Leading healthcare institutions partnering with us for practical training and placement. Our students gain hands-on experience in modern hospitals equipped with state-of-the-art facilities.",
            icon: <Icons.Users className="w-12 h-12 text-blue-600" />,
            link: "/hospital",
            color: "from-blue-50 to-indigo-50",
            buttonColor: "bg-blue-600 hover:bg-blue-700",

            details: [
                "Clinical rotations in various departments",
                "Exposure to patient care and management",
                "Training under experienced medical professionals",
                "Access to modern medical facilities"
            ]
        },
        {
            title: "Ayurvedic Pharmaceutical Partners",
            description: "Collaboration with top Ayurvedic pharmaceutical companies for research, development, and training in traditional medicine manufacturing.",
            icon: <Icons.Leaf className="w-12 h-12 text-green-600" />,
            link: "/ayurvedic-pharma",
            color: "from-green-50 to-emerald-50",
            buttonColor: "bg-green-600 hover:bg-green-700",

            details: [
                "Industry-standard manufacturing exposure",
                "Quality control training",
                "Research and development opportunities",
                "Product development insights"
            ]
        },
        {
            title: "Vaidya Saurabh",
            description: "Expert Ayurvedic practitioner and educator with over 15 years of experience in traditional healing practices and modern research.",
            icon: <Icons.Users className="w-12 h-12 text-teal-600" />,
            link: "/vaid-saurabh",
            color: "from-teal-50 to-cyan-50",
            buttonColor: "bg-teal-600 hover:bg-teal-700",

            details: [
                "Personalized mentorship programs",
                "Traditional healing techniques",
                "Clinical case studies",
                "Research guidance"
            ]
        }
    ];

    const certificates = [
        {
            id: 1,
            title: 'NAAC Certificate',
            description: 'National Assessment and Accreditation Council',
            file: '/CERTIFICATE/1  NAAC_CERTIFICATE__2022.pdf',
            icon: <Icons.Award className="w-5 h-5 text-blue-500" />,
            color: 'from-blue-50 to-blue-100/50'
        },
        {
            id: 2,
            title: 'University Approvals',
            description: 'Official University Recognition',
            file: '/CERTIFICATE/2 UNIVERSITY APPROVALS.pdf',
            icon: <Icons.GraduationCap className="w-5 h-5 text-green-500" />,
            color: 'from-green-50 to-green-100/50'
        },
        {
            id: 3,
            title: 'Authorization Letter',
            description: 'Official Authorization Document',
            file: '/CERTIFICATE/Authorization Letter (2) (1)_230112_140148.pdf',
            icon: <Icons.BookOpen className="w-5 h-5 text-purple-500" />,
            color: 'from-purple-50 to-purple-100/50'
        },
        {
            id: 4,
            title: 'LDM Affiliation',
            description: 'Institute Affiliation Certificate',
            file: '/CERTIFICATE/LDM AFFILATION CERTIFICATE.pdf',
            icon: <Icons.Award className="w-5 h-5 text-orange-500" />,
            color: 'from-orange-50 to-orange-100/50'
        },
    ];

    const galleryImages = [
        {
            src: "/collab1.jpeg",
            alt: "Hospital Training Session",
            caption: "Students during clinical training"
        },
        {
            src: "/collab2.jpeg",
            alt: "Pharmaceutical Company Visit",
            caption: "Industrial visit to pharmaceutical partner"
        },
        {
            src: "/collab3.jpeg",
            alt: "Research Laboratory",
            caption: "Advanced research facilities"
        }
    ];

    // Modal component for image preview
    const ImagePreviewModal = () => {
        if (!selectedPdf) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                <div className="relative bg-white rounded-lg max-w-4xl w-full">
                    <button
                        onClick={() => setSelectedPdf(null)}
                        className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
                    >
                        <Icons.ArrowUpRight className="w-6 h-6" />
                    </button>
                    <div className="relative aspect-[4/3] w-full">
                        <iframe
                            src={selectedPdf}
                            title="Certificate Preview"
                            className="w-full h-full object-contain rounded-lg"
                        />
                    </div>
                </div>
            </div>
        );
    };

    // Gallery Modal
    const GalleryModal = () => {
        if (!selectedGalleryImage) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
                <div className="relative max-w-5xl w-full">
                    <button
                        onClick={() => setSelectedGalleryImage(null)}
                        className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
                    >
                        <Icons.ArrowUpRight className="w-6 h-6" />
                    </button>
                    <img
                        src={selectedGalleryImage}
                        alt="Gallery Preview"
                        className="w-full h-full object-contain rounded-lg"
                    />
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
                {/* Hero Section */}
                <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="py-20"
                >
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-4xl mx-auto">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                                Our Strategic Collaborations
                            </h1>
                            <p className="text-xl text-gray-600 mb-12">
                                Partnering with industry leaders to provide world-class education and training in Ayurvedic medicine
                            </p>
                        </div>

                        {/* Collaboration Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            {collaborations.map((collab, index) => (
                                <motion.div
                                    key={collab.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="relative group"
                                >
                                    <div className={`p-6 rounded-xl bg-gradient-to-br ${collab.color} relative overflow-hidden transform transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl`}>
                                        <div className="relative z-10">
                                            <div className="flex justify-center mb-6 transform transition-transform duration-300 group-hover:scale-110">
                                                {collab.icon}
                                            </div>
                                            <h2 className="text-2xl font-bold text-gray-900 mb-4 transition-colors duration-300 group-hover:text-gray-800">
                                                {collab.title}
                                            </h2>
                                            <p className="text-gray-600 mb-6 transition-colors duration-300 group-hover:text-gray-700">
                                                {collab.description}
                                            </p>

                                            {/* Details List */}
                                            <ul className="space-y-3 mb-8">
                                                {collab.details.map((detail, idx) => (
                                                    <li key={idx} className="flex items-center text-gray-700 transition-transform duration-300 hover:translate-x-1">
                                                        <Icons.Users className="w-5 h-5 text-green-500 mr-2" />
                                                        <span>{detail}</span>
                                                    </li>
                                                ))}
                                            </ul>

                                            <div className="flex justify-center">
                                                <Link
                                                    href={collab.link}
                                                    className={`px-6 py-3 rounded-full text-white ${collab.buttonColor} transition-all duration-300 flex items-center space-x-2 hover:shadow-lg transform hover:-translate-y-0.5`}
                                                >
                                                    <span>Visit</span>
                                                    <Icons.ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Gallery Section */}
                <div className="py-12 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold text-center text-gray-900 mb-8"
                        >
                            Collaboration Gallery
                        </motion.h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {galleryImages.map((image, index) => (
                                <motion.div
                                    key={image.alt}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group relative aspect-w-16 aspect-h-9 rounded-xl overflow-hidden cursor-pointer"
                                    onClick={() => setSelectedGalleryImage(image.src)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <img
                                        src={image.src}
                                        alt={image.alt}
                                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <p className="text-white text-lg font-medium">
                                            {image.caption}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Certifications Section */}
                <div className="py-16">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Our Certifications
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {certificates.map((cert, index) => (
                            <motion.div
                                key={cert.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`bg-gradient-to-br ${cert.color} rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300`}
                            >
                                <a
                                    href={cert.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            {cert.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                {cert.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 truncate">
                                                {cert.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">View Certificate</span>
                                        <Icons.ArrowUpRight className="w-4 h-4 text-gray-400" />
                                    </div>
                                </a>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Benefits Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gray-50 rounded-2xl p-8 mb-20"
                >
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                        Benefits of Our Partnerships
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start space-x-4">
                            <Icons.GraduationCap className="w-6 h-6 text-blue-600 mt-1" />
                            <div>
                                <h3 className="font-semibold text-gray-800">Practical Training</h3>
                                <p className="text-gray-600">Hands-on experience with industry experts</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <Icons.Handshake className="w-6 h-6 text-blue-600 mt-1" />
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-800">Job Opportunities</h3>
                                <p className="text-gray-600">Direct access to employment opportunities</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <Icons.BookOpen className="w-6 h-6 text-blue-600 mt-1" />
                            <div>
                                <h3 className="font-semibold text-gray-800">Research Exposure</h3>
                                <p className="text-gray-600">Participation in cutting-edge research projects</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-4">
                            <Icons.Award className="w-6 h-6 text-blue-600 mt-1" />
                            <div>
                                <h3 className="font-semibold text-gray-800">Industry Recognition</h3>
                                <p className="text-gray-600">Certifications from leading organizations</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Modals */}
            <ImagePreviewModal />
            <GalleryModal />
        </>
    );
};

export default Collaborations;
