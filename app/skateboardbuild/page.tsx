'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import {
  CustomizerControlsProvider,
  useCustomizerControls,
  Deck,
  Wheel,
  Griptape,
  Truck,
  Bolt,
} from './context'

import Controls from './Controls'
import Preview from './Preview'

type AssetKind = 'DECK' | 'WHEEL' | 'GRIPTAPE'
type AssetApiItem = {
  uid: string
  url: string
  kind: AssetKind
}

export default function Page() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [wheels, setWheels] = useState<Wheel[]>([])
  const [griptapes, setGriptapes] = useState<Griptape[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()

  const ready = useMemo(
    () => decks.length > 0 && wheels.length > 0 && griptapes.length > 0,
    [decks, wheels, griptapes]
  )

  useEffect(() => {
    const ac = new AbortController()
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/assets', { signal: ac.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { assets: AssetApiItem[] }
        const a = Array.isArray(data.assets) ? data.assets : []

        const d: Deck[] = a
          .filter((x) => x.kind === 'DECK')
          .map((x) => ({ uid: x.uid, texture: x.url }))
        const w: Wheel[] = a
          .filter((x) => x.kind === 'WHEEL')
          .map((x) => ({ uid: x.uid, texture: x.url }))
        const g: Griptape[] = a
          .filter((x) => x.kind === 'GRIPTAPE')
          .map((x) => ({ uid: x.uid, texture: x.url }))

        setDecks(d)
        setWheels(w)
        setGriptapes(g)
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setError(e?.message || 'Failed to load assets')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => ac.abort()
  }, [])

  const defaults = useMemo(() => {
    const findByUid = <T extends { uid: string }>(list: T[], uid?: string) =>
      (uid && list.find((x) => x.uid === uid)) || list[0]

    const qDeck = searchParams.get('deck') || undefined
    const qWheel = searchParams.get('wheel') || undefined
    const qGrip = searchParams.get('griptape') || undefined
    const qTruck = searchParams.get('truck') || undefined
    const qBolt = searchParams.get('bolt') || undefined

    const ls = (() => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('skate_defaults') : null
        return JSON.parse(stored || '{}')
      } catch {
        return {}
      }
    })() as Partial<{
      deck: string
      wheel: string
      griptape: string
      truckColor: string
      boltColor: string
    }>

    const defaultDeck = findByUid(decks, qDeck || ls.deck)
    const defaultWheel = findByUid(wheels, qWheel || ls.wheel)
    const defaultGriptape = findByUid(griptapes, qGrip || ls.griptape)

    const defaultTruck: Truck = { color: qTruck || ls.truckColor || '#6F6E6A' }
    const defaultBolt: Bolt = { color: qBolt || ls.boltColor || '#6F6E6A' }

    return { defaultDeck, defaultWheel, defaultGriptape, defaultTruck, defaultBolt }
  }, [searchParams, decks, wheels, griptapes])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <div className="relative mx-auto h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-black"></div>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-600">Loading your customizer...</p>
        </div>
      </div>
    )
  }

  if (error || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 px-4">
        <div className="max-w-md text-center">
          <div className="mb-4 text-5xl"></div>
          <h2 className="mb-2 text-xl font-bold text-slate-900">Something went wrong</h2>
          <p className="mb-6 text-sm text-slate-600">{error || 'No assets available'}</p>
          <a
            href="/"
            className="inline-flex items-center rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <CustomizerControlsProvider
      defaultDeck={defaults.defaultDeck}
      defaultWheel={defaults.defaultWheel}
      defaultGriptape={defaults.defaultGriptape}
      defaultTruck={defaults.defaultTruck}
      defaultBolt={defaults.defaultBolt}
    >
      <Customizer
        decks={decks}
        wheels={wheels}
        griptapes={griptapes}
      />
    </CustomizerControlsProvider>
  )
}

