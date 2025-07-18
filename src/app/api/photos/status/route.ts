import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - this route uses database operations
export const dynamic = 'force-dynamic'

// Validation schema for photo status request
const photoStatusSchema = z.object({
  guestId: z.string().uuid('Invalid guest ID'),
})

/**
 * GET /api/photos/status?guestId={guestId}
 * Get photo upload status for a specific guest
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get('guestId')

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      )
    }

    // Validate guest ID
    try {
      photoStatusSchema.parse({ guestId })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
    }

    // Verify guest exists
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

    // Get photos uploaded by this guest
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('photos')
      .select(`
        id,
        original_filename,
        caption,
        file_size,
        mime_type,
        approved,
        featured,
        moderation_notes,
        created_at,
        approved_at,
        approved_by,
        photo_albums (
          id,
          name
        )
      `)
      .eq('uploaded_by_guest_id', guestId)
      .order('created_at', { ascending: false })

    if (photosError) {
      console.error('Error fetching guest photos:', photosError)
      return NextResponse.json(
        { error: 'Failed to fetch photo status' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalPhotos = photos.length
    const approvedPhotos = photos.filter(p => p.approved).length
    const pendingPhotos = photos.filter(p => !p.approved && !p.moderation_notes).length
    const deniedPhotos = photos.filter(p => !p.approved && p.moderation_notes).length
    const featuredPhotos = photos.filter(p => p.featured).length

    // Add public URLs to approved photos only
    const photosWithUrls = photos.map(photo => {
      const basePhoto = {
        id: photo.id,
        original_filename: photo.original_filename,
        caption: photo.caption,
        file_size: photo.file_size,
        mime_type: photo.mime_type,
        approved: photo.approved,
        featured: photo.featured,
        created_at: photo.created_at,
        approved_at: photo.approved_at,
        album: photo.photo_albums,
        status: photo.approved 
          ? 'approved' 
          : photo.moderation_notes 
            ? 'denied' 
            : 'pending'
      }

      // Only include URL and moderation notes for appropriate statuses
      if (photo.approved) {
        return {
          ...basePhoto,
          url: supabaseAdmin!.storage
            .from('wedding-photos')
            .getPublicUrl(`photos/${photo.id}`).data.publicUrl
        }
      } else if (photo.moderation_notes) {
        return {
          ...basePhoto,
          moderation_notes: photo.moderation_notes
        }
      }

      return basePhoto
    })

    return NextResponse.json({
      success: true,
      data: {
        guest: {
          id: guest.id,
          name: `${guest.first_name} ${guest.last_name}`
        },
        statistics: {
          total: totalPhotos,
          approved: approvedPhotos,
          pending: pendingPhotos,
          denied: deniedPhotos,
          featured: featuredPhotos
        },
        photos: photosWithUrls
      }
    })

  } catch (error) {
    console.error('Error in photo status API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
