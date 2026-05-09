"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Bell, User, Globe, Shield, Clock, LogOut, Loader2, ShieldCheck, Play, Square, Megaphone, Send } from 'lucide-react'
import useSWR from 'swr'
import { fetcher } from '@/lib/api/swr-fetcher'
import { ThemeSettingsCard } from '@/components/shared/settings/theme-settings-card'
import { http } from '@/lib/api/httpClient'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function SettingsPage() {
  const { data: profileData, error: profileError } = useSWR('/auth/profile', fetcher)
  const { data: teamData } = useSWR('/team/my/members', fetcher, { revalidateOnFocus: false, revalidateOnReconnect: false, shouldRetryOnError: false })
  const { data: statsData } = useSWR('/team/stats', fetcher, { revalidateOnFocus: false, revalidateOnReconnect: false, shouldRetryOnError: false })

  const [sessionActive, setSessionActive] = useState(false)
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementMessage, setAnnouncementMessage] = useState('')
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false)

  useEffect(() => {
    const session = statsData?.data?.session
    if (session?.active && session?.startedAt) {
      setSessionActive(true)
      setSessionStartedAt(session.startedAt)
      setElapsedSeconds(Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000))
    } else {
      setSessionActive(false)
      setSessionStartedAt(null)
      setElapsedSeconds(0)
    }
  }, [statsData])

  useEffect(() => {
    if (!sessionActive) return
    const baseTime = sessionStartedAt ? new Date(sessionStartedAt).getTime() : Date.now() - elapsedSeconds * 1000
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - baseTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionActive, sessionStartedAt])

  const handleStartSession = async () => {
    setIsUpdating(true)
    try {
      await http.post('/team/session', { action: 'start' })
      setSessionActive(true)
      setSessionStartedAt(new Date().toISOString())
      setElapsedSeconds(0)
      toast.success('Team session started')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to start session')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEndSession = async () => {
    setIsUpdating(true)
    try {
      await http.post('/team/session', { action: 'end' })
      setSessionActive(false)
      setSessionStartedAt(null)
      setElapsedSeconds(0)
      toast.success('Team session ended')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to end session')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      toast.error('Title and message are required')
      return
    }
    setSendingAnnouncement(true)
    try {
      await http.post('/team/announcement', { title: announcementTitle.trim(), message: announcementMessage.trim() })
      toast.success('Announcement sent to team')
      setAnnouncementTitle('')
      setAnnouncementMessage('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send announcement')
    } finally {
      setSendingAnnouncement(false)
    }
  }

  const isLoading = !profileData && !profileError
  const user = profileData?.user || profileData || {}
  const teamInfo = teamData?.team || {}

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border-2 border-primary/20 shadow-inner">
          <span className="text-2xl font-black text-primary">
            {user.name?.[0] || 'U'}
          </span>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your profile, team preferences, and session security</p>
        </div>
      </div>

      <ThemeSettingsCard />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card className="border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Account Profile
            </CardTitle>
            <CardDescription>Your personal information and role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">Full Name</Label>
              <Input id="name" defaultValue={user.name || ''} className="bg-muted/30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Email Address</Label>
              <Input id="email" type="email" defaultValue={user.email || ''} className="bg-muted/30" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team" className="text-xs font-bold uppercase text-muted-foreground">Current Team</Label>
              <Input id="team" defaultValue={teamInfo.name || 'No Team Assigned'} className="bg-muted/30" disabled />
            </div>
            <Button className="w-full mt-4 shadow-sm hover:scale-[1.01] transition-transform">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="border-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Intelligence Notifications
            </CardTitle>
            <CardDescription>Configure real-time alerts for your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Critical Help Requests</Label>
                <p className="text-xs text-muted-foreground">Get instant push notifications for SOS alerts</p>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-primary" />
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Zone Incursion Alerts</Label>
                <p className="text-xs text-muted-foreground">Alert when members cross boundaries</p>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-primary" />
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">Form Verification</Label>
                <p className="text-xs text-muted-foreground">Weekly summary of submissions</p>
              </div>
              <Switch />
            </div>
            <Button variant="secondary" className="w-full mt-2 text-xs font-bold h-9">
              Test Connection
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Session & Privacy */}
      <Card className="border-primary/10 shadow-md">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Operational Session Control
          </CardTitle>
          <CardDescription>Manage your current field deployment settings</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          <div className="space-y-6">
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">Deployment Status</Label>
              <div className="flex items-baseline gap-2">
                <div className={cn('text-4xl font-black tracking-tighter transition-all tabular-nums', sessionActive ? 'text-emerald-600' : 'text-muted-foreground')}>
                  {formatDuration(elapsedSeconds)}
                </div>
                <Badge variant="secondary" className={cn('border-none', sessionActive ? 'animate-pulse bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground')}>
                  {sessionActive ? 'ACTIVE' : 'STOPPED'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {sessionActive ? `Session started ${new Date(sessionStartedAt!).toLocaleTimeString()}` : 'No active session'}
              </p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-primary/5">
              <div className="space-y-0.5">
                <span className="text-sm font-bold">Auto-Sync Optimization</span>
                <p className="text-xs text-muted-foreground leading-relaxed">Save battery by reducing sync frequency in low signal</p>
              </div>
              <Switch className="data-[state=checked]:bg-primary" />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">Tracking Precision</Label>
              <Select defaultValue="standard">
                <SelectTrigger className="h-11 font-medium bg-muted/20 border-primary/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard" className="font-medium text-sm">Balanced Mode (Default)</SelectItem>
                  <SelectItem value="high" className="font-medium text-sm">High Accuracy (GPS Focus)</SelectItem>
                  <SelectItem value="battery" className="font-medium text-sm">Battery Saver (Tower Focus)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2 grid grid-cols-2 gap-3">
              <Button variant="outline" className="font-bold text-xs h-10 border-primary/20 shadow-sm">
                <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                Audit Logs
              </Button>
              {sessionActive ? (
                <Button variant="destructive" className="font-bold text-xs h-10 shadow-md" onClick={handleEndSession} disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Square className="h-4 w-4 mr-2 fill-current" />}
                  End Session
                </Button>
              ) : (
                <Button className="font-bold text-xs h-10 shadow-md" onClick={handleStartSession} disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2 fill-current" />}
                  Start Session
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Communication */}
      <Card className="border-primary/10 shadow-md">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Team Communication
          </CardTitle>
          <CardDescription>Send announcements to your team members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="announcement-title" className="text-xs font-bold uppercase text-muted-foreground">Announcement Title</Label>
            <Input
              id="announcement-title"
              placeholder="e.g., Schedule Change, Safety Reminder"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              className="bg-muted/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="announcement-message" className="text-xs font-bold uppercase text-muted-foreground">Message</Label>
            <textarea
              id="announcement-message"
              placeholder="Type your announcement..."
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
          <Button
            className="w-full shadow-sm"
            onClick={handleSendAnnouncement}
            disabled={sendingAnnouncement || !announcementTitle.trim() || !announcementMessage.trim()}
          >
            {sendingAnnouncement ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send to Team
          </Button>
        </CardContent>
      </Card>

      {/* Security Info Banner */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-primary">Secure Access Token</h4>
          <p className="text-xs text-muted-foreground">Your session is protected with hardware-level encryption and CSRF-hardened endpoints.</p>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary uppercase">v1.2.0-secure</Badge>
      </div>
    </div>
  )
}


