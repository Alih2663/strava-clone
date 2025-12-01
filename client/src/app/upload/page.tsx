'use client';

import { useState } from 'react';
import api from '@/utils/api';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [sportType, setSportType] = useState('run');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('sportType', sportType);

        try {
            await api.post('/activities/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            router.push('/dashboard');
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="container mx-auto p-4 max-w-lg">
                <div className="bg-white p-8 rounded-lg shadow-md mt-10">
                    <h1 className="text-2xl font-bold mb-6">Upload Activity</h1>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">GPX File</label>
                            <input
                                type="file"
                                accept=".gpx"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="w-full border p-2 rounded"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full border p-2 rounded"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full border p-2 rounded"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2">Sport Type</label>
                            <select
                                value={sportType}
                                onChange={(e) => setSportType(e.target.value)}
                                className="w-full border p-2 rounded"
                            >
                                <option value="run">Run</option>
                                <option value="ride">Ride</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-500 text-white p-2 rounded hover:bg-orange-600 disabled:bg-gray-400"
                        >
                            {loading ? 'Uploading...' : 'Upload Activity'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
