import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  await prisma.design.update({ where: { id }, data: { status: 'REJECTED' } })
  return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_BASE_URL || 'https://next-r3-f-seven.vercel.app'))
}
