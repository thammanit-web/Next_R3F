Below is a complete, copy‑pasteable code drop for a **Next.js (App Router) + Prisma + MySQL** e‑commerce site with a 3D skateboard customizer, admin dashboard, asset (deck/wheel) upload, and design submission flow. It’s structured so you can integrate with your existing 3D components (Preview/Skateboard/SkateScene/Controls/context) while wiring up DB + APIs.

> Notes
> - **TypeScript** throughout.
> - **Local uploads** go to `/public/uploads` (good for dev). For production, replace with S3 and store the URL in DB as-is.
> - **Authentication** is left as a stub (protect `/admin` in middleware). You can drop in NextAuth later.
> - If you already have some of these files, replace them with these versions (or merge the deltas you need).

---

# 0) File Tree

```
.
├─ app
│  ├─ api
│  │  ├─ assets
│  │  │  └─ route.ts
│  │  └─ designs
│  │     └─ route.ts
│  ├─ admin
│  │  ├─ assets
│  │  │  └─ page.tsx
│  │  ├─ design
│  │  │  ├─ [id]
│  │  │  │  ├─ approve
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ reject
│  │  │  │     └─ route.ts
│  │  └─ page.tsx
│  ├─ skateboardbuild
│  │  ├─ context.tsx        // (updated)
│  │  ├─ Controls.tsx       // (updated)
│  │  ├─ Loading.tsx
│  │  ├─ Preview.tsx        // (updated: optional capture preview)
│  │  ├─ Skateboard.tsx
│  │  ├─ SkateScene.tsx
│  │  └─ page.tsx           // (updated: fetch assets from DB + Save)
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ lib
│  └─ prisma.ts
├─ prisma
│  └─ schema.prisma
├─ public
│  └─ uploads               // will be created on demand
├─ .env.example
├─ next.config.mjs
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

# 1) package.json

```json
{
  "name": "skateshop-customizer",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name init",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.16.1",
    "next": "^15.0.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^22.7.5",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "eslint": "^9.13.0",
    "eslint-config-next": "^15.0.3",
    "prisma": "^5.16.1",
    "typescript": "^5.6.3"
  }
}
```

---

# 2) next.config.mjs

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  }
}
export default nextConfig
```

---

# 3) tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/lib/*": ["lib/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

---

# 4) .env.example

```
DATABASE_URL="mysql://user:password@localhost:3306/skateshop"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

> Copy to `.env` and adjust.

---

# 5) prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

enum AssetKind {
  DECK
  WHEEL
}

enum DesignStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
}

enum OrderStatus {
  PENDING
  PAID
  FULFILLED
  CANCELED
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  designs   Design[]
  orders    Order[]
  createdAt DateTime @default(now())
}

model Asset {
  id        String    @id @default(cuid())
  kind      AssetKind
  uid       String
  url       String
  createdAt DateTime  @default(now())

  @@unique([kind, uid], name: "kind_uid")
}

model Design {
  id            String       @id @default(cuid())
  customerEmail String?
  notes         String?

  deckUid     String
  deckUrl     String
  wheelUid    String
  wheelUrl    String
  truckColor  String
  boltColor   String

  previewUrl  String?
  status      DesignStatus   @default(SUBMITTED)

  user        User?          @relation(fields: [userId], references: [id])
  userId      String?

  orders      Order[]

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model Order {
  id          String      @id @default(cuid())
  design      Design      @relation(fields: [designId], references: [id])
  designId    String
  status      OrderStatus @default(PENDING)
  quantity    Int         @default(1)
  priceCents  Int         @default(0)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}
```

---

# 6) lib/prisma.ts

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn']
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

# 7) app/layout.tsx

```tsx
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SkateShop Customizer',
  description: 'E-commerce skateboard customizer with admin dashboard.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">{children}</body>
    </html>
  )
}
```

---

# 8) app/page.tsx (Landing)

```tsx
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen grid place-content-center p-8 text-center">
      <h1 className="text-4xl font-bold mb-3">SkateShop Customizer</h1>
      <p className="mb-8 text-slate-600">Design your board, submit, and order. Admin can upload deck and wheel designs.</p>
      <div className="flex gap-3 justify-center">
        <Link className="px-5 py-3 bg-black text-white rounded-xl" href="/skateboardbuild">Start Customizing</Link>
        <Link className="px-5 py-3 border rounded-xl" href="/admin">Admin</Link>
      </div>
    </main>
  )
}
```

