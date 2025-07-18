import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, logAdminAction } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email-service'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

// Validation schema for bulk photo actions
const bulkActionSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1, 'At least one photo ID is required'),
  action: z.enum(['approve', 'deny'], {
    required_error: 'Action is required',
    invalid_type_error: 'Action must be either "approve" or "deny"'
  }),
  moderationNotes: z.string().optional(),
  notifyGuests: z.boolean().default(true)
})

/**
 * POST /api/admin/photos/bulk-action
 * Perform bulk actions on photos (approve/deny multiple photos)
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdmin()

    const body = await request.json()
    
    // Validate request data
    let validatedData
    try {
      validatedData = bulkActionSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: error.errors[0].message },
          { status: 400 }
        )
      }
      throw error
    }

    const { photoIds, action, moderationNotes, notifyGuests } = validatedData

    // Get photos with guest information
    const { data: photos, error: fetchError } = await supabaseAdmin
      .from('photos')
      .select(`
        id,
        original_filename,
        caption,
        uploaded_by_guest_id,
        approved,
        file_path,
        guests (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .in('id', photoIds)

    if (fetchError) {
      console.error('Error fetching photos:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    if (!photos || photos.length === 0) {
      return NextResponse.json(
        { error: 'No photos found with the provided IDs' },
        { status: 404 }
      )
    }

    // Prepare update data based on action
    const updateData: any = {
      approved_at: new Date().toISOString(),
      approved_by: adminUser.id,
      moderation_notes: moderationNotes || null
    }

    if (action === 'approve') {
      updateData.approved = true
    } else {
      updateData.approved = false
      // For denied photos, moderation notes are required
      if (!moderationNotes) {
        return NextResponse.json(
          { error: 'Moderation notes are required when denying photos' },
          { status: 400 }
        )
      }
    }

    // Update photos in database
    const { data: updatedPhotos, error: updateError } = await supabaseAdmin
      .from('photos')
      .update(updateData)
      .in('id', photoIds)
      .select(`
        id,
        original_filename,
        caption,
        approved,
        moderation_notes,
        uploaded_by_guest_id,
        guests (
          id,
          first_name,
          last_name,
          email
        )
      `)

    if (updateError) {
      console.error('Error updating photos:', updateError)
      return NextResponse.json(
        { error: 'Failed to update photos' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction(`bulk_photo_${action}`, {
      photo_count: photoIds.length,
      photo_ids: photoIds,
      moderation_notes: moderationNotes,
      notify_guests: notifyGuests
    })

    // Log analytics events
    for (const photoId of photoIds) {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          event_type: `photo_${action}`,
          metadata: {
            photo_id: photoId,
            admin_id: adminUser.id,
            bulk_action: true,
            moderation_notes: moderationNotes || null
          }
        })
    }

    // Send notifications to guests if requested
    const notificationResults: any[] = []
    if (notifyGuests && updatedPhotos) {
      // Group photos by guest
      const photosByGuest = updatedPhotos.reduce((acc: any, photo: any) => {
        const guestId = photo.uploaded_by_guest_id
        if (!acc[guestId]) {
          acc[guestId] = {
            guest: photo.guests,
            photos: []
          }
        }
        acc[guestId].photos.push(photo)
        return acc
      }, {})

      // Send notification to each guest
      for (const [guestId, data] of Object.entries(photosByGuest) as any) {
        const { guest, photos: guestPhotos } = data
        
        if (!guest?.email) continue

        try {
          const emailResult = await sendEmail({
            to: guest.email,
            templateType: action === 'approve' ? 'photo_approved' : 'photo_denied',
            guestId: guest.id,
            variables: {
              guest_first_name: guest.first_name,
              guest_last_name: guest.last_name,
              guest_full_name: `${guest.first_name} ${guest.last_name}`,
              photo_count: guestPhotos.length.toString(),
              photos_list: guestPhotos.map((p: any) => p.original_filename).join(', '),
              moderation_notes: moderationNotes || '',
              website_url: process.env.NEXT_PUBLIC_APP_URL || 'https://ashtonandcheyenne.com',
              couple_names: 'Ashton & Cheyenne'
            }
          })

          notificationResults.push({
            guestId: guest.id,
            email: guest.email,
            success: emailResult.success,
            error: emailResult.error
          })
        } catch (error) {
          console.error(`Error sending notification to guest ${guest.id}:`, error)
          notificationResults.push({
            guestId: guest.id,
            email: guest.email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    const successCount = updatedPhotos?.length || 0
    const notificationSuccessCount = notificationResults.filter(r => r.success).length
    const notificationFailCount = notificationResults.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'approve' ? 'approved' : 'denied'} ${successCount} photo${successCount > 1 ? 's' : ''}`,
      data: {
        updatedPhotos: updatedPhotos || [],
        notifications: {
          sent: notificationSuccessCount,
          failed: notificationFailCount,
          results: notificationResults
        }
      }
    })

  } catch (error) {
    console.error('Error in bulk photo action API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/photos/bulk-action
 * Get photos pending moderation for bulk actions
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabaseAdmin
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
        uploaded_by_guest_id,
        guests (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filter by status
    if (status === 'pending') {
      query = query.eq('approved', false).is('moderation_notes', null)
    } else if (status === 'approved') {
      query = query.eq('approved', true)
    } else if (status === 'denied') {
      query = query.eq('approved', false).not('moderation_notes', 'is', null)
    }

    const { data: photos, error } = await query

    if (error) {
      console.error('Error fetching photos for bulk action:', error)
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    // Add public URLs to photos
    const photosWithUrls = (photos || []).map(photo => ({
      ...photo,
      url: supabaseAdmin!.storage
        .from('wedding-photos')
        .getPublicUrl(`photos/${photo.id}`).data.publicUrl
    }))

    return NextResponse.json({
      success: true,
      data: photosWithUrls
    })

  } catch (error) {
    console.error('Error in bulk photo action GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
