'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/components/public/Icons';
import IconWrapper from '@/components/public/IconWrapper';

const features = [
    {
        name: 'Experienced Faculty',
        description: 'Learn from highly qualified and experienced medical professionals',
        icon: (
            <IconWrapper color="blue">
                <Icons.Users className="h-6 w-6 text-white" />
            </IconWrapper>
        ),
    },
    {
        name: 'Practical Training',
        description: 'Hands-on experience with modern medical equipment',
        icon: (
            <IconWrapper color="purple">
                <Icons.BookOpen className="h-6 w-6 text-white" />
            </IconWrapper>
        ),
    },
    {
        name: 'Industry Recognition',
        description: 'Courses recognized by leading healthcare institutions',
        icon: (
            <IconWrapper color="green">
                <Icons.Award className="h-6 w-6 text-white" />
            </IconWrapper>
        ),
    },
    {
        name: 'Flexible Schedule',
        description: 'Convenient class timings for working professionals',
        icon: (
            <IconWrapper color="red">
                <Icons.Clock className="h-6 w-6 text-white" />
            </IconWrapper>
        ),
    },
    {
        name: 'Quality Education',
        description: 'Comprehensive curriculum with focus on practical skills',
        icon: (
            <IconWrapper color="orange">
                {/* Using Award as Star replacement if needed, or check Icons export */}
                <Icons.Award className="h-6 w-6 text-white" />
            </IconWrapper>
        ),
    },
    {
        name: 'Placement Support',
        description: 'Career guidance and placement assistance',
        icon: (
            <IconWrapper color="teal">
                {/* Using GraduationCap or Handshake as Shield replacement if needed */}
                <Icons.Handshake className="h-6 w-6 text-white" />
            </IconWrapper>
        ),
    },
];

const WhyChooseUs: React.FC = () => {
    return (
        <section className="py-12 sm:py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                        Why Choose LDM Paramedical?
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                        Experience excellence in paramedical education with our comprehensive programs and skill development courses
                    </p>
                </motion.div>

                <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <motion.div
                            key={feature.name}
                            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;
