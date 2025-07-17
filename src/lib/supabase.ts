// Modern Supabase configuration using @supabase/ssr
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { logEnvironmentStatus, requireValidEnvironment } from './env-validation'

// Re-export browser client for client-side use
export { createClient as createBrowserClient } from './supabase/client'

// Server clients are exported separately to avoid importing next/headers in client components
// Import these directly from './supabase/server' in server components and API routes

// Log environment status in development
if (process.env.NODE_ENV === 'development') {
  logEnvironmentStatus()
}

// Validate environment variables
requireValidEnvironment()

// Environment variable validation with better error messages
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Legacy client-side Supabase client for backward compatibility
export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'wedding-admin-auth',
    flowType: 'pkce'
  }
})

// Legacy client component function for backward compatibility
export const createClientSupabaseClient = () => {
  // Validate environment variables are available on client-side
  if (typeof window !== 'undefined') {
    if (!supabaseUrl || !supabasePublishableKey) {
      console.error('Supabase environment variables not available on client-side:', {
        url: !!supabaseUrl,
        publishableKey: !!supabasePublishableKey
      })
      throw new Error('Supabase configuration error: Missing environment variables on client-side')
    }
  }

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'wedding-admin-auth',
      flowType: 'pkce'
    }
  })
}

// Admin Supabase client with service role key (server-side only)
if (!supabaseServiceKey && typeof window === 'undefined') {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin functions will not work.')
}

export const supabaseAdmin = supabaseServiceKey ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null

// Helper function to check if user is admin
export async function isAdmin(email: string): Promise<boolean> {
  const adminEmails = process.env.ADMIN_EMAIL?.split(',').map(email => email.trim()) || []
  return adminEmails.includes(email)
}

// Helper function to get admin client with validation (legacy - use createAdminClient from server.ts instead)
export function getAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Admin client not available. SUPABASE_SERVICE_ROLE_KEY is required for admin operations.')
  }
  return supabaseAdmin
}

// Helper function to generate invitation code
export function generateInvitationCode(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 16)
}

// Helper function to validate invitation code
export async function validateInvitationCode(code: string) {
  const { data, error } = await supabase
    .from('guests')
    .select('id, first_name, last_name, email, group_id')
    .eq('invitation_code', code)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

// Helper function to get guest by invitation code
export async function getGuestByInvitationCode(code: string) {
  const { data, error } = await supabase
    .from('guests')
    .select(`
      *,
      guest_groups (
        id,
        group_name,
        max_guests
      )
    `)
    .eq('invitation_code', code)
    .single()

  if (error) {
    console.error('Error fetching guest:', error)
    return null
  }

  return data
}

// Helper function to updat guest RSVP
export async function updateGuestRSVP(guestId: string, rsvpData: {
  rsvp_status: 'attending' | 'not_attending'
  meal_preference?: string
  dietary_restrictions?: string
  plus_one_name?: string
  plus_one_meal?: string
  notes?: string
}) {
  const { data, error } = await supabase
    .from('guests')
    .update({
      ...rsvpData,
      rsvp_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', guestId)
    .select()
    .single()

  if (error) {
    console.error('Error updating RSVP:', error)
    throw error
  }

  return data
}

// Helper function to get wedding information
export async function getWeddingInfo() {
  const { data, error } = await supabase
    .from('wedding_info')
    .select('*')
    .eq('published', true)
    .order('order_index')

  if (error) {
    console.error('Error fetching wedding info:', error)
    return []
  }

  return data
}

// Helper function to get wedding events
export async function getWeddingEvents() {
  const { data, error } = await supabase
    .from('wedding_events')
    .select('*')
    .eq('is_active', true)
    .order('date_time')

  if (error) {
    console.error('Error fetching wedding events:', error)
    return []
  }

  return data
}

// Helper function to submit guest message
export async function submitGuestMessage(guestId: string, messageData: {
  subject: string
  message: string
  is_urgent?: boolean
}) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      guest_id: guestId,
      ...messageData,
      status: 'new',
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error submitting message:', error)
    throw error
  }

  return data
}

// Helper function to get approved photos
export async function getApprovedPhotos(albumId?: string) {
  let query = supabase
    .from('photos')
    .select(`
      *,
      photo_albums (
        id,
        name,
        description
      )
    `)
    .eq('approved', true)
    .order('created_at', { ascending: false })

  if (albumId) {
    query = query.eq('album_id', albumId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching photos:', error)
    return []
  }

  return data
}

// Helper function to upload photo
export async function uploadPhoto(file: File, guestId?: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `photos/${fileName}`

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('wedding-photos')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    throw uploadError
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('wedding-photos')
    .getPublicUrl(filePath)

  // Save photo record to database
  const { data, error } = await supabase
    .from('photos')
    .insert({
      file_path: filePath,
      original_filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by_guest_id: guestId,
      approved: false, // Requires admin approval
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving photo record:', error)
    throw error
  }

  return { ...data, url: publicUrl }
}
