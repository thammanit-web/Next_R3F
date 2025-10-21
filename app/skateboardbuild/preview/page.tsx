'use client'

import { Suspense } from 'react'
import PreviewInner from './preview-inner' // new inner component

export const dynamic = 'force-dynamic'

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen w-full bg-white text-black">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex h-[60vh] items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
            <p className="text-gray-600">Loading preview…</p>
          </div>
        </div>
      </main>
    }>
      <PreviewInner />
    </Suspense>
  )
}
