import Sidebar from '@/components/layout/Sidebar';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
            <Toaster position="top-right" />
        </div>
    );
}
