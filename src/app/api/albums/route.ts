import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { photos: true },
        },
      },
    })

    return NextResponse.json(albums)
  } catch (error) {
    console.error('Error fetching albums:', error)
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Album name is required' },
        { status: 400 }
      )
    }

    const album = await prisma.album.create({
      data: {
        name,
        description,
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(album, { status: 201 })
  } catch (error) {
    console.error('Error creating album:', error)
    return NextResponse.json(
      { error: 'Failed to create album' },
      { status: 500 }
    )
  }
}