---

# 9) app/globals.css (minimal)

```css
:root { color-scheme: light; }
* { box-sizing: border-box; }
html, body, #__next { height: 100%; }
body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
button { cursor: pointer; }
```

---

# 10) API — app/api/designs/route.ts

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const designs = await prisma.design.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
  return NextResponse.json({ designs })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      deckUid, deckUrl,
      wheelUid, wheelUrl,
      truckColor, boltColor,
      customerEmail, notes, previewUrl
    } = body

    if (!deckUid || !wheelUid) {
      return NextResponse.json({ error: 'Missing deck/wheel' }, { status: 400 })
    }

    const design = await prisma.design.create({
      data: {
        deckUid, deckUrl,
        wheelUid, wheelUrl,
        truckColor, boltColor,
        customerEmail: customerEmail ?? null,
        notes: notes ?? null,
        previewUrl: previewUrl ?? null,
        status: 'SUBMITTED'
      }
    })

    return NextResponse.json({ ok: true, design })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to save design' }, { status: 500 })
  }
}
```

---

# 11) API — app/api/assets/route.ts (GET list, POST create, file upload helper)

This route supports two ways:
- **POST JSON** `{ kind, uid, url }` to register an asset by URL.
- **POST multipart/form-data** with fields `{ kind, uid, file }` to save file into `/public/uploads` and register the URL.

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function GET() {
  const assets = await prisma.asset.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ assets })
}

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || ''

  // JSON: { kind, uid, url }
  if (contentType.includes('application/json')) {
    const { kind, uid, url } = await req.json()
    if (!kind || !uid || !url) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const asset = await prisma.asset.upsert({
      where: { kind_uid: { kind, uid } },
      update: { url },
      create: { kind, uid, url }
    })
    return NextResponse.json({ ok: true, asset })
  }

  // multipart: kind, uid, file
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const kind = formData.get('kind')?.toString()
    const uid = formData.get('uid')?.toString()
    const file = formData.get('file') as File | null

    if (!kind || !uid || !file) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const bytes = Buffer.from(await file.arrayBuffer())
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const safeName = `${Date.now()}-${uid}-${file.name.replace(/[^a-z0-9_.-]/gi, '_')}`
    const fullPath = path.join(uploadsDir, safeName)
    await writeFile(fullPath, bytes)

    const url = `/uploads/${safeName}`

    const asset = await prisma.asset.upsert({
      where: { kind_uid: { kind, uid } },
      update: { url },
      create: { kind, uid, url }
    })

    return NextResponse.json({ ok: true, asset })
  }

  return NextResponse.json({ error: 'Unsupported content-type' }, { status: 415 })
}
```

---

# 12) Admin — app/admin/page.tsx (Design list)

```tsx
export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const res = await fetch(`${base}/api/designs`, { cache: 'no-store' })
  const { designs } = await res.json()

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Customer Designs</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {designs.map((d: any) => (
          <div key={d.id} className="rounded-xl border p-4 bg-white">
            {d.previewUrl ? (
              <img src={d.previewUrl} alt="preview" className="w-full h-40 object-cover rounded-lg mb-3" />
            ) : (
              <div className="w-full h-40 bg-slate-100 rounded-lg mb-3 grid place-content-center text-slate-500">No preview</div>
            )}
            <div className="text-sm space-y-1">
              <p><b>Deck:</b> {d.deckUid}</p>
              <p><b>Wheel:</b> {d.wheelUid}</p>
              <p><b>Truck:</b> {d.truckColor} | <b>Bolt:</b> {d.boltColor}</p>
              <p><b>Status:</b> {d.status}</p>
              <p className="text-xs text-slate-500">{new Date(d.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <form action={`/admin/design/${d.id}/approve`} method="post">
                <button className="px-3 py-1 rounded bg-emerald-600 text-white">Approve</button>
              </form>
              <form action={`/admin/design/${d.id}/reject`} method="post">
                <button className="px-3 py-1 rounded bg-rose-600 text-white">Reject</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
```

---

# 13) Admin Action Routes — approve/reject

`app/admin/design/[id]/approve/route.ts`
```ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  await prisma.design.update({ where: { id }, data: { status: 'APPROVED' } })
  return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
}
```

