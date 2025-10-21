import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AssetKind } from '@prisma/client'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getSupabase(): SupabaseClient {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL 
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase environment variables are missing on the server')
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const asset = await prisma.asset.findUnique({ where: { id } })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ asset })
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const ct = req.headers.get('content-type') || ''

  if (!/multipart\/form-data|application\/x-www-form-urlencoded/i.test(ct)) {
    return NextResponse.json(
      { error: 'Content-Type must be form-data or x-www-form-urlencoded' },
      { status: 400 }
    )
  }

  const formData = await req.formData()
  const kind = formData.get('kind')?.toString() as AssetKind
  const uid = formData.get('uid')?.toString() || undefined
  const file = formData.get('file') as File | null

  const data: any = {}
  if (kind) data.kind = kind
  if (uid) data.uid = uid

  // Optional: handle file upload via Supabase Storage
  if (file) {
    const supabase = getSupabase()
    const bucket = process.env.SUPABASE_BUCKET || 'assets'
    const path = `${Date.now()}-${file.name}`
    const arrayBuf = await file.arrayBuffer()
    const { error } = await supabase.storage.from(bucket).upload(path, new Uint8Array(arrayBuf), {
      upsert: false,
      contentType: file.type,
    })
    if (error) {
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
    }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
    data.url = pub.publicUrl
  }

  const updated = await prisma.asset.update({ where: { id }, data })
  return NextResponse.json({ ok: true, asset: updated })
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const asset = await prisma.asset.findUnique({ where: { id } })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const bucket = process.env.SUPABASE_BUCKET || 'assets'
    const supabase = getSupabase()

    // convert public URL back to storage path (for public buckets)
    const url = new URL(asset.url)
    const marker = `/object/public/${bucket}/`
    const idx = url.pathname.indexOf(marker)
    if (idx >= 0) {
      const storagePath = url.pathname.slice(idx + marker.length)
      await supabase.storage.from(bucket).remove([storagePath])
    }
  } catch (e) {
    console.warn('Delete from storage failed', e)
  }

  await prisma.asset.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
