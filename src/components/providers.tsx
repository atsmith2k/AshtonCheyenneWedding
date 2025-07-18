'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type Guest = Database['public']['Tables']['guests']['Row']

interface AuthContextType {
  user: User | null
  guest: Guest | null
  isLoading: boolean
  isAdmin: boolean
  signInWithInvitationCode: (code: string) => Promise<{ success: boolean; error?: string }>
  refreshGuestData: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [guest, setGuest] = useState<Guest | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    // Check for existing guest session
    const checkExistingSession = () => {
      try {
        const storedGuest = localStorage.getItem('wedding_guest')
        if (storedGuest) {
          const guestData = JSON.parse(storedGuest)
          setGuest(guestData)

          // Create mock user
          const mockUser = {
            id: guestData.id,
            email: guestData.email || `guest-${guestData.invitationCode}@temp.com`,
            user_metadata: {
              invitation_code: guestData.invitationCode,
              first_name: guestData.firstName,
              last_name: guestData.lastName,
            }
          } as any

          setUser(mockUser)
        }
      } catch (error) {
        console.error('Error loading stored session:', error)
      }

      setIsLoading(false)
    }

    checkExistingSession()
  }, [])

  const loadUserData = async (user: User) => {
    try {
      // Check if user is admin - now done server-side only
      // We'll need to make an API call to check admin status securely
      let userIsAdmin = false

      try {
        const response = await fetch('/api/auth/check-admin', {
          method: 'GET',
          credentials: 'include'
        })

        if (response.ok) {
          const { isAdmin } = await response.json()
          userIsAdmin = isAdmin
          setIsAdmin(userIsAdmin)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      }

      // If not admin, try to load guest data
      if (!userIsAdmin) {
        const invitationCode = user.user_metadata?.invitation_code
        if (invitationCode) {
          const { data: guestData } = await supabase
            .from('guests')
            .select('*')
            .eq('invitation_code', invitationCode)
            .single()
          
          setGuest(guestData)
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const signInWithInvitationCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate invitation code via API
      const response = await fetch('/api/auth/validate-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationCode: code })
      })

      const result = await response.json()

      if (!response.ok) {
        return { success: false, error: result.error || 'Invalid invitation code' }
      }

      // Store guest data in session/local storage for now
      // In a full implementation, you'd use proper session management
      localStorage.setItem('wedding_guest', JSON.stringify(result.guest))
      setGuest(result.guest)

      // Create a mock user for the session
      const mockUser = {
        id: result.guest.id,
        email: result.guest.email || `guest-${code}@temp.com`,
        user_metadata: {
          invitation_code: code,
          first_name: result.guest.firstName,
          last_name: result.guest.lastName,
        }
      } as any

      setUser(mockUser)

      return { success: true }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const refreshGuestData = async () => {
    try {
      if (!guest?.id && !guest?.invitation_code) {
        return
      }

      // Fetch fresh guest data from the server
      const response = await fetch('/api/guest/current', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guest?.id || '',
          'x-invitation-code': guest?.invitation_code || ''
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.guest) {
          // Update guest data in state and localStorage
          setGuest(result.guest)
          localStorage.setItem('wedding_guest', JSON.stringify(result.guest))
        }
      }
    } catch (error) {
      console.error('Error refreshing guest data:', error)
    }
  }

  const signOut = async () => {
    localStorage.removeItem('wedding_guest')
    setUser(null)
    setGuest(null)
    setIsAdmin(false)
  }

  const value: AuthContextType = {
    user,
    guest,
    isLoading,
    isAdmin,
    signInWithInvitationCode,
    refreshGuestData,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
