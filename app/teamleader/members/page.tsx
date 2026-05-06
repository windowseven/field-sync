"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { teamService } from '@/lib/api/teamService'
import { haversineDistance, formatDistance } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Users2, MapPin, Clock, Activity, Phone, Mail, ExternalLink, Loader2 } from 'lucide-react'

interface TeamMember {
  id: string
  name: string
  first_name: string
  email: string
  role: string
  avatar?: string
  status: string
  phone?: string
  sessionActive?: boolean
  currentActivity?: string
  location?: string
  lat?: number
  lng?: number
  distanceFromLeader?: number
  lastSeen?: string
  tasksCompleted?: number
  formsSubmitted?: number
  accuracy?: number | null
  locationUpdatedAt?: string
}

export default function TeamMembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [noTeam, setNoTeam] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [open, setOpen] = useState(false)
  const [leaderLat, setLeaderLat] = useState<number | null>(null)
  const [leaderLng, setLeaderLng] = useState<number | null>(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      setNoTeam(false)
      const data = await teamService.getMyTeamMembers()
      if (!data) {
        setNoTeam(true)
        return
      }

      const leader = data.members.find(m => m.is_team_leader)
      if (leader?.lat && leader?.lng) {
        setLeaderLat(leader.lat)
        setLeaderLng(leader.lng)
      }

      const processed = data.members.map(member => {
        let distance = 0
        if (leaderLat && leaderLng && member.lat && member.lng) {
          distance = haversineDistance(leaderLat, leaderLng, member.lat, member.lng)
        }
        return {
          id: member.id,
          name: member.name,
          first_name: member.first_name,
          email: member.email,
          role: member.role,
          status: member.status,
          lat: member.lat ?? undefined,
          lng: member.lng ?? undefined,
          distanceFromLeader: distance || undefined,
          location: member.lat && member.lng ? `${member.lat.toFixed(5)}, ${member.lng.toFixed(5)}` : 'Unknown',
          lastSeen: member.last_seen ? new Date(member.last_seen).toLocaleString() : 'Never',
          tasksCompleted: 0,
          formsSubmitted: 0,
          accuracy: member.accuracy,
          locationUpdatedAt: member.location_updated_at ?? undefined,
        }
      })

      setMembers(processed)
    } catch (error: any) {
      const isNoTeam = error?.status === 404 || error?.message?.includes('No team assigned')
      if (isNoTeam) {
        setNoTeam(true)
      } else {
        console.error('Failed to fetch members:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const statusConfig: Record<string, string> = {
    online: 'bg-emerald-500',
    active: 'bg-emerald-600',
    idle: 'bg-amber-500',
    offline: 'bg-slate-400',
  }

  function openMember(member: TeamMember) {
    setSelectedMember(member)
    setOpen(true)
  }

  function handleCall(member: TeamMember) {
    if (member.phone) {
      window.location.href = `tel:${member.phone}`
    }
  }

  function handleMessage(member: TeamMember) {
    setOpen(false)
    router.push('/teamleader/notifications')
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
              <Users2 className="h-5 w-5 text-orange-500" />
              No Team Assigned
            </CardTitle>
            <CardDescription>You have not been assigned to a team yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please contact your supervisor to be assigned to a team.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeCount = members.filter(m => m.status === 'online' || m.status === 'active').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground">Manage and monitor your field team</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users2 className="h-3 w-3" />
            {members.length} Total
          </Badge>
          <Badge className="flex items-center gap-1">
            {activeCount} Active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <Card
            key={member.id}
            className="hover:shadow-lg transition-all group cursor-pointer"
            onClick={() => openMember(member)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors truncate font-bold">
                    {member.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 w-2 rounded-full">
                      <div className={cn('h-2 w-2 rounded-full', statusConfig[member.status], member.status !== 'offline' && 'animate-pulse')} />
                    </div>
                    <CardDescription className="text-sm capitalize">{member.status}</CardDescription>
                    {member.sessionActive && <Badge variant="secondary" className="text-xs">Live</Badge>}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{member.location}</span>
              </div>
              {member.distanceFromLeader && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">📏 {formatDistance(member.distanceFromLeader)} from leader</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground/70 mt-2 pt-2 border-t">
                Last seen {member.lastSeen}
              </div>

              <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => handleCall(member)}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={() => handleMessage(member)}
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Member Details</DialogTitle>
            <DialogDescription>Full profile and activity for {selectedMember?.name}</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20 flex-shrink-0">
                  <AvatarImage src={selectedMember.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {selectedMember.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <h3 className="text-2xl font-bold">{selectedMember.name}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className={cn('h-3 w-3 rounded-full', statusConfig[selectedMember.status])} />
                    <span className="capitalize font-medium">{selectedMember.status}</span>
                    {selectedMember.sessionActive && <Badge>Session Active</Badge>}
                  </div>
                  <p className="text-muted-foreground">{selectedMember.currentActivity}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Location & Session</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>{selectedMember.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>Last seen {selectedMember.lastSeen}</span>
                    </div>
                    {selectedMember.distanceFromLeader && (
                      <div className="flex items-center gap-2 text-sm">
                        📏 {formatDistance(selectedMember.distanceFromLeader)} from leader
                      </div>
                    )}
                    {selectedMember.accuracy && (
                      <div className="text-xs text-muted-foreground">Accuracy: ±{Math.round(selectedMember.accuracy)}m</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tasks Completed</span>
                      <Badge>{selectedMember.tasksCompleted}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Forms Submitted</span>
                      <Badge>{selectedMember.formsSubmitted}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Score</span>
                      <Badge className="bg-primary">
                        {(selectedMember.tasksCompleted || 0) + (selectedMember.formsSubmitted || 0)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleCall(selectedMember)}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleMessage(selectedMember)}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Send Message
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {selectedMember.email}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

