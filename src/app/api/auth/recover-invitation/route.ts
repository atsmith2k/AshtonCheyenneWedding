import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Find guest by email
    const { data: guest, error } = await supabase
      .from('guests')
      .select('id, first_name, last_name, email, invitation_code')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !guest) {
      // Don't reveal whether email exists for security
      return NextResponse.json(
        { message: 'If this email is in our guest list, you will receive your invitation code shortly.' },
        { status: 200 }
      )
    }

    // Send invitation code via email
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your_resend_api_key_here') {
      try {
        await resend.emails.send({
          from: 'Ashton & Cheyenne <noreply@your-domain.com>',
          to: guest.email,
          subject: 'Your Wedding Invitation Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #ec4899;">Ashton & Cheyenne's Wedding</h1>
              <p>Hi ${guest.first_name},</p>
              <p>Here is your invitation code for our wedding website:</p>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <h2 style="color: #0ea5e9; font-size: 24px; letter-spacing: 2px; margin: 0;">
                  ${guest.invitation_code}
                </h2>
              </div>
              <p>Use this code to access our wedding website and submit your RSVP.</p>
              <p>We can't wait to celebrate with you!</p>
              <p>Love,<br>Ashton & Cheyenne</p>
            </div>
          `,
          text: `Hi ${guest.first_name},\n\nHere is your invitation code for Ashton & Cheyenne's wedding: ${guest.invitation_code}\n\nUse this code to access the wedding website and submit your RSVP.\n\nWe can't wait to celebrate with you!\n\nLove,\nAshton & Cheyenne`
        })
      } catch (emailError) {
        console.error('Failed to send recovery email:', emailError)
        // Still return success to avoid revealing email existence
      }
    }

    return NextResponse.json(
      { message: 'If this email is in our guest list, you will receive your invitation code shortly.' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Invitation code recovery error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
