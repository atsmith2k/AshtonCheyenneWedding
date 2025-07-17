import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Force dynamic rendering - this route uses database operations and file uploads
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const guestId = formData.get('guestId') as string
    const caption = formData.get('caption') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `photos/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('wedding-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('wedding-photos')
      .getPublicUrl(filePath)

    // Save photo record to database
    const { data: photo, error: dbError } = await supabaseAdmin
      .from('photos')
      .insert({
        file_path: filePath,
        original_filename: file.name,
        caption: caption || null,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by_guest_id: guestId || null,
        approved: false, // Requires admin approval
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Error saving photo record:', dbError)
      
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage
        .from('wedding-photos')
        .remove([filePath])

      return NextResponse.json(
        { error: 'Failed to save photo record' },
        { status: 500 }
      )
    }

    // Log analytics event
    if (guestId) {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          event_type: 'photo_upload',
          guest_id: guestId,
          metadata: {
            filename: file.name,
            file_size: file.size,
            mime_type: file.type
          }
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded successfully and is pending approval',
      data: {
        ...photo,
        url: publicUrl
      }
    })

  } catch (error) {
    console.error('Error in photo upload:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const approved = searchParams.get('approved')
    const albumId = searchParams.get('albumId')

    let query = supabaseAdmin
      .from('photos')
      .select(`
        *,
        photo_albums (
          id,
          name,
          description
        ),
        guests (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by approval status
    if (approved !== null) {
      query = query.eq('approved', approved === 'true')
    }

    // Filter by album
    if (albumId) {
      query = query.eq('album_id', albumId)
    }

    const { data: photos, error } = await query

    if (error) {
      console.error('Error fetching photos:', error)
      return NextResponse.json(
        { error: 'Failed to fetch photos' },
        { status: 500 }
      )
    }

    // Add public URLs to photos
    const photosWithUrls = photos.map(photo => ({
      ...photo,
      url: supabaseAdmin!.storage
        .from('wedding-photos')
        .getPublicUrl(photo.file_path).data.publicUrl
    }))

    return NextResponse.json({
      success: true,
      data: photosWithUrls
    })

  } catch (error) {
    console.error('Error in photos GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
