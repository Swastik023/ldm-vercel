import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Us',
    description: 'Get in touch with LDM College of Pharmacy for admissions, queries, and information. Find our address, phone number, and contact form.',
    keywords: ["LDM college contact","pharmacy college contact","pharmacy college address","admission enquiry"],
    openGraph: {
        title: 'Contact Us | LDM College of Pharmacy',
        description: 'Get in touch with LDM College of Pharmacy for admissions, queries, and information. Find our address, phone number, and contact form.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
