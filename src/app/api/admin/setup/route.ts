import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create admin users for Ashton and Cheyenne
    const adminUsers = [
      {
        email: 'ashton@example.com',
        first_name: 'Ashton',
        last_name: 'Smith',
        role: 'admin'
      },
      {
        email: 'cheyenne@example.com',
        first_name: 'Cheyenne',
        last_name: 'Smith',
        role: 'admin'
      }
    ]

    const results = []

    for (const admin of adminUsers) {
      try {
        const { data, error } = await supabaseAdmin
          .from('admin_users')
          .upsert(admin, { onConflict: 'email' })
          .select()
          .single()

        if (error) {
          results.push({ email: admin.email, success: false, error: error.message })
        } else {
          results.push({ email: admin.email, success: true, data })
        }
      } catch (error) {
        results.push({ 
          email: admin.email, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Admin setup completed',
      results
    })

  } catch (error) {
    console.error('Admin setup error:', error)
    return NextResponse.json(
      { error: 'Failed to set up admin users' },
      { status: 500 }
    )
  }
}
