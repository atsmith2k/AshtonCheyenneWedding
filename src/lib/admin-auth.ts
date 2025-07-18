import { cookies } from 'next/headers'
import { createClient as createServerClient } from './supabase/server'
import { NextRequest } from 'next/server'

/**
 * Server-side admin authentication utility
 * Replaces client-side NEXT_PUBLIC_ADMIN_EMAIL exposure
 */

export interface AdminUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'admin' | 'super_admin'
}

/**
 * Check if the current user is an admin (server-side only)
 * Uses server-side environment variable ADMIN_EMAIL
 */
export async function isAdminUser(): Promise<boolean> {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user?.email) {
      return false
    }

    // Get admin emails from server-side environment variable only
    const adminEmails = process.env.ADMIN_EMAIL?.split(',').map(email => email.trim().toLowerCase()) || []
    const userEmail = user.email.toLowerCase()

    return adminEmails.includes(userEmail)
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Get current admin user information (server-side only)
 */
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user?.email) {
      return null
    }

    const isAdmin = await isAdminUser()
    if (!isAdmin) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      role: 'admin' // Default role, can be enhanced later
    }
  } catch (error) {
    console.error('Error getting admin user:', error)
    return null
  }
}

/**
 * Require admin authentication - throws error if not admin
 * Use this in API routes to protect admin endpoints
 */
export async function requireAdmin(): Promise<AdminUser> {
  const adminUser = await getCurrentAdminUser()
  
  if (!adminUser) {
    throw new Error('Unauthorized: Admin access required')
  }
  
  return adminUser
}

/**
 * Check admin status from request headers (for API routes)
 * Alternative method when cookies aren't available
 */
export async function isAdminFromRequest(request: NextRequest): Promise<boolean> {
  try {
    // For now, we'll use the same cookie-based approach
    // This can be enhanced with JWT tokens later
    return await isAdminUser()
  } catch (error) {
    console.error('Error checking admin from request:', error)
    return false
  }
}

/**
 * Require admin authentication from request
 * Use this in API route handlers
 */
export async function requireAdminFromRequest(request: NextRequest): Promise<AdminUser> {
  const isAdmin = await isAdminFromRequest(request)
  
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }
  
  // Get the admin user details
  const adminUser = await getCurrentAdminUser()
  if (!adminUser) {
    throw new Error('Unauthorized: Admin user not found')
  }
  
  return adminUser
}

/**
 * Validate admin email against server-side list
 * Used for login validation
 */
export function isValidAdminEmail(email: string): boolean {
  try {
    const adminEmails = process.env.ADMIN_EMAIL?.split(',').map(e => e.trim().toLowerCase()) || []
    return adminEmails.includes(email.toLowerCase())
  } catch (error) {
    console.error('Error validating admin email:', error)
    return false
  }
}

/**
 * Get list of admin emails (server-side only)
 * For internal use only - never expose to client
 */
export function getAdminEmails(): string[] {
  try {
    return process.env.ADMIN_EMAIL?.split(',').map(email => email.trim()) || []
  } catch (error) {
    console.error('Error getting admin emails:', error)
    return []
  }
}

/**
 * Log admin actions for audit trail
 */
export async function logAdminAction(action: string, details?: any): Promise<void> {
  try {
    const adminUser = await getCurrentAdminUser()
    if (!adminUser) return

    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action,
      details: details || {},
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      ipAddress: 'Unknown' // Could be enhanced to capture real IP
    }

    // Console logging for immediate debugging
    console.log(`[ADMIN ACTION] ${timestamp} - ${adminUser.email}: ${action}`, details || '')

    // Enhanced logging with structured data
    console.log('[AUDIT TRAIL]', JSON.stringify(logEntry, null, 2))

    // TODO: Store in database audit_logs table
    // This would require creating an audit_logs table and API endpoint
    // For now, we're using enhanced console logging with structured data

  } catch (error) {
    console.error('Error logging admin action:', error)
  }
}
