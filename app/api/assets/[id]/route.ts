import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AssetKind } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const asset = await prisma.asset.findUnique({ where: { id } })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ asset })
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> } | { params: { id: string } }) {
  const params = 'then' in (context as any).params ? await (context as any).params : (context as any).params
  const { id } = params

  const form = await req.formData()
  const kindRaw = form.get('kind')?.toString()
  const uid = form.get('uid')?.toString().trim()
  const file = form.get('file') as unknown as File | null
  const urlFromForm = form.get('url')?.toString().trim()

  if (!uid) {
    return NextResponse.json({ error: 'uid is required' }, { status: 400 })
  }

  let newUrl: string | undefined

  if (file) {
    // อัปโหลดไฟล์ขึ้น Supabase Storage
    const bytes = await file.arrayBuffer()
    const ext = file.name.split('.').pop() || 'bin'
    const storagePath = `assets/${id}-${Date.now()}.${ext}`

    const up = await supabase.storage.from(process.env.SUPABASE_BUCKET!).upload(storagePath, new Uint8Array(bytes), {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    })
    if (up.error) {
      return NextResponse.json({ error: up.error.message }, { status: 400 })
    }
    const { data: pub } = supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .getPublicUrl(storagePath)

    newUrl = pub.publicUrl
  } else if (urlFromForm) {
    // ไม่อัปโหลดไฟล์ แต่เปลี่ยน URL
    newUrl = urlFromForm
  }

  const data: any = { uid }
  if (kindRaw) data.kind = kindRaw as AssetKind
  if (newUrl) data.url = newUrl

  const updated = await prisma.asset.update({
    where: { id },
    data,
  })

  return NextResponse.json({ asset: updated })
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const asset = await prisma.asset.findUnique({ where: { id } })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    // แปลง URL กลับเป็น path ใน Storage (ถ้า bucket เป็น public)
    const url = new URL(asset.url)
    const idx = url.pathname.indexOf(`/object/public/${process.env.SUPABASE_BUCKET}/`)
    if (idx >= 0) {
      const storagePath = url.pathname.slice(idx + `/object/public/${process.env.SUPABASE_BUCKET}/`.length)
      await supabase.storage.from(process.env.SUPABASE_BUCKET!).remove([storagePath])
    }
  } catch (e) {
    console.warn('Delete from storage failed', e)
  }

  await prisma.asset.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
