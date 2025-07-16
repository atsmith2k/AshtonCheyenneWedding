import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerSupabaseClient()
  
  // Check if user is authenticated and is admin
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/admin/login')
  }

  // Check if user is admin (this will be implemented with proper admin check)
  const adminEmails = process.env.ADMIN_EMAIL?.split(',').map(email => email.trim()) || []
  const isAdmin = adminEmails.includes(session.user.email || '')
  
  if (!isAdmin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
