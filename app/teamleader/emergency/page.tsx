"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, Plus, Clock, MapPin, ArrowRight, Pause, Play, CheckCircle, Loader2, ShieldAlert } from 'lucide-react'
import { fieldIssueService, ApiFieldIssue, IssueType, IssueSeverity, IssueResponse } from '@/lib/api/fieldIssueService'
import { zoneService, ApiZone } from '@/lib/api/zoneService'
import { projectService } from '@/lib/api/projectService'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const severityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', label: 'Low' },
  medium: { color: 'bg-orange-500/10 text-orange-500 border-orange-500/30', label: 'Medium' },
  high: { color: 'bg-red-500/10 text-red-500 border-red-500/30', label: 'High' },
  critical: { color: 'bg-red-600/10 text-red-600 border-red-600/30 animate-pulse', label: 'Critical' },
}

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  active: { color: 'text-orange-500', icon: AlertTriangle },
  redirected: { color: 'text-blue-500', icon: ArrowRight },
  paused: { color: 'text-amber-500', icon: Pause },
  resumed: { color: 'text-emerald-500', icon: Play },
  resolved: { color: 'text-muted-foreground', icon: CheckCircle },
}

export default function EmergencyPage() {
  const [issues, setIssues] = useState<ApiFieldIssue[]>([])
  const [activeIssues, setActiveIssues] = useState<ApiFieldIssue[]>([])
  const [zones, setZones] = useState<ApiZone[]>([])
  const [loading, setLoading] = useState(true)
  const [noTeam, setNoTeam] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [respondDialogOpen, setRespondDialogOpen] = useState<ApiFieldIssue | null>(null)
  const [responding, setResponding] = useState(false)
  const [responseNote, setResponseNote] = useState('')
  const [redirectZoneId, setRedirectZoneId] = useState('')

  const [issueType, setIssueType] = useState<IssueType>('safety')
  const [issueTitle, setIssueTitle] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [issueSeverity, setIssueSeverity] = useState<IssueSeverity>('medium')
  const [issueZoneId, setIssueZoneId] = useState('')
  const [reporting, setReporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [allIssues, active, projects] = await Promise.all([
        fieldIssueService.getAll(),
        fieldIssueService.getActive(),
        projectService.getAll(),
      ])
      setIssues(allIssues)
      setActiveIssues(active)

      const activeProject = projects.find(p => p.status === 'active') || projects[0]
      if (activeProject) {
        const zonesData = await zoneService.getByProject(activeProject.id)
        setZones(zonesData)
      }
    } catch (error: any) {
      const isNoTeam = error?.status === 404 || error?.message?.includes('No team assigned')
      if (isNoTeam) {
        setNoTeam(true)
      } else {
        console.error('Failed to load emergency data:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleReport = async () => {
    if (!issueTitle.trim()) {
      toast.error('Title is required')
      return
    }
    setReporting(true)
    try {
      await fieldIssueService.create(issueType, issueTitle, issueDescription || undefined, issueSeverity, issueZoneId || undefined)
      toast.success('Field issue reported')
      setReportDialogOpen(false)
      setIssueTitle('')
      setIssueDescription('')
      setIssueZoneId('')
      await loadData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to report issue')
    } finally {
      setReporting(false)
    }
  }

  const handleRespond = async (id: string, action: IssueResponse) => {
    if (action === 'redirect' && !redirectZoneId) {
      toast.error('Select a redirect zone')
      return
    }
    setResponding(true)
    try {
      await fieldIssueService.respond(id, action, responseNote || undefined, redirectZoneId || undefined)
      toast.success(`Issue ${action}d`)
      setRespondDialogOpen(null)
      setResponseNote('')
      setRedirectZoneId('')
      await loadData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to respond')
    } finally {
      setResponding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (noTeam) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
              No Team Assigned
            </CardTitle>
            <CardDescription>You need to be assigned to a team to manage field issues.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please contact your supervisor to be assigned to a team.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeCount = activeIssues.length
  const criticalCount = issues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-red-500" />
            Field Issues
          </h1>
          <p className="text-muted-foreground">Emergency controls and incident management</p>
        </div>
        <Button onClick={() => setReportDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Active Issues Banner */}
      {activeCount > 0 && (
        <Card className={cn('border-2', criticalCount > 0 ? 'border-red-500/50 bg-red-500/5' : 'border-orange-500/50 bg-orange-500/5')}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Active Field Issues
              <Badge variant="destructive">{activeCount}</Badge>
              {criticalCount > 0 && (
                <Badge className="bg-red-600 animate-pulse">
                  {criticalCount} Critical
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeIssues.map(issue => {
                const StatusIcon = statusConfig[issue.status]?.icon || AlertTriangle
                return (
                  <div key={issue.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-1">
                        <StatusIcon className={cn('h-5 w-5', statusConfig[issue.status]?.color)} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={cn('text-xs', severityConfig[issue.severity].color)}>
                            {severityConfig[issue.severity].label}
                          </Badge>
                          <span className="text-xs text-muted-foreground capitalize">{issue.type}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(issue.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold truncate">{issue.title}</p>
                        {issue.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{issue.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>By: {issue.reported_by_name || 'Unknown'}</span>
                          {issue.zone_name && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {issue.zone_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setRespondDialogOpen(issue); setResponseNote(''); setRedirectZoneId(''); }}>
                        Respond
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Issues History */}
      <Card>
        <CardHeader>
          <CardTitle>Issue History</CardTitle>
          <CardDescription>All reported field issues and their resolution</CardDescription>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No issues reported yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {issues.map(issue => {
                  const StatusIcon = statusConfig[issue.status]?.icon || AlertTriangle
                  return (
                    <div key={issue.id} className="p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-1">
                            <StatusIcon className={cn('h-4 w-4', statusConfig[issue.status]?.color)} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="outline" className="text-xs capitalize">{issue.type}</Badge>
                              <Badge className={cn('text-xs', severityConfig[issue.severity].color)}>
                                {severityConfig[issue.severity].label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(issue.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm font-semibold truncate">{issue.title}</p>
                            {issue.status === 'resolved' && issue.resolved_at && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-emerald-500" />
                                Resolved {new Date(issue.resolved_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0 capitalize text-xs">
                          {issue.status}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-500">{activeCount}</div>
            <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">Active Issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-500">{issues.filter(i => i.status === 'resolved').length}</div>
            <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{issues.length}</div>
            <p className="text-xs text-muted-foreground uppercase font-semibold mt-1">Total Reported</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Report Field Issue
            </DialogTitle>
            <DialogDescription>Report an emergency or field issue affecting operations</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Issue Type</Label>
              <Select value={issueType} onValueChange={(v) => setIssueType(v as IssueType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safety">Safety Hazard</SelectItem>
                  <SelectItem value="equipment">Equipment Failure</SelectItem>
                  <SelectItem value="environmental">Environmental Issue</SelectItem>
                  <SelectItem value="access">Access Restriction</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Severity</Label>
              <Select value={issueSeverity} onValueChange={(v) => setIssueSeverity(v as IssueSeverity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                  <SelectItem value="medium">Medium - Requires attention</SelectItem>
                  <SelectItem value="high">High - Immediate action needed</SelectItem>
                  <SelectItem value="critical">Critical - Stop operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Title</Label>
              <Input value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} placeholder="Brief description of the issue" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Details</Label>
              <Textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} rows={3} placeholder="Additional details..." />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Affected Zone (Optional)</Label>
              <Select value={issueZoneId} onValueChange={setIssueZoneId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(zone => (
                    <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReport} disabled={reporting}>
              {reporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
              Report Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Respond Dialog */}
      <Dialog open={!!respondDialogOpen} onOpenChange={(open) => { if (!open) { setRespondDialogOpen(null); setResponseNote(''); setRedirectZoneId(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Respond to Issue</DialogTitle>
            <DialogDescription>{respondDialogOpen?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Badge className={cn('text-xs', severityConfig[respondDialogOpen?.severity || 'medium'].color)}>
                {severityConfig[respondDialogOpen?.severity || 'medium'].label}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">{respondDialogOpen?.type}</Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Response Note</Label>
              <Textarea value={responseNote} onChange={(e) => setResponseNote(e.target.value)} rows={2} placeholder="Add context for the response..." />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Redirect Zone (if redirecting)</Label>
              <Select value={redirectZoneId} onValueChange={setRedirectZoneId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select redirect zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(zone => (
                    <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button variant="destructive" onClick={() => handleRespond(respondDialogOpen!.id, 'pause')} disabled={responding}>
              <Pause className="h-3 w-3 mr-1" />
              Pause
            </Button>
            <Button variant="outline" onClick={() => handleRespond(respondDialogOpen!.id, 'resume')} disabled={responding}>
              <Play className="h-3 w-3 mr-1" />
              Resume
            </Button>
            <Button variant="secondary" onClick={() => handleRespond(respondDialogOpen!.id, 'redirect')} disabled={responding}>
              <ArrowRight className="h-3 w-3 mr-1" />
              Redirect
            </Button>
            <Button onClick={() => handleRespond(respondDialogOpen!.id, 'resolve')} disabled={responding}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
