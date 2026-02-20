'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { FolderHeart } from 'lucide-react';

export default function CategoryManager({ initialCategories }: { initialCategories: any[] }) {
    const [categories, setCategories] = useState(initialCategories);
    const [name, setName] = useState('');
    const [semesterOrModule, setSemesterOrModule] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return toast.error('Name is required');

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/library/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    semester_or_module: semesterOrModule ? parseInt(semesterOrModule) : null
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Category created');
                setCategories([data.category, ...categories]);
                setName('');
                setSemesterOrModule('');
            } else {
                toast.error(data.message || 'Action failed');
            }
        } catch (err) {
            toast.error('Network error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>New Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Category Name</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Syllabus, Assignments"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Semester/Module (Optional)</label>
                                <Input
                                    type="number"
                                    value={semesterOrModule}
                                    onChange={(e) => setSemesterOrModule(e.target.value)}
                                    placeholder="e.g. 1"
                                    min="1"
                                    max="10"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Leave blank if this category applies to all semesters.</p>
                            </div>
                            <Button type="submit" isLoading={isSubmitting} className="w-full">
                                Create Category
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Existing Categories</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-3">ID / Name</th>
                                    <th className="px-6 py-3">Scope</th>
                                    <th className="px-6 py-3">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {categories.map((cat) => (
                                    <tr key={cat._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <FolderHeart className="h-5 w-5 text-blue-500" />
                                                <span className="font-medium text-gray-900">{cat.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {cat.semester_or_module ? (
                                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                    Sem/Mod: {cat.semester_or_module}
                                                </span>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                    Universal
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center py-10 text-gray-500">
                                            No categories created yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
