import { NextRequest, NextResponse } from 'next/server'
import { isAdminUser, getCurrentAdminUser } from '@/lib/admin-auth'

// Force dynamic rendering - this route uses cookies
export const dynamic = 'force-dynamic'

/**
 * Check if current user is admin (server-side only)
 * Used by client components to securely check admin status
 */
export async function GET(request: NextRequest) {
  try {
    const userIsAdmin = await isAdminUser()
    const adminUser = userIsAdmin ? await getCurrentAdminUser() : null
    
    return NextResponse.json({
      success: true,
      isAdmin: userIsAdmin,
      user: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role
      } : null
    })
  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json(
      { 
        success: false, 
        isAdmin: false,
        error: 'Failed to check admin status' 
      },
      { status: 500 }
    )
  }
}
