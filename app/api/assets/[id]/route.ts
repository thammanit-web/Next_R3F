import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import path from 'path'
import { AssetKind } from '@prisma/client'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const asset = await prisma.asset.findUnique({ where: { id } })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ asset })
}


export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const { kind, uid, url } = await req.json()
    if (!kind || !uid || !url)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const asset = await prisma.asset.update({
      where: { id },
      data: { kind, uid, url },
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

    const bytes = Buffer.from(await file.arrayBuffer())
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const safeName = `${Date.now()}-${uid}-${file.name.replace(/[^a-z0-9_.-]/gi, '_')}`
    const fullPath = path.join(uploadsDir, safeName)
    await writeFile(fullPath, bytes)
    const url = `/uploads/${safeName}`

    const asset = await prisma.asset.update({
      where: { id },
      data: { kind, uid, url },
    })
    return NextResponse.json({ ok: true, asset })
  }

  return NextResponse.json({ error: 'Unsupported content-type' }, { status: 415 })
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  try {
    const asset = await prisma.asset.findUnique({ where: { id } })
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }
    if (asset.url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', asset.url)
      try {
        await unlink(filePath)
        console.log(`Deleted file: ${filePath}`)
      } catch (err: any) {
        console.warn(`File not found or already deleted: ${filePath}`)
      }
    }
    await prisma.asset.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE asset error:', err)
    return NextResponse.json({ error: 'Delete failed or not found' }, { status: 400 })
  }
}
