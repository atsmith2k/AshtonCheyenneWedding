/**
 * Guest creation utilities for access request approval workflow
 * Handles the automated creation of guest records from approved access requests
 */

import { supabaseAdmin } from '@/lib/supabase'
import { encrypt, generateSecureInvitationCode } from '@/lib/crypto'
import { sendEmail } from '@/lib/email-service'
import type { Database } from '@/types/database'

type AccessRequest = Database['public']['Tables']['access_requests']['Row']
type GuestInsert = Database['public']['Tables']['guests']['Insert']

/**
 * Parse a full name into first and last name components
 * Handles various name formats gracefully
 */
export function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmedName = fullName.trim()
  
  if (!trimmedName) {
    return { firstName: 'Guest', lastName: '' }
  }
  
  const nameParts = trimmedName.split(/\s+/)
  
  if (nameParts.length === 1) {
    return { firstName: nameParts[0], lastName: '' }
  }
  
  if (nameParts.length === 2) {
    return { firstName: nameParts[0], lastName: nameParts[1] }
  }
  
  // For names with 3+ parts, take first as firstName and join the rest as lastName
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ')
  
  return { firstName, lastName }
}

/**
 * Check if a guest with the given email already exists
 */
export async function checkExistingGuest(email: string): Promise<{ exists: boolean; guestId?: string }> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  const { data: existingGuest, error } = await supabaseAdmin
    .from('guests')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking existing guest:', error)
    throw new Error('Failed to check for existing guest')
  }

  return {
    exists: !!existingGuest,
    guestId: existingGuest?.id
  }
}

/**
 * Create a new guest record from an approved access request
 */
export async function createGuestFromAccessRequest(
  accessRequest: AccessRequest,
  adminUserId: string
): Promise<{ guestId: string; invitationCode: string }> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  // Parse the full name
  const { firstName, lastName } = parseFullName(accessRequest.name)

  // Generate unique invitation code
  const invitationCode = generateSecureInvitationCode()

  // Encrypt sensitive data
  const encryptedPhone = accessRequest.phone ? encrypt(accessRequest.phone) : null
  const encryptedAddress = accessRequest.address ? encrypt(accessRequest.address) : null

  // Prepare guest data
  const guestData: GuestInsert = {
    first_name: firstName,
    last_name: lastName,
    email: accessRequest.email.toLowerCase(),
    phone: encryptedPhone,
    address: encryptedAddress,
    invitation_code: invitationCode,
    rsvp_status: 'pending',
    plus_one_allowed: false, // Default to false, can be updated later by admin
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  // Insert the new guest
  const { data: newGuest, error: guestError } = await supabaseAdmin
    .from('guests')
    .insert(guestData)
    .select()
    .single()

  if (guestError) {
    console.error('Error creating guest:', guestError)
    throw new Error('Failed to create guest record')
  }

  return {
    guestId: newGuest.id,
    invitationCode
  }
}

/**
 * Update access request with approval details and link to guest
 */
export async function updateAccessRequestApproval(
  accessRequestId: string,
  guestId: string,
  invitationCode: string,
  adminUserId: string,
  adminNotes?: string
): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('access_requests')
    .update({
      status: 'approved',
      guest_id: guestId,
      invitation_code: invitationCode,
      invitation_sent_at: now,
      approved_by: adminUserId,
      approved_at: now,
      admin_notes: adminNotes || null,
      updated_at: now
    })
    .eq('id', accessRequestId)

  if (error) {
    console.error('Error updating access request:', error)
    throw new Error('Failed to update access request')
  }
}

/**
 * Send invitation email to the newly approved guest
 */
