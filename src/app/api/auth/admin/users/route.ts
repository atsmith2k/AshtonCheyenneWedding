import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin-auth'

// Force dynamic rendering - this route handles authentication
export const dynamic = 'force-dynamic'

/**
 * List all admin users
 * Only accessible by admins
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin()

    const supabaseAdmin = createAdminClient()

    // Get all admin users
    const { data: adminUsers, error } = await supabaseAdmin
      .from('admin_users')
      .select('id, email, first_name, last_name, role, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admin users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch admin users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: adminUsers.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at
      }))
    })

  } catch (error) {
    console.error('List admin users error:', error)
    
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

/**
 * Update admin user status
 * Only accessible by super admins
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require admin authentication
    const currentAdmin = await requireAdmin()
    
    // Only super admins can modify other admin users
    if (currentAdmin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Insufficient privileges. Super admin access required.' },
        { status: 403 }
      )
    }

    const supabaseAdmin = createAdminClient()

    const { userId, isActive, role } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Prevent self-modification
    if (userId === currentAdmin.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own account' },
        { status: 400 }
      )
    }

    // Validate role if provided
    if (role && !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or super_admin' },
        { status: 400 }
      )
    }

    // Build update object
    const updates: any = {}
    if (typeof isActive === 'boolean') {
      updates.is_active = isActive
    }
    if (role) {
      updates.role = role
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      )
    }

    // Update admin user
    const { data: updatedUser, error } = await supabaseAdmin
      .from('admin_users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating admin user:', error)
      return NextResponse.json(
        { error: 'Failed to update admin user' },
        { status: 500 }
      )
    }

    // If deactivating user, also disable their auth account
    if (isActive === false) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: 'none', // Indefinite ban
        user_metadata: { ...updatedUser, is_active: false }
      })
    } else if (isActive === true) {
      // Reactivate auth account
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        ban_duration: '0s', // Remove ban
        user_metadata: { ...updatedUser, is_active: true }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        createdAt: updatedUser.created_at
      }
    })

  } catch (error) {
    console.error('Update admin user error:', error)
    
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
