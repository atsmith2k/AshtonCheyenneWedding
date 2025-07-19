import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'

// Initialize Resend client (lazy initialization)
let resend: Resend | null = null

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resend = new Resend(apiKey)
  }
  return resend
}

// Email template variables that can be used in templates
export interface EmailTemplateVariables {
  guest_first_name?: string
  guest_last_name?: string
  guest_full_name?: string
  invitation_code?: string
  wedding_date?: string
  wedding_time?: string
  wedding_venue?: string
  wedding_address?: string
  rsvp_deadline?: string
  website_url?: string
  couple_names?: string
  [key: string]: string | undefined
}

// Email sending options
export interface SendEmailOptions {
  to: string
  templateId?: string
  templateType?: string
  subject?: string
  htmlContent?: string
  textContent?: string
  variables?: EmailTemplateVariables
  guestId?: string
  campaignId?: string
  trackingId?: string
}

// Email sending result
export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
  trackingId?: string
}

/**
 * Replace template variables in content
 */
function replaceTemplateVariables(content: string, variables: EmailTemplateVariables): string {
  let processedContent = content

  // Replace all variables in the format {{variable_name}}
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      processedContent = processedContent.replace(regex, value)
    }
  })

  // Remove any unreplaced variables
  processedContent = processedContent.replace(/{{[^}]+}}/g, '')

  return processedContent
}

/**
 * Get default template variables for the wedding
 */
function getDefaultVariables(): EmailTemplateVariables {
  return {
    couple_names: 'Ashton & Cheyenne',
    wedding_date: 'September 12, 2026',
    wedding_venue: 'The Otisco Disco',
    website_url: process.env.NEXT_PUBLIC_APP_URL || 'https://ashtonandcheyenne.com',
    rsvp_deadline: 'September 1, 2026'
  }
}

/**
 * Get guest-specific variables
 */
async function getGuestVariables(guestId: string): Promise<EmailTemplateVariables> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  const { data: guest, error } = await supabaseAdmin
    .from('guests')
    .select('first_name, last_name, invitation_code, email')
    .eq('id', guestId)
    .single()

  if (error || !guest) {
    throw new Error('Guest not found')
  }

  return {
    guest_first_name: guest.first_name,
    guest_last_name: guest.last_name,
    guest_full_name: `${guest.first_name} ${guest.last_name}`,
    invitation_code: guest.invitation_code
  }
}

/**
 * Get email template by ID or type
 */
async function getEmailTemplate(templateId?: string, templateType?: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not available')
  }

  let query = supabaseAdmin.from('email_templates').select('*')

  if (templateId) {
    query = query.eq('id', templateId)
  } else if (templateType) {
    query = query.eq('template_type', templateType)
  } else {
    throw new Error('Either templateId or templateType must be provided')
  }

  const { data: template, error } = await query.single()

  if (error || !template) {
    throw new Error('Email template not found')
  }

  if (!template.is_active) {
    throw new Error('Email template is not active')
  }

  return template
}

/**
 * Log email sending attempt
 */
