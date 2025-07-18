import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdminFromRequest } from '@/lib/admin-auth'
import { PhotoAnalytics } from '@/types/analytics'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/photos/analytics
 * Get comprehensive photo analytics for the admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Require admin authentication
    await requireAdminFromRequest(request)

    // Get all photos with related data
    const { data: photos, error } = await supabaseAdmin
      .from('photos')
      .select(`
        id,
        uploaded_by_guest_id,
        uploaded_by_admin_id,
        approved,
        featured,
        file_size,
        album_id,
        created_at,
        approved_at,
        moderation_notes
      `)

    if (error) {
      console.error('Error fetching photo analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch photo analytics' },
        { status: 500 }
      )
    }

    // Get album data
    const { data: albums, error: albumError } = await supabaseAdmin
      .from('photo_albums')
      .select('id, name, published')

    if (albumError) {
      console.error('Error fetching album data:', albumError)
      return NextResponse.json(
        { error: 'Failed to fetch album data' },
        { status: 500 }
      )
    }

    // Calculate basic statistics
    const totalPhotos = photos.length
    const approvedPhotos = photos.filter(p => p.approved).length
    const pendingPhotos = photos.filter(p => !p.approved && !p.moderation_notes).length
    const rejectedPhotos = photos.filter(p => !p.approved && p.moderation_notes).length
    const approvalRate = totalPhotos > 0 ? (approvedPhotos / totalPhotos) * 100 : 0

    // Calculate file size statistics
    const photosWithSize = photos.filter(p => p.file_size)
    const totalFileSize = photosWithSize.reduce((sum, p) => sum + (p.file_size || 0), 0)
    const averageFileSize = photosWithSize.length > 0 ? totalFileSize / photosWithSize.length : 0

    // Calculate upload statistics
    const guestUploads = photos.filter(p => p.uploaded_by_guest_id).length
    const adminUploads = photos.filter(p => p.uploaded_by_admin_id).length

    // Calculate recent uploads (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentUploads = photos.filter(p => 
      new Date(p.created_at) >= sevenDaysAgo
    ).length

    // Calculate uploads by day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const uploadsByDay: Record<string, number> = {}
    photos
      .filter(p => new Date(p.created_at) >= thirtyDaysAgo)
      .forEach(photo => {
        const date = new Date(photo.created_at).toISOString().split('T')[0]
        uploadsByDay[date] = (uploadsByDay[date] || 0) + 1
      })

    // Calculate moderation statistics
    const autoApproved = photos.filter(p => p.approved && !p.moderation_notes).length
    const manualApproved = photos.filter(p => p.approved && p.moderation_notes).length
    
    // Calculate average review time for approved photos
    const approvedWithTimes = photos.filter(p => p.approved && p.approved_at && p.created_at)
    const totalReviewTime = approvedWithTimes.reduce((sum, photo) => {
      const created = new Date(photo.created_at).getTime()
      const approved = new Date(photo.approved_at!).getTime()
      return sum + (approved - created)
    }, 0)
    const averageReviewTimeHours = approvedWithTimes.length > 0 
      ? (totalReviewTime / approvedWithTimes.length) / (1000 * 60 * 60) 
      : 0

    // Calculate album statistics
    const totalAlbums = albums.length
    const publishedAlbums = albums.filter(a => a.published).length
    
    const photosPerAlbum: Record<string, number> = {}
    albums.forEach(album => {
      const albumPhotos = photos.filter(p => p.album_id === album.id).length
      photosPerAlbum[album.name] = albumPhotos
    })

    // Calculate featured photo statistics
    const featuredPhotos = photos.filter(p => p.featured).length
    const featuredRate = approvedPhotos > 0 ? (featuredPhotos / approvedPhotos) * 100 : 0

    const analytics: PhotoAnalytics = {
      overview: {
        total_photos: totalPhotos,
        approved_photos: approvedPhotos,
        pending_photos: pendingPhotos,
        rejected_photos: rejectedPhotos,
        approval_rate: Math.round(approvalRate * 100) / 100,
        total_file_size: totalFileSize,
        average_file_size: Math.round(averageFileSize)
      },
      uploads: {
        guest_uploads: guestUploads,
        admin_uploads: adminUploads,
        recent_uploads_7_days: recentUploads,
        uploads_by_day: uploadsByDay
      },
      moderation: {
        pending_review: pendingPhotos,
        auto_approved: autoApproved,
        manual_approved: manualApproved,
        rejected: rejectedPhotos,
        average_review_time_hours: Math.round(averageReviewTimeHours * 100) / 100
      },
      albums: {
        total_albums: totalAlbums,
        published_albums: publishedAlbums,
        photos_per_album: photosPerAlbum
      },
      featured: {
        featured_photos: featuredPhotos,
        featured_rate: Math.round(featuredRate * 100) / 100
      }
    }

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('Error in photo analytics API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photo analytics' },
      { status: 500 }
    )
  }
}
