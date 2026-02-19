'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Icons } from '@/components/public/Icons';

const AyurvedicPharma = () => {
    const partners = [
        {
            name: "Reach Pharmaceuticals",
            description: "Leading manufacturer of ayurvedic products",
            image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80",
            specialties: ["Herbal Medicines", "Natural Healthcare Products", "Ayurvedic Research"],
            icon: (
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full blur group-hover:blur-md transition-all duration-300 opacity-75"></div>
                    <div className="relative bg-white rounded-full p-2 shadow-lg group-hover:shadow-emerald-500/50">
                        <Icons.Leaf className="w-6 h-6 text-emerald-600 transform group-hover:scale-110 transition-transform duration-300" />
                    </div>
                </div>
            )
        },
        {
            name: "Vaidya Saurabh Pharmaceuticals",
            description: "Pioneer in herbal healthcare",
            image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&q=80",
            specialties: ["Personal Care", "Healthcare", "Pharmaceuticals"],
            icon: (
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full blur group-hover:blur-md transition-all duration-300 opacity-75"></div>
                    <div className="relative bg-white rounded-full p-2 shadow-lg group-hover:shadow-purple-500/50">
                        <Icons.Stethoscope className="w-6 h-6 text-purple-600 transform group-hover:scale-110 transition-transform duration-300" />
                    </div>
                </div>
            )
        },
        {
            name: "Green Health Care",
            description: "Trusted name in ayurvedic medicines",
            image: "https://images.unsplash.com/photo-1626863905121-3b0c0ed7b94c?auto=format&fit=crop&q=80",
            specialties: ["Ayurvedic Medicines", "Healthcare Products", "Research & Development"],
            icon: (
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full blur group-hover:blur-md transition-all duration-300 opacity-75"></div>
                    <div className="relative bg-white rounded-full p-2 shadow-lg group-hover:shadow-teal-500/50">
                        <Icons.BookOpen className="w-6 h-6 text-teal-600 transform group-hover:scale-110 transition-transform duration-300" />
                    </div>
                </div>
            )
        },
        {
            name: "Sanjeevani Health Care",
            description: "Trusted name in ayurvedic medicines",
            image: "https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&q=80",
            specialties: ["Ayurvedic Medicines", "Healthcare Products", "Research & Development"],
            icon: (
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-sky-500 rounded-full blur group-hover:blur-md transition-all duration-300 opacity-75"></div>
                    <div className="relative bg-white rounded-full p-2 shadow-lg group-hover:shadow-blue-500/50">
                        <Icons.Users className="w-6 h-6 text-blue-600 transform group-hover:scale-110 transition-transform duration-300" />
                    </div>
                </div>
            )
        }
    ];

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 py-20">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                                Our Ayurvedic Pharmaceutical Partners
                            </h1>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                Collaborating with leading Ayurvedic pharmaceutical companies to promote traditional medicine and holistic healthcare.
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Partners Section */}
                <div className="container mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {partners.map((partner, index) => (
                            <motion.div
                                key={partner.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.2 }}
                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="aspect-w-16 aspect-h-9 relative group">
                                    <img
                                        src={partner.image}
                                        alt={partner.name}
                                        className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            <div className="scale-125">
                                                {partner.icon}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                        {partner.name}
                                    </h3>
                                    <p className="text-gray-600 mb-4">{partner.description}</p>
                                    <div className="space-y-3">
                                        {partner.specialties.map((specialty) => (
                                            <div key={specialty} className="flex items-center text-gray-600 hover:text-emerald-600 transition-colors duration-200 group">
                                                <div className="scale-75 opacity-75 group-hover:opacity-100">
                                                    {partner.icon}
                                                </div>
                                                <span className="ml-2 text-sm group-hover:translate-x-1 transition-transform duration-200">{specialty}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 py-16">
                    <div className="container mx-auto px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-center max-w-3xl mx-auto"
                        >
                            <h2 className="text-3xl font-bold text-gray-800 mb-6">
                                Benefits of Our Partnerships
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                <div className="flex items-start space-x-4">
                                    <Icons.Leaf className="w-6 h-6 text-emerald-600 mt-1" />
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Research Opportunities</h3>
                                        <p className="text-gray-600">Access to cutting-edge research in Ayurvedic medicine</p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-4">
                                    <Icons.BookOpen className="w-6 h-6 text-emerald-600 mt-1" />
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Training Programs</h3>
                                        <p className="text-gray-600">Industry-focused training and workshops</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="container mx-auto px-4 py-16 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">
                        Ready to Learn More?
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                        Join our pharmaceutical training program and gain hands-on experience in Ayurvedic medicine manufacturing.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center px-6 py-3 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                        <span>Contact Us</span>
                        <Icons.ArrowUpRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>
            </div>
        </>
    );
};

export default AyurvedicPharma;
