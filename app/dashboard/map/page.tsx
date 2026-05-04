'use client'

import * as React from 'react'
import {
  Plus,
  Layers,
  Eye,
  Pencil,
  Trash2,
  MapPin,
  Users,
  MoreHorizontal,
  Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BaseMap, MapUser, MapZone } from '@/components/shared/map'
import { zoneService, ApiZone } from '@/lib/api/zoneService'
import { projectService, ApiProject } from '@/lib/api/projectService'
import { fetcher } from '@/lib/api/swr-fetcher'

const zoneColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6']

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
  boundaries?: [number, number][]
}

const mapLayers = [
  { id: 'zones', label: 'Zone Boundaries', enabled: true },
  { id: 'users', label: 'Team Members', enabled: true },
  { id: 'labels', label: 'Zone Labels', enabled: true },
]

function getStatusBadge(status: Zone['status']) {
  switch (status) {
    case 'active':
      return <Badge className="bg-success/10 text-success hover:bg-success/20">Active</Badge>
    case 'completed':
      return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Completed</Badge>
    case 'pending':
      return <Badge className="bg-muted text-muted-foreground hover:bg-muted/80">Pending</Badge>
  }
}

export default function MapPage() {
  const [zones, setZones] = React.useState<Zone[]>([])
  const [mapZones, setMapZones] = React.useState<MapZone[]>([])
  const [mapUsers, setMapUsers] = React.useState<MapUser[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedZone, setSelectedZone] = React.useState<string | null>(null)
  const [layers, setLayers] = React.useState(mapLayers)

  const fetchZones = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const projects = await projectService.getAll()
      const activeProject = projects.find((p: ApiProject) => p.status === 'active') || projects[0]

      if (!activeProject) {
        setZones([])
        setMapZones([])
        return
      }

      const projectZones = await zoneService.getByProject(activeProject.id)

      const transformed: Zone[] = projectZones.map((zone: ApiZone, index: number) => {
        const boundaries = zone.boundaries
          ? (typeof zone.boundaries === 'string' ? JSON.parse(zone.boundaries) : zone.boundaries) as [number, number][]
          : undefined

        return {
          ...zoneService.transformForFrontend(zone),
          color: zoneColors[index % zoneColors.length],
          boundaries,
        }
      })

      setZones(transformed)
      setMapZones(transformed.map((z) => ({
        id: z.id,
        name: z.name,
        description: z.description,
        color: z.color,
        team: z.team,
        status: z.status,
        coverage: z.coverage,
        boundaries: z.boundaries,
      })))
    } catch (err) {
      console.error('Failed to fetch zones:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchZones()
  }, [fetchZones])

  React.useEffect(() => {
    const loadLocations = async () => {
      try {
        const res = await fetcher('/locations')
        const locs: any[] = res?.locations ?? []
        const seen = new Set<string>()
        const users: MapUser[] = []
        for (const loc of locs) {
          if (seen.has(loc.user_id)) continue
          seen.add(loc.user_id)
          users.push({
            user_id: loc.user_id,
            name: loc.name,
            email: loc.email,
            role: loc.role,
            status: loc.status,
            lat: loc.lat,
            lng: loc.lng,
            accuracy: loc.accuracy,
            updated_at: loc.updated_at,
          })
        }
        setMapUsers(users)
      } catch {
        setMapUsers([])
      }
    }
    loadLocations()
  }, [])

  const toggleLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, enabled: !l.enabled } : l))
    )
  }

  return (
    <>
      <DashboardHeader
        title="Map & Zones"
        breadcrumbs={[{ label: 'Map & Zones' }]}
      />
      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <div className="mx-auto flex h-full max-w-[1800px] flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Map & Zone Management
              </h1>
              <p className="text-muted-foreground">
                Configure and monitor operational zones
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Zone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Zone</DialogTitle>
                  <DialogDescription>
                    Define a new operational zone on the map
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Zone Name</Label>
                    <Input id="name" placeholder="Zone E - East Side" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" placeholder="Brief description of the zone" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="team">Assign Team</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alpha">Team Alpha</SelectItem>
                          <SelectItem value="beta">Team Beta</SelectItem>
                          <SelectItem value="gamma">Team Gamma</SelectItem>
                          <SelectItem value="delta">Team Delta</SelectItem>
                          <SelectItem value="echo">Team Echo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="color">Zone Color</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="green">Green</SelectItem>
                          <SelectItem value="blue">Blue</SelectItem>
                          <SelectItem value="orange">Orange</SelectItem>
                          <SelectItem value="purple">Purple</SelectItem>
                          <SelectItem value="cyan">Cyan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Zone</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 gap-6 overflow-hidden">
            {/* Map Area */}
            <Card className="flex-1 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b py-3">
                <CardTitle className="text-base">Zone Map</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{zones.length} zones</span>
                  <span className="mx-1">|</span>
                  <span>{mapUsers.length} tracked users</span>
                </div>
              </CardHeader>
              <CardContent className="relative h-full p-0">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="absolute inset-0">
                    <BaseMap
                      users={layers.find((l) => l.id === 'users')?.enabled ? mapUsers : []}
                      zones={layers.find((l) => l.id === 'zones')?.enabled ? mapZones : []}
                      showLabels={layers.find((l) => l.id === 'labels')?.enabled ?? true}
                      showCoverage={false}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sidebar */}
            <div className="hidden w-80 flex-col gap-4 lg:flex">
              {/* Layers Control */}
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Map Layers
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {layers.map((layer) => (
                    <div key={layer.id} className="flex items-center justify-between">
                      <Label htmlFor={layer.id} className="text-sm cursor-pointer">
                        {layer.label}
                      </Label>
                      <Switch
                        id={layer.id}
                        checked={layer.enabled}
                        onCheckedChange={() => toggleLayer(layer.id)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Zones List */}
              <Card className="flex-1 overflow-hidden">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Zones ({isLoading ? '...' : zones.length})</CardTitle>
                  <CardDescription>Manage operational zones</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-480px)]">
                    <div className="space-y-1 px-4 pb-4">
                      {isLoading ? (
                        <div className="py-20 text-center">
                          <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                          <p className="text-xs text-muted-foreground">Loading zones...</p>
                        </div>
                      ) : zones.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground text-xs italic">
                          No zones found for this project
                        </div>
                      ) : (
                        zones.map((zone) => (
                          <button
                            key={zone.id}
                            onClick={() => setSelectedZone(zone.id)}
                            className={cn(
                              'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent/50',
                              selectedZone === zone.id && 'bg-accent'
                            )}
                          >
                            <div className={cn('mt-0.5 h-4 w-4 rounded', zone.color)} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm truncate">{zone.name}</span>
                                {getStatusBadge(zone.status)}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{zone.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Team {zone.team}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {zone.area}
                                </span>
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Coverage</span>
                                  <span className="font-medium">{zone.coverage}%</span>
                                </div>
                                <Progress value={zone.coverage} className="h-1.5" />
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View on Map
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Zone
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Users className="mr-2 h-4 w-4" />
                                  Reassign Team
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Zone
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
