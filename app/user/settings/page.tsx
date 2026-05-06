'use client'

import { useState, useEffect } from 'react'
import {
  User, Lock, Bell, MapPin, Shield, LogOut,
  Save, Eye, EyeOff, CheckCircle2, Smartphone, Loader2,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { userService, type ApiUser } from '@/lib/api/userService'
import { teamService, type ApiMyTeamInfo } from '@/lib/api/teamService'
import { ThemeSettingsCard } from '@/components/shared/settings/theme-settings-card'

export default function UserSettingsPage() {
  const [user, setUser] = useState<ApiUser | null>(null)
  const [teamInfo, setTeamInfo] = useState<ApiMyTeamInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationSharing, setLocationSharing] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const [profileData, teamData] = await Promise.all([
        userService.getProfile(),
        teamService.getMyTeamMembers().catch(() => null),
      ])
      if (profileData) {
        setUser(profileData)
        setLocationSharing(profileData.location_sharing_enabled ?? true)
        setNotifications(profileData.notifications_enabled ?? true)
      }
      setTeamInfo(teamData)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await userService.getProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  const teamLeader = teamInfo?.members.find((m) => m.is_team_leader)
  const roleLabels: Record<string, string> = {
    field_agent: 'Field Agent',
    team_leader: 'Team Leader',
    supervisor: 'Supervisor',
    admin: 'Admin',
  }

  return (
    <>
      <DashboardHeader
        title="Settings"
        rootCrumb={{ label: 'Field', href: '/user/home' }}
        breadcrumbs={[{ label: 'Settings' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Profile & Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>

          <ThemeSettingsCard />

          {/* Profile card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Avatar row */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-lg font-semibold text-primary shrink-0">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold">{user?.name || 'User'}</p>
                      <p className="text-sm text-muted-foreground">{user?.email || 'email@example.com'}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {roleLabels[user?.role || 'field_agent'] || 'Field Agent'}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input defaultValue={user?.name || ''} className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input defaultValue={user?.phone || ''} className="h-10" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Email</Label>
                      <Input defaultValue={user?.email || ''} type="email" className="h-10" disabled />
                    </div>
                  </div>
                </>
              )}

              {/* Team info */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                {[
                  { label: 'Assigned Zone', value: user?.assigned_zone || 'Not assigned' },
                  { label: 'Team', value: teamInfo?.team?.name || 'Not assigned' },
                  { label: 'Team Leader', value: teamLeader?.name || 'Not assigned' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium text-right max-w-[60%] truncate">{row.value}</span>
                  </div>
                ))}
              </div>

              <Button onClick={handleSave} className={cn('gap-2 w-full sm:w-auto', saved && 'bg-emerald-600 hover:bg-emerald-700')}>
                {saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
              </Button>
            </CardContent>
          </Card>

          {/* Change password */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input type={showPassword ? 'text' : 'password'} placeholder="Enter current password" className="h-10 pr-10" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" placeholder="Enter new password" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="Confirm new password" className="h-10" />
              </div>
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Lock className="h-4 w-4" /> Update Password
              </Button>
            </CardContent>
          </Card>

          {/* Privacy & Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Privacy & Location
              </CardTitle>
              <CardDescription>Control how your data is shared</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  id: 'location',
                  label: 'Location Sharing',
                  desc: 'Allow your team leader to see your real-time GPS position',
                  icon: MapPin,
                  value: locationSharing,
                  set: setLocationSharing,
                  warn: !locationSharing,
                },
                {
                  id: 'notifs',
                  label: 'Push Notifications',
                  desc: 'Receive task assignments, alerts, and messages',
                  icon: Bell,
                  value: notifications,
                  set: setNotifications,
                  warn: false,
                },
              ].map((pref) => (
                <div key={pref.id} className={cn(
                  'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3',
                  pref.warn ? 'border-amber-500/30 bg-amber-500/5' : 'border-border'
                )}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <pref.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground">{pref.desc}</p>
                      {pref.warn && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                          Your team can&apos;t see your position
                        </p>
                      )}
                    </div>
                  </div>
                  <Switch checked={pref.value} onCheckedChange={pref.set} className="self-start sm:self-auto" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Device & Session */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                Device & Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-xs">
                {[
                  { label: 'App Version', value: 'FieldSync v1.0.0' },
                  { label: 'Last Sync', value: user?.last_seen ? new Date(user.last_seen).toLocaleString() : 'Just now' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5">
                <LogOut className="h-4 w-4" /> End Session & Sign Out
              </Button>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  )
}
