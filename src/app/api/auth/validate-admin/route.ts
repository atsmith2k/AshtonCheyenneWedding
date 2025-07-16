import { NextRequest, NextResponse } from 'next/server'
import { isValidAdminEmail } from '@/lib/admin-auth'

/**
 * Validate if an email is in the admin list (server-side only)
 * Used during login process to check admin privileges
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
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
    
    // Check if email is in admin list (server-side only)
    const isAdmin = isValidAdminEmail(email)
    
    return NextResponse.json({
      success: true,
      isAdmin,
      message: isAdmin ? 'Admin email validated' : 'Email not in admin list'
    })
    
  } catch (error) {
    console.error('Error validating admin email:', error)
    return NextResponse.json(
      { 
        success: false, 
        isAdmin: false,
        error: 'Failed to validate admin email' 
      },
      { status: 500 }
    )
  }
}
