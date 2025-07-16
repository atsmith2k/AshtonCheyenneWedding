import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdminFromRequest, logAdminAction } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const adminUser = await requireAdminFromRequest(request)
    await logAdminAction('VIEW_GUESTS', { adminEmail: adminUser.email })

    // Get all guests with group information
    const { data: guests, error } = await supabaseAdmin
      .from('guests')
      .select(`
        *,
        guest_groups (
          group_name
        )
      `)
      .order('last_name')

    if (error) {
      console.error('Error fetching guests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch guests' },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const transformedGuests = guests.map(guest => ({
      id: guest.id,
      first_name: guest.first_name,
      last_name: guest.last_name,
      email: guest.email,
      phone: guest.phone,
      invitation_code: guest.invitation_code,
      rsvp_status: guest.rsvp_status,
      meal_preference: guest.meal_preference,
      plus_one_allowed: guest.plus_one_allowed,
      plus_one_name: guest.plus_one_name,
      group_name: guest.guest_groups?.group_name || null,
      rsvp_submitted_at: guest.rsvp_submitted_at
    }))

    return NextResponse.json({
      success: true,
      data: transformedGuests
    })

  } catch (error) {
    console.error('Error in admin guests API:', error)

    // Handle authorization errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminUser = await requireAdminFromRequest(request)

    const { firstName, lastName, email, phone, groupId, plusOneAllowed } = await request.json()

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Generate unique invitation code
    const invitationCode = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toLowerCase()

    // Insert new guest
    const { data: guest, error } = await supabaseAdmin
      .from('guests')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        invitation_code: invitationCode,
        group_id: groupId || null,
        plus_one_allowed: plusOneAllowed || false,
        rsvp_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating guest:', error)
      return NextResponse.json(
        { error: 'Failed to create guest' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction('CREATE_GUEST', {
      adminEmail: adminUser.email,
      guestEmail: email,
      guestName: `${firstName} ${lastName}`
    })

    return NextResponse.json({
      success: true,
      data: guest
    })

  } catch (error) {
    console.error('Error in admin guests POST:', error)

    // Handle authorization errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
