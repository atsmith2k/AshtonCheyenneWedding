'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OptimizedImage } from '@/components/ui/image-optimized'
import { useToast } from '@/hooks/use-toast'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import {
  Check,
  X,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Mail,
  RefreshCw,
  User,
  Calendar,
  FileImage,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  approved_at: string | null
  moderation_notes: string | null
  uploaded_by_guest_id: string | null
  url: string
  guests?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

interface PhotoModerationPanelProps {
  className?: string
}

export function PhotoModerationPanel({ className }: PhotoModerationPanelProps) {
  const { toast } = useToast()
  const { isMobile } = useMobileDetection()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'denied'>('pending')
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [moderationNotes, setModerationNotes] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'deny'>('approve')

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/photos/bulk-action?status=${filter}&limit=100`)
      const result = await response.json()
      
      if (result.success) {
        setPhotos(result.data)
      } else {
        toast({
          title: "Error loading photos",
          description: result.error || "Failed to load photos",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
      toast({
        title: "Error loading photos",
        description: "Failed to load photos. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filter, toast])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleBulkAction = async () => {
    if (selectedPhotos.length === 0) return

    setBulkActionLoading(true)
    try {
      const response = await fetch('/api/admin/photos/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoIds: selectedPhotos,
          action: bulkAction,
          moderationNotes: bulkAction === 'deny' ? moderationNotes : undefined,
          notifyGuests: true
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success!",
          description: result.message,
        })
        setSelectedPhotos([])
        setModerationNotes('')
        setShowBulkDialog(false)
        await fetchPhotos()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to perform bulk action",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error performing bulk action:', error)
      toast({
        title: "Error",
        description: "Failed to perform bulk action. Please try again.",
        variant: "destructive"
      })
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleSingleAction = async (photoId: string, action: 'approve' | 'deny', notes?: string) => {
    try {
      const response = await fetch('/api/admin/photos/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoIds: [photoId],
          action,
          moderationNotes: notes,
          notifyGuests: true
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Success!",
          description: `Photo ${action === 'approve' ? 'approved' : 'denied'} successfully`,
        })
        await fetchPhotos()
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${action} photo`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error(`Error ${action}ing photo:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} photo. Please try again.`,
        variant: "destructive"
      })
    }
  }

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    )
  }

  const selectAllPhotos = () => {
    setSelectedPhotos(photos.map(p => p.id))
  }

  const clearSelection = () => {
    setSelectedPhotos([])
  }

  const getStatusBadge = (photo: Photo) => {
    if (photo.approved) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Approved
        </Badge>
      )
    } else if (photo.moderation_notes) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <X className="w-3 h-3 mr-1" />
          Denied
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      )
    }
  }

  const pendingCount = photos.filter(p => !p.approved && !p.moderation_notes).length
  const approvedCount = photos.filter(p => p.approved).length
  const deniedCount = photos.filter(p => !p.approved && p.moderation_notes).length

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            Photo Moderation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{deniedCount}</div>
              <div className="text-sm text-muted-foreground">Denied</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
              <TabsTrigger value="denied">Denied ({deniedCount})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedPhotos.length > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedPhotos.length} photo{selectedPhotos.length > 1 ? 's' : ''} selected
                </span>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear Selection
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkAction('approve')
                    setShowBulkDialog(true)
                  }}
                  disabled={bulkActionLoading}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkAction('deny')
                    setShowBulkDialog(true)
                  }}
                  disabled={bulkActionLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Deny Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Photos</CardTitle>
          <div className="flex gap-2">
            {photos.length > 0 && (
              <Button variant="outline" size="sm" onClick={selectAllPhotos}>
                Select All
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={fetchPhotos}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading photos...
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12">
              <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No {filter} photos found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  selected={selectedPhotos.includes(photo.id)}
                  onToggleSelect={() => togglePhotoSelection(photo.id)}
                  onApprove={() => handleSingleAction(photo.id, 'approve')}
                  onDeny={(notes) => handleSingleAction(photo.id, 'deny', notes)}
                  onView={() => setSelectedPhoto(photo)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'approve' ? 'Approve' : 'Deny'} {selectedPhotos.length} Photo{selectedPhotos.length > 1 ? 's' : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {bulkAction === 'deny' && (
              <div>
                <Label htmlFor="notes">Moderation Notes (Required)</Label>
                <Textarea
                  id="notes"
                  value={moderationNotes}
                  onChange={(e) => setModerationNotes(e.target.value)}
                  placeholder="Please provide feedback for the guest..."
                  rows={3}
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkAction}
                disabled={bulkActionLoading || (bulkAction === 'deny' && !moderationNotes.trim())}
              >
                {bulkActionLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : bulkAction === 'approve' ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                {bulkAction === 'approve' ? 'Approve' : 'Deny'} Photos
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Detail Dialog */}
      {selectedPhoto && (
        <PhotoDetailDialog
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onApprove={() => {
            handleSingleAction(selectedPhoto.id, 'approve')
            setSelectedPhoto(null)
          }}
          onDeny={(notes) => {
            handleSingleAction(selectedPhoto.id, 'deny', notes)
            setSelectedPhoto(null)
          }}
        />
      )}
    </div>
  )
}

interface PhotoCardProps {
  photo: Photo
  selected: boolean
  onToggleSelect: () => void
  onApprove: () => void
  onDeny: (notes: string) => void
  onView: () => void
}

function PhotoCard({ photo, selected, onToggleSelect, onApprove, onDeny, onView }: PhotoCardProps) {
  const [showDenyDialog, setShowDenyDialog] = useState(false)
  const [denyNotes, setDenyNotes] = useState('')

  const handleDeny = () => {
    if (denyNotes.trim()) {
      onDeny(denyNotes)
      setDenyNotes('')
      setShowDenyDialog(false)
    }
  }

  return (
    <Card className={cn("overflow-hidden", selected && "ring-2 ring-primary")}>
      <div className="relative">
        <div className="aspect-square relative">
          <OptimizedImage
            src={photo.url}
            alt={photo.caption || photo.original_filename}
            fill
            className="object-cover"
          />
        </div>
        
        {/* Selection Checkbox */}
        <div className="absolute top-2 left-2">
          <Checkbox
            checked={selected}
            onCheckedChange={onToggleSelect}
            className="bg-white/80 backdrop-blur-sm"
          />
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {photo.approved ? (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Approved
            </Badge>
          ) : photo.moderation_notes ? (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              <X className="w-3 h-3 mr-1" />
              Denied
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          )}
        </div>

        {/* Featured Badge */}
        {photo.featured && (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h4 className="font-medium truncate">{photo.original_filename}</h4>
          {photo.caption && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              "{photo.caption}"
            </p>
          )}
        </div>

        {photo.guests && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            {photo.guests.first_name} {photo.guests.last_name}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          {new Date(photo.created_at).toLocaleDateString()}
          <span>•</span>
          {(photo.file_size / 1024 / 1024).toFixed(1)}MB
        </div>

        {photo.moderation_notes && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            <strong>Notes:</strong> {photo.moderation_notes}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onView} className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          
          {!photo.approved && !photo.moderation_notes && (
            <>
              <Button variant="outline" size="sm" onClick={onApprove}>
                <Check className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDenyDialog(true)}>
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>

      {/* Deny Dialog */}
      <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deny-notes">Moderation Notes (Required)</Label>
              <Textarea
                id="deny-notes"
                value={denyNotes}
                onChange={(e) => setDenyNotes(e.target.value)}
                placeholder="Please provide feedback for the guest..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDenyDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleDeny}
                disabled={!denyNotes.trim()}
                variant="destructive"
              >
                <X className="w-4 h-4 mr-2" />
                Deny Photo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

interface PhotoDetailDialogProps {
  photo: Photo
  onClose: () => void
  onApprove: () => void
  onDeny: (notes: string) => void
}

function PhotoDetailDialog({ photo, onClose, onApprove, onDeny }: PhotoDetailDialogProps) {
  const [denyNotes, setDenyNotes] = useState('')
  const [showDenyForm, setShowDenyForm] = useState(false)

  const handleDeny = () => {
    if (denyNotes.trim()) {
      onDeny(denyNotes)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Photo Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photo */}
          <div className="space-y-4">
            <div className="aspect-square relative rounded-lg overflow-hidden">
              <OptimizedImage
                src={photo.url}
                alt={photo.caption || photo.original_filename}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{photo.original_filename}</h3>
              {photo.caption && (
                <p className="text-muted-foreground mt-2">"{photo.caption}"</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>
                  {photo.guests ? 
                    `${photo.guests.first_name} ${photo.guests.last_name}` : 
                    'Unknown Guest'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(photo.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                <span>{(photo.file_size / 1024 / 1024).toFixed(1)}MB • {photo.mime_type}</span>
              </div>
            </div>

            <div>
              {photo.approved ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approved
                  {photo.approved_at && (
                    <span className="ml-2 text-xs">
                      on {new Date(photo.approved_at).toLocaleDateString()}
                    </span>
                  )}
                </Badge>
              ) : photo.moderation_notes ? (
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <X className="w-4 h-4 mr-2" />
                    Denied
                  </Badge>
                  <div className="p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      <strong>Moderation Notes:</strong><br />
                      {photo.moderation_notes}
                    </p>
                  </div>
                </div>
              ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Clock className="w-4 h-4 mr-2" />
                  Pending Review
                </Badge>
              )}
            </div>

            {/* Actions */}
            {!photo.approved && !photo.moderation_notes && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex gap-2">
                  <Button onClick={onApprove} className="flex-1">
                    <Check className="w-4 h-4 mr-2" />
                    Approve Photo
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDenyForm(!showDenyForm)}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Deny Photo
                  </Button>
                </div>

                {showDenyForm && (
                  <div className="space-y-3">
                    <Label htmlFor="detail-deny-notes">Moderation Notes (Required)</Label>
                    <Textarea
                      id="detail-deny-notes"
                      value={denyNotes}
                      onChange={(e) => setDenyNotes(e.target.value)}
                      placeholder="Please provide feedback for the guest..."
                      rows={3}
                    />
                    <Button
                      onClick={handleDeny}
                      disabled={!denyNotes.trim()}
                      variant="destructive"
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Deny with Notes
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
