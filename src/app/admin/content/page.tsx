'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Edit, 
  Save, 
  Eye, 
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface WeddingInfoItem {
  id: string
  section: string
  title: string
  content: string
  order_index: number
  published: boolean
  updated_at: string
}

export default function ContentManagement() {
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    published: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchWeddingInfo()
  }, [])

  const fetchWeddingInfo = async () => {
    try {
      const response = await fetch('/api/wedding-info')
      const result = await response.json()

      if (response.ok && result.success) {
        setWeddingInfo(result.data)
      }
    } catch (error) {
      console.error('Error fetching wedding info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: WeddingInfoItem) => {
    setEditingItem(item.id)
    setEditForm({
      title: item.title,
      content: item.content,
      published: item.published
    })
  }

  const handleSave = async (item: WeddingInfoItem) => {
    setSaving(true)
    
    try {
      const response = await fetch('/api/wedding-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: item.section,
          title: editForm.title,
          content: editForm.content,
          orderIndex: item.order_index,
          published: editForm.published
        })
      })

      if (response.ok) {
        await fetchWeddingInfo()
        setEditingItem(null)
      }
    } catch (error) {
      console.error('Error saving content:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingItem(null)
    setEditForm({ title: '', content: '', published: true })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-800">Content Management</h1>
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="wedding-card p-6 animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-neutral-200 rounded w-1/3" />
                <div className="h-4 bg-neutral-200 rounded w-full" />
                <div className="h-4 bg-neutral-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Content Management</h1>
          <p className="text-neutral-600">Manage your wedding website content</p>
        </div>
        <Button variant="wedding">
          <Plus className="w-4 h-4 mr-2" />
          Add New Section
        </Button>
      </div>

      {/* Content Sections */}
      <div className="grid gap-6">
        {weddingInfo.map((item) => (
          <div key={item.id} className="wedding-card p-6">
            {editingItem === item.id ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-neutral-800">
                    Editing: {item.section}
                  </h3>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editForm.published}
                        onChange={(e) => setEditForm(prev => ({ ...prev, published: e.target.checked }))}
                        className="rounded"
                      />
                      Published
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="wedding-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    className="wedding-input"
                    rows={8}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleSave(item)}
                    disabled={saving}
                    variant="wedding"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-800">
                        {item.title}
                      </h3>
                      <p className="text-sm text-neutral-500">
                        Section: {item.section} • 
                        {item.published ? (
                          <span className="text-green-600 ml-1">Published</span>
                        ) : (
                          <span className="text-red-600 ml-1">Draft</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <div 
                    className="text-neutral-600"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                </div>

                <div className="text-xs text-neutral-400">
                  Last updated: {new Date(item.updated_at).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {weddingInfo.length === 0 && (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-800 mb-2">
            No Content Yet
          </h3>
          <p className="text-neutral-600 mb-6">
            Start by adding your first wedding information section.
          </p>
          <Button variant="wedding">
            <Plus className="w-4 h-4 mr-2" />
            Add First Section
          </Button>
        </div>
      )}
    </div>
  )
}
