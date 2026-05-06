'use client'

import { useState, useEffect } from 'react'
import { Megaphone, Send, Users, UserCog, Globe, Clock, CheckCircle2, AlertTriangle, Bell, Trash2 } from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { broadcastService, BroadcastMessage, BroadcastSnapshot } from '@/lib/api/broadcastService'

const typeConfig: Record<string, { className: string; icon: React.ElementType; label: string }> = {
  maintenance: { className: 'bg-amber-500/10 text-amber-500', icon: AlertTriangle, label: 'Maintenance' },
  announcement: { className: 'bg-primary/10 text-primary', icon: Megaphone, label: 'Announcement' },
  alert: { className: 'bg-destructive/10 text-destructive', icon: Bell, label: 'Alert' },
}

const audienceOptions = [
  { value: 'all', label: 'All Users (Everyone)', icon: Globe },
  { value: 'supervisors', label: 'All Supervisors Only', icon: UserCog },
  { value: 'workers', label: 'All Field Workers Only', icon: Users },
]

export default function BroadcastPage() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState('all')
  const [type, setType] = useState('announcement')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [snapshot, setSnapshot] = useState<BroadcastSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBroadcasts()
  }, [])

  const loadBroadcasts = async () => {
    try {
      setLoading(true)
      const data = await broadcastService.getSnapshot()
      setSnapshot(data)
    } catch {
      setError('Failed to load broadcast history')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!title || !message) return
    setSending(true)
    try {
      await broadcastService.send({ title, message, audience, type })
      setTitle('')
      setMessage('')
      setSent(true)
      await loadBroadcasts()
      setTimeout(() => setSent(false), 3000)
    } catch {
      setError('Failed to send broadcast')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso: string) => {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  const audienceCount = snapshot?.audienceCounts ?? { all: 0, supervisors: 0, workers: 0 }
  const broadcasts = snapshot?.broadcasts ?? []
  const totalBroadcasts = broadcasts.length

  return (
    <>
      <DashboardHeader title="Broadcast" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Broadcast Messages</h1>
            <p className="text-muted-foreground">Send system-wide announcements, alerts, and maintenance notices</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
              <Button variant="ghost" size="sm" className="ml-auto h-6" onClick={() => setError(null)}>Dismiss</Button>
            </div>
          )}

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Total Recipients', value: audienceCount.all.toString(), icon: Globe, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Supervisors', value: audienceCount.supervisors.toString(), icon: UserCog, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Broadcasts Sent', value: loading ? '...' : totalBroadcasts.toString(), icon: Megaphone, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', s.bg)}>
                      <s.icon className={cn('h-6 w-6', s.color)} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Compose Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Compose Broadcast</CardTitle>
                <CardDescription>Send an announcement to all or specific user groups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Audience</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {audienceOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          <div className="flex items-center gap-2">
                            <o.icon className="h-4 w-4" />
                            {o.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Will reach {(audienceCount[audience as keyof typeof audienceCount] ?? 0).toLocaleString()} user{(audienceCount[audience as keyof typeof audienceCount] ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="alert">Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input placeholder="e.g. Scheduled Maintenance Tonight" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Write your message here..."
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">{message.length} / 500 characters</p>
                </div>

                {sent && (
                  <div className="flex items-center gap-2 text-emerald-500 text-sm bg-emerald-500/10 rounded-lg px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Broadcast sent successfully!
                  </div>
                )}

                <Button className="w-full" onClick={handleSend} disabled={!title || !message || sending}>
                  {sending ? (
                    <><Clock className="h-4 w-4 mr-2 animate-pulse" /> Sending...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Send Broadcast</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* History */}
            <div className="lg:col-span-3 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Broadcast History</CardTitle>
                  <CardDescription>Past system-wide messages and their delivery stats</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Message</TableHead>
                        <TableHead>Audience</TableHead>
                        <TableHead>Delivered</TableHead>
                        <TableHead>Read</TableHead>
                        <TableHead>Sent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            <Clock className="h-5 w-5 animate-spin mx-auto mb-2" />
                            Loading broadcasts...
                          </TableCell>
                        </TableRow>
                      ) : broadcasts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No broadcasts sent yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        broadcasts.map((b) => {
                          const tc = typeConfig[b.type] || typeConfig.announcement
                          const Icon = tc.icon
                          const readRate = b.deliveredCount > 0 ? Math.round((b.readCount / b.deliveredCount) * 100) : 0
                          return (
                            <TableRow key={b.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{b.title}</p>
                                  <Badge variant="secondary" className={cn('text-[10px] mt-0.5', tc.className)}>
                                    <Icon className="h-2.5 w-2.5 mr-1" />
                                    {tc.label}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell><span className="text-sm text-muted-foreground">{b.audienceLabel}</span></TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  <span className="text-sm">{b.deliveredCount}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <span className="text-sm font-medium">{b.readCount}</span>
                                  <span className="text-xs text-muted-foreground ml-1">({readRate}%)</span>
                                </div>
                              </TableCell>
                              <TableCell><span className="text-sm text-muted-foreground">{formatTime(b.sentAt)}</span></TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
