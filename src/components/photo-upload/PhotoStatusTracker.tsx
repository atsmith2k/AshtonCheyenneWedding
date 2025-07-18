'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OptimizedImage } from '@/components/ui/image-optimized'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import {
  Camera,
  Check,
  Clock,
  X,
  Star,
  RefreshCw,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoStatus {
  id: string
  original_filename: string
  caption: string | null
  file_size: number
  mime_type: string
  approved: boolean
  featured: boolean
  created_at: string
  approved_at: string | null
  status: 'pending' | 'approved' | 'denied'
  url?: string
  moderation_notes?: string
  album?: {
    id: string
    name: string
  } | null
}

interface PhotoStatusData {
  guest: {
    id: string
    name: string
  }
  statistics: {
    total: number
    approved: number
    pending: number
    denied: number
    featured: number
  }
  photos: PhotoStatus[]
}

interface PhotoStatusTrackerProps {
  guestId: string
  className?: string
}

export function PhotoStatusTracker({ guestId, className }: PhotoStatusTrackerProps) {
  const { isMobile } = useMobileDetection()
  const [data, setData] = useState<PhotoStatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPhotoStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/photos/status?guestId=${guestId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch photo status')
      }

      setData(result.data)
    } catch (err) {
      console.error('Error fetching photo status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load photo status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (guestId) {
      fetchPhotoStatus()
    }
  }, [guestId])

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading photo status...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <div className="text-center">
            <p className="font-medium text-destructive">Error loading photos</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button variant="outline" onClick={fetchPhotoStatus}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.statistics.total === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 gap-4">
          <Camera className="w-12 h-12 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">No photos uploaded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload some photos to see their status here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <Check className="w-4 h-4" />
      case 'denied':
        return <X className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500'
      case 'denied':
        return 'bg-red-500'
      default:
        return 'bg-yellow-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved'
      case 'denied':
        return 'Needs Changes'
      default:
        return 'Pending Review'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Your Photo Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {data.statistics.total}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.statistics.approved}
              </div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {data.statistics.pending}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.statistics.denied}
              </div>
              <div className="text-sm text-muted-foreground">Need Changes</div>
            </div>
          </div>

          {data.statistics.featured > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <Star className="w-4 h-4" />
                <span className="font-medium">
                  {data.statistics.featured} of your photos are featured!
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Photos</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchPhotoStatus}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.photos.map((photo) => (
              <div
                key={photo.id}
                className="flex items-start gap-4 p-4 border rounded-lg"
              >
                {/* Photo Preview */}
                <div className="flex-shrink-0">
                  {photo.url ? (
                    <OptimizedImage
                      src={photo.url}
                      alt={photo.caption || photo.original_filename}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Photo Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium truncate">
                        {photo.original_filename}
                      </h4>
                      {photo.caption && (
                        <p className="text-sm text-muted-foreground mt-1">
                          "{photo.caption}"
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {(photo.file_size / 1024 / 1024).toFixed(1)}MB
                        </span>
                        <span>
                          {new Date(photo.created_at).toLocaleDateString()}
                        </span>
                        {photo.album && (
                          <span>Album: {photo.album.name}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="secondary"
                        className={cn("text-white", getStatusColor(photo.status))}
                      >
                        {getStatusIcon(photo.status)}
                        <span className="ml-1">{getStatusText(photo.status)}</span>
                      </Badge>
                      
                      {photo.featured && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Moderation Notes */}
                  {photo.moderation_notes && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Admin feedback:</strong> {photo.moderation_notes}
                      </p>
                    </div>
                  )}

                  {/* Approval Info */}
                  {photo.approved && photo.approved_at && (
                    <div className="mt-2 text-xs text-green-600">
                      Approved on {new Date(photo.approved_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
