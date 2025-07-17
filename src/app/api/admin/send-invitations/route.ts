import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail, EmailTemplateVariables } from '@/lib/email-service'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

// Validation schema for sending invitations
const sendInvitationsSchema = z.object({
  guest_ids: z.array(z.string().uuid()).min(1, 'At least one guest ID is required'),
  template_id: z.string().uuid().optional(), // Optional custom template
  custom_message: z.string().optional(), // Optional custom message to append
  send_immediately: z.boolean().default(true)
})

/**
 * POST /api/admin/send-invitations
 * Send invitation emails to specified guests
 */
export async function POST(request: NextRequest) {
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
    const validatedData = sendInvitationsSchema.parse(body)

    // Get guest details for the specified IDs
    const { data: guests, error: guestsError } = await supabaseAdmin
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        email,
        invitation_code,
        group_id,
        invitation_sent_at,
        guest_groups (
          group_name
        )
      `)
      .in('id', validatedData.guest_ids)

    if (guestsError) {
      console.error('Error fetching guests:', guestsError)
      return NextResponse.json(
        { error: 'Failed to fetch guest details' },
        { status: 500 }
      )
    }

    if (!guests || guests.length === 0) {
      return NextResponse.json(
        { error: 'No guests found with the provided IDs' },
        { status: 404 }
      )
    }

    // Filter guests who have email addresses
    const guestsWithEmail = guests.filter(guest => guest.email)
    const guestsWithoutEmail = guests.filter(guest => !guest.email)

    if (guestsWithEmail.length === 0) {
      return NextResponse.json(
        { error: 'None of the selected guests have email addresses' },
        { status: 400 }
      )
    }

    // Get the invitation template (use custom template if provided, otherwise get default)
    let template
    if (validatedData.template_id) {
      const { data: customTemplate, error: templateError } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('id', validatedData.template_id)
        .single()

      if (templateError || !customTemplate) {
        return NextResponse.json(
          { error: 'Custom template not found' },
          { status: 404 }
        )
      }
      template = customTemplate
    } else {
      // Get default invitation template
      const { data: defaultTemplate, error: templateError } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('template_type', 'invitation')
        .single()

      if (templateError || !defaultTemplate) {
        return NextResponse.json(
          { error: 'Default invitation template not found. Please create an invitation template first.' },
          { status: 404 }
        )
      }
      template = defaultTemplate
    }

    // Get wedding info for template variables
    const { data: weddingInfo } = await supabaseAdmin
      .from('wedding_info')
      .select('*')
      .single()

    const baseVariables: EmailTemplateVariables = {
      wedding_date: weddingInfo?.wedding_date || 'TBD',
      wedding_time: weddingInfo?.ceremony_time || 'TBD',
      wedding_venue: weddingInfo?.venue_name || 'TBD',
      wedding_address: weddingInfo?.venue_address || 'TBD',
      rsvp_deadline: weddingInfo?.rsvp_deadline || 'TBD',
      website_url: process.env.NEXT_PUBLIC_APP_URL || 'https://ashtonandcheyenne.com',
      couple_names: 'Ashton & Cheyenne'
    }

    const results = []
    const errors = []

    // Send emails to each guest with enhanced error handling
    const emailPromises = guestsWithEmail.map(async (guest) => {
      const guestName = `${guest.first_name} ${guest.last_name}`

      try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(guest.email!)) {
          throw new Error('Invalid email format')
        }

        // Prepare template variables for this guest
        const guestVariables: EmailTemplateVariables = {
          ...baseVariables,
          guest_first_name: guest.first_name,
          guest_last_name: guest.last_name,
          guest_full_name: guestName,
          invitation_code: guest.invitation_code,
          group_name: (guest.guest_groups as any)?.group_name || 'Individual Guest'
        }

        // Add custom message if provided
        let emailContent = template.html_content
        if (validatedData.custom_message) {
          const customMessageHtml = `
            <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #ec4899; border-radius: 4px;">
              <p style="margin: 0; font-style: italic; color: #374151;">${validatedData.custom_message.replace(/\n/g, '<br>')}</p>
            </div>`

          // Insert before closing div
          emailContent = emailContent.replace(
            '</div>\s*$',
            `${customMessageHtml}</div>`
          )
        }

        // Send the email with timeout and retry logic
        const emailResult = await Promise.race([
          sendEmail({
            to: guest.email!,
            subject: template.subject,
            htmlContent: emailContent,
            textContent: template.text_content,
            variables: guestVariables
          }),
          new Promise<{ success: false; error: string }>((_, reject) =>
            setTimeout(() => reject(new Error('Email send timeout (30s)')), 30000)
          )
        ])

        if (emailResult.success) {
          // Update guest record with invitation sent timestamp
          const { error: updateError } = await supabaseAdmin!
            .from('guests')
            .update({
              invitation_sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', guest.id)

          if (updateError) {
            console.error(`Failed to update guest ${guest.id} invitation timestamp:`, updateError)
            // Still consider the email sent since the email was successful
          }

          return {
            guest_id: guest.id,
            guest_name: guestName,
            email: guest.email,
            status: 'sent',
            message_id: emailResult.messageId,
            sent_at: new Date().toISOString()
          }
        } else {
          throw new Error(emailResult.error || 'Email send failed')
        }
      } catch (error) {
        console.error(`Error sending invitation to ${guest.email}:`, error)

        // Categorize errors for better reporting
        let errorCategory = 'unknown'
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        if (errorMessage.includes('timeout')) {
          errorCategory = 'timeout'
        } else if (errorMessage.includes('Invalid email')) {
          errorCategory = 'invalid_email'
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          errorCategory = 'rate_limit'
        } else if (errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
          errorCategory = 'network'
        } else if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
          errorCategory = 'auth'
        }

        return {
          guest_id: guest.id,
          guest_name: guestName,
          email: guest.email,
          status: 'failed',
          error: errorMessage,
          error_category: errorCategory,
          failed_at: new Date().toISOString()
        }
      }
    })

    // Execute all email sends with controlled concurrency
    const batchSize = 5 // Send max 5 emails concurrently to avoid rate limits
    const allResults = []

    for (let i = 0; i < emailPromises.length; i += batchSize) {
      const batch = emailPromises.slice(i, i + batchSize)
      const batchResults = await Promise.all(batch)
      allResults.push(...batchResults)

      // Add small delay between batches to be respectful to email service
      if (i + batchSize < emailPromises.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Separate successful sends from errors
    const successfulSends = allResults.filter(result => result.status === 'sent')
    const failedSends = allResults.filter(result => result.status === 'failed')

    // Update results and errors arrays
    results.push(...successfulSends)
    errors.push(...failedSends)

    // Log admin action
    console.log(`Admin ${adminUser.email} sent invitations to ${results.length} guests`)

    return NextResponse.json({
      success: true,
      message: `Invitations sent successfully to ${results.length} guest${results.length !== 1 ? 's' : ''}`,
      data: {
        sent: results,
        errors: errors,
        guests_without_email: guestsWithoutEmail.map(g => ({
          guest_id: g.id,
          guest_name: `${g.first_name} ${g.last_name}`
        })),
        summary: {
          total_requested: validatedData.guest_ids.length,
          sent_successfully: results.length,
          failed: errors.length,
          no_email: guestsWithoutEmail.length
        }
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error sending invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
