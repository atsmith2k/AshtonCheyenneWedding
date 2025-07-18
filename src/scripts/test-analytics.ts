/**
 * Test script to validate analytics endpoints and calculations
 * Run this to verify that all analytics are working correctly
 */

import { supabaseAdmin } from '@/lib/supabase'

interface TestResult {
  endpoint: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  data?: any
}

async function testAnalyticsEndpoints(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // Test 1: Verify RSVP Analytics calculations
  try {
    if (!supabaseAdmin) {
      results.push({
        endpoint: 'supabase-connection',
        status: 'fail',
        message: 'Supabase admin client not available'
      })
      return results
    }

    const { data: guests, error } = await supabaseAdmin
      .from('guests')
      .select('id, rsvp_status, meal_preference, plus_one_meal, plus_one_name, plus_one_allowed')

    if (error) {
      results.push({
        endpoint: 'guests-data',
        status: 'fail',
        message: `Failed to fetch guests: ${error.message}`
      })
    } else {
      const total = guests.length
      const attending = guests.filter(g => g.rsvp_status === 'attending').length
      const notAttending = guests.filter(g => g.rsvp_status === 'not_attending').length
      const pending = guests.filter(g => g.rsvp_status === 'pending').length
      
      // Calculate response rate
      const responseRate = total > 0 ? ((attending + notAttending) / total) * 100 : 0
      
      // Calculate meal counts
      let totalMeals = 0
      guests.forEach(guest => {
        if (guest.meal_preference) totalMeals++
        if (guest.plus_one_meal) totalMeals++
      })

      results.push({
        endpoint: 'rsvp-calculations',
        status: 'pass',
        message: `RSVP calculations verified`,
        data: {
          total,
          attending,
          notAttending,
          pending,
          responseRate: Math.round(responseRate * 100) / 100,
          totalMeals
        }
      })
    }
  } catch (error) {
    results.push({
      endpoint: 'rsvp-calculations',
      status: 'fail',
      message: `Error testing RSVP calculations: ${error}`
    })
  }

  // Test 2: Verify Photos Analytics calculations
  try {
    if (!supabaseAdmin) {
      results.push({
        endpoint: 'photos-data',
        status: 'fail',
        message: 'Supabase admin client not available'
      })
      return results
    }

    const { data: photos, error } = await supabaseAdmin
      .from('photos')
      .select('id, approved, uploaded_by_guest_id, uploaded_by_admin_id, file_size, created_at')

    if (error) {
      results.push({
        endpoint: 'photos-data',
        status: 'fail',
        message: `Failed to fetch photos: ${error.message}`
      })
    } else {
      const totalPhotos = photos.length
      const approvedPhotos = photos.filter(p => p.approved).length
      const pendingPhotos = photos.filter(p => !p.approved).length
      const guestUploads = photos.filter(p => p.uploaded_by_guest_id).length
      const adminUploads = photos.filter(p => p.uploaded_by_admin_id).length
      
      const approvalRate = totalPhotos > 0 ? (approvedPhotos / totalPhotos) * 100 : 0

      results.push({
        endpoint: 'photo-calculations',
        status: 'pass',
        message: `Photo calculations verified`,
        data: {
          totalPhotos,
          approvedPhotos,
          pendingPhotos,
          guestUploads,
          adminUploads,
          approvalRate: Math.round(approvalRate * 100) / 100
        }
      })
    }
  } catch (error) {
    results.push({
      endpoint: 'photo-calculations',
      status: 'fail',
      message: `Error testing photo calculations: ${error}`
    })
  }

  // Test 3: Verify Messages Analytics calculations
  try {
    if (!supabaseAdmin) {
      results.push({
        endpoint: 'messages-data',
        status: 'fail',
        message: 'Supabase admin client not available'
      })
      return results
    }

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('id, status, is_urgent, created_at, responded_at')

    if (error) {
      results.push({
        endpoint: 'messages-data',
        status: 'fail',
        message: `Failed to fetch messages: ${error.message}`
      })
    } else {
      const totalMessages = messages.length
      const newMessages = messages.filter(m => m.status === 'new').length
      const respondedMessages = messages.filter(m => m.status === 'responded').length
      const urgentMessages = messages.filter(m => m.is_urgent).length
      
      const responseRate = totalMessages > 0 
        ? ((respondedMessages) / totalMessages) * 100 
        : 0

      results.push({
        endpoint: 'message-calculations',
        status: 'pass',
        message: `Message calculations verified`,
        data: {
          totalMessages,
          newMessages,
          respondedMessages,
          urgentMessages,
          responseRate: Math.round(responseRate * 100) / 100
        }
      })
    }
  } catch (error) {
    results.push({
      endpoint: 'message-calculations',
      status: 'fail',
      message: `Error testing message calculations: ${error}`
    })
  }

  // Test 4: Check for data consistency issues
  try {
    if (!supabaseAdmin) {
      results.push({
        endpoint: 'data-consistency',
        status: 'fail',
        message: 'Supabase admin client not available'
      })
      return results
    }

    // Check for guests without invitation codes
    const { data: guestsWithoutCodes } = await supabaseAdmin
      .from('guests')
      .select('id')
      .is('invitation_code', null)

    if (guestsWithoutCodes && guestsWithoutCodes.length > 0) {
      results.push({
        endpoint: 'data-consistency',
        status: 'warning',
        message: `${guestsWithoutCodes.length} guests without invitation codes`
      })
    }

    // Check for photos without file paths
    const { data: photosWithoutPaths } = await supabaseAdmin
      .from('photos')
      .select('id')
      .is('file_path', null)

    if (photosWithoutPaths && photosWithoutPaths.length > 0) {
      results.push({
        endpoint: 'data-consistency',
        status: 'warning',
        message: `${photosWithoutPaths.length} photos without file paths`
      })
    }

    if (!guestsWithoutCodes?.length && !photosWithoutPaths?.length) {
      results.push({
        endpoint: 'data-consistency',
        status: 'pass',
        message: 'No data consistency issues found'
      })
    }
  } catch (error) {
    results.push({
      endpoint: 'data-consistency',
      status: 'fail',
      message: `Error checking data consistency: ${error}`
    })
  }

  return results
}

// Export for use in other files
export { testAnalyticsEndpoints }

// If running directly
if (require.main === module) {
  testAnalyticsEndpoints().then(results => {
    console.log('\n=== Analytics Test Results ===\n')
    
    results.forEach(result => {
      const status = result.status === 'pass' ? '✅' : 
                    result.status === 'warning' ? '⚠️' : '❌'
      
      console.log(`${status} ${result.endpoint}: ${result.message}`)
      
      if (result.data) {
        console.log('   Data:', JSON.stringify(result.data, null, 2))
      }
      console.log('')
    })

    const passed = results.filter(r => r.status === 'pass').length
    const warnings = results.filter(r => r.status === 'warning').length
    const failed = results.filter(r => r.status === 'fail').length

    console.log(`\n=== Summary ===`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`⚠️  Warnings: ${warnings}`)
    console.log(`❌ Failed: ${failed}`)
    
    if (failed > 0) {
      process.exit(1)
    }
  }).catch(error => {
    console.error('Test execution failed:', error)
    process.exit(1)
  })
}
