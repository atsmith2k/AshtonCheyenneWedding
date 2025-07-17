import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

/**
 * Security middleware for protecting admin routes and implementing rate limiting
 * This runs on the Edge Runtime for optimal performance
 */

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Rate limiting configuration
const RATE_LIMITS = {
  admin: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes for admin
  auth: { requests: 10, windowMs: 15 * 60 * 1000 },   // 10 requests per 15 minutes for auth
  api: { requests: 200, windowMs: 15 * 60 * 1000 },   // 200 requests per 15 minutes for general API
}

function getRateLimitKey(request: NextRequest, type: string): string {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  return `${type}:${ip}`
}

function checkRateLimit(request: NextRequest, type: keyof typeof RATE_LIMITS): boolean {
  const key = getRateLimitKey(request, type)
  const limit = RATE_LIMITS[type]
  const now = Date.now()
  
  const current = rateLimitMap.get(key)
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitMap.set(key, { count: 1, resetTime: now + limit.windowMs })
    return true
  }
  
  if (current.count >= limit.requests) {
    return false
  }
  
  current.count++
  return true
}

function addRateLimitHeaders(response: NextResponse, request: NextRequest, type: keyof typeof RATE_LIMITS) {
  const key = getRateLimitKey(request, type)
  const limit = RATE_LIMITS[type]
  const current = rateLimitMap.get(key)
  
  if (current) {
    response.headers.set('X-RateLimit-Limit', limit.requests.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(0, limit.requests - current.count).toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(current.resetTime / 1000).toString())
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create Supabase client for session management
  const { supabase, response: supabaseResponse } = createClient(request)

  // Use the Supabase response as base (includes cookie handling)
  const response = supabaseResponse

  // Add comprehensive security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  // Additional security headers
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // CSRF protection for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    // Allow same-origin requests and localhost for development
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`,
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ].filter(Boolean)

    if (origin && !allowedOrigins.includes(origin)) {
      return NextResponse.json(
        { error: 'CSRF protection: Invalid origin' },
        { status: 403 }
      )
    }
  }
  
  // Handle admin API routes
  if (pathname.startsWith('/api/admin/')) {
    // Rate limiting for admin routes
    if (!checkRateLimit(request, 'admin')) {
      const rateLimitResponse = NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
      addRateLimitHeaders(rateLimitResponse, request, 'admin')
      return rateLimitResponse
    }

    // Add admin rate limit headers
    addRateLimitHeaders(response, request, 'admin')

    // Skip auth check for initialize route (used for setup)
    if (pathname === '/api/admin/initialize') {
      return response
    }

    // Note: Actual admin authentication is handled in individual API routes
    // using the requireAdmin() function from admin-auth.ts
    return response
  }
  
  // Handle auth API routes
  if (pathname.startsWith('/api/auth/')) {
    // Rate limiting for auth routes
    if (!checkRateLimit(request, 'auth')) {
      const rateLimitResponse = NextResponse.json(
        { error: 'Too many authentication attempts. Please try again later.' },
        { status: 429 }
      )
      addRateLimitHeaders(rateLimitResponse, request, 'auth')
      return rateLimitResponse
    }
    
    addRateLimitHeaders(response, request, 'auth')
    return response
  }
  
  // Handle other API routes
  if (pathname.startsWith('/api/')) {
    // General API rate limiting
    if (!checkRateLimit(request, 'api')) {
      const rateLimitResponse = NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
      addRateLimitHeaders(rateLimitResponse, request, 'api')
      return rateLimitResponse
    }
    
    addRateLimitHeaders(response, request, 'api')
    return response
  }
  
  // Handle legacy admin login redirect
  if (pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/auth/admin-login', request.url))
  }

  // Handle admin pages
  if (pathname.startsWith('/admin')) {
    // Admin pages are protected by the layout.tsx file
    // This middleware just adds security headers
    return response
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