`app/admin/design/[id]/reject/route.ts`
```ts
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  await prisma.design.update({ where: { id }, data: { status: 'REJECTED' } })
  return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'))
}
```

---

# 14) Admin — app/admin/assets/page.tsx (upload by URL or file)

```tsx
'use client'

import { useEffect, useState } from 'react'

type Asset = { id: string; kind: 'DECK'|'WHEEL'; uid: string; url: string }

export default function AdminAssets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [kind, setKind] = useState<'DECK'|'WHEEL'>('DECK')
  const [uid, setUid] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)

  async function refresh() {
    const res = await fetch('/api/assets', { cache: 'no-store' })
    const data = await res.json()
    setAssets(data.assets)
  }

  useEffect(() => { refresh() }, [])

  async function submitJson() {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, uid, url })
    })
    if (res.ok) { setUid(''); setUrl(''); refresh() }
  }

  async function submitFile(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    const fd = new FormData()
    fd.append('kind', kind)
    fd.append('uid', uid)
    fd.append('file', file)
    const res = await fetch('/api/assets', { method: 'POST', body: fd })
    if (res.ok) { setUid(''); setFile(null); refresh() }
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Assets (Deck/Wheel)</h1>

      <section className="grid md:grid-cols-2 gap-6">
        <form onSubmit={(e)=>{e.preventDefault(); submitJson()}} className="border rounded-xl p-4">
          <h2 className="font-semibold mb-2">Register by URL</h2>
          <div className="flex gap-2 mb-2">
            <select value={kind} onChange={e=>setKind(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="DECK">DECK</option>
              <option value="WHEEL">WHEEL</option>
            </select>
            <input value={uid} onChange={e=>setUid(e.target.value)} placeholder="uid (e.g., deck-01)" className="border rounded px-2 py-1 flex-1" />
          </div>
          <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://... or /uploads/..." className="border rounded px-2 py-1 w-full mb-2" />
          <button className="px-4 py-2 rounded bg-black text-white">Save</button>
        </form>

        <form onSubmit={submitFile} className="border rounded-xl p-4">
          <h2 className="font-semibold mb-2">Upload File</h2>
          <div className="flex gap-2 mb-2">
            <select value={kind} onChange={e=>setKind(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="DECK">DECK</option>
              <option value="WHEEL">WHEEL</option>
            </select>
            <input value={uid} onChange={e=>setUid(e.target.value)} placeholder="uid" className="border rounded px-2 py-1 flex-1" />
          </div>
          <input type="file" onChange={e=>setFile(e.target.files?.[0] ?? null)} className="mb-2" />
          <button className="px-4 py-2 rounded bg-black text-white">Upload</button>
        </form>
      </section>

      <h2 className="font-semibold mt-8 mb-3">All Assets</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {assets.map(a => (
          <div key={a.id} className="border rounded-lg p-3">
            <div className="text-xs mb-2">{a.kind} / <b>{a.uid}</b></div>
            <img src={a.url} alt={a.uid} className="w-full h-32 object-contain bg-slate-50 rounded" />
            <div className="text-xs mt-2 break-all text-slate-600">{a.url}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
```

---

# 15) Customer Customizer — app/skateboardbuild/context.tsx (state)

> If you already have this, you can keep yours. Here is a minimal, typed context that aligns with Save flow.

```tsx
'use client'
import React, { createContext, useContext, useMemo, useState } from 'react'

export type ColorPick = { color: string }
export type Deck = { uid: string; texture: string }
export type Wheel = { uid: string; texture: string }

export type ControlsState = {
  selectedDeck?: Deck
  selectedWheel?: Wheel
  selectedTruck?: ColorPick
  selectedBolt?: ColorPick

  setDeck: (d: Deck) => void
  setWheel: (w: Wheel) => void
  setTruck: (c: ColorPick) => void
  setBolt: (c: ColorPick) => void
}

const Ctx = createContext<ControlsState | null>(null)

export function CustomizerControlsProvider({ children }: { children: React.ReactNode }) {
  const [selectedDeck, setDeck] = useState<Deck | undefined>()
  const [selectedWheel, setWheel] = useState<Wheel | undefined>()
  const [selectedTruck, setTruck] = useState<ColorPick | undefined>({ color: '#6F6E6A' })
  const [selectedBolt, setBolt] = useState<ColorPick | undefined>({ color: '#6F6E6A' })

  const value = useMemo(() => ({
    selectedDeck, selectedWheel, selectedTruck, selectedBolt,
    setDeck, setWheel, setTruck, setBolt
  }), [selectedDeck, selectedWheel, selectedTruck, selectedBolt])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useCustomizerControls = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCustomizerControls must be used within provider')
  return v
}
```