function Customizer({
  decks,
  wheels,
  griptapes,
}: {
  decks: Deck[]
  wheels: Wheel[]
  griptapes: Griptape[]
}) {
  const { selectedDeck, selectedWheel, selectedGriptape, selectedTruck, selectedBolt } =
    useCustomizerControls()

  const [previewUrl, setPreviewUrl] = useState<string | undefined>()
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSavePanel, setShowSavePanel] = useState(false)

  const deck = selectedDeck ?? decks[0]
  const wheel = selectedWheel ?? wheels[0]
  const griptape = selectedGriptape ?? griptapes[0]
  const truckColor = selectedTruck?.color ?? '#6F6E6A'
  const boltColor = selectedBolt?.color ?? '#6F6E6A'

  const persistRef = useRef<number>(0)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const id = window.setTimeout(() => {
      localStorage.setItem(
        'skate_defaults',
        JSON.stringify({
          deck: deck?.uid,
          wheel: wheel?.uid,
          griptape: griptape?.uid,
          truckColor,
          boltColor,
        })
      )
    }, 150)
    persistRef.current = id
    return () => clearTimeout(persistRef.current)
  }, [deck?.uid, wheel?.uid, griptape?.uid, truckColor, boltColor])

  const onSave = useCallback(async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckUid: deck.uid,
          deckUrl: deck.texture,
          wheelUid: wheel.uid,
          wheelUrl: wheel.texture,
          griptapeUid: griptape?.uid,
          griptapeUrl: griptape?.texture,
          truckColor,
          boltColor,
          customerEmail: email || undefined,
          notes: notes || undefined,
          previewUrl: previewUrl || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data?.error || 'Save failed')
        return
      }
      alert('Design saved!')
      setEmail('')
      setNotes('')
      setShowSavePanel(false)
    } catch {
      alert('Failed to save design')
    } finally {
      setIsSaving(false)
    }
  }, [deck, wheel, griptape, truckColor, boltColor, email, notes, previewUrl])

  const previewHref = useMemo(() => {
    const qp = new URLSearchParams({
      deck: deck?.uid ?? '',
      wheel: wheel?.uid ?? '',
      griptape: griptape?.uid ?? '',
      truck: truckColor,
      bolt: boltColor,
    }).toString()
    return `/skateboardbuild/preview?${qp}`
  }, [deck?.uid, wheel?.uid, griptape?.uid, truckColor, boltColor])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
                Skateboard Customizer
              </h1>
              <p className="mt-1 text-sm text-slate-600">Design your perfect ride</p>
            </div>
            <Link
              href="/"
              className="hidden rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:shadow-sm sm:inline-flex"
            >
              ← Home
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Preview Section */}
          <div className="lg:col-span-7">
            <div className="sticky top-6 overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/50 ">
              <div className="aspect-square w-full">
                <Preview
                  deckTextureURLs={decks.map((d) => d.texture)}
                  deckTextureURL={deck?.texture} 
                  wheelTextureURLs={wheels.map((w) => w.texture)}
                  wheelTextureURL={wheel?.texture}
                  griptapeTextureURLs={griptapes.map((g) => g.texture)}
                  griptapeTextureURL={griptape?.texture}
                  truckColor={truckColor}
                  boltColor={boltColor}
                  onCapture={(url) => setPreviewUrl(url)}
                />
              </div>

              {/* Action Buttons - Mobile Bottom Bar */}
              <div className="flex gap-3 border-t border-slate-200/60 bg-white/80 p-4 backdrop-blur-sm">
                <Link
                  href={previewHref}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </Link>
                <button
                  onClick={() => setShowSavePanel(!showSavePanel)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save Design
                </button>
              </div>
            </div>
          </div>

          {/* Controls Section */}
          <div className="lg:col-span-5">
            <div className="space-y-6">
              {/* Customization Controls */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white">
                <div className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white p-6">
                  <h2 className="text-xl font-bold text-slate-900">Customize Your Board</h2>
                  <p className="mt-1 text-sm text-slate-600">Choose your style</p>
                </div>
                <div className="p-6">
                  <Controls />
                </div>
              </div>

              {/* Save Panel */}
              <SaveDesignModal
                open={showSavePanel}
                onClose={() => setShowSavePanel(false)}
                email={email}
                notes={notes}
                setEmail={setEmail}
                setNotes={setNotes}
                onSave={onSave}
                isSaving={isSaving}
              />

              <Link
                href="/"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-slate-300 hover:shadow-sm sm:hidden"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
function SaveDesignModal({
  open,
  onClose,
  email,
  notes,
  setEmail,
  setNotes,
  onSave,
  isSaving,
}: {
  open: boolean
  onClose: () => void
  email: string
  notes: string
  setEmail: (v: string) => void
  setNotes: (v: string) => void
  onSave: () => void
  isSaving: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Save Your Design</h3>

          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
              Email Address <span className="ml-1 font-normal text-slate-400">(Optional)</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div>
            <label htmlFor="notes" className="mb-2 block text-sm font-semibold text-slate-700">
              Note<span className="ml-1 font-normal text-slate-400">(Optional)</span>
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descriptions...."
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Saving…
                </>
              ) : (
                <>
                  Save Design
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
