import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { sendTestEmail } from '@/lib/email-service'
import { validateEmail } from '@/lib/email-validation'
import { z } from 'zod'

const testEmailSchema = z.object({
  template_id: z.string().uuid('Invalid template ID').optional(),
  template_type: z.string().optional(),
  test_email: z.string().email('Invalid email address'),
  test_variables: z.record(z.string()).optional()
})

/**
 * POST /api/admin/email-templates/test
 * Send a test email using a template
 */
export async function POST(request: NextRequest) {
  try {
    // Check if email service is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured. RESEND_API_KEY is missing.' },
        { status: 503 }
      )
    }

    // Require admin authentication
    await requireAdmin()

    const body = await request.json()
    const validatedData = testEmailSchema.parse(body)

    if (!validatedData.template_id && !validatedData.template_type) {
      return NextResponse.json(
        { error: 'Either template_id or template_type must be provided' },
        { status: 400 }
      )
    }

    // Validate email address
    const emailValidation = validateEmail(validatedData.test_email)
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error || 'Invalid email address' },
        { status: 400 }
      )
    }

    // Warn about disposable emails but allow them for testing
    if (emailValidation.warnings && emailValidation.warnings.length > 0) {
      console.warn('Test email warnings:', emailValidation.warnings)
    }

    // Send test email
    const result = await sendTestEmail(
      validatedData.test_email,
      validatedData.template_id,
      validatedData.template_type,
      validatedData.test_variables
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send test email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${validatedData.test_email}`,
      tracking_id: result.trackingId
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/admin/email-templates/test:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
