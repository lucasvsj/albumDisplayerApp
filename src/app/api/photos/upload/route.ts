import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const albumId = formData.get('albumId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!albumId) {
      return NextResponse.json(
        { error: 'Album ID is required' },
        { status: 400 }
      )
    }

    // Verify album exists
    const album = await prisma.album.findUnique({
      where: { id: albumId },
    })

    if (!album) {
      return NextResponse.json(
        { error: 'Album not found' },
        { status: 404 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${uuidv4()}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Write file to disk
    await writeFile(filepath, buffer)

    // Save to database - use API route for serving images
    const photo = await prisma.photo.create({
      data: {
        filename: file.name,
        path: `/api/uploads/${filename}`,
        albumId,
      },
    })

    return NextResponse.json(photo, { status: 201 })
  } catch (error) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    )
  }
}
