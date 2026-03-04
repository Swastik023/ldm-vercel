import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';
import CourseDetailClient from './CourseDetailClient';
import type { Metadata } from 'next';

// SEO metadata per course
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    await dbConnect();
    const program = await Program.findOne({ code: id, is_active: true }).lean() as any;
    if (!program) return { title: 'Course Not Found' };
    return {
        title: `${program.name} | LDM College`,
        description: (program.description || '').slice(0, 160),
        keywords: [program.name, 'paramedical', 'LDM College', program.eligibilitySummary || '', 'Karnal'],
        openGraph: {
            title: program.name,
            description: (program.description || '').slice(0, 160),
            images: program.image ? [program.image] : [],
        },
    };
}

function toClientCourse(p: any, includeCurriculum = false) {
    const base: any = {
        id: p.code,
        title: p.name,
        duration: p.duration_years >= 1
            ? `${p.duration_years} Year${p.duration_years > 1 ? 's' : ''}`
            : `${Math.round(p.duration_years * 12)} Months`,
        eligibility: p.eligibilitySummary || '12th Pass',
        image: p.image || '/course_img/default.jpeg',
        description: p.description || p.shortDescription || '',
        syllabus: p.syllabus || [],
        career: p.careerOptions || [],
        course_type: p.course_type || 'diploma',
    };
    if (includeCurriculum && p.curriculum) {
        base.curriculum = p.curriculum;
    }
    return base;
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await dbConnect();

    const program = await Program.findOne({ code: id, is_active: true }).lean() as any;
    if (!program) {
        notFound();
        return null;
    }

    // Get related courses (same type, different code, max 3)
    const relatedPrograms = await Program.find({
        code: { $ne: id },
        is_active: true,
    }).sort({ displayOrder: 1 }).limit(3).lean();

    const course = toClientCourse(program, true);
    const related = relatedPrograms.map(p => toClientCourse(p));

    return <CourseDetailClient course={course} related={related} />;
}
