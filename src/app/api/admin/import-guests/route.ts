import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateInvitationCode } from '@/lib/supabase'
import { requireAdminFromRequest, logAdminAction } from '@/lib/admin-auth'

interface GuestImportData {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  groupName: string
  maxGuests?: number
  plusOneAllowed?: boolean
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const adminUser = await requireAdminFromRequest(request)

    const { guests }: { guests: GuestImportData[] } = await request.json()

    if (!guests || !Array.isArray(guests)) {
      return NextResponse.json(
        { error: 'Invalid guest data format' },
        { status: 400 }
      )
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Group guests by group name
    const groupedGuests = guests.reduce((acc, guest) => {
      if (!acc[guest.groupName]) {
        acc[guest.groupName] = []
      }
      acc[guest.groupName].push(guest)
      return acc
    }, {} as Record<string, GuestImportData[]>)

    // Process each group
    for (const [groupName, groupGuests] of Object.entries(groupedGuests)) {
      try {
        // Create guest group
        const { data: guestGroup, error: groupError } = await supabaseAdmin
          .from('guest_groups')
          .insert({
            group_name: groupName,
            max_guests: groupGuests[0].maxGuests || groupGuests.length
          })
          .select()
          .single()

        if (groupError) {
          results.errors.push(`Failed to create group ${groupName}: ${groupError.message}`)
          results.failed += groupGuests.length
          continue
        }

        // Create guests in the group
        for (const guest of groupGuests) {
          try {
            const invitationCode = generateInvitationCode()
            
            const { error: guestError } = await supabaseAdmin
              .from('guests')
              .insert({
                first_name: guest.firstName,
                last_name: guest.lastName,
                email: guest.email?.toLowerCase(),
                phone: guest.phone,
                invitation_code: invitationCode,
                group_id: guestGroup.id,
                plus_one_allowed: guest.plusOneAllowed || false
              })

            if (guestError) {
              results.errors.push(`Failed to create guest ${guest.firstName} ${guest.lastName}: ${guestError.message}`)
              results.failed++
            } else {
              results.successful++
            }
          } catch (error) {
            results.errors.push(`Error processing guest ${guest.firstName} ${guest.lastName}: ${error}`)
            results.failed++
          }
        }
      } catch (error) {
        results.errors.push(`Error processing group ${groupName}: ${error}`)
        results.failed += groupGuests.length
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed: ${results.successful} successful, ${results.failed} failed`,
      results
    })

  } catch (error) {
    console.error('Guest import error:', error)
    return NextResponse.json(
      { error: 'Failed to import guests' },
      { status: 500 }
    )
  }
}
