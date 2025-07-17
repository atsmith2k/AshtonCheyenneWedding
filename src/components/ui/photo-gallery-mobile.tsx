'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { OptimizedImage } from './image-optimized'
import { useTouchGestures } from '@/hooks/use-touch-gestures'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import { Button } from './button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { Badge } from './badge'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Photo {
  id: string
  url: string
  caption?: string
  uploadedBy?: string
  createdAt?: string
  width?: number
  height?: number
}

interface PhotoGalleryMobileProps {
  photos: Photo[]
  onPhotoSelect?: (photo: Photo) => void
  className?: string
  columns?: {
    mobile: number
    tablet: number
    desktop: number
  }
}

export function PhotoGalleryMobile({
  photos,
  onPhotoSelect,
  className,
  columns = { mobile: 2, tablet: 3, desktop: 4 }
}: PhotoGalleryMobileProps) {
  const { isMobile, isTouchDevice } = useMobileDetection()
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const modalImageRef = useRef<HTMLDivElement>(null)

  // Touch gestures for modal
  const modalGestureRef = useTouchGestures<HTMLDivElement>({
    onSwipeLeft: () => navigatePhoto('next'),
    onSwipeRight: () => navigatePhoto('prev'),
    onPinch: (newScale) => {
      setScale(Math.max(0.5, Math.min(3, newScale)))
    },
    onDoubleTap: () => {
      setScale(scale === 1 ? 2 : 1)
      setPosition({ x: 0, y: 0 })
    },
    onTap: () => {
      if (scale > 1) {
        setScale(1)
        setPosition({ x: 0, y: 0 })
      }
    }
  })

  const openPhoto = useCallback((photo: Photo, index: number) => {
    setSelectedPhoto(photo)
    setCurrentIndex(index)
    setScale(1)
    setPosition({ x: 0, y: 0 })
    onPhotoSelect?.(photo)
  }, [onPhotoSelect])

  const closePhoto = useCallback(() => {
    setSelectedPhoto(null)
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const navigatePhoto = useCallback((direction: 'prev' | 'next') => {
    if (!photos.length) return

    let newIndex = currentIndex
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % photos.length
    } else {
      newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1
    }

    setCurrentIndex(newIndex)
    setSelectedPhoto(photos[newIndex])
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [currentIndex, photos])

  const handleZoom = useCallback((zoomIn: boolean) => {
    const newScale = zoomIn ? Math.min(3, scale * 1.5) : Math.max(0.5, scale / 1.5)
    setScale(newScale)
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 })
    }
  }, [scale])

  // Keyboard navigation for desktop
  useEffect(() => {
    if (!selectedPhoto || isMobile) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          navigatePhoto('prev')
          break
        case 'ArrowRight':
          e.preventDefault()
          navigatePhoto('next')
          break
        case 'Escape':
          e.preventDefault()
          closePhoto()
          break
        case '+':
        case '=':
          e.preventDefault()
          handleZoom(true)
          break
        case '-':
          e.preventDefault()
          handleZoom(false)
          break
        case '0':
          e.preventDefault()
          setScale(1)
          setPosition({ x: 0, y: 0 })
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedPhoto, isMobile, navigatePhoto, closePhoto, handleZoom])

  const handleShare = useCallback(async (photo: Photo) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.caption || 'Wedding Photo',
          text: `Check out this photo from Ashton & Cheyenne's wedding!`,
          url: photo.url
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(photo.url)
        // You could show a toast here
      } catch (error) {
        console.log('Error copying to clipboard:', error)
      }
    }
  }, [])

  const gridCols = isMobile 
    ? `grid-cols-${columns.mobile}` 
    : `grid-cols-${columns.mobile} md:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop}`

  return (
    <>
      {/* Photo Grid */}
      <div className={cn(
        'grid gap-2 sm:gap-4',
        gridCols,
        className
      )}>
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={cn(
              'relative aspect-square overflow-hidden rounded-lg cursor-pointer',
              'bg-muted hover:shadow-lg transition-all duration-300',
              'group',
              isTouchDevice && 'active:scale-95'
            )}
            onClick={() => openPhoto(photo, index)}
          >
            <OptimizedImage
              src={photo.url}
              alt={photo.caption || `Photo ${index + 1}`}
              fill
              objectFit="cover"
              className="group-hover:scale-105 transition-transform duration-300"
              sizes={`(max-width: 768px) ${100 / columns.mobile}vw, (max-width: 1200px) ${100 / columns.tablet}vw, ${100 / columns.desktop}vw`}
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            
            {/* Photo info overlay */}
            {photo.uploadedBy && (
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white text-xs truncate">
                  {photo.uploadedBy}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={closePhoto}>
        <DialogContent className={cn(
          'max-w-full max-h-full p-0 bg-black/95',
          isMobile && 'w-full h-full rounded-none'
        )}>
          {selectedPhoto && (
            <div className="relative w-full h-full flex flex-col">
              {/* Header */}
              <DialogHeader className="flex-row items-center justify-between p-4 text-white">
                <div className="flex-1">
                  <DialogTitle className="text-left text-white">
                    {selectedPhoto.caption || `Photo ${currentIndex + 1} of ${photos.length}`}
                  </DialogTitle>
                  {selectedPhoto.uploadedBy && (
                    <Badge variant="secondary" className="mt-1">
                      {selectedPhoto.uploadedBy}
                    </Badge>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {!isMobile && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleZoom(false)}
                        className="text-white hover:bg-white/20"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleZoom(true)}
                        className="text-white hover:bg-white/20"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(selectedPhoto)}
                    className="text-white hover:bg-white/20"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closePhoto}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </DialogHeader>

              {/* Image container */}
              <div 
                ref={modalGestureRef}
                className="flex-1 relative overflow-hidden flex items-center justify-center"
              >
                <div
                  className="relative max-w-full max-h-full"
                  style={{
                    transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                    transition: scale === 1 ? 'transform 0.3s ease' : 'none'
                  }}
                >
                  <OptimizedImage
                    src={selectedPhoto.url}
                    alt={selectedPhoto.caption || 'Wedding photo'}
                    width={selectedPhoto.width || 800}
                    height={selectedPhoto.height || 600}
                    className="max-w-full max-h-full object-contain"
                    priority
                  />
                </div>

                {/* Navigation arrows for desktop */}
                {!isMobile && photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => navigatePhoto('prev')}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => navigatePhoto('next')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile navigation dots */}
              {isMobile && photos.length > 1 && (
                <div className="flex justify-center gap-2 p-4">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentIndex(index)
                        setSelectedPhoto(photos[index])
                      }}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        index === currentIndex ? 'bg-white' : 'bg-white/40'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
