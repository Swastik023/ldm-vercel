'use client';

import { motion } from 'framer-motion';
import { Icons } from '@/components/public/Icons';

const VaidSaurabh = () => {
    const fadeIn = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6 }
    };

    const achievements = [
        {
            title: "Years of Experience",
            value: "15+",
            icon: <Icons.Clock className="w-8 h-8 text-teal-600" />
        },
        {
            title: "Patients Treated",
            value: "10,000+",
            icon: <Icons.Users className="w-8 h-8 text-teal-600" />
        },
        {
            title: "Research Papers",
            value: "25+",
            icon: <Icons.BookOpen className="w-8 h-8 text-teal-600" />
        }
    ];

    const specializations = [
        {
            title: "Clinical Practice",
            description: "Expert in treating chronic diseases using Ayurvedic principles",
            icon: <Icons.Stethoscope className="w-8 h-8 text-teal-600" />
        },
        {
            title: "Herbal Medicine",
            description: "Specializes in traditional herbal formulations",
            icon: <Icons.Leaf className="w-8 h-8 text-teal-600" />
        },
        {
            title: "Academic Contribution",
            description: "Regular contributor to Ayurvedic research and education",
            icon: <Icons.GraduationCap className="w-8 h-8 text-teal-600" />
        }
    ];

    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Hero Section */}
                <div className="bg-gradient-to-r from-green-50 to-teal-50 py-20">
                    <div className="container mx-auto px-4">
                        <motion.div {...fadeIn} className="text-center">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
                                Vaidya Saurabh Sachdeva
                            </h1>
                            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                                Expert Ayurvedic Practitioner and Educator
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="container mx-auto px-4 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <img
                                src="/facu2.jpeg"
                                alt="Vaidya Saurabh"
                                className="rounded-lg shadow-xl w-full max-w-md h-[500px] object-cover object-center mx-auto"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h2 className="text-3xl font-bold text-gray-800 mb-6">About Vaidya Saurabh Sachdeva</h2>
                            <p className="text-gray-600 mb-6">
                                With over 15 years of experience in Ayurvedic medicine, Vaidya Saurabh Sachdeva has dedicated his life to promoting holistic healing and wellness through traditional practices. His expertise spans across various aspects of Ayurveda, from herbal medicine to specialized therapies.
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                {achievements.map((achievement) => (
                                    <div key={achievement.title} className="text-center">
                                        <div className="flex justify-center mb-2">{achievement.icon}</div>
                                        <div className="font-bold text-2xl text-teal-600">{achievement.value}</div>
                                        <div className="text-sm text-gray-600">{achievement.title}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Specializations */}
                <div className="bg-gradient-to-r from-teal-50 to-green-50 py-16">
                    <div className="container mx-auto px-4">
                        <motion.h2
                            {...fadeIn}
                            className="text-3xl font-bold text-gray-800 mb-12 text-center"
                        >
                            Areas of Expertise
                        </motion.h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {specializations.map((spec, index) => (
                                <motion.div
                                    key={spec.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.2 }}
                                    className="bg-white p-6 rounded-xl shadow-lg"
                                >
                                    <div className="flex items-center mb-4">
                                        {spec.icon}
                                        <h3 className="text-xl font-semibold text-gray-800 ml-3">
                                            {spec.title}
                                        </h3>
                                    </div>
                                    <p className="text-gray-600">{spec.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="fixed bottom-11 right-8 z-50"
                >
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <a
                            href="https://wa.me/+919896607010?text=Hi ,%20I%20would%20like%20to%20schedule%20an%20appointment."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/10 backdrop-blur-sm"
                        >
                            <Icons.Phone className="w-5 h-5" />
                            <span className="font-medium">Book Appointment</span>
                        </a>
                    </motion.div>
                </motion.div>
            </div>
        </>
    );
};

export default VaidSaurabh;
