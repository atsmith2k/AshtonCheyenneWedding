'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import {
  Upload,
  Camera,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Plus,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PhotoFile {
  id: string
  file: File
  preview: string
  caption: string
  uploading: boolean
  uploaded: boolean
  error?: string
  progress: number
}

interface PhotoUploadInterfaceProps {
  guestId: string
  onUploadComplete?: (photos: any[]) => void
  maxFiles?: number
  className?: string
}

export function PhotoUploadInterface({
  guestId,
  onUploadComplete,
  maxFiles = 10,
  className
}: PhotoUploadInterfaceProps) {
  const { toast } = useToast()
  const { isMobile } = useMobileDetection()
  const [photos, setPhotos] = useState<PhotoFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newPhotos: PhotoFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2, 15),
      file,
      preview: URL.createObjectURL(file),
      caption: '',
      uploading: false,
      uploaded: false,
      progress: 0
    }))

    setPhotos(prev => {
      const combined = [...prev, ...newPhotos]
      if (combined.length > maxFiles) {
        toast({
          title: "Too many files",
          description: `You can only upload up to ${maxFiles} photos at once.`,
          variant: "destructive"
        })
        return prev
      }
      return combined
    })
  }, [maxFiles, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    disabled: isUploading
  })

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id)
      if (photo?.preview) {
        URL.revokeObjectURL(photo.preview)
      }
      return prev.filter(p => p.id !== id)
    })
  }

  const updateCaption = (id: string, caption: string) => {
    setPhotos(prev => prev.map(p => 
      p.id === id ? { ...p, caption } : p
    ))
  }

  const uploadPhoto = async (photo: PhotoFile): Promise<boolean> => {
    const formData = new FormData()
    formData.append('file', photo.file)
    formData.append('guestId', guestId)
    formData.append('caption', photo.caption)

    try {
      const response = await fetch('/api/photos/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      return true
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const uploadAllPhotos = async () => {
    if (photos.length === 0) return

    setIsUploading(true)
    const uploadedPhotos: any[] = []
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      
      setPhotos(prev => prev.map(p => 
        p.id === photo.id 
          ? { ...p, uploading: true, progress: 0 }
          : p
      ))

      try {
        // Simulate progress updates
        for (let progress = 0; progress <= 100; progress += 20) {
          setPhotos(prev => prev.map(p => 
            p.id === photo.id 
              ? { ...p, progress }
              : p
          ))
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        await uploadPhoto(photo)
        
        setPhotos(prev => prev.map(p => 
          p.id === photo.id 
            ? { ...p, uploading: false, uploaded: true, progress: 100 }
            : p
        ))
        
        successCount++
        uploadedPhotos.push(photo)
      } catch (error) {
        setPhotos(prev => prev.map(p => 
          p.id === photo.id 
            ? { 
                ...p, 
                uploading: false, 
                uploaded: false, 
                error: error instanceof Error ? error.message : 'Upload failed',
                progress: 0
              }
            : p
        ))
        errorCount++
      }
    }

    setIsUploading(false)

    // Show results
    if (successCount > 0) {
      toast({
        title: "Photos uploaded successfully!",
        description: `${successCount} photo${successCount > 1 ? 's' : ''} uploaded and pending approval.`,
      })
    }

    if (errorCount > 0) {
      toast({
        title: "Some uploads failed",
        description: `${errorCount} photo${errorCount > 1 ? 's' : ''} failed to upload. Please try again.`,
        variant: "destructive"
      })
    }

    // Clear successful uploads
    setPhotos(prev => prev.filter(p => !p.uploaded))
    
    onUploadComplete?.(uploadedPhotos)
  }

  const clearAll = () => {
    photos.forEach(photo => {
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview)
      }
    })
    setPhotos([])
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Upload Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-muted">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium">
                {isDragActive ? "Drop photos here" : "Drag & drop photos here"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to select files (max {maxFiles} photos, 10MB each)
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={isUploading}>
              <Plus className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </div>
        </div>

        {/* Photo Previews */}
        {photos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                Selected Photos ({photos.length}/{maxFiles})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={isUploading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photos.map((photo) => (
                <PhotoPreviewCard
                  key={photo.id}
                  photo={photo}
                  onRemove={() => removePhoto(photo.id)}
                  onCaptionChange={(caption) => updateCaption(photo.id, caption)}
                  disabled={isUploading}
                />
              ))}
            </div>

            {/* Upload Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={uploadAllPhotos}
                disabled={isUploading || photos.length === 0}
                size="lg"
                className="min-w-[200px]"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {photos.length} Photo{photos.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface PhotoPreviewCardProps {
  photo: PhotoFile
  onRemove: () => void
  onCaptionChange: (caption: string) => void
  disabled: boolean
}

function PhotoPreviewCard({ photo, onRemove, onCaptionChange, disabled }: PhotoPreviewCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <img
          src={photo.preview}
          alt="Preview"
          className="w-full h-32 object-cover"
        />
        
        {/* Status Overlay */}
        <div className="absolute top-2 right-2 flex gap-2">
          {photo.uploaded && (
            <Badge variant="default" className="bg-green-500">
              <Check className="w-3 h-3 mr-1" />
              Uploaded
            </Badge>
          )}
          {photo.error && (
            <Badge variant="destructive">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          )}
          {!disabled && !photo.uploaded && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        {photo.uploading && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
            <Progress value={photo.progress} className="h-1" />
          </div>
        )}
      </div>

      <CardContent className="p-3 space-y-2">
        <div className="text-xs text-muted-foreground">
          {photo.file.name} ({(photo.file.size / 1024 / 1024).toFixed(1)}MB)
        </div>
        
        {photo.error && (
          <div className="text-xs text-destructive">
            {photo.error}
          </div>
        )}

        <div>
          <Label htmlFor={`caption-${photo.id}`} className="text-xs">
            Caption (optional)
          </Label>
          <Textarea
            id={`caption-${photo.id}`}
            value={photo.caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Add a caption for this photo..."
            disabled={disabled || photo.uploaded}
            className="text-xs h-16 resize-none"
            maxLength={500}
          />
        </div>
      </CardContent>
    </Card>
  )
}
