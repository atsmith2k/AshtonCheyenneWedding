'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Mail, 
  Send, 
  MessageSquare, 
  Users,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter
} from 'lucide-react'

interface Message {
  id: string
  subject: string
  message: string
  status: 'new' | 'responded' | 'archived'
  is_urgent: boolean
  created_at: string
  guest: {
    first_name: string
    last_name: string
    email: string
  }
}

interface EmailTemplate {
  id: string
  template_type: string
  subject: string
  html_content: string
  is_active: boolean
}

export default function Communications() {
  const [activeTab, setActiveTab] = useState<'messages' | 'emails' | 'templates'>('messages')
  const [messages, setMessages] = useState<Message[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages()
    } else if (activeTab === 'templates') {
      fetchTemplates()
    }
  }, [activeTab])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages/submit')
      const result = await response.json()

      if (response.ok && result.success) {
        setMessages(result.data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates')
      const result = await response.json()

      if (response.ok && result.success) {
        setTemplates(result.data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-red-100 text-red-800'
      case 'responded':
        return 'bg-green-100 text-green-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'New'
      case 'responded':
        return 'Responded'
      case 'archived':
        return 'Archived'
      default:
        return status
    }
  }

  const newMessagesCount = messages.filter(m => m.status === 'new').length
  const urgentMessagesCount = messages.filter(m => m.is_urgent && m.status === 'new').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Communications</h1>
          <p className="text-neutral-600">Manage guest messages and email campaigns</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Email
          </Button>
          <Button variant="wedding">
            <Send className="w-4 h-4 mr-2" />
            Send Campaign
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">New Messages</p>
              <p className="text-2xl font-bold text-red-600">{newMessagesCount}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Urgent</p>
              <p className="text-2xl font-bold text-orange-600">{urgentMessagesCount}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Email Templates</p>
              <p className="text-2xl font-bold text-blue-600">{templates.length}</p>
            </div>
            <Mail className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Guests</p>
              <p className="text-2xl font-bold text-green-600">150</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="wedding-card">
        <div className="border-b border-neutral-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('messages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'messages'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Guest Messages ({newMessagesCount})
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'emails'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Email Campaigns
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Email Templates
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'messages' && (
            <div className="space-y-4">
              {/* Message Filters */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <Button size="sm" variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    All Messages
                  </Button>
                  <Button size="sm" variant="outline">
                    New ({newMessagesCount})
                  </Button>
                  <Button size="sm" variant="outline">
                    Urgent ({urgentMessagesCount})
                  </Button>
                </div>
                {selectedMessages.length > 0 && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Mark as Read
                    </Button>
                    <Button size="sm" variant="outline">
                      Archive
                    </Button>
                  </div>
                )}
              </div>

              {/* Messages List */}
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedMessages.includes(message.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMessages(prev => [...prev, message.id])
                              } else {
                                setSelectedMessages(prev => prev.filter(id => id !== message.id))
                              }
                            }}
                            className="rounded"
                          />
                          <h4 className="font-medium text-neutral-800">
                            {message.guest.first_name} {message.guest.last_name}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                            {getStatusText(message.status)}
                          </span>
                          {message.is_urgent && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Urgent
                            </span>
                          )}
                        </div>
                        <h5 className="font-medium text-neutral-700 mb-1">{message.subject}</h5>
                        <p className="text-neutral-600 text-sm line-clamp-2">{message.message}</p>
                        <p className="text-xs text-neutral-400 mt-2">
                          {new Date(message.created_at).toLocaleDateString()} • {message.guest.email}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {messages.length === 0 && (
                <div className="text-center py-16">
                  <MessageSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                    No Messages Yet
                  </h3>
                  <p className="text-neutral-600">
                    Guest messages will appear here when they contact you.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'emails' && (
            <div className="space-y-4">
              <div className="text-center py-16">
                <Mail className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                  Email Campaigns
                </h3>
                <p className="text-neutral-600 mb-6">
                  Create and send email campaigns to your guests.
                </p>
                <Button variant="wedding">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800">Email Templates</h3>
                <Button variant="wedding">
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>

              <div className="grid gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-800">{template.subject}</h4>
                        <p className="text-sm text-neutral-600 capitalize">{template.template_type.replace('_', ' ')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {templates.length === 0 && (
                <div className="text-center py-16">
                  <Mail className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                    No Templates Yet
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    Create email templates for invitations, reminders, and updates.
                  </p>
                  <Button variant="wedding">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Template
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
