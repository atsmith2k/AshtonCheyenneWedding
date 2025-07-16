'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Mail, 
  Image, 
  BarChart3,
  Settings,
  Heart
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Content Management',
    href: '/admin/content',
    icon: FileText,
  },
  {
    name: 'Guest Management',
    href: '/admin/guests',
    icon: Users,
  },
  {
    name: 'Communications',
    href: '/admin/communications',
    icon: Mail,
  },
  {
    name: 'Media Management',
    href: '/admin/media',
    icon: Image,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="admin-sidebar w-64 min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-primary-500" />
          <div>
            <h1 className="font-script text-xl text-primary-600">
              Ashton & Cheyenne
            </h1>
            <p className="text-xs text-neutral-500">Wedding Admin</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'admin-nav-item',
                  isActive && 'active'
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
