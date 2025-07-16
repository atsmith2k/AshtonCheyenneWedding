import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client - moved to separate server file to avoid client-side import issues

// Client component Supabase client
export const createClientSupabaseClient = () => {
  return createClientComponentClient<Database>()
}

// Admin Supabase client with service role key (server-side only)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to check if user is admin
export async function isAdmin(email: string): Promise<boolean> {
  const adminEmails = process.env.ADMIN_EMAIL?.split(',').map(email => email.trim()) || []
  return adminEmails.includes(email)
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

// Helper function to update guest RSVP
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
  const { data: uploadData, error: uploadError } = await supabase.storage
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
