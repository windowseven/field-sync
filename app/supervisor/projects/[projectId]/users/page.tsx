'use client'

import * as React from 'react'
import {
  Search, MoreHorizontal, UserX, Shield, Users,
  CheckCircle2, XCircle, Clock, Filter,
  Mail, Phone, UsersRound, ArrowUpDown,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

// Removed duplicate ProjectUser interface

import { projectService } from '@/lib/api/projectService'
import { useParams } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

interface ProjectUser {
  id: string
  name: string
  email: string
  phone: string
  role: 'team_leader' | 'field_agent' | 'supervisor' | 'admin'
  team_name: string
  status: 'online' | 'offline' | 'idle'
  submissions_count: number
  last_seen: string
}

const statusConfig = {
  online: { label: 'Online', className: 'bg-emerald-500/10 text-emerald-500', dot: 'bg-emerald-500' },
  active: { label: 'Online', className: 'bg-emerald-500/10 text-emerald-500', dot: 'bg-emerald-500' },
  offline: { label: 'Offline', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  idle: { label: 'Idle', className: 'bg-amber-500/10 text-amber-500', dot: 'bg-amber-500' },
}

const roleConfig = {
  admin: { label: 'Admin', className: 'bg-purple-500/10 text-purple-500' },
  supervisor: { label: 'Supervisor', className: 'bg-blue-500/10 text-blue-500' },
  team_leader: { label: 'Team Leader', className: 'bg-primary/10 text-primary' },
  field_agent: { label: 'Field Agent', className: 'bg-secondary text-secondary-foreground' },
  field_user: { label: 'Field Agent', className: 'bg-secondary text-secondary-foreground' },
}

export default function SupervisorUsersPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [users, setUsers] = React.useState<ProjectUser[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [roleFilter, setRoleFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        const data = await projectService.getUsers(projectId)
        setUsers(data)
      } catch (error) {
        console.error('Failed to fetch project users:', error)
        toast({
          title: 'Error',
          description: 'Failed to load project users. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    if (projectId) fetchUsers()
  }, [projectId])

  const filtered = users.filter(u => {
    const matchSearch = String(u.name || '').toLowerCase().includes(search.toLowerCase()) || 
                       String(u.email || '').toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  const leaders = users.filter(u => u.role === 'team_leader')
  const fieldUsers = users.filter(u => u.role === 'field_agent')
  const active = users.filter(u => u.status === 'online' || u.status === 'idle')
  const unverified = [] 

  return (
    <>
      <DashboardHeader
        title="Project Users"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor/projects' }}
        breadcrumbs={[{ label: 'My Projects', href: '/supervisor/projects' }, { label: 'Project Users' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Project Users</h1>
            <p className="text-muted-foreground">All members in this project</p>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Members', value: users.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Team Leaders', value: leaders.length, icon: Shield, color: 'text-chart-2', bg: 'bg-chart-2/10' },
              { label: 'Currently Active', value: active.length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Unverified', value: unverified.length, icon: XCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            ].map((s) => (
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

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="team_leader">Team Leaders</SelectItem>
                <SelectItem value="field_user">Field Users</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Members ({users.length})</TabsTrigger>
              <TabsTrigger value="leaders">Team Leaders ({leaders.length})</TabsTrigger>
              <TabsTrigger value="field">Field Users ({fieldUsers.length})</TabsTrigger>
            </TabsList>

            {(['all', 'leaders', 'field'] as const).map(tab => {
              const tabUsers = tab === 'all' ? filtered : filtered.filter(u => tab === 'leaders' ? u.role === 'team_leader' : u.role === 'field_agent')
              return (
                <TabsContent key={tab} value={tab}>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Team</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead><div className="flex items-center gap-1"><ArrowUpDown className="h-3 w-3" /> Submissions</div></TableHead>
                            <TableHead>Last Seen</TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tabUsers.map((user) => (
                             <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                      {(user.name || 'U').split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-sm">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={roleConfig[user.role]?.className || ''}>
                                  {roleConfig[user.role]?.label || user.role}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5 text-sm">
                                  <UsersRound className="h-3.5 w-3.5 text-muted-foreground" />
                                  {user.team_name || 'No Team'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <div className={cn('h-1.5 w-1.5 rounded-full', statusConfig[user.status]?.dot || 'bg-muted')} />
                                  <span className="text-sm">{statusConfig[user.status]?.label || user.status}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              </TableCell>
                              <TableCell className="font-mono text-sm">{user.submissions_count}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {user.last_seen ? new Date(user.last_seen).toLocaleDateString() : 'Never'}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Mail className="mr-2 h-4 w-4" /> Send Message
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Phone className="mr-2 h-4 w-4" /> View Contact
                                    </DropdownMenuItem>
                                    {user.role === 'field_agent' && (
                                      <DropdownMenuItem>
                                        <Shield className="mr-2 h-4 w-4" /> Promote to Leader
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">
                                      <UserX className="mr-2 h-4 w-4" /> Remove from Project
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              )
            })}
          </Tabs>

        </div>
      </main>
    </>
  )
}
