'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  Image as ImageIcon, 
  Upload, 
  Check, 
  X, 
  Eye, 
  Trash2,
  Star,
  Folder,
  Filter,
  Download
} from 'lucide-react'

interface Photo {
  id: string
  file_path: string
  original_filename: string
  caption: string | null
  approved: boolean
  featured: boolean
  file_size: number
  mime_type: string
  created_at: string
  url: string
  guests?: {
    first_name: string
    last_name: string
  }
}

export default function MediaManagement() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null)

  const fetchPhotos = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter === 'pending') params.append('approved', 'false')
      if (filter === 'approved') params.append('approved', 'true')

      const response = await fetch(`/api/photos/upload?${params}`)
      const result = await response.json()

      if (response.ok && result.success) {
        setPhotos(result.data)
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleApprovePhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/admin/photos/${photoId}/approve`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchPhotos()
      }
    } catch (error) {
      console.error('Error approving photo:', error)
    }
  }

  const handleRejectPhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/admin/photos/${photoId}/reject`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchPhotos()
      }
    } catch (error) {
      console.error('Error rejecting photo:', error)
    }
  }

  const handleBulkApprove = async () => {
    for (const photoId of selectedPhotos) {
      await handleApprovePhoto(photoId)
    }
    setSelectedPhotos([])
  }

  const handleBulkReject = async () => {
    for (const photoId of selectedPhotos) {
      await handleRejectPhoto(photoId)
    }
    setSelectedPhotos([])
  }

  const handleSelectPhoto = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    )
  }

  const handleSelectAll = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([])
    } else {
      setSelectedPhotos(photos.map(p => p.id))
    }
  }

  const pendingCount = photos.filter(p => !p.approved).length
  const approvedCount = photos.filter(p => p.approved).length

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-800">Media Management</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-square bg-neutral-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Media Management</h1>
          <p className="text-neutral-600">Manage wedding photos and guest uploads</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Folder className="w-4 h-4 mr-2" />
            Create Album
          </Button>
          <Button variant="wedding">
            <Upload className="w-4 h-4 mr-2" />
            Upload Photos
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Photos</p>
              <p className="text-2xl font-bold text-neutral-800">{photos.length}</p>
            </div>
            <ImageIcon className="w-8 h-8 text-primary-500" />
          </div>
        </div>
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Eye className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Featured</p>
              <p className="text-2xl font-bold text-blue-600">
                {photos.filter(p => p.featured).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="wedding-card p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-3">
            <Button
              variant={filter === 'all' ? 'wedding' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Photos ({photos.length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'wedding' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingCount})
            </Button>
            <Button
              variant={filter === 'approved' ? 'wedding' : 'outline'}
              onClick={() => setFilter('approved')}
            >
              Approved ({approvedCount})
            </Button>
          </div>

          {selectedPhotos.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleBulkApprove}>
                <Check className="w-4 h-4 mr-2" />
                Approve ({selectedPhotos.length})
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkReject}>
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button size="sm" variant="outline">
                <Star className="w-4 h-4 mr-2" />
                Feature
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>

        {selectedPhotos.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </div>

      {/* Photo Grid */}
      <div className="wedding-card p-6">
        {photos.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-800">
                {filter === 'all' ? 'All Photos' : 
                 filter === 'pending' ? 'Pending Approval' : 'Approved Photos'}
              </h3>
              <Button size="sm" variant="outline" onClick={handleSelectAll}>
                {selectedPhotos.length === photos.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                    <Image
                      src={photo.url}
                      alt={photo.caption || photo.original_filename}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() => setViewingPhoto(photo)}
                    />
                    
                    {/* Selection Checkbox */}
                    <div className="absolute top-2 left-2">
                      <input
                        type="checkbox"
                        checked={selectedPhotos.includes(photo.id)}
                        onChange={() => handleSelectPhoto(photo.id)}
                        className="w-4 h-4 rounded"
                      />
                    </div>

                    {/* Status Indicators */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {photo.featured && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Star className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {photo.approved ? (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Eye className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!photo.approved && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApprovePhoto(photo.id)
                            }}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRejectPhoto(photo.id)
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Photo Info */}
                  <div className="mt-2 text-xs text-neutral-600">
                    <p className="truncate">{photo.original_filename}</p>
                    {photo.guests && (
                      <p className="text-neutral-500">
                        by {photo.guests.first_name} {photo.guests.last_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-800 mb-2">
              No Photos Yet
            </h3>
            <p className="text-neutral-600 mb-6">
              {filter === 'pending' 
                ? 'No photos are pending approval.'
                : filter === 'approved'
                ? 'No photos have been approved yet.'
                : 'Upload photos or wait for guest uploads to appear here.'
              }
            </p>
            <Button variant="wedding">
              <Upload className="w-4 h-4 mr-2" />
              Upload First Photos
            </Button>
          </div>
        )}
      </div>

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-medium text-neutral-800">
                  {viewingPhoto.caption || viewingPhoto.original_filename}
                </h3>
                {viewingPhoto.guests && (
                  <p className="text-sm text-neutral-600">
                    Uploaded by {viewingPhoto.guests.first_name} {viewingPhoto.guests.last_name}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {!viewingPhoto.approved && (
                  <>
                    <Button size="sm" onClick={() => handleApprovePhoto(viewingPhoto.id)}>
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRejectPhoto(viewingPhoto.id)}>
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                <Button size="sm" variant="outline" onClick={() => setViewingPhoto(null)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="p-4">
              <Image
                src={viewingPhoto.url}
                alt={viewingPhoto.caption || viewingPhoto.original_filename}
                width={800}
                height={600}
                className="max-w-full max-h-96 mx-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
