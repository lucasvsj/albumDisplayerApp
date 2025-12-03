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
  x: number
  scale: number
}

export default function Home() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([])
  const [heartCounter, setHeartCounter] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showHeart, setShowHeart] = useState(false)

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
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
      setIsTransitioning(false)
    }, 150)
  }, [photos.length, isTransitioning])

  const goToNext = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
      setIsTransitioning(false)
    }, 150)
  }, [photos.length, isTransitioning])

  const handleReaction = useCallback(() => {
    // Show heart animation on image
    setShowHeart(true)
    setTimeout(() => setShowHeart(false), 800)

    // Create floating hearts
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const newHeart: FloatingHeart = {
          id: heartCounter + i,
          x: Math.random() * 80 + 10,
          scale: Math.random() * 0.5 + 0.8,
        }
        setFloatingHearts((prev) => [...prev, newHeart])
        setHeartCounter((prev) => prev + 1)

        setTimeout(() => {
          setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id))
        }, 2000)
      }, i * 100)
    }
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-pink-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 animate-spin"></div>
          </div>
          <p className="text-gray-400 text-sm animate-pulse">Loading photos...</p>
        </div>
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-700/50 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">No photos yet</h1>
          <p className="text-gray-400">Photos will appear here once uploaded</p>
        </div>
      </div>
    )
  }

  const currentPhoto = photos[currentIndex]

  return (
    <main
      className="min-h-screen flex flex-col relative bg-black overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background blur effect */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={currentPhoto.path}
          alt=""
          fill
          className="object-cover blur-3xl opacity-30 scale-110"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
      </div>

      {/* Album name header */}
      {currentPhoto.album && (
        <div className="relative z-10 pt-safe px-4 py-3">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
              <svg className="w-4 h-4 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/>
              </svg>
              <span className="text-sm font-medium text-white/90">{currentPhoto.album.name}</span>
            </span>
          </div>
        </div>
      )}

      {/* Photo Display */}
      <div className="flex-1 flex items-center justify-center px-4 py-2 relative z-10">
        <div 
          className={`relative w-full max-w-3xl aspect-[3/4] sm:aspect-[4/3] transition-all duration-300 ${
            isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <Image
            src={currentPhoto.path}
            alt={currentPhoto.filename}
            fill
            className="object-contain drop-shadow-2xl"
            priority
            unoptimized
          />
          
          {/* Heart animation overlay */}
          {showHeart && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg
                className="w-32 h-32 text-pink-500 animate-ping"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          )}
        </div>

        {/* Navigation Arrows - Desktop */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all border border-white/10 hover:scale-110"
              aria-label="Previous photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full transition-all border border-white/10 hover:scale-110"
              aria-label="Next photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 pb-safe">
        {/* Progress bar */}
        {photos.length > 1 && (
          <div className="px-6 mb-4">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-pink-400 transition-all duration-300 ease-out"
                style={{ width: `${((currentIndex + 1) / photos.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{currentIndex + 1} of {photos.length}</span>
              <span className="text-gray-500">Swipe to navigate</span>
            </div>
          </div>
        )}

        {/* Reaction Button */}
        <div className="flex justify-center pb-6">
          <button
            onClick={handleReaction}
            className="group relative"
            aria-label="React with heart"
          >
            <div className="absolute inset-0 bg-pink-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white rounded-full shadow-lg transition-all active:scale-95 hover:scale-105">
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="font-semibold">Love it!</span>
            </div>
          </button>
        </div>
      </div>

      {/* Floating Hearts */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {floatingHearts.map((heart) => (
          <span
            key={heart.id}
            className="absolute bottom-0 text-4xl animate-float-up"
            style={{ 
              left: `${heart.x}%`,
              transform: `scale(${heart.scale})`,
              animationDuration: `${1.5 + Math.random() * 0.5}s`
            }}
          >
            ❤️
          </span>
        ))}
      </div>

      {/* Dots Indicator - Mobile */}
      {photos.length > 1 && photos.length <= 10 && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 flex gap-2 z-40 sm:hidden">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-pink-500 w-6' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>
      )}
    </main>
  )
}
