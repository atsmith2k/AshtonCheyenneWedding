import { test, expect } from '@playwright/test'

/**
 * RSVP Management page tests
 * Tests the fixes for data fetching, error handling, and defensive programming
 */

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'test-admin@example.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!'

test.describe('RSVP Management Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin first
    await page.goto('/auth/admin-login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin')
    
    // Navigate to RSVP management page
    await page.goto('/admin/guests/rsvp')
  })

  test('should load RSVP management page without errors', async ({ page }) => {
    // Check that the page loads with proper title
    await expect(page.locator('h1')).toContainText('RSVP Management')
    
    // Check that the refresh button is present
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible()
    
    // Check that the add RSVP button is present
    await expect(page.locator('button:has-text("Add RSVP")')).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return an error
    await page.route('/api/admin/guests', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    // Reload the page to trigger the API call
    await page.reload()
    
    // Should show error toast
    await expect(page.locator('[role="alert"]')).toBeVisible()
    await expect(page.locator('text=Failed to load RSVP data')).toBeVisible()
  })

  test('should handle malformed API response gracefully', async ({ page }) => {
    // Mock API to return malformed data
    await page.route('/api/admin/guests', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: null }) // Invalid: data should be array
      })
    })

    // Reload the page to trigger the API call
    await page.reload()
    
    // Should show error toast with specific message
    await expect(page.locator('[role="alert"]')).toBeVisible()
    await expect(page.locator('text=Expected guest data to be an array')).toBeVisible()
  })

  test('should handle empty guest list gracefully', async ({ page }) => {
    // Mock API to return empty array
    await page.route('/api/admin/guests', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      })
    })

    // Reload the page to trigger the API call
    await page.reload()
    
    // Should show empty state
    await expect(page.locator('text=No RSVP entries found')).toBeVisible()
    await expect(page.locator('text=No guests have been added yet')).toBeVisible()
  })

  test('should handle valid guest data correctly', async ({ page }) => {
    // Mock API to return valid guest data
    const mockGuestData = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        rsvp_status: 'attending',
        meal_preference: 'chicken',
        dietary_restrictions: null,
        plus_one_allowed: true,
        plus_one_name: 'Jane Doe',
        plus_one_meal: 'vegetarian',
        rsvp_submitted_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        guest_groups: {
          group_name: 'Family'
        }
      }
    ]

    await page.route('/api/admin/guests', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockGuestData })
      })
    })

    // Reload the page to trigger the API call
    await page.reload()
    
    // Should display the guest data
    await expect(page.locator('text=John Doe')).toBeVisible()
    await expect(page.locator('text=john@example.com')).toBeVisible()
    await expect(page.locator('text=Family')).toBeVisible()
    
    // Should show correct statistics
    await expect(page.locator('text=1')).toBeVisible() // Total count
  })

  test('should handle search functionality with null safety', async ({ page }) => {
    // Mock API with guest data including null values
    const mockGuestData = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email: null, // Test null email
        phone: null,
        rsvp_status: 'attending',
        meal_preference: null,
        dietary_restrictions: null,
        plus_one_allowed: false,
        plus_one_name: null,
        plus_one_meal: null,
        rsvp_submitted_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        guest_groups: null // Test null group
      }
    ]

    await page.route('/api/admin/guests', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockGuestData })
      })
    })

    // Reload the page to trigger the API call
    await page.reload()
    
    // Should display the guest data without errors
    await expect(page.locator('text=John Doe')).toBeVisible()
    
    // Test search functionality with null values
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('John')
    
    // Should still show the guest
    await expect(page.locator('text=John Doe')).toBeVisible()
    
    // Clear search
    await searchInput.fill('')
    await expect(page.locator('text=John Doe')).toBeVisible()
  })

  test('should handle refresh button correctly', async ({ page }) => {
    let apiCallCount = 0
    
    await page.route('/api/admin/guests', async route => {
      apiCallCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      })
    })

    // Initial load
    await page.reload()
    expect(apiCallCount).toBe(1)
    
    // Click refresh button
    await page.click('button:has-text("Refresh")')
    
    // Should make another API call
    expect(apiCallCount).toBe(2)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('/api/admin/guests', async route => {
      await route.abort('failed')
    })

    // Reload the page to trigger the API call
    await page.reload()
    
    // Should show network error message
    await expect(page.locator('[role="alert"]')).toBeVisible()
    await expect(page.locator('text=Network error')).toBeVisible()
  })

  test('should handle sorting with null values', async ({ page }) => {
    // Mock API with mixed null and valid data
    const mockGuestData = [
      {
        id: '1',
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice@example.com',
        phone: null,
        rsvp_status: 'attending',
        meal_preference: 'chicken',
        dietary_restrictions: null,
        plus_one_allowed: false,
        plus_one_name: null,
        plus_one_meal: null,
        rsvp_submitted_at: '2024-01-15T10:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        guest_groups: { group_name: 'Friends' }
      },
      {
        id: '2',
        first_name: 'Bob',
        last_name: 'Johnson',
        email: null,
        phone: '+1234567890',
        rsvp_status: 'pending',
        meal_preference: null,
        dietary_restrictions: null,
        plus_one_allowed: true,
        plus_one_name: null,
        plus_one_meal: null,
        rsvp_submitted_at: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        guest_groups: null
      }
    ]

    await page.route('/api/admin/guests', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockGuestData })
      })
    })

    // Reload the page to trigger the API call
    await page.reload()
    
    // Should display both guests
    await expect(page.locator('text=Alice Smith')).toBeVisible()
    await expect(page.locator('text=Bob Johnson')).toBeVisible()
    
    // Test sorting by name (should handle null values gracefully)
    await page.click('button:has-text("Name")')
    
    // Should still display both guests without errors
    await expect(page.locator('text=Alice Smith')).toBeVisible()
    await expect(page.locator('text=Bob Johnson')).toBeVisible()
  })
})
