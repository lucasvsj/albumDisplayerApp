import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Update album
export async function PUT(
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

    const { name, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Album name is required' },
        { status: 400 }
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

    const updatedAlbum = await prisma.album.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    })

    return NextResponse.json(updatedAlbum)
  } catch (error) {
    console.error('Error updating album:', error)
    return NextResponse.json(
      { error: 'Failed to update album' },
      { status: 500 }
    )
  }
}

// DELETE album
export async function DELETE(
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

    await prisma.album.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting album:', error)
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    )
  }
}
