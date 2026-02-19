'use client';

import { useState } from 'react';
import { createNotice, deleteNotice } from '@/actions/notice';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Trash2, Calendar } from 'lucide-react';

interface Notice {
    _id: string;
    title: string;
    content: string;
    createdAt: string;
}

export default function NoticesManager({ initialNotices }: { initialNotices: Notice[] }) {
    const [notices, setNotices] = useState<Notice[]>(initialNotices);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Update local state when initialNotices changes (e.g. after revalidate)
    // But strictly speaking, if page reloads, initialNotices updates. 
    // For client-side optimisitic updates we might want to manually update list too.
    // Or just rely on router.refresh() 

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await createNotice({ title, content });
            if (result.success) {
                toast.success('Notice created successfully');
                setTitle('');
                setContent('');
                // Optimistic update or refresh
                setNotices([result.data, ...notices]);
            } else {
                toast.error('Failed to create notice');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;

        try {
            const result = await deleteNotice(id);
            if (result.success) {
                toast.success('Notice deleted');
                setNotices(notices.filter(n => n._id !== id));
            } else {
                toast.error('Failed to delete notice');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Notice</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            placeholder="Notice Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                        <textarea
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                            placeholder="Notice Content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                        />
                        <Button type="submit" isLoading={isLoading}>
                            Post Notice
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-xl font-semibold">Recent Notices</h3>
                <div className="grid gap-4">
                    {notices.map((notice) => (
                        <Card key={notice._id}>
                            <CardContent className="p-4 flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-lg">{notice.title}</h4>
                                    <p className="text-gray-600 mt-1 whitespace-pre-wrap">{notice.content}</p>
                                    <div className="flex items-center text-sm text-gray-400 mt-2">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        {new Date(notice.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(notice._id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    {notices.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No notices found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
