import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail, EmailTemplateVariables } from '@/lib/email-service'

// Force dynamic rendering - this route handles sensitive operations
export const dynamic = 'force-dynamic'

// Validation schema for recovery request
const recoverySchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email address is required')
})

/**
 * POST /api/auth/recover-invitation
 * Send invitation code recovery email to guest
 */
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available')
      return NextResponse.json(
        { message: 'If this email is in our guest list, you will receive your invitation code shortly.' },
        { status: 200 }
      )
    }

    const body = await request.json()
    const validatedData = recoverySchema.parse(body)
    const email = validatedData.email.toLowerCase().trim()

    console.log(`Processing invitation recovery request for email: ${email}`)

    // Find guest by email using admin client
    const { data: guest, error: guestError } = await supabaseAdmin
      .from('guests')
      .select('id, first_name, last_name, email, invitation_code')
      .eq('email', email)
      .single()

    if (guestError || !guest) {
      console.log(`Guest not found for email: ${email}`)
      // Don't reveal whether email exists for security
      return NextResponse.json(
        { message: 'If this email is in our guest list, you will receive your invitation code shortly.' },
        { status: 200 }
      )
    }

    console.log(`Found guest: ${guest.first_name} ${guest.last_name} (ID: ${guest.id})`)

    // Verify the invitation_recovery template exists
    const { data: template, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('template_type', 'invitation_recovery')
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      console.error('Invitation recovery template not found or inactive:', templateError)
      // Still return success to avoid revealing system issues
      return NextResponse.json(
        { message: 'If this email is in our guest list, you will receive your invitation code shortly.' },
        { status: 200 }
      )
    }

    console.log(`Using template: ${template.subject}`)

    // Validate Resend API configuration
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
      console.error('❌ Resend API key not configured properly')
      console.error('🔧 Please set RESEND_API_KEY environment variable')
      // Still return success to avoid revealing system issues
      return NextResponse.json(
        { message: 'If this email is in our guest list, you will receive your invitation code shortly.' },
        { status: 200 }
      )
    }

    console.log(`✅ Resend API key configured: ${process.env.RESEND_API_KEY.substring(0, 10)}...`);
    
    // Prepare template variables
    const baseVariables: EmailTemplateVariables = {
      couple_names: 'Ashton & Cheyenne',
      website_url: process.env.NEXT_PUBLIC_APP_URL || 'https://ashtonandcheyenne.com'
    }

    const guestVariables: EmailTemplateVariables = {
      ...baseVariables,
      guest_first_name: guest.first_name,
      guest_last_name: guest.last_name,
      guest_full_name: `${guest.first_name} ${guest.last_name}`,
      invitation_code: guest.invitation_code
    }

    // Process template variables in the template content
    const processedSubject = template.subject.replace(/{{couple_names}}/g, guestVariables.couple_names || 'Ashton & Cheyenne')

    let processedHtmlContent = template.html_content
    let processedTextContent = template.text_content || ''

    // Replace all template variables
    Object.entries(guestVariables).forEach(([key, value]) => {
      if (value !== undefined) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
        processedHtmlContent = processedHtmlContent.replace(regex, value)
        processedTextContent = processedTextContent.replace(regex, value)
      }
    })

    // Remove any unreplaced variables
    processedHtmlContent = processedHtmlContent.replace(/{{[^}]+}}/g, '')
    processedTextContent = processedTextContent.replace(/{{[^}]+}}/g, '')

    console.log(`Sending recovery email to ${guest.email} with subject: ${processedSubject}`)

    // Send invitation code via email with timeout and enhanced error handling
    // Use the same pattern as working admin emails - pass content directly
    try {
      const emailResult = await Promise.race([
        sendEmail({
          to: guest.email,
          subject: processedSubject,
          htmlContent: processedHtmlContent,
          textContent: processedTextContent,
          templateType: 'invitation_recovery',
          guestId: guest.id,
          variables: guestVariables
        }),
        new Promise<{ success: false; error: string }>((_, reject) =>
          setTimeout(() => reject(new Error('Email send timeout (30s)')), 30000)
        )
      ])

      if (emailResult.success) {
        console.log(`✅ Recovery email sent successfully to ${guest.email}:`, emailResult.messageId)
        console.log(`📧 Email tracking ID: ${emailResult.trackingId}`)
      } else {
        console.error(`❌ Failed to send recovery email to ${guest.email}:`, emailResult.error)
        console.error(`🔍 Email service error details:`, emailResult)
        // Still return success to avoid revealing email existence
      }
    } catch (emailError) {
      console.error(`💥 Email send error for ${guest.email}:`, emailError)
      console.error(`🔍 Full error details:`, emailError instanceof Error ? emailError.stack : emailError)
      // Still return success to avoid revealing email existence
    }

    return NextResponse.json(
      { message: 'If this email is in our guest list, you will receive your invitation code shortly.' },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('Invalid recovery request data:', error.errors)
      return NextResponse.json(
        { message: 'If this email is in our guest list, you will receive your invitation code shortly.' },
        { status: 200 }
      )
    }

    console.error('Invitation code recovery error:', error)
    return NextResponse.json(
      { message: 'If this email is in our guest list, you will receive your invitation code shortly.' },
      { status: 200 }
    )
  }
}
