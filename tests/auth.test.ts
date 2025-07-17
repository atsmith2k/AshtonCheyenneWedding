import { test, expect } from '@playwright/test'

/**
 * Authentication flow tests for the wedding website admin system
 * Tests login, logout, session management, and security measures
 */

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'test-admin@example.com'
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'TestPassword123!'
const NON_ADMIN_EMAIL = 'regular-user@example.com'
const INVALID_EMAIL = 'invalid@example.com'
const WEAK_PASSWORD = '123'

test.describe('Admin Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the admin login page
    await page.goto('/auth/admin-login')
  })

  test('should display admin login form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Admin Login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Please enter both email and password')).toBeVisible()
  })

  test('should show error for invalid email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show validation error or API error
    await expect(page.locator('[class*="error"], [class*="red"]')).toBeVisible()
  })

  test('should reject non-admin email', async ({ page }) => {
    await page.fill('input[type="email"]', NON_ADMIN_EMAIL)
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Admin privileges required')).toBeVisible()
  })

  test('should reject invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('should successfully login with valid admin credentials', async ({ page }) => {
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin')
    await expect(page.locator('text=Wedding Admin Dashboard')).toBeVisible()
  })

  test('should maintain session across page refreshes', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/admin')
    
    // Refresh the page
    await page.reload()
    
    // Should still be on admin dashboard
    await expect(page).toHaveURL('/admin')
    await expect(page.locator('text=Wedding Admin Dashboard')).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/admin')
    
    // Click user menu and logout
    await page.click('[data-testid="user-menu"], button:has-text("Admin")')
    await page.click('text=Sign Out')
    
    // Should redirect to login page
    await expect(page).toHaveURL('/auth/admin-login')
  })

  test('should redirect unauthenticated users from admin pages', async ({ page }) => {
    // Try to access admin page directly
    await page.goto('/admin')
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/admin-login')
  })

  test('should handle session expiry gracefully', async ({ page }) => {
    // This test would require manipulating session cookies or waiting for expiry
    // For now, we'll test the error handling when session is invalid
    
    // Login first
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/admin')
    
    // Clear session cookies to simulate expiry
    await page.context().clearCookies()
    
    // Try to access admin page
    await page.goto('/admin')
    
    // Should redirect to login
    await expect(page).toHaveURL('/auth/admin-login')
  })
})

test.describe('Admin API Security', () => {
  test('should reject requests without authentication', async ({ request }) => {
    const response = await request.get('/api/auth/check-admin')
    expect(response.status()).toBe(401)
  })

  test('should enforce rate limiting on auth endpoints', async ({ request }) => {
    // Make multiple rapid requests to trigger rate limiting
    const promises = Array.from({ length: 15 }, () =>
      request.post('/api/auth/admin/login', {
        data: { email: 'test@example.com', password: 'password' }
      })
    )
    
    const responses = await Promise.all(promises)
    
    // At least one should be rate limited
    const rateLimited = responses.some(response => response.status() === 429)
    expect(rateLimited).toBe(true)
  })

  test('should validate CSRF protection', async ({ request }) => {
    // Request without proper origin should be rejected
    const response = await request.post('/api/auth/admin/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      headers: { 'Origin': 'https://malicious-site.com' }
    })
    
    expect(response.status()).toBe(403)
  })

  test('should set secure headers', async ({ request }) => {
    const response = await request.get('/auth/admin-login')
    
    expect(response.headers()['x-frame-options']).toBe('DENY')
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    expect(response.headers()['x-xss-protection']).toBe('1; mode=block')
    expect(response.headers()['content-security-policy']).toBeTruthy()
  })
})

test.describe('Admin User Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/auth/admin-login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/admin')
  })

  test('should display current admin user info', async ({ page }) => {
    // Check if user info is displayed in header
    await expect(page.locator('[data-testid="user-menu"], button:has-text("Admin")')).toBeVisible()
  })

  test('should handle session refresh automatically', async ({ page }) => {
    // Wait for some time to trigger auto-refresh
    await page.waitForTimeout(2000)
    
    // Page should still be accessible
    await expect(page.locator('text=Wedding Admin Dashboard')).toBeVisible()
  })
})

test.describe('Error Handling', () => {
  test('should display user-friendly error messages', async ({ page }) => {
    await page.goto('/auth/admin-login')
    
    // Test various error scenarios
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show user-friendly error, not technical details
    const errorText = await page.locator('[class*="error"], [class*="red"]').textContent()
    expect(errorText).not.toContain('PGRST')
    expect(errorText).not.toContain('JWT')
    expect(errorText).not.toContain('500')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept and fail API requests
    await page.route('/api/auth/admin/login', route => route.abort())
    
    await page.goto('/auth/admin-login')
    await page.fill('input[type="email"]', ADMIN_EMAIL)
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    
    // Should show network error message
    await expect(page.locator('text=Network error')).toBeVisible()
  })
})
