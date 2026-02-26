import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Our Faculty & Team',
    description: 'Meet the dedicated and experienced faculty team at LDM College committed to providing quality pharmaceutical education.',
    keywords: ["LDM faculty","pharmacy college teachers","pharmacy professors","college staff"],
    openGraph: {
        title: 'Our Faculty & Team | LDM College',
        description: 'Meet the dedicated and experienced faculty team at LDM College committed to providing quality pharmaceutical education.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
