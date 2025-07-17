import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - this route uses database queries
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Fetch approved photos
    const { data: photos, error } = await supabaseAdmin
      .from('photos')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching photos:', error)
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: photos || []
    })

  } catch (error) {
    console.error('Error in photos API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
