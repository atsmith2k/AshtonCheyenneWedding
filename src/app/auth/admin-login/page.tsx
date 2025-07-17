'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers'
import { getErrorMessage } from '@/lib/auth-errors'
import { Heart, Lock, ArrowRight, Home, AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const { user, isAdmin, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // If user is already authenticated as admin, redirect to admin dashboard
    if (user && isAdmin) {
      router.push('/admin')
    }
  }, [user, isAdmin, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Use the new admin login API
      const loginResponse = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim()
        }),
        credentials: 'include'
      })

      const loginData = await loginResponse.json()

      if (loginResponse.ok && loginData.success) {
        // Login successful, redirect to admin dashboard
        router.push('/admin')
      } else {
        // Use standardized error handling
        const errorMessage = getErrorMessage(loginData)
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = getErrorMessage(error)
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary-200 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary-200 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-100 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mb-6">
            <Heart className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h1 className="font-script text-4xl text-primary-600 mb-2">
              Ashton & Cheyenne
            </h1>
            <p className="text-neutral-600">Wedding Admin Portal</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="wedding-card p-8 animate-slide-up">
          <div className="text-center mb-8">
            <Lock className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-neutral-800 mb-2">
              Admin Login
            </h2>
            <p className="text-neutral-600 text-sm">
              Please sign in to access the wedding admin dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-3">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="wedding-input"
                placeholder="Enter your email"
                autoComplete="email"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-3">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="wedding-input"
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isSubmitting}
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-red-600 font-medium mb-1">
                      Authentication Error
                    </p>
                    <p className="text-sm text-red-600">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              variant="wedding"
              size="lg"
              className="w-full"
              disabled={!email.trim() || !password.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In to Admin Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-200">
            <div className="text-center">
              <p className="text-sm text-neutral-600 mb-4">
                Not an admin?
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Wedding Website
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="wedding-card p-6">
            <h3 className="font-medium text-neutral-800 mb-3">
              Admin Access
            </h3>
            <div className="text-sm text-neutral-600 space-y-2">
              <p>
                This area is restricted to wedding administrators only.
              </p>
              <p>
                If you're having trouble accessing the admin dashboard, 
                please contact the system administrator.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-neutral-500 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p>
            Secure admin portal for Ashton & Cheyenne's wedding 🔒
          </p>
        </div>
      </div>
    </div>
  )
}
