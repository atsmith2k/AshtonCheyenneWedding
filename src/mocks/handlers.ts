import { http, HttpResponse } from 'msw'
import { 
  createMockGuest, 
  createMockRSVP, 
  createMockPhoto, 
  createMockMessage,
  createMockEmailTemplate,
  mockApiResponse 
} from '../test-utils'

// Mock data stores
const mockGuests = [
  createMockGuest({ id: 'guest-1', invitation_code: 'ABC123' }),
  createMockGuest({ id: 'guest-2', invitation_code: 'DEF456', first_name: 'Jane', last_name: 'Smith' })
]

const mockRSVPs = [
  createMockRSVP({ id: 'rsvp-1', guest_id: 'guest-1' })
]

const mockPhotos = [
  createMockPhoto({ id: 'photo-1', guest_id: 'guest-1' })
]

const mockMessages = [
  createMockMessage({ id: 'message-1', guest_id: 'guest-1' })
]

const mockEmailTemplates = [
  createMockEmailTemplate({ id: 'template-1', type: 'invitation' })
]

export const handlers = [
  // Authentication endpoints
  http.post('/api/auth/admin/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string }
    
    if (body.email === 'admin@test.com' && body.password === 'password123') {
      return HttpResponse.json(mockApiResponse({
        user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' },
        session: { access_token: 'mock-token', refresh_token: 'mock-refresh' }
      }))
    }
    
    return HttpResponse.json(
      mockApiResponse('Invalid credentials', false),
      { status: 401 }
    )
  }),

  http.get('/api/auth/check-admin', () => {
    return HttpResponse.json(mockApiResponse({
      isAdmin: true,
      user: { id: 'admin-1', email: 'admin@test.com' }
    }))
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json(mockApiResponse({ success: true }))
  }),

  // Guest endpoints
  http.get('/api/guests', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    
    let filteredGuests = mockGuests
    if (search) {
      filteredGuests = mockGuests.filter(guest => 
        guest.first_name.toLowerCase().includes(search.toLowerCase()) ||
        guest.last_name.toLowerCase().includes(search.toLowerCase()) ||
        guest.email.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    return HttpResponse.json(mockApiResponse(filteredGuests))
  }),

  http.post('/api/guests', async ({ request }) => {
    const body = await request.json() as any
    const newGuest = createMockGuest({
      id: `guest-${Date.now()}`,
      ...body
    })
    // In a real app, this would persist to database
    // For testing, we'll just return the created guest

    return HttpResponse.json(mockApiResponse(newGuest), { status: 201 })
  }),

  http.get('/api/guests/:id', ({ params }) => {
    const guest = mockGuests.find(g => g.id === params.id)
    if (!guest) {
      return HttpResponse.json(
        mockApiResponse('Guest not found', false),
        { status: 404 }
      )
    }
    return HttpResponse.json(mockApiResponse(guest))
  }),

  // RSVP endpoints
  http.post('/api/rsvp/submit', async ({ request }) => {
    const body = await request.json() as any
    const newRSVP = createMockRSVP({
      id: `rsvp-${Date.now()}`,
      ...body
    })
    // In a real app, this would persist to database

    return HttpResponse.json(mockApiResponse(newRSVP), { status: 201 })
  }),

  http.get('/api/rsvp/:guestId', ({ params }) => {
    const rsvp = mockRSVPs.find(r => r.guest_id === params.guestId)
    if (!rsvp) {
      return HttpResponse.json(
        mockApiResponse('RSVP not found', false),
        { status: 404 }
      )
    }
    return HttpResponse.json(mockApiResponse(rsvp))
  }),

  // Photo endpoints
  http.post('/api/photos/upload', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('photo') as File
    const guestId = formData.get('guestId') as string

    if (!file || !guestId) {
      return HttpResponse.json(
        mockApiResponse('Missing required fields', false),
        { status: 400 }
      )
    }

    const newPhoto = createMockPhoto({
      id: `photo-${Date.now()}`,
      guest_id: guestId,
      filename: file.name,
      file_size: file.size,
      mime_type: file.type
    })
    // In a real app, this would persist to database

    return HttpResponse.json(mockApiResponse(newPhoto), { status: 201 })
  }),

  http.get('/api/admin/photos', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    
    let filteredPhotos = mockPhotos
    if (status) {
      filteredPhotos = mockPhotos.filter(photo => photo.status === status)
    }
    
    return HttpResponse.json(mockApiResponse(filteredPhotos))
  }),

  http.patch('/api/admin/photos/:id', async ({ params, request }) => {
    const body = await request.json() as any
    const photo = mockPhotos.find(p => p.id === params.id)

    if (!photo) {
      return HttpResponse.json(
        mockApiResponse('Photo not found', false),
        { status: 404 }
      )
    }

    const updatedPhoto = { ...photo, ...body }
    return HttpResponse.json(mockApiResponse(updatedPhoto))
  }),

  // Message endpoints
  http.post('/api/messages/submit', async ({ request }) => {
    const body = await request.json() as any
    const newMessage = createMockMessage({
      id: `message-${Date.now()}`,
      ...body
    })
    // In a real app, this would persist to database

    return HttpResponse.json(mockApiResponse(newMessage), { status: 201 })
  }),

  http.get('/api/admin/messages', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    
    let filteredMessages = mockMessages
    if (status) {
      filteredMessages = mockMessages.filter(message => message.status === status)
    }
    
    return HttpResponse.json(mockApiResponse(filteredMessages))
  }),

  // Email template endpoints
  http.get('/api/admin/email-templates', () => {
    return HttpResponse.json(mockApiResponse(mockEmailTemplates))
  }),

  http.post('/api/admin/email-templates/test', async ({ request }) => {
    const body = await request.json() as any
    
    return HttpResponse.json(mockApiResponse({
      success: true,
      message: `Test email sent to ${body.test_email}`,
      tracking_id: 'test-tracking-123'
    }))
  }),

  // Wedding info endpoints
  http.get('/api/wedding-info', () => {
    return HttpResponse.json(mockApiResponse([
      {
        id: 'info-1',
        section: 'ceremony',
        title: 'Ceremony Details',
        content: 'Join us for our wedding ceremony...',
        order_index: 1,
        published: true
      }
    ]))
  }),

  // Invitation validation
  http.post('/api/invitation/validate', async ({ request }) => {
    const body = await request.json() as { code: string }
    const guest = mockGuests.find(g => g.invitation_code === body.code)
    
    if (!guest) {
      return HttpResponse.json(
        mockApiResponse('Invalid invitation code', false),
        { status: 404 }
      )
    }
    
    return HttpResponse.json(mockApiResponse({
      valid: true,
      guest: {
        id: guest.id,
        first_name: guest.first_name,
        last_name: guest.last_name
      }
    }))
  })
]
