import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const albumId = searchParams.get('albumId')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let whereClause: any = {}

    if (albumId) {
      whereClause.albumId = albumId
    } else if (activeOnly) {
      // Get photos from the active album only
      const activeAlbum = await prisma.album.findFirst({
        where: { isActive: true },
      })
      
      if (!activeAlbum) {
        return NextResponse.json([])
      }
      
      whereClause.albumId = activeAlbum.id
    }

    const photos = await prisma.photo.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        album: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    })

    return NextResponse.json(photos)
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}
