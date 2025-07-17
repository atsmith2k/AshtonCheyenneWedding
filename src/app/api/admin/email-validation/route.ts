import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { validateEmailList, validateEmail } from '@/lib/email-validation'
import { z } from 'zod'

const validateEmailSchema = z.object({
  email: z.string().min(1, 'Email is required')
})

const validateEmailListSchema = z.object({
  emails: z.array(z.string()).min(1, 'At least one email is required')
})

/**
 * POST /api/admin/email-validation
 * Validate email addresses for admin use
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin()

    const body = await request.json()
    
    // Check if it's a single email or list validation
    if (body.email) {
      // Single email validation
      const { email } = validateEmailSchema.parse(body)
      const result = validateEmail(email)
      
      return NextResponse.json({
        success: true,
        validation: result
      })
    } else if (body.emails) {
      // Email list validation
      const { emails } = validateEmailListSchema.parse(body)
      const result = validateEmailList(emails)
      
      return NextResponse.json({
        success: true,
        validation: result
      })
    } else {
      return NextResponse.json(
        { error: 'Either email or emails array is required' },
        { status: 400 }
      )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/admin/email-validation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
