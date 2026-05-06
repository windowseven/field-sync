'use client'

import * as React from 'react'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Users,
  MapPin,
  TrendingUp,
  UserPlus,
  Settings,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  Loader2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { teamService } from '@/lib/api/teamService'
import { projectService, ApiProject } from '@/lib/api/projectService'

interface TeamMember {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
  role: 'leader' | 'member'
  status: 'online' | 'offline' | 'idle'
  joinedAt: string
  formsCompleted: number
}

interface Team {
  id: string
  name: string
  description: string
  color: string
  leader: TeamMember
  members: TeamMember[]
  zone: string
  status: 'active' | 'inactive' | 'paused'
  progress: number
  createdAt: string
}

const chartColors = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6']

function getStatusBadge(status: Team['status']) {
  switch (status) {
    case 'active':
      return <Badge className="bg-success/10 text-success hover:bg-success/20">Active</Badge>
    case 'inactive':
      return <Badge className="bg-muted text-muted-foreground hover:bg-muted/80">Inactive</Badge>
    case 'paused':
      return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">Paused</Badge>
  }
}

function getMemberStatusColor(status: TeamMember['status']) {
  switch (status) {
    case 'online':
      return 'status-online'
    case 'idle':
      return 'status-idle'
    case 'offline':
      return 'status-offline'
  }
}

export default function TeamsPage() {
  const [teams, setTeams] = React.useState<Team[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedTeam, setSelectedTeam] = React.useState<Team | null>(null)
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid')

  React.useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true)
        const projects = await projectService.getAll()
        const activeProject = projects.find((p: ApiProject) => p.status === 'active') || projects[0]
        
        if (!activeProject) {
          setTeams([])
          setIsLoading(false)
          return
        }

        const projectTeams = await teamService.getByProject(activeProject.id)
        
        const transformed = projectTeams.map((team: any, index: number) => ({
          id: team.id,
          name: team.name,
          description: team.description || '',
          color: chartColors[index % chartColors.length],
          zone: team.zone?.name || 'Unassigned',
          status: team.status === 'active' ? 'active' : team.status === 'paused' ? 'paused' : 'inactive',
          progress: Math.round((team.tasks_completed || 0) / ((team.tasks_completed || 0) + (team.tasks_pending || 1)) * 100),
          createdAt: team.created_at || new Date().toISOString(),
          leader: {
            id: team.leader?.id || '',
            name: team.leader?.name || 'Unassigned',
            email: team.leader?.email || '',
            phone: team.leader?.phone || '',
            role: 'leader',
            status: team.leader?.status === 'active' ? 'online' : team.leader?.status === 'idle' ? 'idle' : 'offline',
            joinedAt: team.leader?.joined_at || '',
            formsCompleted: team.leader?.submissions || 0,
          },
          members: (team.members || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            email: m.email || '',
            phone: m.phone || '',
            role: 'member',
            status: m.status === 'active' ? 'online' : m.status === 'idle' ? 'idle' : 'offline',
            joinedAt: m.joined_at || '',
            formsCompleted: m.submissions || 0,
          })),
        }))

        setTeams(transformed as Team[])
      } catch (err) {
        console.error('Failed to fetch teams:', err)
        setTeams([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchTeams()
  }, [])

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.zone.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalMembers = teams.reduce((acc, team) => acc + team.members.length + 1, 0)
  const activeTeams = teams.filter((t) => t.status === 'active').length

  if (isLoading) {
    return (
      <>
        <DashboardHeader
          title="Team Management"
          breadcrumbs={[{ label: 'Teams' }]}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Loading teams...</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <DashboardHeader
        title="Team Management"
        breadcrumbs={[{ label: 'Teams' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Team Management
              </h1>
              <p className="text-muted-foreground">
                Manage teams, assign leaders, and monitor performance
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>
                    Set up a new field operations team
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input id="teamName" placeholder="Team Echo" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teamDesc">Description</Label>
                    <Input id="teamDesc" placeholder="Brief description" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teamLeader">Team Leader</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select leader" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Assign new user</SelectItem>
                        <SelectItem value="existing">Select from users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="teamZone">Assign Zone</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a">Zone A - Downtown</SelectItem>
                        <SelectItem value="b">Zone B - North District</SelectItem>
                        <SelectItem value="c">Zone C - Industrial</SelectItem>
                        <SelectItem value="e">Zone E - East Side</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Team</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teams.length}</p>
                  <p className="text-xs text-muted-foreground">Total Teams</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeTeams}</p>
                  <p className="text-xs text-muted-foreground">Active Teams</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <Users className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalMembers}</p>
                  <p className="text-xs text-muted-foreground">Total Members</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <MapPin className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teams.filter((t) => t.zone).length}</p>
                  <p className="text-xs text-muted-foreground">Zones Covered</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search teams..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')}>
              <TabsList>
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Teams Grid/Table */}
          {viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredTeams.map((team) => (
                <Card
                  key={team.id}
                  className="overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn('h-10 w-10 rounded-lg', team.color)} />
                        <div>
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {team.zone}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(team.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedTeam(team)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Add Member
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{team.description}</p>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{team.progress}%</span>
                      </div>
                      <Progress value={team.progress} className="h-2" />
                    </div>

                    {/* Team Leader */}
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={team.leader.avatar} />
                            <AvatarFallback className="text-xs">
                              {team.leader.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
                              getMemberStatusColor(team.leader.status)
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{team.leader.name}</p>
                          <p className="text-xs text-muted-foreground">Team Leader</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {team.leader.formsCompleted} forms
                      </Badge>
                    </div>

                    {/* Members */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Team Members ({team.members.length})
                        </span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <UserPlus className="mr-1 h-3 w-3" />
                          Add
                        </Button>
                      </div>
                      <div className="flex -space-x-2">
                        {team.members.slice(0, 5).map((member) => (
                          <div key={member.id} className="relative">
                            <Avatar className="h-8 w-8 border-2 border-card">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-[10px]">
                                {member.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={cn(
                                'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card',
                                getMemberStatusColor(member.status)
                              )}
                            />
                          </div>
                        ))}
                        {team.members.length > 5 && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-medium">
                            +{team.members.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn('h-8 w-8 rounded', team.color)} />
                          <div>
                            <p className="font-medium">{team.name}</p>
                            <p className="text-xs text-muted-foreground">{team.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px]">
                              {team.leader.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{team.leader.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{team.zone}</TableCell>
                      <TableCell>
                        <div className="flex -space-x-1">
                          {team.members.slice(0, 3).map((m) => (
                            <Avatar key={m.id} className="h-6 w-6 border-2 border-card">
                              <AvatarFallback className="text-[8px]">
                                {m.name.split(' ').map((n) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {team.members.length > 3 && (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-secondary text-[8px]">
                              +{team.members.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={team.progress} className="h-1.5 w-16" />
                          <span className="text-xs text-muted-foreground">{team.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(team.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Team</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}

