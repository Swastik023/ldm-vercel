import PublicNavbar from '@/components/layout/PublicNavbar';
import Footer from '@/components/layout/Footer';

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <PublicNavbar />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}
