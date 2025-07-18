import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/guest/current
 * Fetch current guest data including all RSVP details
 * Requires guest authentication via invitation code in headers
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Get guest ID from request headers (set by auth context)
    const guestId = request.headers.get('x-guest-id')
    const invitationCode = request.headers.get('x-invitation-code')

    if (!guestId && !invitationCode) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch guest data with all RSVP details
    let query = supabaseAdmin
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
        meal_preference,
        dietary_restrictions,
        plus_one_allowed,
        plus_one_name,
        plus_one_meal,
        notes,
        rsvp_submitted_at,
        created_at,
        updated_at,
        guest_groups (
          id,
          group_name,
          max_guests
        )
      `)

    // Query by guest ID if available, otherwise by invitation code
    if (guestId) {
      query = query.eq('id', guestId)
    } else {
      query = query.eq('invitation_code', invitationCode?.trim().toLowerCase())
    }

    const { data: guest, error } = await query.single()

    if (error || !guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    // Return guest data in the same format as the auth validation endpoint
    return NextResponse.json({
      success: true,
      guest: {
        id: guest.id,
        firstName: guest.first_name,
        lastName: guest.last_name,
        email: guest.email,
        phone: guest.phone,
        invitationCode: guest.invitation_code,
        groupId: guest.group_id,
        rsvpStatus: guest.rsvp_status,
        mealPreference: guest.meal_preference,
        dietaryRestrictions: guest.dietary_restrictions,
        plusOneAllowed: guest.plus_one_allowed,
        plusOneName: guest.plus_one_name,
        plusOneMeal: guest.plus_one_meal,
        specialNotes: guest.notes,
        rsvpSubmittedAt: guest.rsvp_submitted_at,
        group: guest.guest_groups
      }
    })

  } catch (error) {
    console.error('Error fetching current guest data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
