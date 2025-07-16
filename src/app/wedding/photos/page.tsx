'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Camera, Heart, Image as ImageIcon, Plus } from 'lucide-react'
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
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadData, setUploadData] = useState({
    caption: '',
    file: null as File | null
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    // If user is not authenticated, redirect to landing page
    if (!isLoading && (!user || !guest)) {
      router.push('/landing')
    }
  }, [user, guest, isLoading, router])

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await fetch('/api/photos')
        const result = await response.json()

        if (response.ok && result.success) {
          setPhotos(result.data)
        } else {
          console.error('Failed to fetch photos:', result.error)
          // Fallback to empty array
          setPhotos([])
        }
      } catch (error) {
        console.error('Error fetching photos:', error)
        setPhotos([])
      } finally {
        setLoading(false)
      }
    }

    if (user && guest) {
      fetchPhotos()
    }
  }, [user, guest])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadData(prev => ({ ...prev, file }))
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadData.file || !guest) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('photo', uploadData.file)
      formData.append('caption', uploadData.caption)
      formData.append('guestId', guest.id)

      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Reset form
        setUploadData({ caption: '', file: null })
        setShowUpload(false)
        
        // Refresh photos
        const photosResponse = await fetch('/api/photos')
        const photosResult = await photosResponse.json()
        if (photosResponse.ok && photosResult.success) {
          setPhotos(photosResult.data)
        }
      } else {
        console.error('Photo upload failed:', result.error)
        alert('Failed to upload photo. Please try again.')
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setUploading(false)
    }
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

        {/* Upload Section */}
        <div className="mb-12">
          {!showUpload ? (
            <Card className="text-center">
              <CardContent className="p-8">
                <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Share Your Photos</h3>
                <p className="text-muted-foreground mb-6">
                  Upload your favorite photos from our engagement, pre-wedding events, or any special moments you'd like to share!
                </p>
                <Button variant="wedding" onClick={() => setShowUpload(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload a Photo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="photo">Select Photo</Label>
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption (Optional)</Label>
                    <Textarea
                      id="caption"
                      value={uploadData.caption}
                      onChange={(e) => setUploadData(prev => ({ ...prev, caption: e.target.value }))}
                      placeholder="Add a caption to your photo..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      variant="wedding"
                      disabled={!uploadData.file || uploading}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowUpload(false)
                        setUploadData({ caption: '', file: null })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Photo Gallery */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-4">Loading photos...</p>
          </div>
        ) : photos.length === 0 ? (
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
            {photos
              .filter(photo => photo.approved) // Only show approved photos
              .map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-square relative">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Wedding photo'}
                      className="w-full h-full object-cover"
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

        {/* Info Section */}
        <div className="mt-12">
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
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
