'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface AdminUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: 'admin' | 'super_admin'
}

interface AdminAuthContextType {
  user: User | null
  adminUser: AdminUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

interface AdminAuthProviderProps {
  children: ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientSupabaseClient()

  // Check admin status
  const checkAdminStatus = async (currentUser: User | null) => {
    if (!currentUser?.email) {
      setAdminUser(null)
      return false
    }

    try {
      const response = await fetch('/api/auth/check-admin', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.isAdmin && data.user) {
          setAdminUser(data.user)
          return true
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    }

    setAdminUser(null)
    return false
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          if (mounted) {
            setUser(null)
            setAdminUser(null)
            setIsLoading(false)
          }
          return
        }

        if (mounted) {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await checkAdminStatus(session.user)
          } else {
            setAdminUser(null)
          }
          
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setUser(null)
          setAdminUser(null)
          setIsLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state change:', event, session?.user?.email)

        setUser(session?.user ?? null)

        if (session?.user) {
          await checkAdminStatus(session.user)
        } else {
          setAdminUser(null)
        }

        setIsLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Auto-refresh session
  useEffect(() => {
    if (!user || !adminUser) return

    const refreshInterval = setInterval(async () => {
      try {
        await fetch('/api/auth/admin/refresh', {
          method: 'POST',
          credentials: 'include'
        })
      } catch (error) {
        console.error('Session refresh error:', error)
      }
    }, 15 * 60 * 1000) // Refresh every 15 minutes

    return () => clearInterval(refreshInterval)
  }, [user, adminUser])

  const signOut = async () => {
    try {
      // Call logout API
      await fetch('/api/auth/admin/logout', {
        method: 'POST',
        credentials: 'include'
      })

      // Sign out from Supabase client
      await supabase.auth.signOut()

      // Clear state
      setUser(null)
      setAdminUser(null)
    } catch (error) {
      console.error('Sign out error:', error)
      // Force clear state even if API call fails
      setUser(null)
      setAdminUser(null)
    }
  }

  const refreshSession = async () => {
    try {
      const response = await fetch('/api/auth/admin/refresh', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setAdminUser(data.user)
        }
      }
    } catch (error) {
      console.error('Session refresh error:', error)
    }
  }

  const value: AdminAuthContextType = {
    user,
    adminUser,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: !!adminUser,
    signOut,
    refreshSession
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}
