import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Activate an album (deactivates all others)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const album = await prisma.album.findUnique({
      where: { id: params.id },
    })

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      )
    }

    // Deactivate all albums first
    await prisma.album.updateMany({
      data: { isActive: false },
    })

    // Activate the selected album
    const updatedAlbum = await prisma.album.update({
      where: { id: params.id },
      data: { isActive: true },
    })

    return NextResponse.json(updatedAlbum)
  } catch (error) {
    console.error('Error activating album:', error)
    return NextResponse.json(
      { error: 'Failed to activate album' },
      { status: 500 }
    )
  }
}
