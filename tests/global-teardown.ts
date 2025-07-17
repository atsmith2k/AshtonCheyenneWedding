import { FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

/**
 * Global teardown for Playwright tests
 * Runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...')
  
  try {
    // Clean up authentication state file
    const authStatePath = path.join(__dirname, 'auth-state.json')
    if (fs.existsSync(authStatePath)) {
      fs.unlinkSync(authStatePath)
      console.log('✅ Authentication state cleaned up')
    }
    
    // Clean up test data if needed
    await cleanupTestData()
    
    // Clean up temporary files
    await cleanupTempFiles()
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw error to avoid failing the test run
  }
  
  console.log('✅ Global teardown completed')
}

/**
 * Clean up test data from the database
 */
async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...')
  
  // You can add cleanup logic here
  // For example, removing test guests, RSVPs, photos, etc.
  
  // Note: In a real application, you might want to:
  // 1. Use a separate test database
  // 2. Use database transactions that can be rolled back
  // 3. Mark test data with special flags for easy cleanup
  
  console.log('✅ Test data cleanup completed')
}

/**
 * Clean up temporary files created during tests
 */
async function cleanupTempFiles() {
  console.log('📁 Cleaning up temporary files...')
  
  const tempDirs = [
    'test-results/temp',
    'uploads/temp',
    'screenshots/temp'
  ]
  
  for (const dir of tempDirs) {
    const fullPath = path.join(process.cwd(), dir)
    if (fs.existsSync(fullPath)) {
      try {
        fs.rmSync(fullPath, { recursive: true, force: true })
        console.log(`✅ Cleaned up ${dir}`)
      } catch (error) {
        console.log(`⚠️ Could not clean up ${dir}:`, error)
      }
    }
  }
}

export default globalTeardown
