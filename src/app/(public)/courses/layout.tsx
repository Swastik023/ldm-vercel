import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Courses & Programs',
    description: 'Explore Diploma and Degree pharmacy programs at LDM College — D.Pharma, B.Pharma, and Ayurvedic Pharmacy with expert faculty.',
    keywords: ["D.Pharma course","B.Pharma course","pharmacy programs","pharmacy admission"],
    openGraph: {
        title: 'Courses & Programs | LDM College of Pharmacy',
        description: 'Explore Diploma and Degree pharmacy programs at LDM College — D.Pharma, B.Pharma, and Ayurvedic Pharmacy with expert faculty.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
