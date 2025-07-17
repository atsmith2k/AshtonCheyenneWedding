import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isValidAdminEmail } from '@/lib/admin-auth'
import { mapSupabaseAuthError, createAuthError, AUTH_ERROR_CODES } from '@/lib/auth-errors'
import { cookies } from 'next/headers'

// Force dynamic rendering - this route handles authentication
export const dynamic = 'force-dynamic'

/**
 * Admin login endpoint using Supabase Auth
 * Validates admin email and creates authenticated session
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email is in admin list before attempting authentication
    if (!isValidAdminEmail(email)) {
      const error = createAuthError(AUTH_ERROR_CODES.ADMIN_ACCESS_REQUIRED)
      return NextResponse.json(
        { error: error.userMessage },
        { status: error.statusCode }
      )
    }

    // Create Supabase client for authentication
    const supabase = createServerSupabaseClient()

    // Attempt to sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    })

    if (authError) {
      console.error('Admin login error:', authError)

      // Map Supabase error to standardized error
      const mappedError = mapSupabaseAuthError(authError)
      return NextResponse.json(
        { error: mappedError.userMessage },
        { status: mappedError.statusCode }
      )
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: 'Authentication failed. No session created.' },
        { status: 401 }
      )
    }

    // Double-check admin status after successful authentication
    if (!isValidAdminEmail(authData.user.email || '')) {
      // Sign out the user if they're not an admin
      await supabase.auth.signOut()
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    // Get or create admin user record in database
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', authData.user.email)
      .single()

    if (adminError && adminError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching admin user:', adminError)
    }

    // Create admin user record if it doesn't exist
    if (!adminUser) {
      const { data: newAdminUser, error: createError } = await supabase
        .from('admin_users')
        .insert({
          email: authData.user.email!,
          first_name: authData.user.user_metadata?.first_name || 'Admin',
          last_name: authData.user.user_metadata?.last_name || 'User',
          role: 'admin'
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating admin user record:', createError)
      }
    }

    // Set secure session cookies
    const cookieStore = cookies()
    
    // Set access token cookie
    cookieStore.set('sb-access-token', authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: authData.session.expires_in,
      path: '/'
    })

    // Set refresh token cookie
    cookieStore.set('sb-refresh-token', authData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName: adminUser?.first_name || authData.user.user_metadata?.first_name,
        lastName: adminUser?.last_name || authData.user.user_metadata?.last_name,
        role: adminUser?.role || 'admin'
      }
    })

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}
