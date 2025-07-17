import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdminFromRequest, logAdminAction } from '@/lib/admin-auth'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdminFromRequest(request)

    // Await params in Next.js 14 App Router
    const { id } = await params

    const { data: guest, error } = await supabaseAdmin
      .from('guests')
      .select(`
        *,
        guest_groups (
          group_name
        )
      `)
      .eq('id', id)
      .single()

    if (error || !guest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    // Log admin action
    await logAdminAction('VIEW_GUEST_DETAILS', {
      adminEmail: adminUser.email,
      guestId: id,
      guestName: `${guest.first_name} ${guest.last_name}`
    })

    // Transform data for frontend
    const transformedGuest = {
      id: guest.id,
      first_name: guest.first_name,
      last_name: guest.last_name,
      email: guest.email,
      phone: guest.phone,
      invitation_code: guest.invitation_code,
      rsvp_status: guest.rsvp_status,
      meal_preference: guest.meal_preference,
      dietary_restrictions: guest.dietary_restrictions,
      special_notes: guest.special_notes,
      plus_one_allowed: guest.plus_one_allowed,
      plus_one_name: guest.plus_one_name,
      plus_one_meal: guest.plus_one_meal,
      children_attending: guest.children_attending,
      group_name: guest.guest_groups?.group_name || null,
      group_id: guest.group_id,
      rsvp_submitted_at: guest.rsvp_submitted_at,
      created_at: guest.created_at,
      updated_at: guest.updated_at
    }

    return NextResponse.json({
      success: true,
      data: transformedGuest
    })

  } catch (error) {
    console.error('Error in admin guest details API:', error)

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdminFromRequest(request)

    // Await params in Next.js 14 App Router
    const { id } = await params

    const updateData = await request.json()

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

    // Update guest
    const { data: updatedGuest, error } = await supabaseAdmin
      .from('guests')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
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

    // Log admin action
    await logAdminAction('UPDATE_GUEST_INDIVIDUAL', {
      adminEmail: adminUser.email,
      guestId: id,
      guestName: `${updatedGuest.first_name} ${updatedGuest.last_name}`,
      updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedGuest,
      message: 'Guest updated successfully'
    })

  } catch (error) {
    console.error('Error in admin guest update API:', error)

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    const adminUser = await requireAdminFromRequest(request)

    // Await params in Next.js 14 App Router
    const { id } = await params

    // Check if guest exists
    const { data: existingGuest, error: fetchError } = await supabaseAdmin
      .from('guests')
      .select('id, first_name, last_name, email')
      .eq('id', id)
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
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting guest:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete guest' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction('DELETE_GUEST_INDIVIDUAL', {
      adminEmail: adminUser.email,
      guestId: id,
      guestName: `${existingGuest.first_name} ${existingGuest.last_name}`,
      guestEmail: existingGuest.email
    })

    return NextResponse.json({
      success: true,
      message: 'Guest deleted successfully'
    })

  } catch (error) {
    console.error('Error in admin guest delete API:', error)

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
