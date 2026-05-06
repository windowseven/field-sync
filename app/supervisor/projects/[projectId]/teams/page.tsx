'use client'

import * as React from 'react'
import {
  Plus, Search, MoreHorizontal, Users, MapPin,
  TrendingUp, UserPlus, Trash2, Settings, UserMinus,
  UsersRound, CheckCircle2,
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
import { cn } from '@/lib/utils'

const teams = [
  {
    id: '1', name: 'Team Alpha', color: 'bg-chart-1', zone: 'Zone A - Downtown',
    status: 'active' as const, progress: 79,
    leader: { name: 'Sarah Johnson', email: 'sarah.j@survey.co' },
    members: [
      { name: 'Kwame Asante', status: 'active' as const, submissions: 43 },
      { name: 'Tewodros Bekele', status: 'active' as const, submissions: 19 },
      { name: 'Lena Mugo', status: 'idle' as const, submissions: 12 },
      { name: 'Ibrahim Diallo', status: 'offline' as const, submissions: 8 },
    ],
    tasksCompleted: 45, tasksPending: 12,
  },
  {
    id: '2', name: 'Team Beta', color: 'bg-chart-2', zone: 'Zone C - Westlands',
    status: 'active' as const, progress: 68,
    leader: { name: 'James Kariuki', email: 'james.k@survey.co' },
    members: [
      { name: 'Fatima Ndiaye', status: 'offline' as const, submissions: 31 },
      { name: 'Amina Sesay', status: 'active' as const, submissions: 27 },
      { name: 'Osei Mensah', status: 'active' as const, submissions: 14 },
    ],
    tasksCompleted: 38, tasksPending: 18,
  },
  {
    id: '3', name: 'Team Gamma', color: 'bg-chart-3', zone: 'Zone E - Eastlands',
    status: 'active' as const, progress: 55,
    leader: { name: 'Amara Diallo', email: 'amara.d@survey.co' },
    members: [
      { name: 'Ngozi Adeyemi', status: 'offline' as const, submissions: 4 },
      { name: 'Sule Bah', status: 'idle' as const, submissions: 18 },
      { name: 'Yvonne Cherono', status: 'active' as const, submissions: 22 },
    ],
    tasksCompleted: 29, tasksPending: 14,
  },
  {
    id: '4', name: 'Team Delta', color: 'bg-chart-4', zone: 'Zone F - Kasarani',
    status: 'idle' as const, progress: 50,
    leader: { name: 'Chioma Obi', email: 'chioma.o@survey.co' },
    members: [
      { name: 'Victor Eze', status: 'idle' as const, submissions: 11 },
      { name: 'Blessing Okeke', status: 'active' as const, submissions: 9 },
      { name: 'Halima Juma', status: 'offline' as const, submissions: 2 },
    ],
    tasksCompleted: 22, tasksPending: 22,
  },
  {
    id: '5', name: 'Team Echo', color: 'bg-chart-5', zone: 'Zone H - Kibera',
    status: 'active' as const, progress: 64,
    leader: { name: 'Mwangi Njoroge', email: 'mwangi.n@survey.co' },
    members: [
      { name: 'Aisha Diop', status: 'idle' as const, submissions: 15 },
      { name: 'Kojo Acheampong', status: 'active' as const, submissions: 28 },
      { name: 'Seun Adeyemi', status: 'active' as const, submissions: 18 },
    ],
    tasksCompleted: 18, tasksPending: 10,
  },
]

const statusColors = {
  active: { dot: 'bg-emerald-500', label: 'Active', badge: 'bg-emerald-500/10 text-emerald-500' },
  idle: { dot: 'bg-amber-500', label: 'Idle', badge: 'bg-amber-500/10 text-amber-500' },
  paused: { dot: 'bg-muted-foreground', label: 'Paused', badge: 'bg-muted text-muted-foreground' },
}

const memberStatus = {
  active: 'bg-emerald-500',
  idle: 'bg-amber-500',
  offline: 'bg-muted-foreground',
}

export default function SupervisorTeamsPage() {
  const [search, setSearch] = React.useState('')
  const [createOpen, setCreateOpen] = React.useState(false)

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
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Create Team</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>Set up a new field team for your project.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Team Name</Label>
                    <Input placeholder="e.g. Team Foxtrot" />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Team Leader</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select a team leader" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sarah">Sarah Johnson</SelectItem>
                        <SelectItem value="james">James Kariuki</SelectItem>
                        <SelectItem value="amara">Amara Diallo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Zone</Label>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select a zone" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zoneB">Zone B - Nairobi West</SelectItem>
                        <SelectItem value="zoneD">Zone D - Lang'ata</SelectItem>
                        <SelectItem value="zoneG">Zone G - Embakasi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={() => setCreateOpen(false)}>Create Team</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Teams', value: teams.length, icon: UsersRound, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Active Teams', value: teams.filter(t => t.status === 'active').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Total Members', value: teams.reduce((acc, t) => acc + t.members.length + 1, 0), icon: Users, color: 'text-chart-2', bg: 'bg-chart-2/10' },
              { label: 'Avg. Progress', value: `${Math.round(teams.reduce((acc, t) => acc + t.progress, 0) / teams.length)}%`, icon: TrendingUp, color: 'text-chart-3', bg: 'bg-chart-3/10' },
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

        </div>
      </main>
    </>
  )
}
