import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { accessRequestUpdateSchema } from '@/lib/validation'
import { decrypt, generateSecureInvitationCode } from '@/lib/crypto'
import { sendEmail } from '@/lib/email-service'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/access-requests/[id]
 * Get a specific access request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdmin()

    const { data: accessRequest, error } = await supabaseAdmin
      .from('access_requests')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !accessRequest) {
      return NextResponse.json(
        { error: 'Access request not found' },
        { status: 404 }
      )
    }

    // Decrypt sensitive data for admin view
    const decryptedRequest = {
      ...accessRequest,
      phone: decrypt(accessRequest.phone),
      address: decrypt(accessRequest.address)
    }

    return NextResponse.json(decryptedRequest)

  } catch (error) {
    console.error('Error fetching access request:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/access-requests/[id]
 * Update an access request (approve/deny)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdmin()

    const body = await request.json()
    const validatedData = accessRequestUpdateSchema.parse(body)

    // Fetch the current request
    const { data: currentRequest, error: fetchError } = await supabaseAdmin
      .from('access_requests')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !currentRequest) {
      return NextResponse.json(
        { error: 'Access request not found' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    const updateData: any = {
      status: validatedData.status,
      updated_at: now,
      admin_notes: validatedData.admin_notes || null
    }

    // If approving, set approval fields
    if (validatedData.status === 'approved') {
      updateData.approved_by = adminUser.id
      updateData.approved_at = now

      // Generate invitation code if sending invitation
      if (validatedData.send_invitation) {
        const invitationCode = generateSecureInvitationCode()
        updateData.invitation_code = invitationCode
        updateData.invitation_sent_at = now
      }
    }

    // Update the access request
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('access_requests')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating access request:', updateError)
      return NextResponse.json(
        { error: 'Failed to update access request' },
        { status: 500 }
      )
    }

    // Send invitation email if approved and requested
    if (validatedData.status === 'approved' && validatedData.send_invitation && updateData.invitation_code) {
      try {
        const decryptedRequest = {
          ...updatedRequest,
          phone: decrypt(updatedRequest.phone),
          address: decrypt(updatedRequest.address)
        }

        await sendEmail({
          to: decryptedRequest.email,
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
                    ${updateData.invitation_code}
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

Dear ${decryptedRequest.name},

We're excited to have you celebrate with us at our wedding!

Your Invitation Code: ${updateData.invitation_code}

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

        console.log(`Invitation email sent to ${decryptedRequest.email}`)
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError)
        // Don't fail the request if email fails, but log it
      }
    }

    // Return the updated request with decrypted data for admin view
    const responseData = {
      ...updatedRequest,
      phone: decrypt(updatedRequest.phone),
      address: decrypt(updatedRequest.address)
    }

    return NextResponse.json({
      success: true,
      request: responseData,
      invitation_sent: validatedData.status === 'approved' && validatedData.send_invitation
    })

  } catch (error) {
    console.error('Error updating access request:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/access-requests/[id]
 * Delete an access request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdmin()

    const { error } = await supabaseAdmin
      .from('access_requests')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting access request:', error)
      return NextResponse.json(
        { error: 'Failed to delete access request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Access request deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting access request:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
