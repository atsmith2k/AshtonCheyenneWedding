'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminAuthProvider, useAdminAuth } from '@/components/admin-auth-provider'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'
import { MobileAdminHeader } from '@/components/admin/mobile-admin-header'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import { Toaster } from '@/components/ui/toaster'

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isLoading, isAuthenticated, isAdmin } = useAdminAuth()
  const { isMobile } = useMobileDetection()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/admin-login')
      } else if (!isAdmin) {
        router.push('/')
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile header */}
      <MobileAdminHeader />

      {/* Desktop header */}
      {!isMobile && <AdminHeader />}

      <div className="flex">
        {/* Desktop sidebar */}
        {!isMobile && <AdminSidebar />}

        <main className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutContent>
        {children}
      </AdminLayoutContent>
    </AdminAuthProvider>
  )
}
