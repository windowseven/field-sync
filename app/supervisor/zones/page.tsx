'use client'

import * as React from 'react'
import {
  Plus, Eye, EyeOff, Pencil, Trash2, MapPin, Users,
  MoreHorizontal, CheckCircle2, Clock, AlertTriangle, Layers,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { zoneService } from '@/lib/api/zoneService'
import { projectService, ApiProject } from '@/lib/api/projectService'
import { teamService } from '@/lib/api/teamService'

interface Zone {
  id: string
  name: string
  description: string
  color: string
  colorHex: string
  team: string
  status: 'active' | 'completed' | 'pending'
  coverage: number
  area: string
  members: number
  visible: boolean
  overlap: boolean
}

const statusConfig = {
  active: { label: 'Active', icon: CheckCircle2, className: 'bg-emerald-500/10 text-emerald-500' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'bg-primary/10 text-primary' },
  pending: { label: 'Pending', icon: Clock, className: 'bg-muted text-muted-foreground' },
}

export default function SupervisorZonesPage() {
  const [zonesState, setZonesState] = React.useState<Zone[]>([])
  const [teams, setTeams] = React.useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)

  const chartColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6']

  React.useEffect(() => {
    const fetchZones = async () => {
      try {
        setIsLoading(true)
        const projects = await projectService.getAll()
        const activeProject = projects.find((p: ApiProject) => p.status === 'active') || projects[0]

        if (!activeProject) {
          setZonesState([])
          setError(null)
          return
        }

        const [projectZones, projectTeams] = await Promise.all([
          zoneService.getByProject(activeProject.id),
          teamService.getByProject(activeProject.id),
        ])

        const transformed = projectZones.map((zone: any, index: number) => ({
          ...zoneService.transformForFrontend(zone),
          color: chartColors[index % chartColors.length],
        }))

        setZonesState(transformed)
        setTeams(projectTeams.map((t: any) => ({ id: t.id, name: t.name })))
        setError(null)
      } catch (err) {
        console.error('Failed to fetch zones:', err)
        setError('Failed to load zones')
      } finally {
        setIsLoading(false)
      }
    }

    fetchZones()
  }, [])

  function toggleVisible(id: string) {
    setZonesState(prev => prev.map(z => z.id === id ? { ...z, visible: !z.visible } : z))
  }

  const assigned = zonesState.filter(z => z.team !== 'Unassigned')
  const pending = zonesState.filter(z => z.team === 'Unassigned')
  const overlapping = zonesState.filter(z => z.overlap)

  return (
    <>
      <DashboardHeader
        title="Zones"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor' }}
        breadcrumbs={[{ label: 'Project Overview', href: '/supervisor' }, { label: 'Zones' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Zones & Coverage</h1>
              <p className="text-muted-foreground">Define geofenced zones, assign teams, and track coverage</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/supervisor/map">
                  <MapPin className="h-4 w-4 mr-2" /> View on Live Map
                </a>
              </Button>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" /> Create Zone</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Zone</DialogTitle>
                    <DialogDescription>Define a new geofenced zone for your field teams.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Zone Name</Label>
                      <Input placeholder="e.g. Zone M - Pumwani" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input placeholder="Brief area description" />
                    </div>
                    <div className="space-y-2">
                    <Label>Assign Team</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select team (optional)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Leave Unassigned</SelectItem>
                        {teams.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                        {teams.length === 0 && <SelectItem value="none" disabled>No teams available</SelectItem>}
                      </SelectContent>
                    </Select>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted rounded-md p-3">
                      Zone boundaries are drawn directly on the Live Map. After creating the zone, go to Live Map to draw its geofence.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button onClick={() => setCreateOpen(false)}>Create Zone</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            {isLoading ? (
              <>
                {[1, 2, 3, 4].map(i => (
                  <Card key={i}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0 bg-muted animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                {error && (
                  <div className="col-span-4 rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
                    {error}
                  </div>
                )}
                {[
                  { label: 'Total Zones', value: zonesState.length, icon: Layers, color: 'text-primary', bg: 'bg-primary/10' },
                  { label: 'Assigned', value: assigned.length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'Unassigned', value: pending.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                  { label: 'Overlapping', value: overlapping.length, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
                ].map(s => (
                  <Card key={s.label}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', s.bg)}>
                        <s.icon className={cn('h-5 w-5', s.color)} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>

          {/* Zone Grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shrink-0 bg-muted" />
                        <div className="space-y-2">
                          <div className="h-4 w-20 bg-muted rounded" />
                          <div className="h-3 w-32 bg-muted rounded" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" />
                      <div className="h-8 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : error ? (
              <div className="col-span-full rounded-lg bg-destructive/10 p-8 text-center text-destructive">
                Failed to load zones. Please try again.
              </div>
            ) : zonesState.length === 0 ? (
              <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                <MapPin className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="font-medium">No zones found</p>
                <p className="text-sm">Create a zone to get started</p>
              </div>
            ) : (
              zonesState.map(zone => {
                const cfg = statusConfig[zone.status]
                const StatusIcon = cfg.icon
                return (
                  <Card key={zone.id} className={cn('transition-opacity', !zone.visible && 'opacity-50')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: zone.colorHex }} />
                          <div>
                            <CardTitle className="text-base">{zone.name}</CardTitle>
                            <CardDescription className="text-xs">{zone.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {zone.overlap && (
                            <Badge variant="secondary" className="bg-destructive/10 text-destructive text-[10px] px-1.5">
                              Overlap
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit Zone</DropdownMenuItem>
                              <DropdownMenuItem><Users className="mr-2 h-4 w-4" /> Reassign Team</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Zone</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {zone.team}
                        </span>
                        <Badge variant="secondary" className={cfg.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Area: <span className="text-foreground font-medium">{zone.area}</span></span>
                        <span>Members: <span className="text-foreground font-medium">{zone.members}</span></span>
                      </div>
                      {zone.status !== 'pending' && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Coverage</span>
                            <span className="font-medium">{zone.coverage}%</span>
                          </div>
                          <Progress value={zone.coverage} className="h-1.5" />
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-border">
                        <span className="text-xs text-muted-foreground">Visible on map</span>
                        <Switch checked={zone.visible} onCheckedChange={() => toggleVisible(zone.id)} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

        </div>
      </main>
    </>
  )
}

