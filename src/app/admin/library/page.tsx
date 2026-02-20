import { redirect } from 'next/navigation';

export default function LibraryIndexRedirect() {
    redirect('/admin/library/documents');
}
