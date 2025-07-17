import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase'
import { sendBulkEmails } from '@/lib/email-service'
import { z } from 'zod'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

// Validation schema for email campaigns
const emailCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  template_id: z.string().uuid('Invalid template ID'),
  subject: z.string().min(1, 'Subject is required'),
  recipient_filter: z.object({
    rsvp_status: z.array(z.enum(['pending', 'attending', 'not_attending'])).optional(),
    group_ids: z.array(z.string().uuid()).optional(),
    guest_ids: z.array(z.string().uuid()).optional(),
    has_email: z.boolean().optional().default(true)
  }).optional(),
  scheduled_at: z.string().datetime().optional()
})

const sendCampaignSchema = z.object({
  campaign_id: z.string().uuid('Invalid campaign ID')
})

/**
 * GET /api/admin/email-campaigns
 * Retrieve all email campaigns
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    await requireAdmin()

    // Get all email campaigns with template information
    const { data: campaigns, error } = await supabaseAdmin
      .from('email_campaigns')
      .select(`
        *,
        email_templates (
          template_type,
          subject
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching email campaigns:', error)
      return NextResponse.json(
        { error: 'Failed to fetch email campaigns' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaigns: campaigns || []
    })

  } catch (error) {
    console.error('Error in GET /api/admin/email-campaigns:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/email-campaigns
 * Create a new email campaign
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
    const validatedData = emailCampaignSchema.parse(body)

    // Verify template exists
    const { data: template, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('id', validatedData.template_id)
      .single()

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      )
    }

    if (!template.is_active) {
      return NextResponse.json(
        { error: 'Email template is not active' },
        { status: 400 }
      )
    }

    // Count potential recipients based on filter
    let recipientQuery = supabaseAdmin
      .from('guests')
      .select('id, email', { count: 'exact' })
      .not('email', 'is', null)

    if (validatedData.recipient_filter) {
      const filter = validatedData.recipient_filter

      if (filter.rsvp_status && filter.rsvp_status.length > 0) {
        recipientQuery = recipientQuery.in('rsvp_status', filter.rsvp_status)
      }

      if (filter.group_ids && filter.group_ids.length > 0) {
        recipientQuery = recipientQuery.in('group_id', filter.group_ids)
      }

      if (filter.guest_ids && filter.guest_ids.length > 0) {
        recipientQuery = recipientQuery.in('id', filter.guest_ids)
      }
    }

    const { count: recipientCount, error: countError } = await recipientQuery

    if (countError) {
      console.error('Error counting recipients:', countError)
      return NextResponse.json(
        { error: 'Failed to count recipients' },
        { status: 500 }
      )
    }

    // Create new email campaign
    const { data: campaign, error } = await supabaseAdmin
      .from('email_campaigns')
      .insert({
        name: validatedData.name,
        template_id: validatedData.template_id,
        subject: validatedData.subject,
        recipient_count: recipientCount || 0,
        status: validatedData.scheduled_at ? 'scheduled' : 'draft',
        scheduled_at: validatedData.scheduled_at || null,
        created_by: adminUser.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating email campaign:', error)
      return NextResponse.json(
        { error: 'Failed to create email campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign,
      message: 'Email campaign created successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/admin/email-campaigns:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get campaign recipients
 */
async function getCampaignRecipients(campaignId: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  // Get campaign details
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    throw new Error('Campaign not found')
  }

  // Get recipients based on campaign filter
  // For now, we'll get all guests with emails
  // This can be enhanced to support the recipient_filter from the campaign
  const { data: guests, error: guestsError } = await supabaseAdmin
    .from('guests')
    .select('id, email, first_name, last_name')
    .not('email', 'is', null)

  if (guestsError) {
    throw new Error('Failed to fetch recipients')
  }

  return {
    campaign,
    recipients: guests || []
  }
}
