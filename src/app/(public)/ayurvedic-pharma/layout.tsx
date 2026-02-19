import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Ayurvedic Pharmacy',
    description: 'LDM College offers specialized Ayurvedic Pharmacy programs blending traditional Ayurvedic knowledge with modern pharmaceutical sciences.',
    keywords: ["Ayurvedic pharmacy","Ayurveda course","herbal pharmacy","ayurvedic medicine"],
    openGraph: {
        title: 'Ayurvedic Pharmacy | LDM College of Pharmacy',
        description: 'LDM College offers specialized Ayurvedic Pharmacy programs blending traditional Ayurvedic knowledge with modern pharmaceutical sciences.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
