import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendBulkEmails } from '@/lib/email-service'
import { z } from 'zod'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

const sendCampaignSchema = z.object({
  campaign_id: z.string().uuid('Invalid campaign ID')
})

/**
 * POST /api/admin/email-campaigns/send
 * Send an email campaign to recipients
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
    const { campaign_id } = sendCampaignSchema.parse(body)

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select(`
        *,
        email_templates (
          id,
          template_type,
          subject,
          html_content,
          text_content
        )
      `)
      .eq('id', campaign_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    if (campaign.status === 'sent' || campaign.status === 'completed') {
      return NextResponse.json(
        { error: 'Campaign has already been sent' },
        { status: 400 }
      )
    }

    if (campaign.status === 'sending') {
      return NextResponse.json(
        { error: 'Campaign is currently being sent' },
        { status: 400 }
      )
    }

    // Update campaign status to sending
    await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: 'sending',
        sent_at: new Date().toISOString()
      })
      .eq('id', campaign_id)

    // Get recipients
    const { data: guests, error: guestsError } = await supabaseAdmin
      .from('guests')
      .select('id, email, first_name, last_name')
      .not('email', 'is', null)

    if (guestsError) {
      console.error('Error fetching recipients:', guestsError)
      
      // Update campaign status to failed
      await supabaseAdmin
        .from('email_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaign_id)

      return NextResponse.json(
        { error: 'Failed to fetch recipients' },
        { status: 500 }
      )
    }

    const recipients = guests || []

    if (recipients.length === 0) {
      // Update campaign status to completed (no recipients)
      await supabaseAdmin
        .from('email_campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          sent_count: 0,
          delivered_count: 0
        })
        .eq('id', campaign_id)

      return NextResponse.json({
        success: true,
        message: 'Campaign completed - no recipients found',
        sent_count: 0,
        failed_count: 0
      })
    }

    // Prepare recipients for bulk sending
    const emailRecipients = recipients.map(guest => ({
      email: guest.email,
      guestId: guest.id,
      variables: {
        guest_first_name: guest.first_name,
        guest_last_name: guest.last_name,
        guest_full_name: `${guest.first_name} ${guest.last_name}`
      }
    }))

    // Send emails in batches to avoid overwhelming the system
    const batchSize = 10
    let totalSent = 0
    let totalFailed = 0

    for (let i = 0; i < emailRecipients.length; i += batchSize) {
      const batch = emailRecipients.slice(i, i + batchSize)
      
      try {
        const results = await sendBulkEmails(batch, {
          templateId: campaign.template_id,
          subject: campaign.subject,
          campaignId: campaign_id
        })

        // Count successes and failures
        const batchSent = results.filter(r => r.success).length
        const batchFailed = results.filter(r => !r.success).length

        totalSent += batchSent
        totalFailed += batchFailed

        // Update campaign progress
        await supabaseAdmin
          .from('email_campaigns')
          .update({
            sent_count: totalSent,
            delivered_count: totalSent // Will be updated by webhooks later
          })
          .eq('id', campaign_id)

        // Add delay between batches
        if (i + batchSize < emailRecipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

      } catch (batchError) {
        console.error('Error sending email batch:', batchError)
        totalFailed += batch.length
      }
    }

    // Update final campaign status
    const finalStatus = totalFailed === 0 ? 'completed' : 'sent'
    await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: finalStatus,
        sent_count: totalSent,
        delivered_count: totalSent,
        completed_at: new Date().toISOString()
      })
      .eq('id', campaign_id)

    return NextResponse.json({
      success: true,
      message: `Campaign sent successfully. ${totalSent} emails sent, ${totalFailed} failed.`,
      sent_count: totalSent,
      failed_count: totalFailed,
      total_recipients: recipients.length
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/admin/email-campaigns/send:', error)
    
    // Try to update campaign status to failed if we have the campaign_id
    try {
      const body = await request.json()
      const { campaign_id } = body
      if (campaign_id && supabaseAdmin) {
        await supabaseAdmin
          .from('email_campaigns')
          .update({ status: 'failed' })
          .eq('id', campaign_id)
      }
    } catch (updateError) {
      console.error('Failed to update campaign status:', updateError)
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
