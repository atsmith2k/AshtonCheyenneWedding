import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { isValidAdminEmail } from '@/lib/admin-auth'
import { cookies } from 'next/headers'

// Force dynamic rendering - this route handles authentication
export const dynamic = 'force-dynamic'

/**
 * Admin session refresh endpoint
 * Refreshes the authentication session and updates cookies
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const cookieStore = cookies()

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    // Verify user is still an admin
    if (!isValidAdminEmail(session.user.email || '')) {
      // Sign out if no longer admin
      await supabase.auth.signOut()
      cookieStore.delete('sb-access-token')
      cookieStore.delete('sb-refresh-token')
      
      return NextResponse.json(
        { error: 'Admin privileges revoked' },
        { status: 403 }
      )
    }

    // Refresh the session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      console.error('Session refresh error:', refreshError)
      return NextResponse.json(
        { error: 'Failed to refresh session' },
        { status: 401 }
      )
    }

    if (!refreshData.session) {
      return NextResponse.json(
        { error: 'Failed to create new session' },
        { status: 401 }
      )
    }

    // Update cookies with new tokens
    cookieStore.set('sb-access-token', refreshData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshData.session.expires_in,
      path: '/'
    })

    if (refreshData.session.refresh_token) {
      cookieStore.set('sb-refresh-token', refreshData.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })
    }

    // Get admin user data
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', refreshData.session.user.email)
      .single()

    return NextResponse.json({
      success: true,
      message: 'Session refreshed successfully',
      user: {
        id: refreshData.session.user.id,
        email: refreshData.session.user.email,
        firstName: adminUser?.first_name || refreshData.session.user.user_metadata?.first_name,
        lastName: adminUser?.last_name || refreshData.session.user.user_metadata?.last_name,
        role: adminUser?.role || 'admin'
      },
      expiresAt: new Date(Date.now() + refreshData.session.expires_in * 1000).toISOString()
    })

  } catch (error) {
    console.error('Session refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
