'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Icons } from '@/components/public/Icons';
import { courseData } from '@/data/courseData';

const Courses: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'regular' | 'certification'>('regular');

    const regularCourses = courseData.filter(course =>
        !['caim', 'cand', 'cap', 'cacsbc'].includes(course.id)
    );

    const certificationCourses = courseData.filter(course =>
        ['caim', 'cand', 'cap', 'cacsbc'].includes(course.id)
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">
                        Our Courses
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Explore our comprehensive range of medical and paramedical courses designed to shape the future of healthcare professionals.
                    </p>
                </motion.div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                        <button
                            onClick={() => setActiveTab('regular')}
                            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === 'regular'
                                    ? 'bg-blue-500 text-white'
                                    : 'hover:bg-gray-50 text-gray-500'
                                }`}
                        >
                            Regular Courses
                        </button>

                        <button
                            onClick={() => setActiveTab('certification')}
                            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === 'certification'
                                    ? 'bg-blue-500 text-white'
                                    : 'hover:bg-gray-50 text-gray-500'
                                }`}
                        >
                            Certification Courses
                        </button>
                    </div>
                </div>

                {/* Course Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(activeTab === 'regular' ? regularCourses : certificationCourses).map((course, index) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                        >
                            <div className="relative h-48">
                                <img
                                    src={course.image}
                                    alt={course.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                    {course.title}
                                </h2>
                                <p className="text-gray-600 mb-4 line-clamp-2">
                                    {course.description}
                                </p>
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Icons.Clock className="w-4 h-4 mr-1" />
                                        {course.duration}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Icons.GraduationCap className="w-4 h-4 mr-1" />
                                        {course.eligibility}
                                    </div>
                                </div>
                                <Link
                                    href={`/courses/${course.id}`}
                                    className="inline-flex items-center justify-center w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                                >
                                    <span>Learn More</span>
                                    <Icons.ArrowUpRight className="w-4 h-4 ml-2" />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Courses;
