'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { PointerEvent, WheelEvent } from 'react'

type Point = { x: number; y: number }

export type ZoomableImageProps = {
  src: string
  alt: string
  imageClassName?: string
  wrapperClassName?: string
  maxScale?: number
  priority?: boolean
  unoptimized?: boolean
  sizes?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function centroid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export default function ZoomableImage({
  src,
  alt,
  imageClassName,
  wrapperClassName,
  maxScale = 3,
  priority,
  unoptimized,
  sizes,
}: ZoomableImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const transformRef = useRef<HTMLDivElement | null>(null)

  const pointersRef = useRef<Map<number, Point>>(new Map<number, Point>())
  const isInteractingRef = useRef(false)

  const startRef = useRef<{
    startDistance: number
    startCentroid: Point
    startScale: number
    startTranslate: Point
    containerSize: { width: number; height: number }
  } | null>(null)

  const currentRef = useRef({ scale: 1, translateX: 0, translateY: 0 })

  const rafRef = useRef<number | null>(null)
  const wheelResetTimerRef = useRef<number | null>(null)

  const applyTransform = useCallback(() => {
    const el = transformRef.current
    if (!el) return

    const { scale, translateX, translateY } = currentRef.current
    el.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${scale})`
    el.style.transition = isInteractingRef.current ? 'none' : 'transform 220ms ease-out'
    rafRef.current = null
  }, [])

  const scheduleApply = useCallback(() => {
    if (rafRef.current !== null) return
    rafRef.current = window.requestAnimationFrame(applyTransform)
  }, [applyTransform])

  const reset = useCallback(() => {
    currentRef.current = { scale: 1, translateX: 0, translateY: 0 }
    isInteractingRef.current = false
    startRef.current = null
    scheduleApply()
  }, [scheduleApply])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container) return

    container.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 2) {
      e.preventDefault()
      const points = Array.from(pointersRef.current.values()) as Point[]
      const p1 = points[0]
      const p2 = points[1]
      if (!p1 || !p2) return
      const rect = container.getBoundingClientRect()

      startRef.current = {
        startDistance: Math.max(1, distance(p1, p2)),
        startCentroid: centroid(p1, p2),
        startScale: currentRef.current.scale,
        startTranslate: { x: currentRef.current.translateX, y: currentRef.current.translateY },
        containerSize: { width: rect.width, height: rect.height },
      }

      isInteractingRef.current = true
      scheduleApply()
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return

    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size !== 2) return
    const start = startRef.current
    if (!start) return

    e.preventDefault()

    const points = Array.from(pointersRef.current.values()) as Point[]
    const p1 = points[0]
    const p2 = points[1]
    if (!p1 || !p2) return
    const nextDistance = Math.max(1, distance(p1, p2))
    const nextCentroid = centroid(p1, p2)

    const scale = clamp((start.startScale * nextDistance) / start.startDistance, 1, maxScale)

    const rawTranslateX = start.startTranslate.x + (nextCentroid.x - start.startCentroid.x)
    const rawTranslateY = start.startTranslate.y + (nextCentroid.y - start.startCentroid.y)

    const maxTranslateX = ((scale - 1) * start.containerSize.width) / 2
    const maxTranslateY = ((scale - 1) * start.containerSize.height) / 2

    const translateX = clamp(rawTranslateX, -maxTranslateX, maxTranslateX)
    const translateY = clamp(rawTranslateY, -maxTranslateY, maxTranslateY)

    currentRef.current = { scale, translateX, translateY }
    scheduleApply()
  }

  const onPointerUpOrCancel = (e: PointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.delete(e.pointerId)
    }

    if (isInteractingRef.current && pointersRef.current.size < 2) {
      reset()
    }
  }

  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey) return

    e.preventDefault()

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    isInteractingRef.current = true

    const { scale: currentScale, translateX, translateY } = currentRef.current
    const zoomFactor = Math.exp(-e.deltaY / 200)
    const scale = clamp(currentScale * zoomFactor, 1, maxScale)

    const maxTranslateX = ((scale - 1) * width) / 2
    const maxTranslateY = ((scale - 1) * height) / 2

    currentRef.current = {
      scale,
      translateX: clamp(translateX, -maxTranslateX, maxTranslateX),
      translateY: clamp(translateY, -maxTranslateY, maxTranslateY),
    }

    scheduleApply()

    if (wheelResetTimerRef.current !== null) {
      window.clearTimeout(wheelResetTimerRef.current)
    }
    wheelResetTimerRef.current = window.setTimeout(() => reset(), 180)
  }

  useEffect(() => {
    scheduleApply()

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
      if (wheelResetTimerRef.current !== null) {
        window.clearTimeout(wheelResetTimerRef.current)
      }
    }
  }, [scheduleApply])

  const wrapperClasses = useMemo(() => {
    return ['absolute inset-0 overflow-hidden', wrapperClassName].filter(Boolean).join(' ')
  }, [wrapperClassName])

  return (
    <div
      ref={containerRef}
      className={wrapperClasses}
      style={{ touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUpOrCancel}
      onPointerCancel={onPointerUpOrCancel}
      onLostPointerCapture={onPointerUpOrCancel}
      onWheel={onWheel}
    >
      <div ref={transformRef} className="absolute inset-0 will-change-transform">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          unoptimized={unoptimized}
          sizes={sizes}
          draggable={false}
          className={imageClassName}
        />
      </div>
    </div>
  )
}
