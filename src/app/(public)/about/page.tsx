'use client';

import { useState, useEffect } from "react";
import { Icons } from '@/components/public/Icons';
import WhyChooseUs from "@/components/public/WhyChooseUs";
import { motion } from "framer-motion";
import IconWrapper from '@/components/public/IconWrapper';

const About = () => {
    const [directorMessage, setDirectorMessage] = useState('');

    useEffect(() => {
        // Mock fetch for now, or ensure API exists
        // fetch('/api/public/content')
        //   .then(res => res.json())
        //   .then(data => {
        //     if (data.success && data.content) {
        //       setDirectorMessage(data.content.principal_message || '');
        //     }
        //   })
        //   .catch(err => console.error(err));
    }, []);

    const facilities = [
        {
            name: 'Digital Library',
            description: 'Access to extensive digital resources, medical journals, and research papers.',
            icon: (
                <IconWrapper color="purple">
                    <Icons.BookOpen className="h-6 w-6 text-white" />
                </IconWrapper>
            ),
        },
        {
            name: 'Smart Classrooms',
            description: 'Interactive learning environment with modern teaching aids and technology.',
            icon: (
                <IconWrapper color="green">
                    {/* Icons.MonitorSmartphone replacement if missing */}
                    <Icons.Users className="h-6 w-6 text-white" />
                </IconWrapper>
            ),
        },
        {
            name: 'Research Focus',
            description: 'Emphasis on research and practical learning through hands-on experience.',
            icon: (
                <IconWrapper color="orange">
                    {/* Icons.Target replacement if missing */}
                    <Icons.Award className="h-6 w-6 text-white" />
                </IconWrapper>
            ),
        },
        {
            name: 'Wi-Fi Campus',
            description: 'High-speed internet connectivity throughout the campus.',
            icon: (
                <IconWrapper color="teal">
                    {/* Icons.Wifi replacement if missing */}
                    <Icons.Clock className="h-6 w-6 text-white" />
                </IconWrapper>
            ),
        },
        {
            name: 'Cafeteria',
            description: 'Modern cafeteria serving healthy and nutritious meals.',
            icon: (
                <IconWrapper color="blue">
                    {/* Icons.Coffee replacement if missing */}
                    <Icons.Leaf className="h-6 w-6 text-white" />
                </IconWrapper>
            ),
        },
        {
            name: 'Library',
            description: 'Well-stocked library with medical books, journals, and study materials.',
            icon: (
                <IconWrapper color="purple">
                    <Icons.BookOpen className="h-6 w-6 text-white" />
                </IconWrapper>
            ),
        },
    ];

    return (
        <>
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-blue-50 to-white pt-20 pb-16 transition-colors duration-200">
                <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold text-gray-900 mb-6">About Us</h1>
                    <div className="prose max-w-none">
                        <p className="text-xl text-gray-600 mb-8">
                            LDM PARAMEDICAL is an Autonomous Educational Organization running under DBU (Centre of Excellence) Desh Bhagat University, Mandi Gobindgarh & FIIP, (Punjab). Founded in honor of Smt. Lajwanti (State Awarded in 1974), we are recognized as one of the top paramedical institutes providing practical training.
                        </p>
                    </div>
                </div>
            </div>

            {/* Message from Director */}
            <div className="py-16 bg-gradient-to-b from-white to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:flex lg:items-center lg:gap-12">
                        {/* Director's Image */}
                        <motion.div
                            className="lg:w-1/3 mb-8 lg:mb-0"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="relative">
                                <img
                                    src="/facu2.jpeg"
                                    alt="Director"
                                    className="rounded-lg shadow-xl w-full max-w-md mx-auto object-cover aspect-[3/4]"
                                />
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/30 to-transparent"></div>
                            </div>
                        </motion.div>

                        {/* Message Content */}
                        <motion.div
                            className="lg:w-2/3"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="bg-white rounded-xl shadow-lg p-8 relative">
                                {/* Icons.Quote replacement */}
                                <span className="absolute top-4 left-4 text-4xl text-blue-100 font-serif">"</span>

                                <h2 className="text-3xl font-bold text-gray-900 mb-6 mt-4">Message from Director</h2>

                                <div className="space-y-4 text-gray-600 relative z-10 whitespace-pre-wrap">
                                    {directorMessage || (
                                        <>
                                            <p>
                                                Welcome to LDM Paramedical Institute. As the Director, it gives me immense pleasure to lead an institution that has been at the forefront of paramedical education for years.
                                            </p>
                                            <p>
                                                Our mission is to nurture skilled healthcare professionals who will contribute significantly to the medical field. We believe in providing not just education, but a transformative learning experience that prepares our students for the real world of healthcare.
                                            </p>
                                            <p>
                                                At LDM, we focus on practical training, modern facilities, and a curriculum that adapts to the evolving healthcare landscape. Our dedicated faculty, state-of-the-art infrastructure, and strong industry connections ensure that our students receive the best possible education.
                                            </p>
                                            <p className="font-medium text-gray-900">
                                                Join us in our journey to shape the future of healthcare education and make a positive impact on society.
                                            </p>
                                        </>
                                    )}
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h3 className="font-bold text-gray-900">Dr. Saurabh Sachdeva</h3>
                                    <p className="text-blue-600">Director, LDM College</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Vision & Mission Section */}
            <motion.section
                className="py-16"
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: false, amount: 0.3 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Vision */}
                        <motion.div
                            className="bg-gradient-to-br from-white via-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg"
                            initial={{ x: -100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: false, amount: 0.3 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        >
                            <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
                                {/* Icons.Eye replacement */}
                                <Icons.BookOpen className="w-6 h-6 mr-3" />
                                Our Vision
                            </h2>
                            <p className="text-gray-700">
                                To become a leading institution in paramedical education, known for excellence in healthcare training and producing skilled professionals who make a meaningful impact in the medical field.
                            </p>
                        </motion.div>

                        {/* Mission */}
                        <motion.div
                            className="bg-gradient-to-br from-white via-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg"
                            initial={{ x: 100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: false, amount: 0.3 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                        >
                            <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
                                <Icons.Award className="w-6 h-6 mr-3" />
                                Our Mission
                            </h2>
                            <p className="text-gray-700">
                                To provide comprehensive, practical paramedical education that equips students with the knowledge, skills, and values needed to excel in healthcare settings and contribute to improving patient care.
                            </p>
                        </motion.div>

                        {/* {Aim} */}
                        <motion.div
                            className="bg-gradient-to-br from-white via-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg"
                            initial={{ x: -100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: false, amount: 0.3 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        >
                            <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
                                <Icons.BookOpen className="w-6 h-6 mr-3" />
                                Our Aim
                            </h2>
                            <p className="text-gray-700">
                                LDM Institute aims to develop the student&apos;s expertise in their specialized disciplines. We assure quality
                                education with the perfect blend of theory and practical according to NSQF (NATIONAL SKILL QUALIFICATION FRAMEWORK) guidelines.
                            </p>
                        </motion.div>

                        {/* {new} */}
                        <motion.div
                            className="bg-gradient-to-br from-white via-blue-50 to-blue-100 p-8 rounded-2xl shadow-lg"
                            initial={{ x: 100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: false, amount: 0.3 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                        >
                            <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
                                <Icons.Award className="w-6 h-6 mr-3" />
                                Our Infrastructure
                            </h2>
                            <p className="text-gray-700">
                                The campus is divided into various functional zones like Academic and Administrative Blocks, and Residential complexes for faculty and staff.
                            </p>
                        </motion.div>


                    </div>
                </div>
            </motion.section>

            {/* Facilities Section */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        className="text-center mb-12"
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: false }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Facilities</h2>
                        <p className="text-lg text-gray-600">State-of-the-art facilities to support your learning journey</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {facilities.map((facility, index) => (
                            <motion.div
                                key={index}
                                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-center justify-center mb-4">
                                    {facility.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-center mb-2">{facility.name}</h3>
                                <p className="text-gray-600 text-center">{facility.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Why Choose Us Section */}
            <WhyChooseUs />
        </>
    );
};

export default About;
