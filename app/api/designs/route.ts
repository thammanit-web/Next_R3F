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
      truckColor, boltColor, griptapeUid, griptapeUrl,
      customerEmail, notes, previewUrl
    } = body

    if (!deckUid || !wheelUid) {
      return NextResponse.json({ error: 'Missing deck/wheel' }, { status: 400 })
    }

    const design = await prisma.design.create({
      data: {
        deckUid, deckUrl, griptapeUid, griptapeUrl,
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
