'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Album {
  id: string
  name: string
  description: string | null
  isActive: boolean
  _count: {
    photos: number
  }
}

interface Photo {
  id: string
  filename: string
  path: string
  createdAt: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [albums, setAlbums] = useState<Album[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumDescription, setNewAlbumDescription] = useState('')
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      const [albumsRes, photosRes] = await Promise.all([
        fetch('/api/albums'),
        fetch('/api/photos'),
      ])
      
      const albumsData = await albumsRes.json()
      const photosData = await photosRes.json()
      
      setAlbums(albumsData)
      setPhotos(photosData)
      
      if (albumsData.length > 0 && !selectedAlbum) {
        setSelectedAlbum(albumsData[0].id)
      }
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('file', files[i])
        formData.append('albumId', selectedAlbum)

        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Upload failed')
        }
      }

      setSuccess(`Successfully uploaded ${files.length} photo(s)`)
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete photo')
      }

      setSuccess('Photo deleted successfully')
      fetchData()
    } catch (err) {
      setError('Failed to delete photo')
    }
  }

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAlbumName.trim()) return

    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAlbumName,
          description: newAlbumDescription || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create album')
      }

      setSuccess('Album created successfully')
      setNewAlbumName('')
      setNewAlbumDescription('')
      setShowCreateAlbum(false)
      fetchData()
    } catch (err) {
      setError('Failed to create album')
    }
  }

  const handleActivateAlbum = async (albumId: string) => {
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/albums/${albumId}/activate`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to activate album')
      }

      setSuccess('Album activated successfully')
      fetchData()
    } catch (err) {
      setError('Failed to activate album')
    }
  }

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm('Are you sure you want to delete this album? All photos in it will be deleted.')) return

    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete album')
      }

      setSuccess('Album deleted successfully')
      if (selectedAlbum === albumId) {
        setSelectedAlbum('')
      }
      fetchData()
    } catch (err) {
      setError('Failed to delete album')
    }
  }

  const startEditAlbum = (album: Album) => {
    setEditingAlbum(album)
    setEditName(album.name)
    setEditDescription(album.description || '')
  }

  const cancelEditAlbum = () => {
    setEditingAlbum(null)
    setEditName('')
    setEditDescription('')
  }

  const handleUpdateAlbum = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAlbum || !editName.trim()) return

    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/albums/${editingAlbum.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update album')
      }

      setSuccess('Album updated successfully')
      cancelEditAlbum()
      fetchData()
    } catch (err) {
      setError('Failed to update album')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{session?.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Albums Section */}
      <div className="bg-gray-900 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Albums</h2>
          <button
            onClick={() => setShowCreateAlbum(!showCreateAlbum)}
            className="px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg text-sm transition-colors"
          >
            {showCreateAlbum ? 'Cancel' : '+ New Album'}
          </button>
        </div>

        {/* Create Album Form */}
        {showCreateAlbum && (
          <form onSubmit={handleCreateAlbum} className="mb-6 p-4 bg-gray-800 rounded-lg">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Album name"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newAlbumDescription}
                onChange={(e) => setNewAlbumDescription(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <button
              type="submit"
              className="mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
            >
              Create Album
            </button>
          </form>
        )}

        {/* Albums List */}
        <div className="space-y-3">
          {albums.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No albums yet. Create one to get started!</p>
          ) : (
            albums.map((album) => (
              <div
                key={album.id}
                className={`p-4 rounded-lg border ${
                  album.isActive
                    ? 'bg-pink-500/20 border-pink-500'
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                {editingAlbum?.id === album.id ? (
                  /* Edit Mode */
                  <form onSubmit={handleUpdateAlbum} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Album name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                        autoFocus
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-green-500 hover:bg-green-600 rounded-lg text-sm transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditAlbum}
                        className="px-4 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  /* View Mode */
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{album.name}</span>
                        {album.isActive && (
                          <span className="px-2 py-0.5 bg-pink-500 text-xs rounded-full">ACTIVE</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {album._count.photos} photo{album._count.photos !== 1 ? 's' : ''}
                        {album.description && ` • ${album.description}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!album.isActive && (
                        <button
                          onClick={() => handleActivateAlbum(album.id)}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm transition-colors"
                          title="Set as active album"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => startEditAlbum(album)}
                        className="p-1.5 bg-yellow-500/20 hover:bg-yellow-500 rounded-lg transition-colors"
                        title="Edit album"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAlbum(album.id)}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500 rounded-lg transition-colors"
                        title="Delete album"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-gray-900 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Photos</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Select an album...</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.name} ({album._count.photos} photos) {album.isActive ? '★' : ''}
              </option>
            ))}
          </select>
          
          <label className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading || !selectedAlbum}
            />
            <div className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg cursor-pointer transition-colors ${
              uploading || !selectedAlbum
                ? 'bg-pink-500/50 cursor-not-allowed'
                : 'bg-pink-500 hover:bg-pink-600'
            }`}>
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Select Photos</span>
                </>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Photos Grid */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          Photos ({photos.length})
        </h2>
        
        {photos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No photos uploaded yet. Upload some photos to get started!
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square">
                <Image
                  src={photo.path}
                  alt={photo.filename}
                  fill
                  className="object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    aria-label="Delete photo"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                  <p className="text-xs text-gray-300 truncate">{photo.filename}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to Gallery Link */}
      <div className="mt-8 text-center">
        <a href="/" className="text-pink-400 hover:text-pink-300">
          ← Back to gallery
        </a>
      </div>
    </div>
  )
}
