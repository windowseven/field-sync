'use client'

import { useEffect, useState } from 'react'
import {
  HelpCircle, Users, Calendar, Send, CheckCircle2,
  XCircle, Clock, MessageCircle, Plus, Loader2,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { helpRequestService, type ApiHelpRequest, type HelpRequestType, type HelpRequestStatus } from '@/lib/api/helpRequestService'

const requestTypeConfig: Record<HelpRequestType, { label: string; icon: React.ElementType; color: string; bg: string; desc: string }> = {
  help: { label: 'Request Help', icon: HelpCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', desc: 'Need assistance with a task' },
  meeting: { label: 'Request Meeting', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10', desc: 'Meet with a team member' },
  assistance: { label: 'Request Assistance', icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10', desc: 'Need someone nearby' },
}

const statusConfig: Record<HelpRequestStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  accepted: { label: 'Accepted', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  rejected: { label: 'Declined', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
}

export default function UserHelpPage() {
  const [selectedType, setSelectedType] = useState<HelpRequestType | null>(null)
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [requests, setRequests] = useState<ApiHelpRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await helpRequestService.getMine()
        setRequests(data)
      } catch (err) {
        console.error('Failed to load help requests', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleSend = async () => {
    if (!selectedType || !message.trim()) return
    try {
      const created = await helpRequestService.create(selectedType, message.trim())
      setRequests((prev) => [created, ...prev])
      setSent(true)
      setMessage('')
      setSelectedType(null)
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      console.error('Failed to send help request', err)
    }
  }

  if (loading) {
    return (
      <>
        <DashboardHeader
          title="Request Help"
          rootCrumb={{ label: 'Field', href: '/user/home' }}
          breadcrumbs={[{ label: 'Request Help' }]}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <DashboardHeader
        title="Request Help"
        rootCrumb={{ label: 'Field', href: '/user/home' }}
        breadcrumbs={[{ label: 'Request Help' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Help & Interaction</h1>
            <p className="text-sm text-muted-foreground">Contact your team leader or request assistance</p>
          </div>

          {/* Sent confirmation */}
          {sent && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Request sent!</p>
                  <p className="text-xs text-muted-foreground">Your team leader will respond shortly.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Request */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                New Request
              </CardTitle>
              <CardDescription>What kind of help do you need?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type selector */}
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.entries(requestTypeConfig) as [HelpRequestType, typeof requestTypeConfig[HelpRequestType]][]).map(([type, cfg]) => {
                  const Icon = cfg.icon
                  const isSelected = selectedType === type
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(isSelected ? null : type)}
                      className={cn(
                        'flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:bg-muted/50'
                      )}
                    >
                      <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', cfg.bg)}>
                        <Icon className={cn('h-4 w-4', cfg.color)} />
                      </div>
                      <p className={cn('text-sm font-medium', isSelected && 'text-primary')}>{cfg.label}</p>
                      <p className="text-xs text-muted-foreground leading-tight">{cfg.desc}</p>
                    </button>
                  )
                })}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder={
                    selectedType === 'help'
                      ? 'Describe what you need help with...'
                      : selectedType === 'meeting'
                      ? 'What do you want to discuss?'
                      : 'Describe the assistance you need...'
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleSend}
                disabled={!selectedType || !message.trim()}
                className="w-full gap-2 h-11"
              >
                <Send className="h-4 w-4" />
                Send Request
              </Button>
            </CardContent>
          </Card>

          {/* Request History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Recent Requests
              </CardTitle>
              <CardDescription>Your help request history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {requests.length > 0 ? requests.map((req) => {
                  const tc = requestTypeConfig[req.type] || requestTypeConfig.help
                  const sc = statusConfig[req.status] || statusConfig.pending
                  const StatusIcon = sc.icon
                  return (
                    <div key={req.id} className="rounded-lg border p-4 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', tc.bg)}>
                          <tc.icon className={cn('h-4 w-4', tc.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">{tc.label}</p>
                            <Badge className={cn('text-xs px-2 border-0 gap-1 shrink-0', sc.bg, sc.color)}>
                              <StatusIcon className="h-3 w-3" /> {sc.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 break-words line-clamp-2">{req.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(req.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {req.response_note && (
                        <div className={cn(
                          'rounded-lg p-3 text-sm border-l-2 mt-3',
                          req.status === 'accepted'
                            ? 'bg-emerald-500/5 border-emerald-500'
                            : 'bg-muted/50 border-muted-foreground'
                        )}>
                          <p className="font-medium mb-0.5">{req.response_from ?? 'Supervisor'} replied:</p>
                          <p className="text-muted-foreground">{req.response_note}</p>
                          {req.response_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(req.response_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                }) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <HelpCircle className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No help requests</p>
                    <p className="text-xs mt-1">Your request history will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  )
}
