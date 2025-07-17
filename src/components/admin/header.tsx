'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAdminAuth } from '@/components/admin-auth-provider'
import { Bell, User, LogOut, Menu } from 'lucide-react'

export function AdminHeader() {
  const { user, adminUser, signOut } = useAdminAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="bg-white border-b border-neutral-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-neutral-800">
            Wedding Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2"
            >
              <User className="w-5 h-5" />
              <span className="hidden md:inline">
                {adminUser?.firstName || user?.email?.split('@')[0] || 'Admin'}
              </span>
            </Button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-neutral-100">
                  <p className="text-sm font-medium text-neutral-800">
                    {adminUser?.firstName && adminUser?.lastName
                      ? `${adminUser.firstName} ${adminUser.lastName}`
                      : user?.email
                    }
                  </p>
                  <p className="text-xs text-neutral-500">
                    {adminUser?.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}
                  </p>
                </div>
                <button
                  onClick={() => signOut()}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
