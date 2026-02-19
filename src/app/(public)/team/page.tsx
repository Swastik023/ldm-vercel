'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export const teamMembers = [
    {
        id: 'dr-rajesh-sachdeva',
        name: 'Dr. Rajesh Sachdeva',
        role: 'Medical Director',
        image: "/facu3.jpeg",
        bio: `Dr. Rajesh Sachdeva is one of the best-leading doctors in our centre. 
           He completed his D. Pharma and joined his father. He also did B.E.M.S. in 2008. 
           After Dr. Dharam Dev, the name of the SACHDEVA CLINIC was converted into DR. DHARAM DEV MEMORIAL HOSPITAL. 
           Dr. Rajesh has worked effortlessly for the care and treatment of patients. 
           He has taken the hospital to new heights of success with his dedication, efforts, and immense knowledge. 
           For the needy and poor, he provides free medication and lab tests.`,
        contact: {
            email: 'dr.rajesh@ldmhospital.com',
            phone: '+91-XXX-XXX-XXXX',
            linkedin: 'linkedin.com/in/rajeshsachdeva',
        },
    },
    {
        id: 'dr-sakshi-sachdeva',
        name: 'Dr. Sakshi Sachdeva',
        role: 'Chief Gynecologist',
        image: "/facu1.jpeg",
        bio: `Dr. Sakshi Sachdeva finished her BAMS and PGDHCI and has been practicing gynecology for 4 years. 
           She also completed NDDY, contributing significantly to naturopathic care for patients. 
           As a consultant for the diet and weight management department, she creates personalized diet plans for specific ailments. 
           Her extensive knowledge and expertise benefit countless patients.`,
        contact: {
            email: 'dr.sakshi@ldmhospital.com',
            phone: '+91-XXX-XXX-XXXX',
            linkedin: 'linkedin.com/in/sakshisachdeva',
        },
    },
    {
        id: 'dr-saurabh-sachdeva',
        name: 'Dr. Saurabh Sachdeva',
        role: 'Senior Consultant',
        image: "/facu2.jpeg",
        bio: `Dr. Saurabh Sachdeva passed his M.D. in 2019 after finishing his BAMS. 
           He also earned Diplomas in Naturopathy and Yoga (NDDY). 
           Dr. Saurabh was a top student at his university and is an expert in internal and interpersonal skills. 
           He provides specialized Yoga therapy for male and female infertility and offers free medical care through NGOs. 
           Sharing his father’s enthusiasm for charity, Dr. Saurabh is dedicated to helping the needy.`,
        contact: {
            email: 'dr.saurabh@ldmhospital.com',
            phone: '+91-XXX-XXX-XXXX',
            linkedin: 'linkedin.com/in/saurabhsachdeva',
        },
    },
];

const Team: React.FC = () => {
    return (
        <section className="py-12 sm:py-16 bg-gradient-to-b from-white to-gray-50">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                        Our Expert Team
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Meet our dedicated team of healthcare professionals committed to providing exceptional care and healing.
                    </p>
                </motion.div>

                <div className="mt-12 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {teamMembers.map((member, index) => (
                        <motion.div
                            key={member.id}
                            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Link href={`/faculty/${member.id}`} className="block">
                                <div className="relative">
                                    <div className="aspect-[3/4] overflow-hidden border-4 border-gray-100 rounded-t-xl">
                                        <motion.div
                                            whileHover={{ scale: 1.15 }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                            className="w-full h-full"
                                        >
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                className="w-full h-full object-cover object-center"
                                            />
                                        </motion.div>
                                    </div>
                                </div>
                                <div className="p-6 bg-white border-t border-gray-100">
                                    <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {member.name}
                                    </h2>
                                    <p className="mt-1 text-sm font-medium text-blue-600">
                                        {member.role}
                                    </p>
                                    <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                                        {member.bio}
                                    </p>
                                    <div className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                                        View Profile
                                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Team;
