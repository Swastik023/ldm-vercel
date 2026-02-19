import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Vaid Saurabh — Expert Ayurvedic Practitioner',
    description: 'Learn about Vaid Saurabh, an expert Ayurvedic practitioner associated with LDM College, offering traditional healing expertise.',
    keywords: ["Vaid Saurabh","Ayurvedic practitioner","LDM Ayurveda","vaidya"],
    openGraph: {
        title: 'Vaid Saurabh — Expert Ayurvedic Practitioner | LDM College of Pharmacy',
        description: 'Learn about Vaid Saurabh, an expert Ayurvedic practitioner associated with LDM College, offering traditional healing expertise.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
