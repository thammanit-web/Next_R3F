import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { AssetKind } from '@prisma/client'

export async function GET() {
  const assets = await prisma.asset.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ assets })
}

export async function POST(req: Request) { 
  const contentType = req.headers.get('content-type') || ''


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

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const kind = formData.get('kind')?.toString() as AssetKind
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
