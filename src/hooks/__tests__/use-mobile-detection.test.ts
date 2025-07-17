import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMobileDetection } from '../use-mobile-detection'

// Mock window properties
const mockWindow = (width: number, height: number, touchSupport = false) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })

  // Properly mock touch support
  if (touchSupport) {
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      configurable: true,
      value: {},
    })
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 1,
    })
  } else {
    // Ensure no touch support by deleting the property
    if ('ontouchstart' in window) {
      delete (window as any).ontouchstart
    }
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    })
  }
}

// Mock event listeners
const mockEventListeners: { [key: string]: EventListener[] } = {}

const mockAddEventListener = vi.fn((event: string, listener: EventListenerOrEventListenerObject) => {
  const eventListener = typeof listener === 'function' ? listener : listener.handleEvent
  if (!mockEventListeners[event]) {
    mockEventListeners[event] = []
  }
  mockEventListeners[event].push(eventListener)
})

const mockRemoveEventListener = vi.fn((event: string, listener: EventListenerOrEventListenerObject) => {
  const eventListener = typeof listener === 'function' ? listener : listener.handleEvent
  if (mockEventListeners[event]) {
    const index = mockEventListeners[event].indexOf(eventListener)
    if (index > -1) {
      mockEventListeners[event].splice(index, 1)
    }
  }
})

const triggerEvent = (event: string) => {
  if (mockEventListeners[event]) {
    mockEventListeners[event].forEach(listener => listener(new Event(event)))
  }
}

