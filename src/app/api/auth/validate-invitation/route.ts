import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { invitationCode } = await request.json()

    if (!invitationCode) {
      return NextResponse.json(
        { error: 'Invitation code is required' },
        { status: 400 }
      )
    }

    // Validate invitation code against database
    const { data: guest, error } = await supabaseAdmin
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        invitation_code,
        group_id,
        rsvp_status,
        plus_one_allowed,
        guest_groups (
          id,
          group_name,
          max_guests
        )
      `)
      .eq('invitation_code', invitationCode.trim().toLowerCase())
      .single()

    if (error || !guest) {
      return NextResponse.json(
        { error: 'Invalid invitation code' },
        { status: 404 }
      )
    }

    // Return guest information (excluding sensitive data)
    return NextResponse.json({
      success: true,
      guest: {
        id: guest.id,
        firstName: guest.first_name,
        lastName: guest.last_name,
        email: guest.email,
        invitationCode: guest.invitation_code,
        groupId: guest.group_id,
        rsvpStatus: guest.rsvp_status,
        plusOneAllowed: guest.plus_one_allowed,
        group: guest.guest_groups
      }
    })

  } catch (error) {
    console.error('Error validating invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
