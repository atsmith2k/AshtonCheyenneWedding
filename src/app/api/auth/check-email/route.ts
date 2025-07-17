import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - this route uses database queries
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Check if email exists in guest list
    const { data: guest, error } = await supabaseAdmin
      .from('guests')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !guest) {
      return NextResponse.json(
        { exists: false },
        { status: 200 }
      )
    }

    return NextResponse.json({
      exists: true
    })

  } catch (error) {
    console.error('Error checking email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