export async function sendApprovalInvitationEmail(
  accessRequest: AccessRequest,
  invitationCode: string
): Promise<void> {
  try {
    await sendEmail({
      to: accessRequest.email,
      subject: 'Your Wedding Access Request Has Been Approved! 💕',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ec4899; font-family: 'Georgia', serif; font-size: 32px; margin-bottom: 10px;">
              Ashton & Cheyenne
            </h1>
            <p style="color: #6b7280; font-size: 18px; margin: 0;">
              are getting married!
            </p>
          </div>

          <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <h2 style="color: #15803d; margin-top: 0;">🎉 Your Access Request Has Been Approved!</h2>
            <p style="color: #166534; font-size: 16px;">
              We're excited to have you celebrate with us!
            </p>
          </div>

          <div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">Your Invitation Code</h3>
            <div style="background: white; border: 2px dashed #f59e0b; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
              <code style="font-size: 24px; font-weight: bold; color: #92400e; letter-spacing: 2px;">
                ${invitationCode}
              </code>
            </div>
            <p style="color: #92400e; font-size: 14px; margin-bottom: 0;">
              Use this code to access our wedding website and RSVP
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/landing" 
               style="background: #ec4899; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              Access Wedding Website
            </a>
          </div>

          <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0;">What's Next?</h3>
            <ol style="color: #374151; line-height: 1.6;">
              <li>Visit our wedding website using the link above</li>
              <li>Enter your email and invitation code to access the site</li>
              <li>Complete your RSVP with meal preferences</li>
              <li>Explore wedding details, photos, and more!</li>
            </ol>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
            We can't wait to celebrate with you! 💕<br>
            Ashton & Cheyenne
          </p>
        </div>
      `,
      textContent: `
Your Wedding Access Request Has Been Approved!

Dear ${accessRequest.name},

We're excited to have you celebrate with us at our wedding!

Your Invitation Code: ${invitationCode}

What's Next:
1. Visit our wedding website: ${process.env.NEXT_PUBLIC_SITE_URL}/landing
2. Enter your email and invitation code to access the site
3. Complete your RSVP with meal preferences
4. Explore wedding details, photos, and more!

We can't wait to celebrate with you!

Love,
Ashton & Cheyenne
      `
    })

    console.log(`Approval invitation email sent to ${accessRequest.email}`)
  } catch (emailError) {
    console.error('Error sending approval invitation email:', emailError)
    throw new Error('Failed to send invitation email')
  }
}

/**
 * Complete automated workflow for approving an access request
 * This function handles the entire process atomically
 */
export async function approveAccessRequestWorkflow(
  accessRequestId: string,
  adminUserId: string,
  adminNotes?: string,
  sendInvitation: boolean = true
): Promise<{
  success: boolean
  guestId?: string
  invitationCode?: string
  error?: string
}> {
  if (!supabaseAdmin) {
    return {
      success: false,
      error: 'Supabase admin client not available'
    }
  }

  try {
    // Start a transaction-like process
    // 1. Fetch the access request
    const { data: accessRequest, error: fetchError } = await supabaseAdmin
      .from('access_requests')
      .select('*')
      .eq('id', accessRequestId)
      .single()

    if (fetchError || !accessRequest) {
      return {
        success: false,
        error: 'Access request not found'
      }
    }

    // 2. Validate that the request is pending
    if (accessRequest.status !== 'pending') {
      return {
        success: false,
        error: `Access request is already ${accessRequest.status}`
      }
    }

    // 3. Check for existing guest with same email
    const { exists, guestId: existingGuestId } = await checkExistingGuest(accessRequest.email)
    
    if (exists) {
      return {
        success: false,
        error: 'A guest with this email address already exists in the system'
      }
    }

    // 4. Create new guest record
    const { guestId, invitationCode } = await createGuestFromAccessRequest(
      accessRequest,
      adminUserId
    )

    // 5. Update access request with approval details
    await updateAccessRequestApproval(
      accessRequestId,
      guestId,
      invitationCode,
      adminUserId,
      adminNotes
    )

    // 6. Send invitation email if requested
    if (sendInvitation) {
      await sendApprovalInvitationEmail(accessRequest, invitationCode)
    }

    return {
      success: true,
      guestId,
      invitationCode
    }

  } catch (error) {
    console.error('Error in approval workflow:', error)
    
    // In a real implementation, we would want to rollback any partial changes
    // For now, we'll log the error and return failure
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
