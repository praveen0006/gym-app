'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function DeleteDataButton() {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch('/api/user/delete', { method: 'DELETE' });
            if (res.ok) {
                await fetch('/auth/signout', { method: 'POST' });
                window.location.href = '/login';
            } else {
                alert('Failed to delete data. Please try again.');
                setIsDeleting(false);
            }
        } catch (err) {
            console.error(err);
            setIsDeleting(false);
            alert('An error occurred.');
        }
    };

    if (isConfirming) {
        return (
            <div className="mt-12 rounded-xl border border-red-200 bg-red-50 p-6">
                <div className="mb-2 flex items-center gap-2 text-red-600">
                    <AlertTriangle size={20} />
                    <h4 className="font-bold">Danger Zone</h4>
                </div>
                <p className="mb-4 text-sm text-slate-600">
                    Are you sure? This will permanently delete all your tracking data, photos, and goals.
                    This action cannot be undone.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={16} />
                        {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
                    </button>
                    <button
                        onClick={() => setIsConfirming(false)}
                        disabled={isDeleting}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12 border-t border-slate-200 pt-8 text-center">
            <button
                onClick={() => setIsConfirming(true)}
                className="text-xs text-slate-400 decoration-slate-300 hover:text-red-500 hover:underline transition-colors"
            >
                Delete my data and reset account
            </button>
        </div>
    );
}
