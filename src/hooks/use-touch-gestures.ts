'use client'

import { useRef, useEffect, useCallback } from 'react'

interface TouchGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onPinchStart?: () => void
  onPinchEnd?: () => void
  onPinch?: (scale: number) => void
  onTap?: () => void
  onDoubleTap?: () => void
  swipeThreshold?: number
  pinchThreshold?: number
}

interface TouchPoint {
  x: number
  y: number
  timestamp: number
}

export function useTouchGestures<T extends HTMLElement>(
  options: TouchGestureOptions = {}
) {
  const elementRef = useRef<T>(null)
  const touchStartRef = useRef<TouchPoint | null>(null)
  const lastTapRef = useRef<number>(0)
  const initialDistanceRef = useRef<number>(0)
  const currentScaleRef = useRef<number>(1)

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinchStart,
    onPinchEnd,
    onPinch,
    onTap,
    onDoubleTap,
    swipeThreshold = 50,
    pinchThreshold = 0.1
  } = options

  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - potential swipe or tap
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      }
    } else if (e.touches.length === 2) {
      // Two touches - potential pinch
      const distance = getDistance(e.touches[0], e.touches[1])
      initialDistanceRef.current = distance
      currentScaleRef.current = 1
      onPinchStart?.()
    }
  }, [getDistance, onPinchStart])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && initialDistanceRef.current > 0) {
      // Handle pinch gesture
      e.preventDefault()
      const currentDistance = getDistance(e.touches[0], e.touches[1])
      const scale = currentDistance / initialDistanceRef.current
      
      if (Math.abs(scale - currentScaleRef.current) > pinchThreshold) {
        currentScaleRef.current = scale
        onPinch?.(scale)
      }
    }
  }, [getDistance, onPinch, pinchThreshold])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length === 0 && touchStartRef.current) {
      // Handle swipe or tap
      const touchEnd = e.changedTouches[0]
      const touchStart = touchStartRef.current
      
      const deltaX = touchEnd.clientX - touchStart.x
      const deltaY = touchEnd.clientY - touchStart.y
      const deltaTime = Date.now() - touchStart.timestamp
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      if (distance < 10 && deltaTime < 300) {
        // Tap gesture
        const now = Date.now()
        if (now - lastTapRef.current < 300) {
          // Double tap
          onDoubleTap?.()
        } else {
          // Single tap
          onTap?.()
        }
        lastTapRef.current = now
      } else if (distance > swipeThreshold) {
        // Swipe gesture
        const absX = Math.abs(deltaX)
        const absY = Math.abs(deltaY)
        
        if (absX > absY) {
          // Horizontal swipe
          if (deltaX > 0) {
            onSwipeRight?.()
          } else {
            onSwipeLeft?.()
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            onSwipeDown?.()
          } else {
            onSwipeUp?.()
          }
        }
      }
      
      touchStartRef.current = null
    } else if (e.touches.length === 0 && initialDistanceRef.current > 0) {
      // End pinch gesture
      onPinchEnd?.()
      initialDistanceRef.current = 0
      currentScaleRef.current = 1
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap, onPinchEnd, swipeThreshold])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return elementRef
}
