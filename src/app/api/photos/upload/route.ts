import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - this route uses database operations and file uploads
export const dynamic = 'force-dynamic'

// Rate limiting for photo uploads (more restrictive than general API)
const PHOTO_UPLOAD_RATE_LIMIT = {
  requests: 10, // 10 uploads per window
  windowMs: 15 * 60 * 1000, // 15 minutes
}

// In-memory rate limiting (use Redis in production)
const uploadRateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkPhotoUploadRateLimit(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            request.headers.get('cf-connecting-ip') ||
            'unknown'

  const key = `photo-upload:${ip}`
  const now = Date.now()
  const windowStart = now - PHOTO_UPLOAD_RATE_LIMIT.windowMs

  const current = uploadRateLimitMap.get(key)

  if (!current || current.resetTime < windowStart) {
    uploadRateLimitMap.set(key, { count: 1, resetTime: now })
    return true
  }

  if (current.count >= PHOTO_UPLOAD_RATE_LIMIT.requests) {
    return false
  }

  current.count++
  return true
}

// Validation schema for photo upload
const photoUploadSchema = z.object({
  guestId: z.string().uuid('Invalid guest ID'),
  caption: z.string().max(500, 'Caption too long').optional(),
  albumId: z.string().uuid('Invalid album ID').optional(),
})

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Check photo upload rate limit
    if (!checkPhotoUploadRateLimit(request)) {
      return NextResponse.json(
        { error: 'Too many photo uploads. Please wait before uploading more photos.' },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const guestId = formData.get('guestId') as string
    const caption = formData.get('caption') as string
    const albumId = formData.get('albumId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate form data
    try {
      photoUploadSchema.parse({
        guestId,
        caption: caption || undefined,
        albumId: albumId || undefined,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
    }

    // Verify guest exists and is valid
    const { data: guest, error: guestError } = await supabaseAdmin
      .from('guests')
      .select('id, first_name, last_name')
      .eq('id', guestId)
      .single()

    if (guestError || !guest) {
      return NextResponse.json(
        { error: 'Invalid guest ID' },
        { status: 400 }
      )
    }

    // Enhanced file validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Basic content validation - check if it's actually an image
    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)

    // Check for common image file signatures
    const isValidImage = (
      // JPEG
      (uint8Array[0] === 0xFF && uint8Array[1] === 0xD8) ||
      // PNG
      (uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && uint8Array[2] === 0x4E && uint8Array[3] === 0x47) ||
      // WebP
      (uint8Array[8] === 0x57 && uint8Array[9] === 0x45 && uint8Array[10] === 0x42 && uint8Array[11] === 0x50)
    )

    if (!isValidImage) {
      return NextResponse.json(
        { error: 'Invalid image file. File appears to be corrupted or not a valid image.' },
        { status: 400 }
      )
    }

    // Generate unique filename with better collision avoidance
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}-${randomId}.${fileExt}`
    const filePath = `photos/${fileName}`

    // Create a new File object from the buffer to ensure clean upload
    const cleanFile = new File([buffer], fileName, { type: file.type })

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('wedding-photos')
      .upload(filePath, cleanFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('wedding-photos')
      .getPublicUrl(filePath)

    // Generate thumbnail path for future use
    const thumbnailPath = `thumbnails/${fileName}`

    // Save photo record to database with enhanced metadata
    const { data: photo, error: dbError } = await supabaseAdmin
      .from('photos')
      .insert({
        file_path: filePath,
        thumbnail_path: thumbnailPath,
        original_filename: file.name,
        caption: caption || null,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by_guest_id: guestId,
        album_id: albumId || null,
        approved: false, // Requires admin approval
        featured: false,
        sort_order: 0,
        created_at: new Date().toISOString()
      })
      .select(`
        *,
        guests (
          first_name,
          last_name
        )
      `)
      .single()

    if (dbError) {
      console.error('Error saving photo record:', dbError)

      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage
        .from('wedding-photos')
        .remove([filePath])

      return NextResponse.json(
        { error: 'Failed to save photo record' },
        { status: 500 }
      )
    }

    // Log analytics event with enhanced metadata
    await supabaseAdmin
      .from('analytics_events')
      .insert({
        event_type: 'photo_upload',
        guest_id: guestId,
        metadata: {
          photo_id: photo.id,
          filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          has_caption: !!caption,
          album_id: albumId || null,
          upload_timestamp: new Date().toISOString()
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully and is pending admin approval',
      data: {
        ...photo,
        url: publicUrl,
        status: 'pending'
      }
    })

  } catch (error) {
    console.error('Error in photo upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const approved = searchParams.get('approved')
    const albumId = searchParams.get('albumId')

    let query = supabaseAdmin
      .from('photos')
      .select(`
        *,
        photo_albums (
          id,
          name,
          description
        ),
        guests (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by approval status
    if (approved !== null) {
      query = query.eq('approved', approved === 'true')
    }

    // Filter by album
    if (albumId) {
      query = query.eq('album_id', albumId)
    }

    const { data: photos, error } = await query

    if (error) {
      console.error('Error fetching photos:', error)
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    // Add public URLs to photos
    const photosWithUrls = photos.map(photo => ({
      ...photo,
      url: supabaseAdmin!.storage
        .from('wedding-photos')
        .getPublicUrl(photo.file_path).data.publicUrl
    }))

    return NextResponse.json({
      success: true,
      data: photosWithUrls
    })

  } catch (error) {
    console.error('Error in photos GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
