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
    await logAdminAction('VIEW_GUEST_GROUPS', { adminEmail: adminUser.email })

    // Get all guest groups with guest count
    const { data: groups, error } = await supabaseAdmin
      .from('guest_groups')
      .select(`
        *,
        guests (
          id,
          first_name,
          last_name,
          rsvp_status
        )
      `)
      .order('group_name')

    if (error) {
      console.error('Error fetching guest groups:', error)
      return NextResponse.json(
        { error: 'Failed to fetch guest groups' },
        { status: 500 }
      )
    }

    // Transform data for frontend
    const transformedGroups = groups.map(group => ({
      id: group.id,
      group_name: group.group_name,
      max_guests: group.max_guests,
      invitation_sent_at: group.invitation_sent_at,
      created_at: group.created_at,
      updated_at: group.updated_at,
      guest_count: group.guests?.length || 0,
      attending_count: group.guests?.filter((g: any) => g.rsvp_status === 'attending').length || 0,
      pending_count: group.guests?.filter((g: any) => g.rsvp_status === 'pending').length || 0,
      guests: group.guests || []
    }))

    return NextResponse.json({
      success: true,
      data: transformedGroups
    })

  } catch (error) {
    console.error('Error in admin guest groups API:', error)

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

    const { groupName, maxGuests } = await request.json()

    if (!groupName) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    // Check if group name already exists
    const { data: existingGroup } = await supabaseAdmin
      .from('guest_groups')
      .select('id')
      .eq('group_name', groupName)
      .single()

    if (existingGroup) {
      return NextResponse.json(
        { error: 'A group with this name already exists' },
        { status: 400 }
      )
    }

    // Insert new guest group
    const { data: group, error } = await supabaseAdmin
      .from('guest_groups')
      .insert({
        group_name: groupName,
        max_guests: maxGuests || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating guest group:', error)
      return NextResponse.json(
        { error: 'Failed to create guest group' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction('CREATE_GUEST_GROUP', {
      adminEmail: adminUser.email,
      groupId: group.id,
      groupName: groupName,
      maxGuests: maxGuests
    })

    return NextResponse.json({
      success: true,
      data: group,
      message: 'Guest group created successfully'
    })

  } catch (error) {
    console.error('Error in admin guest groups POST:', error)

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

    const { id, groupName, maxGuests, invitationSentAt } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      )
    }

    if (!groupName) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    // Check if group exists
    const { data: existingGroup, error: fetchError } = await supabaseAdmin
      .from('guest_groups')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingGroup) {
      return NextResponse.json(
        { error: 'Guest group not found' },
        { status: 404 }
      )
    }

    // Check if group name is being changed and if new name already exists
    if (groupName !== existingGroup.group_name) {
      const { data: nameConflict } = await supabaseAdmin
        .from('guest_groups')
        .select('id')
        .eq('group_name', groupName)
        .neq('id', id)
        .single()

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A group with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update guest group
    const updateData: any = {
      group_name: groupName,
      max_guests: maxGuests || existingGroup.max_guests,
      updated_at: new Date().toISOString()
    }

    if (invitationSentAt !== undefined) {
      updateData.invitation_sent_at = invitationSentAt
    }

    const { data: updatedGroup, error } = await supabaseAdmin
      .from('guest_groups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating guest group:', error)
      return NextResponse.json(
        { error: 'Failed to update guest group' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction('UPDATE_GUEST_GROUP', {
      adminEmail: adminUser.email,
      groupId: id,
      groupName: groupName,
      oldGroupName: existingGroup.group_name,
      maxGuests: maxGuests
    })

    return NextResponse.json({
      success: true,
      data: updatedGroup,
      message: 'Guest group updated successfully'
    })

  } catch (error) {
    console.error('Error in admin guest groups PUT:', error)

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
    const groupId = searchParams.get('id')

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      )
    }

    // Check if group exists and get guest count
    const { data: existingGroup, error: fetchError } = await supabaseAdmin
      .from('guest_groups')
      .select(`
        *,
        guests (id)
      `)
      .eq('id', groupId)
      .single()

    if (fetchError || !existingGroup) {
      return NextResponse.json(
        { error: 'Guest group not found' },
        { status: 404 }
      )
    }

    // Check if group has guests
    if (existingGroup.guests && existingGroup.guests.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete group with existing guests. Please move or delete all guests first.',
          guestCount: existingGroup.guests.length
        },
        { status: 400 }
      )
    }

    // Delete guest group
    const { error: deleteError } = await supabaseAdmin
      .from('guest_groups')
      .delete()
      .eq('id', groupId)

    if (deleteError) {
      console.error('Error deleting guest group:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete guest group' },
        { status: 500 }
      )
    }

    // Log admin action
    await logAdminAction('DELETE_GUEST_GROUP', {
      adminEmail: adminUser.email,
      groupId: groupId,
      groupName: existingGroup.group_name
    })

    return NextResponse.json({
      success: true,
      message: 'Guest group deleted successfully'
    })

  } catch (error) {
    console.error('Error in admin guest groups DELETE:', error)

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
