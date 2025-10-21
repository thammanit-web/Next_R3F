'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CubeIcon, Cog8ToothIcon } from '@heroicons/react/24/outline'; // For icons

// --- Type Definition (unchanged) ---
type Design = {
  id: string;
  customerEmail: string;
  deckUid: string;
  wheelUid: string;
  truckColor: string;
  boltColor: string;
  status: string;
  createdAt: string;
};

// --- Helper Function for Status Badge Styling ---
const getStatusClasses = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// --- Reusable Design Card Component ---
function DesignCard({ design }: { design: Design }) {
  return (
    <Link
      href={`/admin/design/${design.id}`}
      className="group block rounded-xl border border-gray-200 bg-white transition-all hover:border-black hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-black"
    >
      {/* 3D Viewer Placeholder */}
      <div className="flex h-40 w-full flex-col items-center justify-center rounded-t-xl bg-gray-100">
        <CubeIcon className="h-10 w-10 text-gray-400 transition-transform group-hover:scale-110" />
        <p className="mt-2 text-sm font-semibold text-gray-500">Open 3D Viewer</p>
      </div>

      {/* Card Content */}
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="truncate font-semibold text-gray-900" title={design.customerEmail}>
            {design.customerEmail}
          </p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClasses(
              design.status
            )}`}
          >
            {design.status}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-gray-100 pt-3 text-sm">
          <dt className="text-gray-500">Deck</dt>
          <dd className="font-medium text-gray-800 truncate">{design.deckUid}</dd>
          
          <dt className="text-gray-500">Wheel</dt>
          <dd className="font-medium text-gray-800 truncate">{design.wheelUid}</dd>

          <dt className="text-gray-500">Truck</dt>
          <dd className="font-medium text-gray-800">{design.truckColor}</dd>
          
          <dt className="text-gray-500">Bolt</dt>
          <dd className="font-medium text-gray-800">{design.boltColor}</dd>
        </div>

        <p className="pt-2 text-right text-xs text-gray-400">
          {new Date(design.createdAt).toLocaleString()}
        </p>
      </div>
    </Link>
  );
}


export default function AdminPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://next-r3-f-seven.vercel.app';

  // --- Data Fetching Logic (unchanged) ---
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const res = await fetch(`${base}/api/designs`, { cache: 'no-store' });
        const data = await res.json();
        setDesigns(data.designs);
      } catch (error) {
        console.error("Failed to fetch designs:", error);
      }
    };

    fetchDesigns();
    const interval = setInterval(fetchDesigns, 5000);
    return () => clearInterval(interval);
  }, [base]);

  return (
    // Assume a light gray background on the <body> for contrast
    <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto bg-white rounded-2xl shadow-sm">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row gap-4 justify-between items-center border-b border-gray-200 pb-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          Customer Designs
        </h1>
        <nav className="flex items-center gap-2">
          <Link href="/" className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            Home
          </Link>
          <Link href="/admin/assets" className="px-4 py-2 text-sm  text-white bg-black hover:bg-gray-800 rounded-lg transition-colors">
            Manage Assets
          </Link>
        </nav>
      </header>

      {/* Designs Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {designs.map(d => (
          <DesignCard key={d.id} design={d} />
        ))}
      </div>

      {designs.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
           <p className="text-gray-500">Waiting for new designs...</p>
        </div>
      )}
    </main>
  );
}