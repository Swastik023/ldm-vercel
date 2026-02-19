'use client';

import { useState } from 'react';
import { updateContactStatus } from '@/actions/contact';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge'; // Need to create Badge or use simple span
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { Mail, CheckCircle, Archive } from 'lucide-react';

// Simple Badge component inline for now
function StatusBadge({ status }: { status: string }) {
    const colors = {
        new: 'bg-blue-100 text-blue-800',
        read: 'bg-yellow-100 text-yellow-800',
        replied: 'bg-green-100 text-green-800',
        archived: 'bg-gray-100 text-gray-800'
    };
    const color = colors[status as keyof typeof colors] || colors.new;
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

interface Message {
    _id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
    createdAt: string;
}

export default function ContactMessages({ initialMessages }: { initialMessages: Message[] }) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            const result = await updateContactStatus(id, status);
            if (result.success) {
                toast.success(`Marked as ${status}`);
                setMessages(messages.map(m => m._id === id ? { ...m, status } : m));
            } else {
                toast.error('Failed to update status');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    return (
        <div className="space-y-4">
            {messages.map((msg) => (
                <Card key={msg._id} className={msg.status === 'new' ? 'border-blue-200 bg-blue-50/10' : ''}>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">{msg.subject}</span>
                                    <StatusBadge status={msg.status} />
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {msg.name} ({msg.email}) • {new Date(msg.createdAt).toLocaleDateString()}
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap mt-2">{msg.message}</p>
                            </div>
                            <div className="flex md:flex-col gap-2 justify-center">
                                {msg.status !== 'read' && msg.status !== 'replied' && (
                                    <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(msg._id, 'read')}>
                                        <CheckCircle className="h-4 w-4 mr-1" /> Mark Read
                                    </Button>
                                )}
                                {msg.status !== 'archived' && (
                                    <Button size="sm" variant="ghost" onClick={() => handleStatusUpdate(msg._id, 'archived')}>
                                        <Archive className="h-4 w-4 mr-1" /> Archive
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
            {messages.length === 0 && (
                <p className="text-center text-gray-500">No messages found.</p>
            )}
        </div>
    );
}
