import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/email-service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * POST /api/auth/test-recovery
 * Test endpoint for debugging invitation code recovery functionality
 * This endpoint provides detailed debugging information
 */
export async function POST(request: NextRequest) {
  try {
    const { email, debug = false } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      email: email,
      steps: []
    }

    // Step 1: Check Supabase Admin Client
    debugInfo.steps.push({
      step: 1,
      name: 'Supabase Admin Client',
      status: supabaseAdmin ? 'OK' : 'FAILED',
      details: supabaseAdmin ? 'Admin client available' : 'Admin client not available'
    })

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase admin client not available', debug: debugInfo }, { status: 500 })
    }

    // Step 2: Check Resend API Key
    const resendConfigured = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your_resend_api_key_here'
    debugInfo.steps.push({
      step: 2,
      name: 'Resend API Configuration',
      status: resendConfigured ? 'OK' : 'FAILED',
      details: resendConfigured 
        ? `API key configured: ${process.env.RESEND_API_KEY?.substring(0, 10)}...`
        : 'Resend API key not configured'
    })

    // Step 3: Find Guest
    const { data: guest, error: guestError } = await supabaseAdmin
      .from('guests')
      .select('id, first_name, last_name, email, invitation_code')
      .eq('email', email.toLowerCase().trim())
      .single()

    debugInfo.steps.push({
      step: 3,
      name: 'Guest Lookup',
      status: guest ? 'OK' : 'FAILED',
      details: guest 
        ? `Found guest: ${guest.first_name} ${guest.last_name} (ID: ${guest.id})`
        : `Guest not found: ${guestError?.message || 'Unknown error'}`,
      guest: guest ? {
        id: guest.id,
        name: `${guest.first_name} ${guest.last_name}`,
        email: guest.email,
        invitation_code: guest.invitation_code
      } : null
    })

    // Step 4: Check Email Template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('template_type', 'invitation_recovery')
      .eq('is_active', true)
      .single()

    debugInfo.steps.push({
      step: 4,
      name: 'Email Template',
      status: template ? 'OK' : 'FAILED',
      details: template 
        ? `Template found: ${template.subject}`
        : `Template not found: ${templateError?.message || 'Unknown error'}`,
      template: template ? {
        id: template.id,
        subject: template.subject,
        is_active: template.is_active,
        has_html_content: !!template.html_content,
        has_text_content: !!template.text_content
      } : null
    })

    // Step 5: Test Email Sending (only if all previous steps passed and guest exists)
    if (guest && template && resendConfigured && debug) {
      try {
        const templateVariables = {
          couple_names: 'Ashton & Cheyenne',
          website_url: process.env.NEXT_PUBLIC_APP_URL || 'https://ashtonandcheyenne.com',
          guest_first_name: guest.first_name,
          guest_last_name: guest.last_name,
          guest_full_name: `${guest.first_name} ${guest.last_name}`,
          invitation_code: guest.invitation_code
        }

        console.log(`🔗 Test email - Website URL: ${templateVariables.website_url}`)

        // Use the centralized email service for consistent template processing
        const emailResult = await sendEmail({
          to: guest.email,
          templateType: 'invitation_recovery',
          guestId: guest.id,
          variables: templateVariables
        })

        debugInfo.steps.push({
          step: 5,
          name: 'Email Sending Test',
          status: emailResult.success ? 'OK' : 'FAILED',
          details: emailResult.success 
            ? `Email sent successfully: ${emailResult.messageId}`
            : `Email failed: ${emailResult.error}`,
          emailResult: {
            success: emailResult.success,
            messageId: emailResult.messageId,
            error: emailResult.error,
            trackingId: emailResult.trackingId
          }
        })
      } catch (emailError) {
        debugInfo.steps.push({
          step: 5,
          name: 'Email Sending Test',
          status: 'ERROR',
          details: `Email sending threw error: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`,
          error: emailError instanceof Error ? emailError.stack : emailError
        })
      }
    }

    // Summary
    const allStepsOK = debugInfo.steps.every((step: any) => step.status === 'OK')
    debugInfo.summary = {
      overall_status: allStepsOK ? 'READY' : 'ISSUES_FOUND',
      ready_to_send: !!(guest && template && resendConfigured),
      recommendations: []
    }

    if (!resendConfigured) {
      debugInfo.summary.recommendations.push('Configure RESEND_API_KEY environment variable')
    }
    if (!guest) {
      debugInfo.summary.recommendations.push('Ensure guest exists in database with valid email')
    }
    if (!template) {
      debugInfo.summary.recommendations.push('Initialize email templates: POST /api/admin/email-templates/initialize')
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })

  } catch (error) {
    console.error('Test recovery error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
