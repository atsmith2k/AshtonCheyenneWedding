import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendEmail } from '@/lib/email-service'

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

    // Send invitation code via email using the email service
    try {
      const emailResult = await sendEmail({
        to: guest.email,
        templateType: 'invitation_recovery',
        guestId: guest.id,
        variables: {
          guest_first_name: guest.first_name,
          guest_last_name: guest.last_name,
          guest_full_name: `${guest.first_name} ${guest.last_name}`,
          invitation_code: guest.invitation_code
        }
      })

      if (!emailResult.success) {
        console.error('Failed to send recovery email:', emailResult.error)
        // Still return success to avoid revealing email existence
      } else {
        console.log('Recovery email sent successfully:', emailResult.messageId)
      }
    } catch (emailError) {
      console.error('Failed to send recovery email:', emailError)
      // Still return success to avoid revealing email existence
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
