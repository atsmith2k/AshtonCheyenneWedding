import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdminFromRequest, logAdminAction } from '@/lib/admin-auth'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

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
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdminFromRequest(request)

    const {
      firstName,
      lastName,
      email,
      phone,
      groupId,
      plusOneAllowed,
      mealPreference,
      dietaryRestrictions,
      specialNotes
    } = await request.json()

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Validate email uniqueness if provided
    if (email) {
      const { data: existingGuest } = await supabaseAdmin
        .from('guests')
        .select('id')
        .eq('email', email.toLowerCase())
        .single()

      if (existingGuest) {
        return NextResponse.json(
          { error: 'A guest with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Generate unique invitation code
    const invitationCode = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toLowerCase()

    // Insert new guest
    const { data: guest, error } = await supabaseAdmin
      .from('guests')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email?.toLowerCase() || null,
        phone: phone || null,
        invitation_code: invitationCode,
        group_id: groupId || null,
        plus_one_allowed: plusOneAllowed || false,
        meal_preference: mealPreference || null,
        dietary_restrictions: dietaryRestrictions || null,
        special_notes: specialNotes || null,
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
      guestId: guest.id,
      guestEmail: email,
      guestName: `${firstName} ${lastName}`,
      groupId: groupId
    })

    return NextResponse.json({
      success: true,
      data: guest,
      message: 'Guest created successfully'
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

export async function PUT(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdminFromRequest(request)

    const {
      id,
      firstName,
      lastName,
      email,
      phone,
      groupId,
      plusOneAllowed,
      plusOneName,
      mealPreference,
      dietaryRestrictions,
      specialNotes,
      rsvpStatus
    } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      )
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Check if guest exists
    const { data: existingGuest, error: fetchError } = await supabaseAdmin
      .from('guests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingGuest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    // Validate email uniqueness if email is being changed
    if (email && email.toLowerCase() !== existingGuest.email) {
      const { data: emailConflict } = await supabaseAdmin
        .from('guests')
        .select('id')
        .eq('email', email.toLowerCase())
        .neq('id', id)
        .single()

      if (emailConflict) {
        return NextResponse.json(
          { error: 'A guest with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      first_name: firstName,
      last_name: lastName,
      email: email?.toLowerCase() || null,
      phone: phone || null,
      group_id: groupId || null,
      plus_one_allowed: plusOneAllowed || false,
      plus_one_name: plusOneName || null,
      meal_preference: mealPreference || null,
      dietary_restrictions: dietaryRestrictions || null,
      special_notes: specialNotes || null,
      updated_at: new Date().toISOString()
    }

    // Only update RSVP status if provided and valid
    if (rsvpStatus && ['pending', 'attending', 'not_attending'].includes(rsvpStatus)) {
      updateData.rsvp_status = rsvpStatus

      // Set RSVP submitted timestamp if status is being changed from pending
      if (existingGuest.rsvp_status === 'pending' && rsvpStatus !== 'pending') {
        updateData.rsvp_submitted_at = new Date().toISOString()
      }
    }

    // Update guest
    const { data: updatedGuest, error } = await supabaseAdmin
      .from('guests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating guest:', error)
      return NextResponse.json(
        { error: 'Failed to update guest' },
        { status: 500 }
      )
    }

    // Log admin action with details of what changed
    const changes = Object.keys(updateData).filter(key =>
      updateData[key] !== existingGuest[key]
    )

    await logAdminAction('UPDATE_GUEST', {
      adminEmail: adminUser.email,
      guestId: id,
      guestName: `${firstName} ${lastName}`,
      changedFields: changes,
      oldValues: changes.reduce((acc, field) => {
        acc[field] = existingGuest[field]
        return acc
      }, {} as any),
      newValues: changes.reduce((acc, field) => {
        acc[field] = updateData[field]
        return acc
      }, {} as any)
    })

    return NextResponse.json({
      success: true,
      data: updatedGuest,
      message: 'Guest updated successfully'
    })

  } catch (error) {
    console.error('Error in admin guests PUT:', error)

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

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdminFromRequest(request)

    const { searchParams } = new URL(request.url)
    const guestId = searchParams.get('id')
    const guestIds = searchParams.get('ids')?.split(',')

    // Handle bulk delete
    if (guestIds && guestIds.length > 0) {
      // Validate all guest IDs exist
      const { data: existingGuests, error: fetchError } = await supabaseAdmin
        .from('guests')
        .select('id, first_name, last_name, email')
        .in('id', guestIds)

      if (fetchError) {
        console.error('Error fetching guests for bulk delete:', fetchError)
        return NextResponse.json(
          { error: 'Failed to validate guests for deletion' },
          { status: 500 }
        )
      }

      if (!existingGuests || existingGuests.length !== guestIds.length) {
        return NextResponse.json(
          { error: 'One or more guests not found' },
          { status: 404 }
        )
      }

      // Delete guests
      const { error: deleteError } = await supabaseAdmin
        .from('guests')
        .delete()
        .in('id', guestIds)

      if (deleteError) {
        console.error('Error deleting guests:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete guests' },
          { status: 500 }
        )
      }

      // Log admin action
      await logAdminAction('BULK_DELETE_GUESTS', {
        adminEmail: adminUser.email,
        deletedGuests: existingGuests.map(g => ({
          id: g.id,
          name: `${g.first_name} ${g.last_name}`,
          email: g.email
        })),
        count: existingGuests.length
      })

      return NextResponse.json({
        success: true,
        message: `Successfully deleted ${existingGuests.length} guest(s)`
      })
    }

    // Handle single delete
    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      )
    }

    // Check if guest exists
    const { data: existingGuest, error: fetchError } = await supabaseAdmin
      .from('guests')
      .select('id, first_name, last_name, email, group_id')
      .eq('id', guestId)
      .single()

    if (fetchError || !existingGuest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    // Delete guest
    const { error: deleteError } = await supabaseAdmin
      .from('guests')
      .delete()
      .eq('id', guestId)

    if (deleteError) {
      console.error('Error deleting guest:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete guest' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction('DELETE_GUEST', {
      adminEmail: adminUser.email,
      guestId: guestId,
      guestName: `${existingGuest.first_name} ${existingGuest.last_name}`,
      guestEmail: existingGuest.email,
      groupId: existingGuest.group_id
    })

    return NextResponse.json({
      success: true,
      message: 'Guest deleted successfully'
    })

  } catch (error) {
    console.error('Error in admin guests DELETE:', error)

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
