'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PhotoUploadInterface } from '@/components/photo-upload/PhotoUploadInterface'
import { PhotoStatusTracker } from '@/components/photo-upload/PhotoStatusTracker'
import { OptimizedImage } from '@/components/ui/image-optimized'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import { Upload, Camera, Heart, Image as ImageIcon, ImageIcon as ImagesIcon, BarChart3 } from 'lucide-react'
import WeddingNavigation from '@/components/wedding-navigation'

interface Photo {
  id: string
  url: string
  caption: string
  uploaded_by: string
  uploaded_at: string
  approved: boolean
}

export default function PhotoGalleryPage() {
  const router = useRouter()
  const { user, guest, isLoading } = useAuth()
  const { isMobile } = useMobileDetection()
  const [approvedPhotos, setApprovedPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('gallery')

  useEffect(() => {
    // If user is not authenticated, redirect to landing page
    if (!isLoading && (!user || !guest)) {
      router.push('/landing')
    }
  }, [user, guest, isLoading, router])

  useEffect(() => {
    const fetchApprovedPhotos = async () => {
      try {
        const response = await fetch('/api/photos?approved=true')
        const result = await response.json()

        if (response.ok && result.success) {
          setApprovedPhotos(result.data)
        } else {
          console.error('Failed to fetch photos:', result.error)
          setApprovedPhotos([])
        }
      } catch (error) {
        console.error('Error fetching photos:', error)
        setApprovedPhotos([])
      } finally {
        setLoading(false)
      }
    }

    if (user && guest) {
      fetchApprovedPhotos()
    }
  }, [user, guest])

  const handleUploadComplete = (uploadedPhotos: any[]) => {
    // Switch to status tab to show upload results
    setActiveTab('status')

    // Refresh approved photos
    const fetchApprovedPhotos = async () => {
      try {
        const response = await fetch('/api/photos?approved=true')
        const result = await response.json()
        if (response.ok && result.success) {
          setApprovedPhotos(result.data)
        }
      } catch (error) {
        console.error('Error refreshing photos:', error)
      }
    }

    fetchApprovedPhotos()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user || !guest) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <WeddingNavigation
        showBackButton={true}
        backUrl="/wedding"
        title="Photo Gallery"
      />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="font-script text-5xl md:text-6xl text-primary mb-4">
            Photo Gallery
          </h1>
          <div className="flex items-center justify-center gap-4 text-primary/70 mb-6">
            <div className="h-px bg-primary/30 w-16" />
            <Heart className="w-6 h-6 fill-current text-primary" />
            <div className="h-px bg-primary/30 w-16" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Share your favorite moments and memories with us
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <ImagesIcon className="w-4 h-4" />
              {!isMobile && "Gallery"}
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {!isMobile && "Upload"}
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              {!isMobile && "My Photos"}
            </TabsTrigger>
          </TabsList>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-muted-foreground mt-4">Loading photos...</p>
              </div>
            ) : approvedPhotos.length === 0 ? (
              <Card className="text-center">
                <CardContent className="p-12">
                  <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Photos Yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to share a photo! Upload your favorite memories to get started.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedPhotos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <OptimizedImage
                        src={photo.url}
                        alt={photo.caption || 'Wedding photo'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {photo.caption && (
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">{photo.caption}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Shared by {photo.uploaded_by}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <PhotoUploadInterface
              guestId={guest?.id || ''}
              onUploadComplete={handleUploadComplete}
              maxFiles={10}
            />

            {/* Photo Guidelines */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-primary mb-2">
                  Photo Guidelines
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All photos are reviewed before being displayed publicly</li>
                  <li>• Please only upload appropriate, family-friendly content</li>
                  <li>• Photos should be related to our relationship or wedding events</li>
                  <li>• Maximum file size: 10MB per photo</li>
                  <li>• Supported formats: JPEG, PNG, WebP</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-6">
            <PhotoStatusTracker guestId={guest?.id || ''} />
          </TabsContent>
        </Tabs>

      </main>
    </div>
  )
}
