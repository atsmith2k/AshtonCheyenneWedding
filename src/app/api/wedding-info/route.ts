import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get published wedding information
    const { data: weddingInfo, error } = await supabaseAdmin
      .from('wedding_info')
      .select('*')
      .eq('published', true)
      .order('order_index')

    if (error) {
      console.error('Error fetching wedding info:', error)
      return NextResponse.json(
        { error: 'Failed to fetch wedding information' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: weddingInfo
    })

  } catch (error) {
    console.error('Error in wedding info API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (this should be enhanced with proper auth)
    const { section, title, content, orderIndex, published } = await request.json()

    if (!section || !title || !content) {
      return NextResponse.json(
        { error: 'Section, title, and content are required' },
        { status: 400 }
      )
    }

    // Insert or update wedding info
    const { data, error } = await supabaseAdmin
      .from('wedding_info')
      .upsert({
        section,
        title,
        content,
        order_index: orderIndex || 0,
        published: published !== false,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'section'
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating wedding info:', error)
      return NextResponse.json(
        { error: 'Failed to update wedding information' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Error in wedding info POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
