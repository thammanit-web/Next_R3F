'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { InteractiveSkateboard } from '@/components/SkateScene';

export const dynamic = 'force-dynamic'

type AssetKind = 'DECK' | 'WHEEL' | 'GRIPTAPE';
type AssetApiItem = {
    uid: string;
    url: string;
    kind: AssetKind;
};

export default function PreviewPage() {
    const sp = useSearchParams();


    const spDeckUrl = sp.get('deckUrl') ?? '';
    const spWheelUrl = sp.get('wheelUrl') ?? '';
    const spGripUrl = sp.get('griptapeUrl') ?? '';


    const spDeckUid = sp.get('deck') ?? '';
    const spWheelUid = sp.get('wheel') ?? '';
    const spGripUid = sp.get('griptape') ?? '';


    const truckColor = sp.get('truckColor') ?? sp.get('truck') ?? '#6F6E6A';
    const boltColor = sp.get('boltColor') ?? sp.get('bolt') ?? '#6F6E6A';


    const [assets, setAssets] = useState<AssetApiItem[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);


    useEffect(() => {
        const needLookup =
            (!!spDeckUid && !spDeckUrl) ||
            (!!spWheelUid && !spWheelUrl) ||
            (!!spGripUid && !spGripUrl);

        if (!needLookup || assets) return;

        const ac = new AbortController();
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                const res = await fetch('/api/assets', { signal: ac.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = (await res.json()) as { assets: AssetApiItem[] };
                setAssets(Array.isArray(data.assets) ? data.assets : []);
            } catch (e: any) {
                if (e?.name !== 'AbortError') setErr(e?.message || 'Failed to load assets');
            } finally {
                setLoading(false);
            }
        })();

        return () => ac.abort();
    }, [spDeckUid, spWheelUid, spGripUid, spDeckUrl, spWheelUrl, spGripUrl, assets]);


    const findUrl = (kind: AssetKind, uid?: string | null) =>
        assets?.find((a) => a.kind === kind && a.uid === uid)?.url || '';

    const deckUrl = useMemo(
        () => spDeckUrl || (spDeckUid ? findUrl('DECK', spDeckUid) : ''),
        [spDeckUrl, spDeckUid, assets]
    );
    const wheelUrl = useMemo(
        () => spWheelUrl || (spWheelUid ? findUrl('WHEEL', spWheelUid) : ''),
        [spWheelUrl, spWheelUid, assets]
    );
    const griptapeUrl = useMemo(
        () => spGripUrl || (spGripUid ? findUrl('GRIPTAPE', spGripUid) : ''),
        [spGripUrl, spGripUid, assets]
    );

    const canRender = !!deckUrl && !!wheelUrl;


    return (
        <main className="min-h-screen w-full bg-white text-black">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Preview</h1>
                    <Link
                        href={{
                            pathname: '/skateboardbuild',
                            query: {
                                deck: sp.get('deck') ?? '',
                                wheel: sp.get('wheel') ?? '',
                                griptape: sp.get('griptape') ?? '',
                                truck: sp.get('truckColor') ?? sp.get('truck') ?? '#6F6E6A',
                                bolt: sp.get('boltColor') ?? sp.get('bolt') ?? '#6F6E6A',
                                deckUrl: sp.get('deckUrl') ?? '',
                                wheelUrl: sp.get('wheelUrl') ?? '',
                                griptapeUrl: sp.get('griptapeUrl') ?? '',
                            },
                        }}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                    >
                        Back to Customizer
                    </Link>
                </div>

                {loading ? (
                    <div className="flex h-[60vh] items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                        <p className="text-gray-600">Loading assets…</p>
                    </div>
                ) : err ? (
                    <div className="flex h-[60vh] items-center justify-center rounded-xl border border-gray-200 bg-red-50">
                        <p className="text-red-600 font-medium">{err}</p>
                    </div>
                ) : !canRender ? (
                    <div className="flex h-[60vh] items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                        <p className="text-gray-600">
                            Missing texture URL(s). Please go back and choose your textures again.
                        </p>
                    </div>
                ) : (
                    <div className="relative h-[70vh] w-full rounded-xl border border-gray-200 bg-gray-400">
                        <InteractiveSkateboard
                            deckTextureURL={deckUrl}
                            wheelTextureURL={wheelUrl}
                            griptapeTextureURL={griptapeUrl}
                            truckColor={truckColor}
                            boltColor={boltColor}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}
