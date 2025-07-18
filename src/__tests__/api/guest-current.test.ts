import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/guest/current/route'

// Mock the supabase admin client
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}))

describe('/api/guest/current', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when no authentication headers are provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/guest/current', {
      method: 'GET',
      headers: {}
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('should return guest data when valid guest ID is provided', async () => {
    const mockGuest = {
      id: 'guest-123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      invitation_code: 'ABC123',
      rsvp_status: 'attending',
      meal_preference: 'chicken',
      dietary_restrictions: 'No nuts',
      plus_one_allowed: true,
      plus_one_name: 'Jane Doe',
      plus_one_meal: 'fish',
      notes: 'Looking forward to it!',
      guest_groups: { group_name: 'Family' }
    }

    const { supabaseAdmin } = await import('@/lib/supabase')
    const mockQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: mockGuest, error: null })
        }))
      }))
    }

    if (supabaseAdmin) {
      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)
    }

    const request = new NextRequest('http://localhost:3000/api/guest/current', {
      method: 'GET',
      headers: {
        'x-guest-id': 'guest-123'
      }
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.guest.firstName).toBe('John')
    expect(data.guest.lastName).toBe('Doe')
    expect(data.guest.rsvpStatus).toBe('attending')
    expect(data.guest.mealPreference).toBe('chicken')
    expect(data.guest.specialNotes).toBe('Looking forward to it!')
  })
})
