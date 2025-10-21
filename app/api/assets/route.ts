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

export async function GET() {
  const assets = await prisma.asset.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ assets })
}

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || ''
  const supabase = getSupabase()

  if (contentType.includes('application/json')) {
    const { kind, uid, url } = await req.json()
    if (!kind || !uid || !url)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const asset = await prisma.asset.upsert({
      where: { kind_uid: { kind, uid } },
      update: { url },
      create: { kind, uid, url },
    })
    return NextResponse.json({ ok: true, asset })
  }

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const kind = formData.get('kind')?.toString() as AssetKind
    const uid = formData.get('uid')?.toString()
    const file = formData.get('file') as File | null

    if (!kind || !uid || !file)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const ext = file.name.split('.').pop()
    const filePath = `assets/${uid}-${Date.now()}.${ext}`


    const { error: uploadError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .upload(filePath, await file.arrayBuffer(), { upsert: true })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // 👉 ดึง public URL ของไฟล์ที่อัปโหลด
    const { data } = supabase.storage
      .from(process.env.SUPABASE_BUCKET!)
      .getPublicUrl(filePath)
    const publicUrl = data.publicUrl

    // 👉 บันทึก URL ลง DB
    const asset = await prisma.asset.upsert({
      where: { kind_uid: { kind, uid } },
      update: { url: publicUrl },
      create: { kind, uid, url: publicUrl },
    })

    return NextResponse.json({ ok: true, asset })
  }

  return NextResponse.json({ error: 'Unsupported content-type' }, { status: 415 })
}
