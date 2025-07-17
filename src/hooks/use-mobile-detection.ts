'use client'

import { useState, useEffect } from 'react'

interface MobileDetection {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  screenSize: 'mobile' | 'tablet' | 'desktop'
  orientation: 'portrait' | 'landscape'
}

export function useMobileDetection(): MobileDetection {
  const [detection, setDetection] = useState<MobileDetection>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    screenSize: 'desktop',
    orientation: 'landscape'
  })

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Define breakpoints
      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024
      
      const screenSize: 'mobile' | 'tablet' | 'desktop' = 
        isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
      
      const orientation: 'portrait' | 'landscape' = 
        height > width ? 'portrait' : 'landscape'

      setDetection({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        screenSize,
        orientation
      })
    }

    // Check on mount
    checkDevice()

    // Listen for resize events
    window.addEventListener('resize', checkDevice)
    window.addEventListener('orientationchange', checkDevice)

    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('orientationchange', checkDevice)
    }
  }, [])

  return detection
}
