/**
 * lib/gtag.ts — Production-grade Google Analytics 4 utility
 *
 * Usage:
 *   import * as gtag from '@/lib/gtag';
 *   gtag.pageview('/courses/dmlt');
 *   gtag.event.applyClick('DMLT');
 *   gtag.event.courseView('dmlt', 'Diploma in Medical Laboratory Technology');
 */

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || '';

// ─── Core: send a page_view hit ────────────────────────────────────────────
export function pageview(url: string) {
    if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
    window.gtag('config', GA_ID, {
        page_path: url,
        // Anonymize IP for privacy compliance (GDPR-friendly)
        anonymize_ip: true,
    });
}

// ─── Core: send a custom GA4 event ────────────────────────────────────────
export function sendEvent(
    action: string,
    params?: Record<string, string | number | boolean>
) {
    if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
    window.gtag('event', action, params);
}

// ─── Typed event helpers ───────────────────────────────────────────────────
export const event = {
    /** Fired when a student clicks "Apply Now" */
    applyClick: (source: string = 'unknown') =>
        sendEvent('apply_click', { event_category: 'engagement', source }),

    /** Fired when a course detail page is viewed */
    courseView: (courseId: string, courseName: string) =>
        sendEvent('course_view', { event_category: 'content', course_id: courseId, course_name: courseName }),

    /** Fired when the contact form is successfully submitted */
    contactFormSubmit: () =>
        sendEvent('contact_form_submit', { event_category: 'lead' }),

    /** Fired when the admission enquiry form is submitted */
    admissionEnquiry: (course: string) =>
        sendEvent('admission_enquiry', { event_category: 'lead', selected_course: course }),

    /** Fired when a student starts an MCQ test */
    testStart: (testTitle: string) =>
        sendEvent('test_start', { event_category: 'exam', test_title: testTitle }),

    /** Fired when a student submits an MCQ test */
    testSubmit: (testTitle: string, score: number, percentage: number) =>
        sendEvent('test_submit', { event_category: 'exam', test_title: testTitle, score, percentage }),

    /** Fired when a new student registers */
    studentRegister: () =>
        sendEvent('sign_up', { method: 'email', event_category: 'auth' }),

    /** Fired when a student verifies their OTP */
    otpVerified: () =>
        sendEvent('otp_verified', { event_category: 'auth' }),

    /** Fired when student downloads their resume PDF */
    resumeDownload: () =>
        sendEvent('resume_download', { event_category: 'engagement' }),

    /** Fired when a user clicks WhatsApp contact button */
    whatsappClick: (source: string = 'unknown') =>
        sendEvent('whatsapp_click', { event_category: 'engagement', source }),

    /** Fired when a user views the library page */
    libraryView: () =>
        sendEvent('library_view', { event_category: 'content' }),
};

// ─── TypeScript declaration for window.gtag ───────────────────────────────
declare global {
    interface Window {
        gtag: (...args: unknown[]) => void;
        dataLayer: unknown[];
    }
}
