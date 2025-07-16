import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = params.id

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      )
    }

    // Get photo info before deletion
    const { data: photo, error: fetchError } = await supabaseAdmin
      .from('photos')
      .select('file_path')
      .eq('id', photoId)
      .single()

    if (fetchError || !photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Delete photo from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('wedding-photos')
      .remove([photo.file_path])

    if (storageError) {
      console.error('Error deleting photo from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete photo record from database
    const { error: deleteError } = await supabaseAdmin
      .from('photos')
      .delete()
      .eq('id', photoId)

    if (deleteError) {
      console.error('Error deleting photo record:', deleteError)
      return NextResponse.json(
        { error: 'Failed to reject photo' },
        { status: 500 }
      )
    }

    // Log analytics event
    await supabaseAdmin
      .from('analytics_events')
      .insert({
        event_type: 'photo_rejected',
        metadata: {
          photo_id: photoId,
          rejected_at: new Date().toISOString()
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Photo rejected and deleted successfully'
    })

  } catch (error) {
    console.error('Error in photo reject API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
