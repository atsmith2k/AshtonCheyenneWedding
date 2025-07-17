'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Mail,
  Send,
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  Play,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EmailTemplateEditor } from '@/components/admin/email-template-editor'
import { EmailCampaignCreator } from '@/components/admin/email-campaign-creator'
import { EmailAnalytics } from '@/components/admin/email-analytics'
import { EmailPreview } from '@/components/admin/email-preview'
import { EmailTester } from '@/components/admin/email-tester'

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
  text_content?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface EmailCampaign {
  id: string
  name: string
  template_id: string
  subject: string
  recipient_count: number
  sent_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  bounced_count: number
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed' | 'failed'
  scheduled_at?: string
  sent_at?: string
  completed_at?: string
  created_at: string
  email_templates?: {
    template_type: string
    subject: string
  }
}

export default function Communications() {
  const [activeTab, setActiveTab] = useState<'messages' | 'emails' | 'templates' | 'analytics'>('messages')
  const [messages, setMessages] = useState<Message[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [selectedMessages, setSelectedMessages] = useState<string[]>([])
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [showTester, setShowTester] = useState(false)
  const [testTemplate, setTestTemplate] = useState<{ id?: string; type?: string } | null>(null)
  const { toast } = useToast()

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/messages/submit')
      const result = await response.json()

      if (response.ok && result.success) {
        setMessages(result.data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [])

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/email-templates')
      const result = await response.json()

      if (response.ok && result.success) {
        setTemplates(result.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch email templates',
        variant: 'destructive'
      })
    }
  }, [toast])

  const fetchCampaigns = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/email-campaigns')
      const result = await response.json()

      if (response.ok && result.success) {
        setCampaigns(result.campaigns || [])
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch email campaigns',
        variant: 'destructive'
      })
    }
  }, [toast])

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

  const getCampaignStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'sending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sent':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCampaignStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4" />
      case 'scheduled':
        return <Clock className="w-4 h-4" />
      case 'sending':
        return <Play className="w-4 h-4" />
      case 'sent':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Edit className="w-4 h-4" />
    }
  }

  const handleSendCampaign = async (campaignId: string) => {
    try {
      const response = await fetch('/api/admin/email-campaigns/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ campaign_id: campaignId })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: result.message
        })
        fetchCampaigns() // Refresh campaigns
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send campaign',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error sending campaign:', error)
      toast({
        title: 'Error',
        description: 'Failed to send campaign',
        variant: 'destructive'
      })
    }
  }

  const handleTestTemplate = async (templateId: string) => {
    const testEmail = prompt('Enter email address to send test email:')
    if (!testEmail) return

    try {
      const response = await fetch('/api/admin/email-templates/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: templateId,
          test_email: testEmail
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: result.message
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send test email',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      })
    }
  }

  const handleInitializeTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: result.message
        })
        fetchTemplates() // Refresh templates
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to initialize templates',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error initializing templates:', error)
      toast({
        title: 'Error',
        description: 'Failed to initialize templates',
        variant: 'destructive'
      })
    }
  }

  const handlePreviewTemplate = (template: EmailTemplate) => {
    setPreviewTemplate(template)
    setShowPreview(true)
  }

  const handleAdvancedTest = (template: EmailTemplate) => {
    setTestTemplate({ id: template.id, type: template.template_type })
    setShowTester(true)
  }

  // Effect to fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages()
    } else if (activeTab === 'templates') {
      fetchTemplates()
    } else if (activeTab === 'emails') {
      fetchCampaigns()
    }
  }, [activeTab, fetchMessages, fetchTemplates, fetchCampaigns])

  const newMessagesCount = messages.filter(m => m.status === 'new').length
  const urgentMessagesCount = messages.filter(m => m.is_urgent && m.status === 'new').length
  const activeCampaigns = campaigns.filter(c => c.status === 'sending' || c.status === 'scheduled').length
  const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Communications</h1>
          <p className="text-neutral-600">Manage guest messages and email campaigns</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'templates' && (
            <Button
              variant="outline"
              onClick={() => setShowCreateTemplate(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          )}
          {activeTab === 'emails' && (
            <Button
              variant="wedding"
              onClick={() => setShowCreateCampaign(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          )}
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
              <p className="text-sm font-medium text-neutral-600">Active Campaigns</p>
              <p className="text-2xl font-bold text-blue-600">{activeCampaigns}</p>
            </div>
            <Send className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="wedding-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Emails Sent</p>
              <p className="text-2xl font-bold text-green-600">{totalEmailsSent}</p>
            </div>
            <Mail className="w-8 h-8 text-green-500" />
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
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Analytics
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800">Email Campaigns</h3>
                <Button
                  variant="wedding"
                  onClick={() => setShowCreateCampaign(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>

              <div className="grid gap-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-neutral-800">{campaign.name}</h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCampaignStatusColor(campaign.status)}`}>
                            {getCampaignStatusIcon(campaign.status)}
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 mb-2">{campaign.subject}</p>
                        <div className="flex items-center gap-4 text-xs text-neutral-500">
                          <span>Recipients: {campaign.recipient_count}</span>
                          <span>Sent: {campaign.sent_count}</span>
                          <span>Delivered: {campaign.delivered_count}</span>
                          {campaign.opened_count > 0 && <span>Opened: {campaign.opened_count}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendCampaign(campaign.id)}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {campaigns.length === 0 && (
                <div className="text-center py-16">
                  <Mail className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                    No Campaigns Yet
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    Create email campaigns to send invitations, reminders, and updates to your guests.
                  </p>
                  <Button
                    variant="wedding"
                    onClick={() => setShowCreateCampaign(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Campaign
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800">Email Templates</h3>
                <Button
                  variant="wedding"
                  onClick={() => setShowCreateTemplate(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </div>

              <div className="grid gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium text-neutral-800">{template.subject}</h4>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 capitalize">{template.template_type.replace('_', ' ')}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          Updated {new Date(template.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestTemplate(template.id)}
                          title="Quick test email"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAdvancedTest(template)}
                          title="Advanced email testing"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewTemplate(template)}
                          title="Preview email"
                        >
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
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={handleInitializeTemplates}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Add Default Templates
                    </Button>
                    <Button
                      variant="wedding"
                      onClick={() => setShowCreateTemplate(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Custom Template
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <EmailAnalytics />
          )}
        </div>
      </div>

      {/* Email Template Editor Modal */}
      <EmailTemplateEditor
        isOpen={showCreateTemplate}
        onClose={() => setShowCreateTemplate(false)}
        onSave={() => {
          fetchTemplates()
          setShowCreateTemplate(false)
        }}
      />

      {/* Email Campaign Creator Modal */}
      <EmailCampaignCreator
        isOpen={showCreateCampaign}
        onClose={() => setShowCreateCampaign(false)}
        onSave={() => {
          fetchCampaigns()
          setShowCreateCampaign(false)
        }}
      />

      {/* Email Preview Modal */}
      <EmailPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        template={previewTemplate || undefined}
      />

      {/* Email Tester Modal */}
      <EmailTester
        isOpen={showTester}
        onClose={() => setShowTester(false)}
        templateId={testTemplate?.id}
        templateType={testTemplate?.type}
      />
    </div>
  )
}
