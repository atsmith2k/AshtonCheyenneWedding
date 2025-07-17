import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - admin routes use authentication
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const results = {
      adminUsers: { success: 0, failed: 0, errors: [] as string[] },
      weddingEvents: { success: 0, failed: 0, errors: [] as string[] },
      photoAlbums: { success: 0, failed: 0, errors: [] as string[] }
    }

    // 1. Create admin users
    const adminUsers = [
      {
        email: 'ashton@example.com',
        first_name: 'Ashton',
        last_name: 'Smith',
        role: 'admin'
      },
      {
        email: 'cheyenne@example.com',
        first_name: 'Cheyenne',
        last_name: 'Smith',
        role: 'admin'
      }
    ]

    for (const admin of adminUsers) {
      try {
        const { error } = await supabaseAdmin
          .from('admin_users')
          .upsert(admin, { onConflict: 'email' })

        if (error) {
          results.adminUsers.errors.push(`${admin.email}: ${error.message}`)
          results.adminUsers.failed++
        } else {
          results.adminUsers.success++
        }
      } catch (error) {
        results.adminUsers.errors.push(`${admin.email}: ${error}`)
        results.adminUsers.failed++
      }
    }

    // 2. Create wedding events
    const weddingEvents = [
      {
        name: 'Wedding Ceremony',
        description: 'Join Ashton and Cheyenne as they exchange vows',
        date_time: '2026-07-15T15:00:00Z',
        location: 'Beautiful Garden Venue',
        address: '123 Wedding Lane, Love City, LC 12345',
        dress_code: 'Formal attire requested',
        additional_info: 'Outdoor ceremony, weather permitting',
        order_index: 1,
        is_active: true
      },
      {
        name: 'Cocktail Hour',
        description: 'Celebrate with drinks and appetizers',
        date_time: '2026-07-15T16:30:00Z',
        location: 'Garden Terrace',
        address: '123 Wedding Lane, Love City, LC 12345',
        additional_info: 'Light refreshments and signature cocktails',
        order_index: 2,
        is_active: true
      },
      {
        name: 'Reception Dinner',
        description: 'Dinner, dancing, and celebration',
        date_time: '2026-07-15T18:00:00Z',
        location: 'Grand Ballroom',
        address: '123 Wedding Lane, Love City, LC 12345',
        dress_code: 'Formal attire',
        additional_info: 'Dinner service followed by dancing until midnight',
        order_index: 3,
        is_active: true
      }
    ]

    for (const event of weddingEvents) {
      try {
        const { error } = await supabaseAdmin
          .from('wedding_events')
          .insert(event)

        if (error) {
          results.weddingEvents.errors.push(`${event.name}: ${error.message}`)
          results.weddingEvents.failed++
        } else {
          results.weddingEvents.success++
        }
      } catch (error) {
        results.weddingEvents.errors.push(`${event.name}: ${error}`)
        results.weddingEvents.failed++
      }
    }

    // 3. Create photo albums
    const photoAlbums = [
      {
        name: 'Engagement Photos',
        description: 'Beautiful engagement session photos',
        published: true,
        sort_order: 1
      },
      {
        name: 'Wedding Day',
        description: 'Photos from our special day',
        published: true,
        sort_order: 2
      },
      {
        name: 'Guest Photos',
        description: 'Photos shared by our wonderful guests',
        published: true,
        sort_order: 3
      }
    ]

    for (const album of photoAlbums) {
      try {
        const { error } = await supabaseAdmin
          .from('photo_albums')
          .insert(album)

        if (error) {
          results.photoAlbums.errors.push(`${album.name}: ${error.message}`)
          results.photoAlbums.failed++
        } else {
          results.photoAlbums.success++
        }
      } catch (error) {
        results.photoAlbums.errors.push(`${album.name}: ${error}`)
        results.photoAlbums.failed++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialization completed',
      results
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    )
  }
}
