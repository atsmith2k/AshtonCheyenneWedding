import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Await params in Next.js 14 App Router
    const { id } = await params
    const photoId = id

    if (!photoId) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      )
    }

    // Update photo to approved status
    const { data: photo, error } = await supabaseAdmin
      .from('photos')
      .update({
        approved: true,
        approved_at: new Date().toISOString(),
        // approved_by: adminUserId, // Add when admin auth is implemented
      })
      .eq('id', photoId)
      .select()
      .single()

    if (error) {
      console.error('Error approving photo:', error)
      return NextResponse.json(
        { error: 'Failed to approve photo' },
        { status: 500 }
      )
    }

    // Log analytics event
    await supabaseAdmin
      .from('analytics_events')
      .insert({
        event_type: 'photo_approved',
        metadata: {
          photo_id: photoId,
          approved_at: new Date().toISOString()
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Photo approved successfully',
      data: photo
    })

  } catch (error) {
    console.error('Error in photo approve API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
