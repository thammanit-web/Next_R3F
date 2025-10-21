'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Preview from '@/app/skateboardbuild/Preview';
import { CustomizerControlsProvider } from '@/app/skateboardbuild/context';
import { ArrowLeftIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
export const dynamic = 'force-dynamic'

type Design = {
    id: string;
    deckUid: string;
    deckUrl: string;
    wheelUid: string;
    wheelUrl: string;
    griptapeUid: string;
    griptapeUrl: string;
    truckColor: string;
    boltColor: string;
    customerEmail?: string | null;
    notes?: string | null;
    status?: string | null;
    createdAt: string;
};

const getStatusClasses = (status?: string | null) => {
    switch (status?.toLowerCase()) {
        case 'approved':
            return 'bg-black text-white ring-1 ring-black'; // Solid for approved
        case 'rejected':
            return 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'; // Muted for rejected
        case 'pending':
        default:
            return 'bg-white text-black ring-1 ring-black'; // Outline for pending
    }
};

// --- Main Page Component ---
export default function AdminDesignDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const [design, setDesign] = useState<Design | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [updating, setUpdating] = useState(false);

    // --- Data Fetching Logic (unchanged) ---
    useEffect(() => {
        let alive = true;
        fetch(`/api/designs/${id}`, { cache: 'no-store' })
            .then(async (r) => {
                if (!r.ok) {
                    const data = await r.json().catch(() => ({}));
                    throw new Error(data.error || `Failed to load design #${id}`);
                }
                return r.json();
            })
            .then((data) => {
                if (!alive) return;
                setDesign(data.design as Design);
            })
            .catch((e) => {
                if (!alive) return;
                setErr(e.message);
            });

        return () => { alive = false; };
    }, [id]);

    // --- API Handlers (unchanged) ---
    const handleUpdateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            const res = await fetch(`/api/designs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update status');
            setDesign(prev => prev ? { ...prev, status: newStatus } : prev);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this design?')) return;
        setUpdating(true);
        try {
            const res = await fetch(`/api/designs/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to delete design');
            }
            alert('Design deleted successfully.');
            window.location.href = '/admin';
        } catch (e: any) {
            alert(e.message);
        } finally {
            setUpdating(false);
        }
    };

    // --- Render correct state ---
    const renderContent = () => {
        if (err) return <ErrorState message={err} />;
        if (!design) return <LoadingState />;
        return <DesignDetailsView design={design} updating={updating} onUpdate={handleUpdateStatus} onDelete={handleDelete} />;
    };

    return (
        <main className="min-h-screen w-full bg-white p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-7xl">
                {renderContent()}
            </div>
        </main>
    );
}

// --- State Components ---
function LoadingState() {
    return (
        <div>
            <div className="h-8 w-1/3 animate-pulse rounded-md bg-gray-200 mb-6"></div>
            <div className="grid lg:grid-cols-2 gap-8">
                <div className="aspect-square animate-pulse rounded-xl bg-gray-200"></div>
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-6 w-full animate-pulse rounded-md bg-gray-200"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <>
            <PageHeader title="Error" />
            <div className="flex items-center gap-4 rounded-xl border border-gray-300 bg-gray-50 p-6 text-black">
                <ExclamationTriangleIcon className="h-8 w-8 text-gray-500" />
                <div>
                    <h2 className="font-semibold">Could not load design</h2>
                    <p className="text-gray-600">{message}</p>
                </div>
            </div>
        </>
    );
}

function DesignDetailsView({ design, updating, onUpdate, onDelete }: { design: Design, updating: boolean, onUpdate: (s: string) => void, onDelete: () => void }) {
    const status = design.status || 'PENDING';

    return (
        <div>
            <PageHeader title={`Design Details`} />
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">

                <div className="lg:col-span-3">
                    <div className="sticky top-8 flex h-[60vh] items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 lg:h-auto lg:aspect-square">
                        <CustomizerControlsProvider>
                            <Preview
                                deckTextureURLs={[design.deckUrl]} deckTextureURL={design.deckUrl}
                                wheelTextureURLs={[design.wheelUrl]} wheelTextureURL={design.wheelUrl}
                                griptapeTextureURLs={[design.griptapeUrl]} griptapeTextureURL={design.griptapeUrl}
                                truckColor={design.truckColor} boltColor={design.boltColor}
                                 pose="upright"
                            />
                        </CustomizerControlsProvider>
                    </div>
                </div>

                <div className="flex flex-col space-y-8 lg:col-span-2">
                    <div className="space-y-4">
                        <dl className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Customer Email</dt>
                                <dd className="font-semibold text-black">{design.customerEmail || 'N/A'}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                                <dt className="text-gray-500">Status</dt>
                                <dd>
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-inset ${getStatusClasses(status)}`}>
                                        {status.toUpperCase()}
                                    </span>
                                </dd>
                            </div>
                            <div className="flex justify-between border-t border-gray-100 pt-4">
                                <dt className="text-gray-500">Deck UID</dt>
                                <dd className="font-mono text-gray-600">{design.deckUid}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Wheel UID</dt>
                                <dd className="font-mono text-gray-600">{design.wheelUid}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Griptape UID</dt>
                                <dd className="font-mono text-gray-600">{design.griptapeUid}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-gray-500">Truck / Bolt</dt>
                                <dd className="font-medium text-gray-800">{design.truckColor} / {design.boltColor}</dd>
                            </div>
                            <div className="flex flex-col space-y-2 border-t border-gray-100 pt-4">
                                <dt className="text-gray-500">Notes</dt>
                                <dd className="text-gray-800 whitespace-pre-wrap">{design.notes || '-'}</dd>
                            </div>
                        </dl>
                        <div className="border-t border-gray-100 pt-3 text-right text-xs text-gray-400">
                            Created: {new Date(design.createdAt).toLocaleString()}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <div className="space-y-3">
                            <button onClick={() => onUpdate('APPROVED')} disabled={updating} className="w-full justify-center rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-300">
                                Approve
                            </button>
                            <button onClick={() => onUpdate('REJECTED')} disabled={updating} className="w-full justify-center rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-200 disabled:bg-gray-300">
                                Reject
                            </button>
                            <button onClick={onDelete} disabled={updating} className="group flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-black hover:bg-black hover:text-white disabled:opacity-50">
                                <TrashIcon className="h-4 w-4 text-gray-500 transition-colors group-hover:text-white" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PageHeader({ title }: { title: string }) {
    return (
        <div className="mb-8 flex items-center gap-4">
            <Link href="/admin" className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black">
                <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-black">{title}</h1>
        </div>
    );
}