---

# 16) Customer Customizer — app/skateboardbuild/Controls.tsx

```tsx
'use client'
import { useCustomizerControls, Deck, Wheel } from './context'
import { useEffect, useState } from 'react'

export default function Controls() {
  const { selectedDeck, selectedWheel, selectedTruck, selectedBolt, setDeck, setWheel, setTruck, setBolt } = useCustomizerControls()
  const [decks, setDecks] = useState<Deck[]>([])
  const [wheels, setWheels] = useState<Wheel[]>([])

  useEffect(() => {
    fetch('/api/assets').then(r=>r.json()).then(data => {
      const d = (data.assets as any[]).filter(a => a.kind === 'DECK').map(a => ({ uid: a.uid, texture: a.url }))
      const w = (data.assets as any[]).filter(a => a.kind === 'WHEEL').map(a => ({ uid: a.uid, texture: a.url }))
      setDecks(d)
      setWheels(w)
      if (!selectedDeck && d[0]) setDeck(d[0])
      if (!selectedWheel && w[0]) setWheel(w[0])
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-4">
      <section>
        <h3 className="font-semibold mb-2">Deck</h3>
        <div className="flex gap-2 flex-wrap">
          {decks.map(d => (
            <button key={d.uid} onClick={()=>setDeck(d)} className={`px-3 py-1 rounded border ${selectedDeck?.uid===d.uid?'bg-black text-white':''}`}>{d.uid}</button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Wheel</h3>
        <div className="flex gap-2 flex-wrap">
          {wheels.map(w => (
            <button key={w.uid} onClick={()=>setWheel(w)} className={`px-3 py-1 rounded border ${selectedWheel?.uid===w.uid?'bg-black text-white':''}`}>{w.uid}</button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Truck Color</h3>
        <input type="color" value={selectedTruck?.color ?? '#6F6E6A'} onChange={e=>setTruck({ color: e.target.value })} />
      </section>

      <section>
        <h3 className="font-semibold mb-2">Bolt Color</h3>
        <input type="color" value={selectedBolt?.color ?? '#6F6E6A'} onChange={e=>setBolt({ color: e.target.value })} />
      </section>
    </div>
  )
}
```

---

# 17) Customer Customizer — app/skateboardbuild/Preview.tsx

> Placeholder: replace your R3F implementation here or keep your existing `Preview` that renders textures/colors. We also add an optional **capture** function to get a `dataURL` for `previewUrl`.

```tsx
'use client'
import React, { useEffect, useRef } from 'react'

export default function Preview({
  deckUrl,
  wheelUrl,
  truckColor,
  boltColor,
  onCapture
}: {
  deckUrl: string
  wheelUrl: string
  truckColor: string
  boltColor: string
  onCapture?: (dataUrl: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // TODO: Integrate your real 3D canvas (react-three-fiber) here.
    // For now we just render a simple visual placeholder.
  }, [deckUrl, wheelUrl, truckColor, boltColor])

  async function capture() {
    if (!ref.current) return
    // Simple fallback: create a canvas snapshot from this container using HTMLCanvas (placeholder).
    // In your R3F setup, prefer WebGLRenderer .domElement.toDataURL("image/png").
    onCapture?.('')
  }

  return (
    <div className="border rounded-xl p-4 bg-slate-50" ref={ref}>
      <div className="text-sm mb-2">Preview (replace with your 3D)</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><b>Deck:</b> {deckUrl}</div>
        <div><b>Wheel:</b> {wheelUrl}</div>
        <div><b>Truck:</b> {truckColor}</div>
        <div><b>Bolt:</b> {boltColor}</div>
      </div>
      <button onClick={capture} className="mt-3 px-3 py-1 border rounded">Capture</button>
    </div>
  )
}
```

