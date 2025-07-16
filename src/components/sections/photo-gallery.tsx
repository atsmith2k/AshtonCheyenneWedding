'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Upload, Heart, Download, X } from 'lucide-react'
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
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
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

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
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
        // Refresh photos list
        // You could add a state update here to show the uploaded photo

      } catch (error) {
        console.error('Error uploading photo:', error)
        // You could add error handling here to show user-friendly error messages
      }
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
              <CardContent className="p-8">
                <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
                <CardTitle className="font-serif text-xl text-card-foreground mb-4">
                  Share Your Photos
                </CardTitle>
                <p className="text-muted-foreground mb-6">
                  Upload your favorite photos from our special day to share with everyone!
                </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e.target.files)}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button variant="wedding" size="lg" asChild>
                  <span className="cursor-pointer">Choose Photos</span>
                </Button>
              </label>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Photo Grid */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {photos.map((photo, index) => (
              <Card
                key={photo.id}
                className="aspect-square overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 animate-slide-up bg-card/80 backdrop-blur-sm border-border/50 group"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300">
                  <Heart className="w-8 h-8 text-primary/60 group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16 bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-8">
              <Heart className="w-16 h-16 text-primary/60 mx-auto mb-6" />
              <CardTitle className="font-serif text-2xl text-card-foreground mb-4">
                No Photos Yet
              </CardTitle>
              <p className="text-muted-foreground max-w-md mx-auto">
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
