import { notFound } from 'next/navigation';
import { courseData } from '@/data/courseData';
import CourseDetailClient from './CourseDetailClient';
import type { Metadata } from 'next';

// Generate static paths for all courses
export async function generateStaticParams() {
    return courseData.map(c => ({ id: c.id }));
}

// SEO metadata per course
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const course = courseData.find(c => c.id === id);
    if (!course) return { title: 'Course Not Found' };
    return {
        title: `${course.title} | LDM College`,
        description: course.description.slice(0, 160),
        keywords: [course.title, 'paramedical', 'LDM College', course.eligibility, 'Karnal'],
        openGraph: {
            title: course.title,
            description: course.description.slice(0, 160),
            images: [course.image],
        },
    };
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const course = courseData.find(c => c.id === id);

    if (!course) {
        notFound();
        return null;
    }

    const related = courseData.filter(c => c.id !== course.id).slice(0, 3);

    return <CourseDetailClient course={course} related={related} />;
}
