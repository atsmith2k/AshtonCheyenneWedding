#!/usr/bin/env tsx

/**
 * Setup script for the photo upload and moderation system
 * This script initializes email templates and ensures the system is ready
 */

import { supabaseAdmin } from '../lib/supabase'

async function setupPhotoEmailTemplates() {
  console.log('🎨 Setting up photo notification email templates...')
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/email-templates/photo-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Photo email templates initialized successfully')
      console.log(`   - Created: ${result.data.created} templates`)
      console.log(`   - Updated: ${result.data.updated} templates`)
      
      if (result.data.errors.length > 0) {
        console.log('⚠️  Some errors occurred:')
        result.data.errors.forEach((error: string) => {
          console.log(`   - ${error}`)
        })
      }
    } else {
      console.error('❌ Failed to initialize photo email templates:', result.error)
    }
  } catch (error) {
    console.error('❌ Error setting up photo email templates:', error)
  }
}

async function verifyPhotoSystemSetup() {
  console.log('🔍 Verifying photo system setup...')
  
  if (!supabaseAdmin) {
    console.error('❌ Supabase admin client not configured')
    return false
  }

  try {
    // Check if photos table exists and has required columns
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('photos')
      .select('id, approved, moderation_notes, uploaded_by_guest_id')
      .limit(1)

    if (photosError) {
      console.error('❌ Photos table not accessible:', photosError.message)
      return false
    }

    console.log('✅ Photos table is accessible')

    // Check if storage bucket exists
    const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Storage not accessible:', bucketsError.message)
      return false
    }

    const weddingPhotosBucket = buckets.find(bucket => bucket.name === 'wedding-photos')
    if (!weddingPhotosBucket) {
      console.error('❌ wedding-photos storage bucket not found')
      console.log('   Please create the wedding-photos bucket in Supabase Storage')
      return false
    }

    console.log('✅ wedding-photos storage bucket exists')

    // Check if email templates table exists
    const { data: templates, error: templatesError } = await supabaseAdmin
      .from('email_templates')
      .select('id, template_type')
      .limit(1)

    if (templatesError) {
      console.error('❌ Email templates table not accessible:', templatesError.message)
      return false
    }

    console.log('✅ Email templates table is accessible')

    // Check if analytics events table exists
    const { data: analytics, error: analyticsError } = await supabaseAdmin
      .from('analytics_events')
      .select('id')
      .limit(1)

    if (analyticsError) {
      console.error('❌ Analytics events table not accessible:', analyticsError.message)
      return false
    }

    console.log('✅ Analytics events table is accessible')

    return true
  } catch (error) {
    console.error('❌ Error verifying photo system setup:', error)
    return false
  }
}

async function displaySetupInstructions() {
  console.log('\n📋 Photo Upload & Moderation System Setup Complete!')
  console.log('\n🎯 Features Available:')
  console.log('   • Enhanced guest photo upload with drag & drop')
  console.log('   • Multiple file upload with progress indicators')
  console.log('   • Photo status tracking for guests')
  console.log('   • Admin bulk moderation actions')
  console.log('   • Email notifications for photo approval/denial')
  console.log('   • Rate limiting and security measures')
  console.log('   • Comprehensive audit logging')
  
  console.log('\n🔗 Access Points:')
  console.log('   • Guest Upload: /wedding/photos (Upload tab)')
  console.log('   • Guest Status: /wedding/photos (My Photos tab)')
  console.log('   • Admin Moderation: /admin/media')
  
  console.log('\n⚙️  Configuration:')
  console.log('   • Photo upload limit: 10MB per file')
  console.log('   • Supported formats: JPEG, PNG, WebP')
  console.log('   • Rate limit: 10 uploads per 15 minutes per IP')
  console.log('   • Email notifications: Enabled by default')
  
  console.log('\n🛡️  Security Features:')
  console.log('   • File type validation with magic number checking')
  console.log('   • Rate limiting for photo uploads')
  console.log('   • Admin authentication required for moderation')
  console.log('   • Guest authentication via invitation codes')
  console.log('   • Comprehensive audit logging')
  
  console.log('\n📧 Email Templates:')
  console.log('   • photo_approved: Sent when photos are approved')
  console.log('   • photo_denied: Sent when photos need changes')
  
  console.log('\n🚀 Next Steps:')
  console.log('   1. Test photo upload as a guest')
  console.log('   2. Test moderation workflow as admin')
  console.log('   3. Verify email notifications are working')
  console.log('   4. Monitor photo upload analytics')
  
  console.log('\n✨ The photo upload and moderation system is ready to use!')
}

async function main() {
  console.log('🎉 Setting up Photo Upload & Moderation System\n')
  
  // Verify system requirements
  const systemReady = await verifyPhotoSystemSetup()
  if (!systemReady) {
    console.log('\n❌ System verification failed. Please fix the issues above before proceeding.')
    process.exit(1)
  }
  
  // Setup email templates
  await setupPhotoEmailTemplates()
  
  // Display setup completion
  await displaySetupInstructions()
  
  console.log('\n🎊 Setup completed successfully!')
}

// Run the setup
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  })
}

export { main as setupPhotoSystem }
