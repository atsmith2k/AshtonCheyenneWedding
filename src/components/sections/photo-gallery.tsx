'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { PhotoGalleryMobile } from '@/components/ui/photo-gallery-mobile'
import { OptimizedImage } from '@/components/ui/image-optimized'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import { Upload, Heart, Camera, Plus } from 'lucide-react'
import { useAuth } from '@/components/providers'

interface Photo {
  id: string
  url: string
  caption?: string
  uploadedBy?: string
  createdAt: string
}

export function PhotoGallery() {
  const { user, guest } = useAuth()
  const { isMobile, isTouchDevice } = useMobileDetection()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    // This will be replaced with actual Supabase data fetching
    // For now, using placeholder data
    const placeholderPhotos: Photo[] = [
      {
        id: '1',
        url: '/placeholder-photo-1.jpg',
        caption: 'Engagement photo at the park',
        uploadedBy: 'Ashton & Cheyenne',
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        url: '/placeholder-photo-2.jpg',
        caption: 'Our first date location',
        uploadedBy: 'Ashton & Cheyenne',
        createdAt: '2024-01-10'
      }
    ]

    setTimeout(() => {
      setPhotos(placeholderPhotos)
      setLoading(false)
    }, 1000)
  }, [])

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!files || !user || !guest) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const totalFiles = files.length

      for (let i = 0; i < totalFiles; i++) {
        const file = files[i]

        // Validate file
        if (!file.type.startsWith('image/')) {
          console.error('Invalid file type:', file.type)
          continue
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          console.error('File too large:', file.size)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('guestId', guest.id)

        const response = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to upload photo')
        }

        console.log('Photo uploaded successfully:', result.data)

        // Update progress
        setUploadProgress(((i + 1) / totalFiles) * 100)
      }

      // Refresh photos list after all uploads
      // You could add a state update here to show the uploaded photos

    } catch (error) {
      console.error('Error uploading photos:', error)
      // You could add error handling here to show user-friendly error messages
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  if (loading) {
    return (
      <section id="photos" className="wedding-section bg-muted/30">
        <div className="wedding-container">
          <div className="text-center mb-16">
            <h2 className="wedding-heading">
              Photo Gallery
            </h2>
            <div className="wedding-divider" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="photos" className="wedding-section bg-muted/30">
      <div className="wedding-container">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="wedding-heading">
            Photo Gallery
          </h2>
          <p className="wedding-subheading">
            Share your memories with us
          </p>
          <div className="wedding-divider" />
        </div>

        {/* Upload Section */}
        {user && guest && (
          <div className="max-w-2xl mx-auto mb-16">
            <Card className="text-center bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className={`${isMobile ? 'p-6' : 'p-8'}`}>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <Camera className="w-12 h-12 text-primary" />
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <CardTitle className={`font-serif text-card-foreground mb-4 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  Share Your Photos
                </CardTitle>

                <p className={`text-muted-foreground mb-6 ${isMobile ? 'text-sm' : ''}`}>
                  Upload your favorite photos from our special day to share with everyone!
                </p>

                {uploading && (
                  <div className="mb-4">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Uploading... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handlePhotoUpload(e.target.files)}
                  className="hidden"
                  id="photo-upload"
                  disabled={uploading}
                />

                <label htmlFor="photo-upload">
                  <Button
                    variant="wedding"
                    size={isMobile ? "default" : "lg"}
                    className={`cursor-pointer ${isTouchDevice ? 'min-h-[48px]' : ''}`}
                    disabled={uploading}
                    asChild
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Choose Photos'}
                    </span>
                  </Button>
                </label>

                {isMobile && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Tap to select multiple photos from your gallery
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Photo Grid */}
        {photos.length > 0 ? (
          <PhotoGalleryMobile
            photos={photos}
            columns={{
              mobile: 2,
              tablet: 3,
              desktop: 4
            }}
            className="max-w-6xl mx-auto"
          />
        ) : (
          <Card className="text-center py-16 bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className={`${isMobile ? 'p-6' : 'p-8'}`}>
              <Heart className="w-16 h-16 text-primary/60 mx-auto mb-6" />
              <CardTitle className={`font-serif text-card-foreground mb-4 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                No Photos Yet
              </CardTitle>
              <p className={`text-muted-foreground max-w-md mx-auto ${isMobile ? 'text-sm' : ''}`}>
                Be the first to share a photo! Upload your favorite memories to get the gallery started.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Photo Modal */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-left">
                {selectedPhoto?.caption || 'Wedding Photo'}
              </DialogTitle>
              <div className="text-left">
                <Badge variant="secondary" className="text-xs">
                  Uploaded by {selectedPhoto?.uploadedBy}
                </Badge>
              </div>
            </DialogHeader>
            <div className="mt-4">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                <Heart className="w-16 h-16 text-primary/60" />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
