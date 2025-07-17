import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../wedding-info/route'

// Mock the Supabase admin client
const mockSupabaseAdmin = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    single: vi.fn()
  }))
}

vi.mock('@/lib/supabase-server', () => ({
  supabaseAdmin: mockSupabaseAdmin
}))

describe('Wedding Info API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/wedding-info', () => {
    it('should return published wedding information', async () => {
      const mockWeddingInfo = [
        {
          id: '1',
          section: 'ceremony',
          title: 'Ceremony Details',
          content: 'Join us for our wedding ceremony at the beautiful garden venue.',
          order_index: 1,
          published: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          section: 'reception',
          title: 'Reception Information',
          content: 'Celebrate with us at the reception following the ceremony.',
          order_index: 2,
          published: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]

      // Mock successful database response
      mockSupabaseAdmin.from().single.mockResolvedValue({
        data: mockWeddingInfo,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/wedding-info')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockWeddingInfo)
      
      // Verify database query
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('wedding_info')
      expect(mockSupabaseAdmin.from().select).toHaveBeenCalledWith('*')
      expect(mockSupabaseAdmin.from().eq).toHaveBeenCalledWith('published', true)
      expect(mockSupabaseAdmin.from().order).toHaveBeenCalledWith('order_index')
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseAdmin.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })

      const request = new NextRequest('http://localhost:3000/api/wedding-info')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch wedding information')
      expect(data.success).toBeUndefined()
    })

    it('should handle missing supabase client', async () => {
      // Temporarily mock supabaseAdmin as null
      vi.doMock('@/lib/supabase-server', () => ({
        supabaseAdmin: null
      }))

      const { GET: getHandler } = await import('../wedding-info/route')
      const request = new NextRequest('http://localhost:3000/api/wedding-info')
      const response = await getHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Server configuration error')
    })

    it('should return empty array when no published info exists', async () => {
      // Mock empty result
      mockSupabaseAdmin.from().single.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/wedding-info')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual([])
    })
  })

  describe('POST /api/wedding-info', () => {
    it('should create new wedding info with valid data', async () => {
      const newWeddingInfo = {
        section: 'venue',
        title: 'Venue Information',
        content: 'Our wedding will be held at the beautiful Sunset Gardens.',
        orderIndex: 3,
        published: true
      }

      const mockCreatedInfo = {
        id: '3',
        section: 'venue',
        title: 'Venue Information',
        content: 'Our wedding will be held at the beautiful Sunset Gardens.',
        order_index: 3,
        published: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // Mock successful creation
      mockSupabaseAdmin.from().single.mockResolvedValue({
        data: mockCreatedInfo,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/wedding-info', {
        method: 'POST',
        body: JSON.stringify(newWeddingInfo),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockCreatedInfo)

      // Verify upsert was called with correct data
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('wedding_info')
      expect(mockSupabaseAdmin.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          section: 'venue',
          title: 'Venue Information',
          content: 'Our wedding will be held at the beautiful Sunset Gardens.',
          order_index: 3,
          published: true,
          updated_at: expect.any(String)
        }),
        { onConflict: 'section' }
      )
    })

    it('should reject requests with missing required fields', async () => {
      const invalidData = {
        section: 'venue',
        // Missing title and content
        orderIndex: 3
      }

      const request = new NextRequest('http://localhost:3000/api/wedding-info', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Section, title, and content are required')
    })

    it('should handle database errors during creation', async () => {
      const validData = {
        section: 'venue',
        title: 'Venue Information',
        content: 'Our wedding will be held at the beautiful Sunset Gardens.'
      }

      // Mock database error
      mockSupabaseAdmin.from().single.mockResolvedValue({
        data: null,
        error: { message: 'Unique constraint violation' }
      })

      const request = new NextRequest('http://localhost:3000/api/wedding-info', {
        method: 'POST',
        body: JSON.stringify(validData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to save wedding information')
    })

    it('should default published to true when not specified', async () => {
      const dataWithoutPublished = {
        section: 'venue',
        title: 'Venue Information',
        content: 'Our wedding will be held at the beautiful Sunset Gardens.'
      }

      mockSupabaseAdmin.from().single.mockResolvedValue({
        data: { id: '1', ...dataWithoutPublished, published: true },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/wedding-info', {
        method: 'POST',
        body: JSON.stringify(dataWithoutPublished),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      await POST(request)

      // Verify published defaults to true
      expect(mockSupabaseAdmin.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          published: true
        }),
        { onConflict: 'section' }
      )
    })

    it('should default orderIndex to 0 when not specified', async () => {
      const dataWithoutOrder = {
        section: 'venue',
        title: 'Venue Information',
        content: 'Our wedding will be held at the beautiful Sunset Gardens.'
      }

      mockSupabaseAdmin.from().single.mockResolvedValue({
        data: { id: '1', ...dataWithoutOrder, order_index: 0 },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/wedding-info', {
        method: 'POST',
        body: JSON.stringify(dataWithoutOrder),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      await POST(request)

      // Verify order_index defaults to 0
      expect(mockSupabaseAdmin.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          order_index: 0
        }),
        { onConflict: 'section' }
      )
    })

    it('should handle malformed JSON requests', async () => {
      const request = new NextRequest('http://localhost:3000/api/wedding-info', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
