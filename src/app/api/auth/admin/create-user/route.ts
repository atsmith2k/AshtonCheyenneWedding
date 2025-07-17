import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'

// Force dynamic rendering - this route handles authentication
export const dynamic = 'force-dynamic'

/**
 * Create a new admin user
 * Only accessible by existing super admins
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const currentAdmin = await requireAdmin()
    
    // Only super admins can create new admin users
    if (currentAdmin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient privileges. Super admin access required.' },
        { status: 403 }
      )
    }

    const supabaseAdmin = createAdminClient()

    const { email, password, firstName, lastName, role = 'admin' } = await request.json()

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or super_admin' },
        { status: 400 }
      )
    }

    // Check if user already exists in Supabase Auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUsers.users.some(user => user.email === email.toLowerCase())

    if (userExists) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm email for admin users
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role,
        created_by: currentAdmin.id
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create admin user record in database
    const { data: adminUser, error: dbError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        id: authUser.user.id,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        role: role,
        is_active: true
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error creating admin user record:', dbError)
      
      // Clean up auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      
      return NextResponse.json(
        { error: 'Failed to create admin user record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.first_name,
        lastName: adminUser.last_name,
        role: adminUser.role,
        isActive: adminUser.is_active,
        createdAt: adminUser.created_at
      }
    })

  } catch (error) {
    console.error('Create admin user error:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
