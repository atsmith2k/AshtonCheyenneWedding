import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Force dynamic rendering - this route handles authentication
export const dynamic = 'force-dynamic'

/**
 * Admin logout endpoint
 * Signs out the user and clears session cookies
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const cookieStore = await cookies()

    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser()

    // Sign out from Supabase
    if (user) {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase logout error:', error)
        // Continue with cookie cleanup even if Supabase logout fails
      }
    }

    // Clear authentication cookies
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')

    // Clear any other session-related cookies
    const allCookies = cookieStore.getAll()
    allCookies.forEach(cookie => {
      if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase')) {
        cookieStore.delete(cookie.name)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

  } catch (error) {
    console.error('Admin logout error:', error)
    
    // Even if there's an error, try to clear cookies
    const cookieStore = await cookies()
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')

    return NextResponse.json(
      { error: 'Logout completed with errors' },
      { status: 200 } // Still return 200 since logout should always succeed
    )
  }
}

/**
 * Handle GET requests for logout (for redirect-based logout)
 */
export async function GET(request: NextRequest) {
  // Redirect to POST for actual logout
  return NextResponse.redirect(new URL('/auth/admin-login', request.url))
}