async function logEmailSend(options: {
  campaignId?: string
  guestId?: string
  templateId?: string
  templateType: string
  recipientEmail: string
  subject: string
  trackingId: string
  deliveryStatus: string
  errorMessage?: string
}) {
  if (!supabaseAdmin) {
    return
  }

  try {
    await supabaseAdmin
      .from('email_logs')
      .insert({
        campaign_id: options.campaignId || null,
        guest_id: options.guestId || null,
        template_id: options.templateId || null,
        template_type: options.templateType,
        recipient_email: options.recipientEmail,
        subject: options.subject,
        tracking_id: options.trackingId,
        delivery_status: options.deliveryStatus,
        error_message: options.errorMessage || null,
        sent_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log email send:', error)
  }
}

/**
 * Send a single email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
  try {
    // Validate Resend API key
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
      throw new Error('Resend API key not configured')
    }

    // Generate tracking ID if not provided
    const trackingId = options.trackingId || randomUUID()

    let subject = options.subject
    let htmlContent = options.htmlContent
    let textContent = options.textContent
    let templateId: string | undefined
    let templateType = 'custom'

    // If using a template, fetch and process it
    if (options.templateId || options.templateType) {
      const template = await getEmailTemplate(options.templateId, options.templateType)
      templateId = template.id
      templateType = template.template_type
      subject = template.subject
      htmlContent = template.html_content
      textContent = template.text_content
    }

    if (!subject || !htmlContent) {
      throw new Error('Subject and HTML content are required')
    }

    // Prepare template variables
    const defaultVariables = getDefaultVariables()
    let guestVariables: EmailTemplateVariables = {}

    if (options.guestId) {
      guestVariables = await getGuestVariables(options.guestId)
    }

    const allVariables = {
      ...defaultVariables,
      ...guestVariables,
      ...options.variables
    }

    // Process template variables
    const processedSubject = replaceTemplateVariables(subject, allVariables)
    const processedHtmlContent = replaceTemplateVariables(htmlContent, allVariables)
    const processedTextContent = textContent ? replaceTemplateVariables(textContent, allVariables) : undefined

    // Check if Resend is configured
    if (!resend) {
      console.warn('Resend API key not configured, skipping email send')
      return {
        success: false,
        error: 'Email service not configured'
      }
    }

    // Send email via Resend
    const resendClient = getResendClient()
    const { data, error } = await resendClient.emails.send({
      from: 'Ashton & Cheyenne <noreply@ashtonandcheyenne.com>', // Update with your domain
      to: options.to,
      subject: processedSubject,
      html: processedHtmlContent,
      text: processedTextContent,
      headers: {
        'X-Tracking-ID': trackingId
      }
    })

    if (error) {
      console.error('Resend error:', error)
      
      // Log failed send
      await logEmailSend({
        campaignId: options.campaignId,
        guestId: options.guestId,
        templateId,
        templateType,
        recipientEmail: options.to,
        subject: processedSubject,
        trackingId,
        deliveryStatus: 'failed',
        errorMessage: error.message
      })

      return {
        success: false,
        error: error.message,
        trackingId
      }
    }

    // Log successful send
    await logEmailSend({
      campaignId: options.campaignId,
      guestId: options.guestId,
      templateId,
      templateType,
      recipientEmail: options.to,
      subject: processedSubject,
      trackingId,
      deliveryStatus: 'sent'
    })

    return {
      success: true,
      messageId: data?.id,
      trackingId
    }

  } catch (error) {
    console.error('Email service error:', error)
    
    // Log failed send
    if (options.to) {
      await logEmailSend({
        campaignId: options.campaignId,
        guestId: options.guestId,
        templateId: undefined,
        templateType: options.templateType || 'custom',
        recipientEmail: options.to,
        subject: options.subject || 'Unknown',
        trackingId: options.trackingId || randomUUID(),
        deliveryStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      trackingId: options.trackingId
    }
  }
}

/**
 * Send emails to multiple recipients (batch sending)
 */
export async function sendBulkEmails(
  recipients: Array<{
    email: string
    guestId?: string
    variables?: EmailTemplateVariables
  }>,
  emailOptions: Omit<SendEmailOptions, 'to' | 'guestId' | 'variables'>
): Promise<Array<EmailSendResult & { email: string }>> {
  const results: Array<EmailSendResult & { email: string }> = []

  // Send emails sequentially to avoid rate limiting
  for (const recipient of recipients) {
    const result = await sendEmail({
      ...emailOptions,
      to: recipient.email,
      guestId: recipient.guestId,
      variables: recipient.variables
    })

    results.push({
      ...result,
      email: recipient.email
    })

    // Add small delay between sends to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}

/**
 * Send test email (for previewing templates)
 */
export async function sendTestEmail(
  testEmail: string,
  templateId?: string,
  templateType?: string,
  testVariables?: EmailTemplateVariables
): Promise<EmailSendResult> {
  return sendEmail({
    to: testEmail,
    templateId,
    templateType,
    variables: {
      guest_first_name: 'Test',
      guest_last_name: 'Guest',
      guest_full_name: 'Test Guest',
      invitation_code: 'TEST123',
      ...testVariables
    }
  })
}
