'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Heart, Download } from 'lucide-react'
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
      <section id="photos" className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-neutral-800 mb-4">
              Photo Gallery
            </h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-neutral-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="photos" className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-serif text-4xl md:text-5xl text-neutral-800 mb-4">
            Photo Gallery
          </h2>
          <p className="text-xl text-neutral-600 mb-6">
            Share your memories with us
          </p>
          <div className="w-24 h-1 bg-primary-500 mx-auto" />
        </div>

        {/* Upload Section */}
        {user && guest && (
          <div className="max-w-2xl mx-auto mb-16">
            <div className="wedding-card p-8 text-center">
              <Upload className="w-12 h-12 text-primary-500 mx-auto mb-4" />
              <h3 className="font-serif text-xl text-neutral-800 mb-4">
                Share Your Photos
              </h3>
              <p className="text-neutral-600 mb-6">
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
            </div>
          </div>
        )}

        {/* Photo Grid */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="aspect-square bg-neutral-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="w-full h-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-primary-400" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-primary-300 mx-auto mb-6" />
            <h3 className="font-serif text-2xl text-neutral-800 mb-4">
              No Photos Yet
            </h3>
            <p className="text-neutral-600 max-w-md mx-auto">
              Be the first to share a photo! Upload your favorite memories to get the gallery started.
            </p>
          </div>
        )}

        {/* Photo Modal */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-neutral-800">
                      {selectedPhoto.caption || 'Wedding Photo'}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      Uploaded by {selectedPhoto.uploadedBy}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="text-neutral-500 hover:text-neutral-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-16 h-16 text-primary-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
