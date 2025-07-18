'use client'

import { PhotoModerationPanel } from '@/components/admin/PhotoModerationPanel'

export default function MediaManagementPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Media Management</h1>
        <p className="text-neutral-600">Manage wedding photos and guest uploads</p>
      </div>

      <PhotoModerationPanel />
    </div>
  )
}
