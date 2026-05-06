"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, MapPin, Users, Plus, Trash2, Edit3 } from 'lucide-react'
import { zoneService, ApiZone } from '@/lib/api/zoneService'
import { projectService, ApiProject } from '@/lib/api/projectService'
import { teamService } from '@/lib/api/teamService'
import { http } from '@/lib/api/httpClient'
import { toast } from 'sonner'

interface SubZoneAssignment {
  id: string
  zone_id: string
  user_id: string
  user_name: string
  user_email: string
  boundaries?: any
  assigned_at: string
}

export default function SubZoneAllocationPage() {
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [zones, setZones] = useState<ApiZone[]>([])
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [assignments, setAssignments] = useState<SubZoneAssignment[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedMember, setSelectedMember] = useState('')
  const [boundariesJson, setBoundariesJson] = useState('')
  const [zoneMode, setZoneMode] = useState<'individual' | 'group'>('individual')
  const [noTeam, setNoTeam] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedZone) {
      fetchAssignments()
    }
  }, [selectedZone])

  const loadData = async () => {
    try {
      setLoading(true)
      const [projectsData, teamData] = await Promise.all([
        projectService.getAll(),
        teamService.getMyTeamMembers(),
      ])
      setProjects(projectsData)
      setMembers(teamData?.data?.members ?? teamData?.members ?? [])

      const activeProject = projectsData.find(p => p.status === 'active') || projectsData[0]
      if (activeProject) {
        const zonesData = await zoneService.getByProject(activeProject.id)
        setZones(zonesData)
        if (zonesData.length > 0) {
          setSelectedZone(zonesData[0].id)
        }
      }
    } catch (error: any) {
      const isNoTeam = error?.status === 404 || error?.message?.includes('No team assigned')
      if (isNoTeam) {
        setNoTeam(true)
      } else {
        console.error('Failed to load data:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    try {
      const res = await http.get<any>(`/zones/${selectedZone}/sub-assignments`)
      setAssignments(res?.data?.assignments ?? res?.data?.data?.assignments ?? [])
    } catch {
      setAssignments([])
    }
  }

  const handleAssign = async () => {
    if (!selectedMember) {
      toast.error('Please select a member')
      return
    }
    setAssigning(true)
    try {
      let boundaries = null
      if (boundariesJson.trim()) {
        boundaries = JSON.parse(boundariesJson)
      }
      await http.post('/zones/sub-assign', {
        zone_id: selectedZone,
        user_id: selectedMember,
        boundaries,
      })
      toast.success('Member assigned to sub-zone')
      setAssignDialogOpen(false)
      setSelectedMember('')
      setBoundariesJson('')
      await fetchAssignments()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await http.delete(`/zones/sub-assign/${id}`)
      toast.success('Assignment removed')
      await fetchAssignments()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to remove')
    }
  }

  const handleModeChange = async (mode: 'individual' | 'group') => {
    setZoneMode(mode)
    try {
      await http.patch(`/zones/${selectedZone}/mode`, { mode })
      toast.success(`Zone mode set to ${mode}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update mode')
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
              <MapPin className="h-5 w-5 text-orange-500" />
              No Team Assigned
            </CardTitle>
            <CardDescription>You need to be assigned to a team to manage zones.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please contact your supervisor to be assigned to a team.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentZone = zones.find(z => z.id === selectedZone)
  const assignedCount = assignments.length
  const unassignedMembers = members.filter(m => !assignments.some(a => a.user_id === m.id))

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sub-Zone Allocation</h1>
          <p className="text-muted-foreground">Divide zones and assign to team members</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Zone Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a zone" />
            </SelectTrigger>
            <SelectContent>
              {zones.map(zone => (
                <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {currentZone && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{currentZone.name}</CardTitle>
              <CardDescription>{currentZone.description || 'No description'}</CardDescription>
            </div>
            <Select value={zoneMode} onValueChange={(v) => handleModeChange(v as 'individual' | 'group')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assignments
                <Badge variant="secondary" className="ml-2">{assignedCount}</Badge>
              </CardTitle>
            </div>
            <Button size="sm" onClick={() => setAssignDialogOpen(true)} disabled={unassignedMembers.length === 0}>
              <Plus className="h-4 w-4 mr-1" />
              Assign
            </Button>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No members assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {assignment.user_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{assignment.user_name}</p>
                        <p className="text-xs text-muted-foreground">{assignment.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleRemove(assignment.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zone Boundaries</CardTitle>
            <CardDescription>Current zone coverage and sub-zones</CardDescription>
          </CardHeader>
          <CardContent>
            {currentZone?.boundaries ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Zone Coordinates</Label>
                  <pre className="mt-2 p-3 rounded-lg bg-muted text-xs overflow-auto max-h-40">
                    {typeof currentZone.boundaries === 'string' ? currentZone.boundaries : JSON.stringify(currentZone.boundaries, null, 2)}
                  </pre>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg border">
                    <p className="text-muted-foreground text-xs">Total Members</p>
                    <p className="text-xl font-bold">{members.length}</p>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="text-muted-foreground text-xs">Assigned</p>
                    <p className="text-xl font-bold">{assignedCount}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No boundaries defined for this zone</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Sub-Zone</DialogTitle>
            <DialogDescription>Assign a team member to {currentZone?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Team Member</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedMembers.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Sub-Zone Boundaries (Optional)</Label>
              <Textarea
                placeholder='[{"lat": 0, "lng": 0}, ...]'
                value={boundariesJson}
                onChange={(e) => setBoundariesJson(e.target.value)}
                rows={4}
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Leave empty to assign the full zone</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
