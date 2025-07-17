import { chromium, FullConfig } from '@playwright/test'

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for wedding website tests...')
  
  // Get base URL from config
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...')
    await page.goto(baseURL, { waitUntil: 'networkidle' })
    
    // Verify the application is running
    await page.waitForSelector('body', { timeout: 30000 })
    console.log('✅ Application is ready')
    
    // Setup test data if needed
    await setupTestData(page, baseURL)
    
    // Setup admin authentication state
    await setupAdminAuth(page, baseURL)
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
  
  console.log('✅ Global setup completed successfully')
}

/**
 * Setup test data in the database
 */
async function setupTestData(page: any, baseURL: string) {
  console.log('📊 Setting up test data...')
  
  // You can add API calls here to setup test data
  // For example, creating test guests, RSVPs, etc.
  
  // Example: Create test guest via API
  try {
    const response = await page.request.post(`${baseURL}/api/admin/guests`, {
      data: {
        firstName: 'Test',
        lastName: 'Guest',
        email: 'test.guest@example.com',
        invitationCode: 'TEST123',
        plusOneAllowed: true
      },
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok()) {
      console.log('✅ Test guest created')
    } else {
      console.log('ℹ️ Test guest may already exist')
    }
  } catch (error) {
    console.log('ℹ️ Skipping test data setup (API not available)')
  }
}

/**
 * Setup admin authentication state
 */
async function setupAdminAuth(page: any, baseURL: string) {
  console.log('🔐 Setting up admin authentication...')
  
  const adminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@test.com'
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!'
  
  try {
    // Navigate to admin login
    await page.goto(`${baseURL}/auth/admin-login`)
    
    // Fill login form
    await page.fill('input[type="email"]', adminEmail)
    await page.fill('input[type="password"]', adminPassword)
    await page.click('button[type="submit"]')
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin', { timeout: 10000 })
    
    // Save authentication state
    await page.context().storageState({ path: 'tests/auth-state.json' })
    console.log('✅ Admin authentication state saved')
    
  } catch (error) {
    console.log('ℹ️ Admin authentication setup failed (may not be configured)')
    console.log('   This is normal if admin credentials are not set up yet')
  }
}

export default globalSetup