describe('useMobileDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(mockEventListeners).forEach(key => {
      mockEventListeners[key] = []
    })
    
    // Mock window event listeners
    window.addEventListener = mockAddEventListener as any
    window.removeEventListener = mockRemoveEventListener as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial Detection', () => {
    it('should detect desktop device correctly', () => {
      mockWindow(1200, 800, false)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isDesktop).toBe(true)
      expect(result.current.isMobile).toBe(false)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isTouchDevice).toBe(false)
      expect(result.current.screenSize).toBe('desktop')
      expect(result.current.orientation).toBe('landscape')
    })

    it('should detect mobile device correctly', () => {
      mockWindow(375, 667, true)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isMobile).toBe(true)
      expect(result.current.isTablet).toBe(false)
      expect(result.current.isDesktop).toBe(false)
      expect(result.current.isTouchDevice).toBe(true)
      expect(result.current.screenSize).toBe('mobile')
      expect(result.current.orientation).toBe('portrait')
    })

    it('should detect tablet device correctly', () => {
      mockWindow(768, 1024, true)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isTablet).toBe(true)
      expect(result.current.isMobile).toBe(false)
      expect(result.current.isDesktop).toBe(false)
      expect(result.current.isTouchDevice).toBe(true)
      expect(result.current.screenSize).toBe('tablet')
      expect(result.current.orientation).toBe('portrait')
    })

    it('should detect landscape orientation correctly', () => {
      mockWindow(667, 375, true) // Mobile in landscape
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.orientation).toBe('landscape')
      expect(result.current.isMobile).toBe(true)
    })
  })

  describe('Breakpoint Detection', () => {
    it('should use correct mobile breakpoint (< 768px)', () => {
      mockWindow(767, 800, false)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isMobile).toBe(true)
      expect(result.current.screenSize).toBe('mobile')
    })

    it('should use correct tablet breakpoint (768px - 1023px)', () => {
      mockWindow(768, 800, false)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isTablet).toBe(true)
      expect(result.current.screenSize).toBe('tablet')
    })

    it('should use correct desktop breakpoint (>= 1024px)', () => {
      mockWindow(1024, 800, false)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isDesktop).toBe(true)
      expect(result.current.screenSize).toBe('desktop')
    })
  })

  describe('Touch Detection', () => {
    it('should detect touch support via ontouchstart', () => {
      mockWindow(1200, 800, true)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isTouchDevice).toBe(true)
    })

    it('should detect touch support via maxTouchPoints', () => {
      // First set up window dimensions without touch
      mockWindow(1200, 800, false)

      // Then override maxTouchPoints to simulate touch support
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 2,
        configurable: true
      })

      const { result } = renderHook(() => useMobileDetection())

      expect(result.current.isTouchDevice).toBe(true)
    })

    it('should not detect touch when neither method indicates support', () => {
      // Use mockWindow with touchSupport = false to ensure no touch
      mockWindow(1200, 800, false)

      const { result } = renderHook(() => useMobileDetection())

      expect(result.current.isTouchDevice).toBe(false)
    })
  })

  describe('Event Listeners', () => {
    it('should add resize and orientationchange event listeners', () => {
      mockWindow(1200, 800, false)
      
      renderHook(() => useMobileDetection())
      
      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function))
    })

    it('should update detection on window resize', () => {
      mockWindow(1200, 800, false)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isDesktop).toBe(true)
      
      // Simulate window resize to mobile
      act(() => {
        mockWindow(375, 667, false)
        triggerEvent('resize')
      })
      
      expect(result.current.isMobile).toBe(true)
      expect(result.current.isDesktop).toBe(false)
    })

    it('should update detection on orientation change', () => {
      mockWindow(375, 667, true)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.orientation).toBe('portrait')
      
      // Simulate orientation change to landscape
      act(() => {
        mockWindow(667, 375, true)
        triggerEvent('orientationchange')
      })
      
      expect(result.current.orientation).toBe('landscape')
    })

    it('should remove event listeners on unmount', () => {
      mockWindow(1200, 800, false)
      
      const { unmount } = renderHook(() => useMobileDetection())
      
      unmount()
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function))
    })
  })

  describe('Edge Cases', () => {
    it('should handle exactly at breakpoint boundaries', () => {
      // Test exactly at mobile/tablet boundary
      mockWindow(768, 800, false)
      const { result: tabletResult } = renderHook(() => useMobileDetection())
      expect(tabletResult.current.isTablet).toBe(true)
      expect(tabletResult.current.isMobile).toBe(false)

      // Test exactly at tablet/desktop boundary
      mockWindow(1024, 800, false)
      const { result: desktopResult } = renderHook(() => useMobileDetection())
      expect(desktopResult.current.isDesktop).toBe(true)
      expect(desktopResult.current.isTablet).toBe(false)
    })

    it('should handle square aspect ratios', () => {
      mockWindow(800, 800, false)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.orientation).toBe('landscape') // width >= height
    })

    it('should handle very small screens', () => {
      mockWindow(320, 568, true)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isMobile).toBe(true)
      expect(result.current.screenSize).toBe('mobile')
      expect(result.current.orientation).toBe('portrait')
    })

    it('should handle very large screens', () => {
      mockWindow(2560, 1440, false)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isDesktop).toBe(true)
      expect(result.current.screenSize).toBe('desktop')
      expect(result.current.orientation).toBe('landscape')
    })
  })

  describe('Real-world Scenarios', () => {
    it('should handle iPhone 12 dimensions', () => {
      mockWindow(390, 844, true)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isMobile).toBe(true)
      expect(result.current.isTouchDevice).toBe(true)
      expect(result.current.orientation).toBe('portrait')
    })

    it('should handle iPad dimensions', () => {
      mockWindow(820, 1180, true)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isTablet).toBe(true)
      expect(result.current.isTouchDevice).toBe(true)
      expect(result.current.orientation).toBe('portrait')
    })

    it('should handle desktop with touch (Surface Pro)', () => {
      mockWindow(1368, 912, true)
      
      const { result } = renderHook(() => useMobileDetection())
      
      expect(result.current.isDesktop).toBe(true)
      expect(result.current.isTouchDevice).toBe(true)
      expect(result.current.orientation).toBe('landscape')
    })
  })
})
