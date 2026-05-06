'use client'

import { useState, useEffect, useCallback } from 'react'
import { Power, AlertTriangle, Shield, MapPin, Lock, WifiOff, RefreshCw, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { emergencyService } from '@/lib/api/emergencyService'
import type { EmergencyControlState, EmergencyAction, SystemStatus } from '@/lib/api/emergencyService'

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${d}d ${h}h ${m}m`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function EmergencyPage() {
  const [controls, setControls] = useState<EmergencyControlState | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [recentActions, setRecentActions] = useState<EmergencyAction[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmShutdown, setConfirmShutdown] = useState(false)
  const [shutdownReason, setShutdownReason] = useState('')
  const [shutdowning, setShutdowning] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const loadSnapshot = useCallback(async () => {
    try {
      const snapshot = await emergencyService.getSnapshot()
      setControls(snapshot.controls)
      setSystemStatus(snapshot.systemStatus)
      setRecentActions(snapshot.recentActions)
    } catch (error) {
      console.error('[Emergency] Failed to load snapshot:', error)
      toast({ title: 'Error', description: 'Failed to load emergency controls', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSnapshot()
  }, [loadSnapshot])

  const toggle = async (key: string) => {
    if (!controls || toggling) return
    setToggling(key)
    try {
      const next = !controls[key as keyof typeof controls]
      const result = await emergencyService.updateControl(key, next)
      setControls(result)
      toast({
        title: next ? 'Activated' : 'Deactivated',
        description: `Emergency control ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${next ? 'enabled' : 'disabled'}.`,
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to update control',
        variant: 'destructive',
      })
    } finally {
      setToggling(null)
    }
  }

  const handleShutdown = async () => {
    if (!shutdownReason.trim() || shutdowning) return
    setShutdowning(true)
    try {
      await emergencyService.requestShutdown(shutdownReason)
      toast({
        title: 'Shutdown Requested',
        description: 'Emergency shutdown request has been recorded and broadcast.',
      })
      setShutdownReason('')
      setConfirmShutdown(false)
      loadSnapshot()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to request shutdown',
        variant: 'destructive',
      })
    } finally {
      setShutdowning(false)
    }
  }

  if (loading) {
    return (
      <>
        <DashboardHeader title="Emergency Control" />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </>
    )
  }

  if (!controls || !systemStatus) return null

  const anyActive = controls.trackingDisabled || controls.registrationBlocked || controls.maintenanceMode || controls.platformLocked

  return (
    <>
      <DashboardHeader title="Emergency Control" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Emergency Control</h1>
              <Badge variant="destructive" className="text-xs">GOD MODE</Badge>
            </div>
            <p className="text-muted-foreground">
              Super admin controls for platform-wide emergency actions. All actions are logged and irreversible without manual reversal.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive text-sm">Extreme Caution Required</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Actions on this page affect all users across all projects in real time. Every action is permanently recorded in the audit log with your IP address and timestamp.
              </p>
            </div>
          </div>

          {anyActive && (
            <div className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-500 font-medium">
                Emergency controls are currently active. The platform is operating in a restricted state.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'System Uptime', value: formatUptime(systemStatus.uptimeSeconds), icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Active Users', value: systemStatus.activeUsers, icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Active Sessions', value: systemStatus.activeSessions, icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Active Projects', value: systemStatus.activeProjects, icon: CheckCircle2, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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

          <div className="grid gap-4 sm:grid-cols-2">

            <Card className={cn('border-2 transition-colors', controls.trackingDisabled ? 'border-amber-500/50 bg-amber-500/5' : 'border-border')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', controls.trackingDisabled ? 'bg-amber-500/20' : 'bg-muted')}>
                      <MapPin className={cn('h-5 w-5', controls.trackingDisabled ? 'text-amber-500' : 'text-muted-foreground')} />
                    </div>
                    <div>
                      <CardTitle className="text-base">Disable Live Tracking</CardTitle>
                      <CardDescription className="text-xs mt-0.5">Stop all GPS updates globally</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={controls.trackingDisabled}
                    onCheckedChange={() => toggle('trackingDisabled')}
                    disabled={toggling === 'trackingDisabled'}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Immediately halts all GPS location updates from all {systemStatus.activeUsers} active field workers. Use during a tracking system failure or security incident.
                </p>
                {controls.trackingDisabled && (
                  <Badge variant="secondary" className="mt-2 bg-amber-500/10 text-amber-500">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Tracking Disabled
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className={cn('border-2 transition-colors', controls.registrationBlocked ? 'border-amber-500/50 bg-amber-500/5' : 'border-border')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', controls.registrationBlocked ? 'bg-amber-500/20' : 'bg-muted')}>
                      <XCircle className={cn('h-5 w-5', controls.registrationBlocked ? 'text-amber-500' : 'text-muted-foreground')} />
                    </div>
                    <div>
                      <CardTitle className="text-base">Block Registrations</CardTitle>
                      <CardDescription className="text-xs mt-0.5">Prevent new account creation</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={controls.registrationBlocked}
                    onCheckedChange={() => toggle('registrationBlocked')}
                    disabled={toggling === 'registrationBlocked'}
                    className="data-[state=checked]:bg-amber-500"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Blocks all new user registrations system-wide. Existing accounts can still log in and operate normally.
                </p>
                {controls.registrationBlocked && (
                  <Badge variant="secondary" className="mt-2 bg-amber-500/10 text-amber-500">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Registrations Blocked
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className={cn('border-2 transition-colors', controls.maintenanceMode ? 'border-blue-500/50 bg-blue-500/5' : 'border-border')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', controls.maintenanceMode ? 'bg-blue-500/20' : 'bg-muted')}>
                      <WifiOff className={cn('h-5 w-5', controls.maintenanceMode ? 'text-blue-500' : 'text-muted-foreground')} />
                    </div>
                    <div>
                      <CardTitle className="text-base">Maintenance Mode</CardTitle>
                      <CardDescription className="text-xs mt-0.5">Show maintenance screen to all users</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={controls.maintenanceMode}
                    onCheckedChange={() => toggle('maintenanceMode')}
                    disabled={toggling === 'maintenanceMode'}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Redirects all {systemStatus.activeUsers} active users to a maintenance page. Admin remains accessible. Use before deploying updates.
                </p>
                {controls.maintenanceMode && (
                  <Badge variant="secondary" className="mt-2 bg-blue-500/10 text-blue-500">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Maintenance Mode On
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className={cn('border-2 transition-colors', controls.platformLocked ? 'border-destructive/50 bg-destructive/5' : 'border-border')}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', controls.platformLocked ? 'bg-destructive/20' : 'bg-muted')}>
                      <Lock className={cn('h-5 w-5', controls.platformLocked ? 'text-destructive' : 'text-muted-foreground')} />
                    </div>
                    <div>
                      <CardTitle className="text-base">Lock Platform</CardTitle>
                      <CardDescription className="text-xs mt-0.5">Force-logout all users immediately</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={controls.platformLocked}
                    onCheckedChange={() => toggle('platformLocked')}
                    disabled={toggling === 'platformLocked'}
                    className="data-[state=checked]:bg-destructive"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Immediately invalidates all {systemStatus.activeSessions} active sessions and locks the platform. Only admin can re-enter. Use for security emergencies.
                </p>
                {controls.platformLocked && (
                  <Badge variant="secondary" className="mt-2 bg-destructive/10 text-destructive">
                    <Lock className="h-3 w-3 mr-1" /> Platform Locked
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <Power className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-base text-destructive">Emergency System Shutdown</CardTitle>
                  <CardDescription>Completely shut down all platform services</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This will immediately terminate all running services, disconnect all {systemStatus.activeUsers} users, and take the platform completely offline. Requires manual restart from the server.
              </p>
              {controls.shutdownRequest?.active && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
                  <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Shutdown Pending
                  </p>
                  <p className="text-sm text-muted-foreground">{controls.shutdownRequest.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    Requested by {controls.shutdownRequest.requestedBy} at {new Date(controls.shutdownRequest.requestedAt!).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="shutdown-reason">Reason for shutdown (required)</Label>
                <Textarea
                  id="shutdown-reason"
                  placeholder="Describe the emergency reason for this shutdown..."
                  className="resize-none"
                  rows={2}
                  value={shutdownReason}
                  onChange={(e) => setShutdownReason(e.target.value)}
                />
              </div>
              {!confirmShutdown ? (
                <Button
                  variant="destructive"
                  disabled={!shutdownReason.trim() || shutdowning}
                  onClick={() => setConfirmShutdown(true)}
                >
                  <Power className="h-4 w-4 mr-2" /> Initiate Shutdown
                </Button>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-destructive/40 bg-destructive/5">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-destructive">Are you absolutely sure?</p>
                    <p className="text-xs text-muted-foreground">This will take the entire platform offline immediately.</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => setConfirmShutdown(false)} disabled={shutdowning}>Cancel</Button>
                    <Button size="sm" variant="destructive" onClick={handleShutdown} disabled={shutdowning}>
                      {shutdowning ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Power className="h-3.5 w-3.5 mr-1.5" />}
                      Confirm Shutdown
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Emergency Actions</CardTitle>
              <CardDescription>Logged history of emergency control usage</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No emergency actions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentActions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', action.enabled ? 'bg-destructive/10' : 'bg-muted')}>
                          <Power className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {action.controlKey.replace(/([A-Z])/g, ' $1')} {action.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            By {action.actor} · {action.reason || 'No reason provided'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{timeAgo(action.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  )
}
