import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const design = await prisma.design.findUnique({
    where: { id },
  })

  if (!design)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ design })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const updatedDesign = await prisma.design.update({
      where: { id: params.id },
      data: {
        ...body, 
      },
    })
    return NextResponse.json({ ok: true, design: updatedDesign })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update design' }, { status: 500 })
  }
}


export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.design.delete({
      where: { id: params.id },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 })
  }
}