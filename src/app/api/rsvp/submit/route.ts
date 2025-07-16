import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'

// RSVP validation schema
const rsvpSchema = z.object({
  guestId: z.string().uuid(),
  attending: z.enum(['attending', 'not_attending']),
  mealPreference: z.enum(['chicken', 'beef', 'fish', 'vegetarian', 'vegan', 'kids_meal']).optional(),
  dietaryRestrictions: z.string().max(500).optional(),
  childrenAttending: z.boolean().optional(),
  plusOneName: z.string().max(100).optional(),
  plusOneMeal: z.enum(['chicken', 'beef', 'fish', 'vegetarian', 'vegan', 'kids_meal']).optional(),
  specialNotes: z.string().max(1000).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validatedData = rsvpSchema.parse(body)

    // Check if guest exists
    const { data: existingGuest, error: guestError } = await supabaseAdmin
      .from('guests')
      .select('id, plus_one_allowed')
      .eq('id', validatedData.guestId)
      .single()

    if (guestError || !existingGuest) {
      return NextResponse.json(
        { error: 'Guest not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      rsvp_status: validatedData.attending,
      rsvp_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Only add meal preference if attending
    if (validatedData.attending === 'attending') {
      if (validatedData.mealPreference) {
        updateData.meal_preference = validatedData.mealPreference
      }
      if (validatedData.dietaryRestrictions) {
        updateData.dietary_restrictions = validatedData.dietaryRestrictions
      }
      if (validatedData.childrenAttending !== undefined) {
        updateData.children_attending = validatedData.childrenAttending
      }
      if (validatedData.specialNotes) {
        updateData.special_notes = validatedData.specialNotes
      }

      // Handle plus-one if allowed
      if (existingGuest.plus_one_allowed) {
        if (validatedData.plusOneName) {
          updateData.plus_one_name = validatedData.plusOneName
        }
        if (validatedData.plusOneMeal) {
          updateData.plus_one_meal = validatedData.plusOneMeal
        }
      }
    }

    // Update guest RSVP
    const { data: updatedGuest, error: updateError } = await supabaseAdmin
      .from('guests')
      .update(updateData)
      .eq('id', validatedData.guestId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating RSVP:', updateError)
      return NextResponse.json(
        { error: 'Failed to update RSVP' },
        { status: 500 }
      )
    }

    // Log analytics event
    await supabaseAdmin
      .from('analytics_events')
      .insert({
        event_type: 'rsvp_submit',
        guest_id: validatedData.guestId,
        metadata: {
          attending: validatedData.attending,
          has_plus_one: !!validatedData.plusOneName,
          meal_preference: validatedData.mealPreference
        }
      })

    return NextResponse.json({
      success: true,
      message: 'RSVP submitted successfully',
      guest: updatedGuest
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error submitting RSVP:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
