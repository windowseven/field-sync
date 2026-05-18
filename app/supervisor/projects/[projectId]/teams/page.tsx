'use client'

import { use } from 'react'
import * as React from 'react'
import {
  Plus, Search, MoreHorizontal, Users, MapPin,
  TrendingUp, UserPlus, Trash2, Settings, UserMinus,
  UsersRound, CheckCircle2, Loader2, XCircle,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
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
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { teamService } from '@/lib/api/teamService'
import { projectService } from '@/lib/api/projectService'

const statusColors = {
  active: { dot: 'bg-emerald-500', label: 'Active', badge: 'bg-emerald-500/10 text-emerald-500' },
  idle: { dot: 'bg-amber-500', label: 'Idle', badge: 'bg-amber-500/10 text-amber-500' },
  paused: { dot: 'bg-muted-foreground', label: 'Paused', badge: 'bg-muted text-muted-foreground' },
}

const memberStatus: Record<string, string> = {
  active: 'bg-emerald-500',
  idle: 'bg-amber-500',
  offline: 'bg-muted-foreground',
}

interface TeamData {
  id: string
  name: string
  color: string
  zone: string
  status: 'active' | 'idle' | 'paused'
  progress: number
  leader: { name: string; email: string }
  members: Array<{ name: string; status: 'active' | 'idle' | 'offline'; submissions: number }>
  tasksCompleted: number
  tasksPending: number
}

export default function SupervisorTeamsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const [search, setSearch] = React.useState('')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [teams, setTeams] = React.useState<TeamData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [teamName, setTeamName] = React.useState('')
  const [leaderId, setLeaderId] = React.useState('')
  const [projectUsers, setProjectUsers] = React.useState<any[]>([])

  const chartColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6']

  React.useEffect(() => {
    const fetchTeams = async () => {
      setIsLoading(true)
      try {
        const [projectTeams, users] = await Promise.all([
          teamService.getByProject(projectId),
          projectService.getUsers(projectId).catch(() => []),
        ])
        setProjectUsers(users)
        const transformed = projectTeams.map((team: any, index: number) => ({
          id: team.id,
          name: team.name,
          color: chartColors[index % chartColors.length],
          zone: team.zone?.name || 'Unassigned',
          status: team.status === 'active' ? 'active' as const : team.status === 'paused' ? 'paused' as const : 'idle' as const,
          progress: Math.round((team.tasks_completed || 0) / ((team.tasks_completed || 0) + (team.tasks_pending || 1)) * 100),
          leader: { name: team.leader?.name || 'Unassigned', email: team.leader?.email || '' },
          members: (team.members || []).map((m: any) => ({
            name: m.name,
            status: m.status === 'active' ? 'active' as const : m.status === 'offline' ? 'offline' as const : 'idle' as const,
            submissions: m.submissions || 0,
          })),
          tasksCompleted: team.tasks_completed || 0,
          tasksPending: team.tasks_pending || 0,
        }))
        setTeams(transformed)
        setError(null)
      } catch {
        setError('Failed to load teams')
      } finally {
        setIsLoading(false)
      }
    }
    fetchTeams()
  }, [projectId])

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      toast({ title: 'Team name is required', variant: 'destructive' })
      return
    }
    setIsCreating(true)
    try {
      await teamService.create({
        project_id: projectId,
        name: teamName.trim(),
        leader_id: leaderId || undefined,
      })
      toast({ title: 'Team created successfully' })
      setCreateOpen(false)
      setTeamName('')
      setLeaderId('')
      const projectTeams = await teamService.getByProject(projectId)
      const transformed = projectTeams.map((team: any, index: number) => ({
        id: team.id,
        name: team.name,
        color: chartColors[index % chartColors.length],
        zone: team.zone?.name || 'Unassigned',
        status: team.status === 'active' ? 'active' as const : team.status === 'paused' ? 'paused' as const : 'idle' as const,
        progress: Math.round((team.tasks_completed || 0) / ((team.tasks_completed || 0) + (team.tasks_pending || 1)) * 100),
        leader: { name: team.leader?.name || 'Unassigned', email: team.leader?.email || '' },
        members: (team.members || []).map((m: any) => ({
          name: m.name,
          status: m.status === 'active' ? 'active' as const : m.status === 'offline' ? 'offline' as const : 'idle' as const,
          submissions: m.submissions || 0,
        })),
        tasksCompleted: team.tasks_completed || 0,
        tasksPending: team.tasks_pending || 0,
      }))
      setTeams(transformed)
    } catch (err) {
      console.error('Failed to create team:', err)
      toast({ title: 'Failed to create team', variant: 'destructive' })
    } finally {
      setIsCreating(false)
    }
  }

  const filtered = teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.leader.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <DashboardHeader
        title="Teams"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor/projects' }}
        breadcrumbs={[{ label: 'My Projects', href: '/supervisor/projects' }, { label: 'Teams' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
              <p className="text-muted-foreground">Manage field teams, assign leaders, and track performance</p>
            </div>
            <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setTeamName(''); setLeaderId('') } }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Create Team</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>Set up a new field team for this project.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Team Name</Label>
                    <Input
                      placeholder="e.g. Team Foxtrot"
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Team Leader</Label>
                    <Select value={leaderId} onValueChange={setLeaderId}>
                      <SelectTrigger><SelectValue placeholder="Select a team leader (optional)" /></SelectTrigger>
                      <SelectContent>
                        {projectUsers.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                        ))}
                        {projectUsers.length === 0 && <SelectItem value="none" disabled>No users in this project</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setCreateOpen(false); setTeamName(''); setLeaderId('') }}>Cancel</Button>
                  <Button onClick={handleCreateTeam} disabled={isCreating || !teamName.trim()}>
                    {isCreating ? 'Creating...' : 'Create Team'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading teams...</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
              <XCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && (
          <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Teams', value: teams.length, icon: UsersRound, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Active Teams', value: teams.filter(t => t.status === 'active').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Total Members', value: teams.reduce((acc, t) => acc + t.members.length + 1, 0), icon: Users, color: 'text-chart-2', bg: 'bg-chart-2/10' },
              { label: 'Avg. Progress', value: teams.length > 0 ? `${Math.round(teams.reduce((acc, t) => acc + t.progress, 0) / teams.length)}%` : '0%', icon: TrendingUp, color: 'text-chart-3', bg: 'bg-chart-3/10' },
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
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search teams..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Team Cards */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(team => (
              <Card key={team.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-3 w-3 rounded-full shrink-0', team.color)} />
                      <div>
                        <CardTitle className="text-base">{team.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {team.zone}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={statusColors[team.status].badge}>
                        <span className={cn('h-1.5 w-1.5 rounded-full mr-1', statusColors[team.status].dot)} />
                        {statusColors[team.status].label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Settings className="mr-2 h-4 w-4" /> Edit Team</DropdownMenuItem>
                          <DropdownMenuItem><UserPlus className="mr-2 h-4 w-4" /> Add Member</DropdownMenuItem>
                          <DropdownMenuItem><MapPin className="mr-2 h-4 w-4" /> Change Zone</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Disband Team</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {/* Leader */}
                  <div className="flex items-center gap-2 rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {team.leader.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium">{team.leader.name}</p>
                      <p className="text-[10px] text-muted-foreground">Team Leader</p>
                    </div>
                    <Badge variant="outline" className="ml-auto text-[10px]">Leader</Badge>
                  </div>

                  {/* Members */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Members ({team.members.length})</p>
                    {team.members.map(member => (
                      <div key={member.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', memberStatus[member.status])} />
                          <span>{member.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{member.submissions} submissions</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><UserMinus className="mr-2 h-3.5 w-3.5" /> Remove from Team</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">Task Progress</span>
                      <span className="text-xs font-medium">{team.tasksCompleted}/{team.tasksCompleted + team.tasksPending}</span>
                    </div>
                    <Progress value={team.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{team.progress}% complete</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          </>
          )}

        </div>
      </main>
    </>
  )
}
