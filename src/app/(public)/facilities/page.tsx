'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from '@/components/public/Icons';

const facilities = [
    {
        id: 1,
        title: 'Emergency & Triage',
        description: 'Our modern triage facility is equipped with emergency response equipment, vital signs monitoring systems, and trauma care tools. Students learn patient assessment, emergency response protocols, and critical decision-making in our simulated emergency environment.',
        features: ['Emergency response equipment', 'Vital signs monitoring', 'Trauma care tools', 'Patient assessment area'],
        image: '/hospital/TRIAGE.jpeg',
    },
    {
        id: 2,
        title: 'Minor OT',
        description: 'State-of-the-art operation theatre with modern surgical equipment, sterilization facilities, and surgical instruments. Provides hands-on training in minor surgical procedures, sterilization techniques, and OT protocols.',
        features: ['Surgical equipment', 'Sterilization unit', 'Surgical instruments', 'OT monitoring systems'],
        image: '/hospital/ICU.jpeg',
    },
    {
        id: 3,
        title: 'Pharmacy',
        description: 'Comprehensive pharmacy setup featuring medication storage systems, dispensing units, and inventory management tools. Students learn pharmaceutical practices, medication management, and dispensing protocols in a realistic environment.',
        features: ['Medication storage systems', 'Dispensing units', 'Inventory management', 'Drug information resources'],
        image: '/hospital/PHARMACY2.jpeg',
    },
    {
        id: 4,
        title: 'Laboratory',
        description: 'Advanced medical laboratory equipped with modern diagnostic equipment, microscopes, and testing facilities. Provides practical training in sample collection, analysis, and laboratory procedures with focus on accuracy and safety protocols.',
        features: ['Diagnostic equipment', 'Microscopes', 'Testing facilities', 'Sample processing units'],
        image: '/hospital/LAB..jpeg',
    },
    {
        id: 5,
        title: 'ICU',
        description: 'Intensive Care Unit featuring advanced life support systems, patient monitoring equipment, and emergency response tools. Students gain experience in critical care management, ventilator operation, and intensive patient monitoring.',
        features: ['Life support systems', 'Patient monitoring', 'Ventilators', 'Emergency response equipment'],
        image: '/hospital/ICU2.jpeg',
    },
    {
        id: 6,
        title: 'X-Ray & TMT',
        description: 'Modern imaging department with X-ray facilities and Treadmill Test (TMT) equipment. Provides training in radiological procedures, image processing, and cardiac stress testing with emphasis on safety protocols.',
        features: ['X-ray machine', 'TMT equipment', 'Image processing systems', 'Radiation safety gear'],
        image: '/hospital/X_Ray.jpeg',
    },
    {
        id: 7,
        title: 'Private Room',
        description: 'Well-equipped private patient rooms with modern hospital beds, monitoring systems, and patient care equipment. Students learn personalized patient care, monitoring, and management in a controlled environment.',
        features: ['Hospital beds', 'Patient monitoring', 'Care equipment', 'Sanitation facilities'],
        image: '/hospital/private_room.jpeg',
    },
    {
        id: 8,
        title: 'General Ward',
        description: 'Spacious general ward setup with multiple patient beds, nursing stations, and essential medical equipment. Provides training in managing multiple patients, ward procedures, and efficient healthcare delivery.',
        features: ['Multiple patient beds', 'Nursing station', 'Medical equipment', 'Patient care tools'],
        image: '/hospital/WARD.jpeg',
    },
];

const featuresList = [
    'Modern medical equipment and instruments for hands-on practice',
    'Real-world healthcare environment simulation',
    'Safety-compliant training facilities',
    'Advanced diagnostic and therapeutic equipment',
];

const Facilities: React.FC = () => {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center space-y-4 sm:space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                            Our Facilities
                        </h1>
                        <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600">
                            Experience hands-on training in our state-of-the-art medical facilities equipped with modern technology and professional-grade equipment.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Facilities Grid */}
            <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {facilities.map((facility) => (
                            <motion.div
                                key={facility.id}
                                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: facility.id * 0.1 }}
                            >
                                <div className="relative pt-[56.25%]">
                                    <img
                                        src={facility.image}
                                        alt={facility.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                                        {facility.title}
                                    </h3>
                                    <p className="text-gray-600 text-base sm:text-lg mb-4">
                                        {facility.description}
                                    </p>
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-gray-900">Key Equipment:</h4>
                                        <ul className="grid grid-cols-2 gap-2">
                                            {facility.features.map((feature, index) => (
                                                <li key={index} className="flex items-start text-sm text-gray-600">
                                                    <Icons.Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Additional Info Section */}
            <section className="bg-gray-50 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="space-y-4 sm:space-y-6">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                                Professional Training Environment
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600">
                                Our facilities are designed to provide students with practical experience in a professional healthcare setting. Each facility is equipped with industry-standard equipment and follows proper medical protocols.
                            </p>
                            <ul className="space-y-3">
                                {featuresList.map((feature, index) => (
                                    <motion.li
                                        key={feature}
                                        className="flex items-center text-gray-600"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: index * 0.1 }}
                                    >
                                        <Icons.Check className="h-5 w-5 text-green-500 mr-3" />
                                        <span className="text-base sm:text-lg">{feature}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                        <motion.div
                            className="relative aspect-[4/3]"
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <img
                                src="/hospital/LAB2.jpeg"
                                alt="Medical Laboratory"
                                className="rounded-lg shadow-lg w-full h-full object-cover"
                            />
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                            Experience Our Facilities
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                            Visit our campus to see our state-of-the-art facilities and learn more about our practical training approach.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => {
                                    const url = "https://www.google.com/maps/dir/?api=1&destination=29.733569974798775,76.98468427563566&destination_place_id=ChIJR6MTJ_1yDTkRCkpe+LLl6fY";
                                    window.open(url, '_blank');
                                }}
                                className="inline-flex items-center justify-center px-6 py-3 text-base sm:text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors duration-300"
                            >
                                Get Directions
                                <Icons.MapPin className="ml-2 h-5 w-5" />
                            </button>
                            <a
                                href="tel:+919896607010"
                                className="inline-flex items-center justify-center px-6 py-3 text-base sm:text-lg font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors duration-300"
                            >
                                Call Us Now
                                <Icons.Phone className="ml-2 h-5 w-5" />
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default Facilities;