> ⚠️ Replace the placeholder with your actual `Preview/Skateboard/SkateScene` code. The important bit is the `onCapture` callback.

---

# 18) Customer Page — app/skateboardbuild/page.tsx (fetch assets + Save)

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { CustomizerControlsProvider, useCustomizerControls, Deck, Wheel } from './context'
import Controls from './Controls'
import Preview from './Preview'

function SaveArea({ decks, wheels }: { decks: Deck[]; wheels: Wheel[] }) {
  const { selectedDeck, selectedWheel, selectedTruck, selectedBolt } = useCustomizerControls()
  const [previewUrl, setPreviewUrl] = useState<string | undefined>()
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  const deck = selectedDeck ?? decks[0]
  const wheel = selectedWheel ?? wheels[0]
  const truckColor = selectedTruck?.color ?? '#6F6E6A'
  const boltColor = selectedBolt?.color ?? '#6F6E6A'

  async function onSave() {
    const res = await fetch('/api/designs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deckUid: deck.uid,
        deckUrl: deck.texture,
        wheelUid: wheel.uid,
        wheelUrl: wheel.texture,
        truckColor,
        boltColor,
        customerEmail: email || undefined,
        notes: notes || undefined,
        previewUrl: previewUrl || undefined
      })
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.error || 'Save failed')
      return
    }
    alert('Design saved!')
  }

  return (
    <div className="space-y-4">
      <Preview
        deckUrl={deck.texture}
        wheelUrl={wheel.texture}
        truckColor={truckColor}
        boltColor={boltColor}
        onCapture={(url)=> setPreviewUrl(url)}
      />

      <div className="grid gap-2">
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email (optional)" className="border rounded px-3 py-2" />
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes for admin (optional)" className="border rounded px-3 py-2" />
      </div>

      <button
        onClick={onSave}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        Save Design
      </button>
    </div>
  )
}

export default function Page() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [wheels, setWheels] = useState<Wheel[]>([])
  const ready = useMemo(() => decks.length>0 && wheels.length>0, [decks, wheels])

  useEffect(() => {
    fetch('/api/assets').then(r=>r.json()).then(data => {
      const d = (data.assets as any[]).filter(a => a.kind === 'DECK').map(a => ({ uid: a.uid, texture: a.url }))
      const w = (data.assets as any[]).filter(a => a.kind === 'WHEEL').map(a => ({ uid: a.uid, texture: a.url }))
      setDecks(d)
      setWheels(w)
    })
  }, [])

  return (
    <CustomizerControlsProvider>
      <main className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-4">Customize Your Skateboard</h1>
          <Controls />
        </div>
        <div>
          {ready ? (
            <SaveArea decks={decks} wheels={wheels} />
          ) : (
            <div className="border rounded-xl p-6 bg-slate-50">Loading assets...</div>
          )}
        </div>
      </main>
    </CustomizerControlsProvider>
  )
}
```

---

# 19) (Optional) Existing 3D Components

Place your existing `Skateboard.tsx`, `SkateScene.tsx`, and improved `Preview.tsx` here. As long as `Preview` accepts `deckUrl`, `wheelUrl`, `truckColor`, `boltColor` and (optionally) calls `onCapture(dataUrl)` when you press “Capture”, the save flow will work.

---

# 20) app/middleware.ts (stub to protect admin)

```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // TODO: add real auth. For now, simple IP allowlist or a header-based check.
    // Example: if (!req.headers.get('x-admin-key')) return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
```

---

# 21) README.md (quick start)

```md
# SkateShop Customizer

## Setup
1. `cp .env.example .env` and edit `DATABASE_URL` + `NEXT_PUBLIC_BASE_URL`.
2. `npm i`
3. Run Prisma: `npm run prisma:migrate`
4. `npm run dev`

## Admin
- Go to `/admin` to see submitted designs.
- Go to `/admin/assets` to upload or register deck/wheel textures.

## Customer
- Go to `/skateboardbuild` to customize and save design.

## Notes
- Local uploads are stored in `/public/uploads`. For production, replace with S3 and keep the URL in DB.
- Add proper authentication for `/admin` before going live.
```

---

## That’s it!
- You now have DB models, CRUD API routes, admin pages (list + approve/reject + asset upload), and a customer customizer wired to save designs.
- Drop in your R3F 3D `Preview` and textures, and you’re ready to iterate.

