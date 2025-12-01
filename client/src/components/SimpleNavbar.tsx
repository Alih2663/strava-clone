'use client';

import Link from 'next/link';

export default function SimpleNavbar() {
    return (
        <nav className="bg-orange-600 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-center items-center">
                <Link href="/" className="text-xl font-bold flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8" /> StravaClone
                </Link>
            </div>
        </nav>
    );
}
