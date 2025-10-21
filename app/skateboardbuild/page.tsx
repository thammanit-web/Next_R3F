'use client'

import { Suspense } from 'react'
import PageContent from './page-content' // new inner component (see below)

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <p className="mt-4 text-sm font-medium text-slate-600">Loading your customizer...</p>
      </div>
    }>
      <PageContent />
    </Suspense>
  )
}
