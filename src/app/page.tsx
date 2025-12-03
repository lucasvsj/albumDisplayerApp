'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

interface Photo {
  id: string
  filename: string
  path: string
  createdAt: string
  album: {
    id: string
    name: string
  }
}

interface FloatingHeart {
  id: number
  left: number
}

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([])
  const [heartCounter, setHeartCounter] = useState(0)

  useEffect(() => {
    fetchPhotos()
  }, [])

  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos?activeOnly=true')
      const data = await response.json()
      setPhotos(data)
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
  }, [photos.length])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
  }, [photos.length])

  const handleReaction = useCallback(() => {
    const newHeart: FloatingHeart = {
      id: heartCounter,
      left: Math.random() * 60 + 10, // Random position between 10-70px
    }
    setFloatingHearts((prev) => [...prev, newHeart])
    setHeartCounter((prev) => prev + 1)

    // Remove heart after animation completes
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id))
    }, 2000)
  }, [heartCounter])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        handleReaction()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext, handleReaction])

  // Touch swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return

    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext()
      } else {
        goToPrevious()
      }
    }
    setTouchStart(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <svg
          className="w-24 h-24 text-gray-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h1 className="text-2xl font-bold text-gray-300 mb-2">No photos yet</h1>
        <p className="text-gray-500">Photos will appear here once uploaded by an admin</p>
      </div>
    )
  }

  const currentPhoto = photos[currentIndex]

  return (
    <main
      className="min-h-screen flex flex-col relative"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo Display */}
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <div className="relative w-full max-w-4xl aspect-[3/4] sm:aspect-video">
          <Image
            src={currentPhoto.path}
            alt={currentPhoto.filename}
            fill
            className="object-contain rounded-lg"
            priority
            unoptimized
          />
        </div>

        {/* Navigation Arrows */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all"
              aria-label="Previous photo"
            >
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 sm:p-3 rounded-full transition-all"
              aria-label="Next photo"
            >
              <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Photo Counter */}
      <div className="text-center py-2 text-gray-400 text-sm">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Floating Hearts Container */}
      <div className="reaction-container">
        {floatingHearts.map((heart) => (
          <span
            key={heart.id}
            className="floating-heart"
            style={{ left: `${heart.left}px` }}
          >
            ❤️
          </span>
        ))}
      </div>

      {/* Reaction Button - Centered on mobile */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={handleReaction}
          className="bg-pink-500/90 hover:bg-pink-500 text-white p-5 rounded-full shadow-lg transition-all active:scale-90 animate-pulse"
          aria-label="React with heart"
        >
          <svg
            className="w-10 h-10"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>

      {/* Dots Indicator */}
      {photos.length > 1 && photos.length <= 10 && (
        <div className="flex justify-center gap-2 pb-4">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white scale-125' : 'bg-gray-600'
              }`}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </main>
  )
}
