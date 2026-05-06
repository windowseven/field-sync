'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Users, Search, MoreHorizontal, CheckCircle2, AlertTriangle, XCircle,
  Shield, LogOut, Key, Ban, Eye, UserCog, UserCheck, User, Download, Loader2, Trash2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { http } from '@/lib/api/httpClient'
import { userService } from '@/lib/api/userService'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface PlatformUser {
  id: string
  name: string
  email: string
  role: string
  status: string
  last_seen?: string
  avatar?: string
  first_name?: string
}

const roleConfig: Record<string, { icon: React.ElementType; className: string; label: string }> = {
  admin: { icon: Shield, className: 'bg-purple-500/10 text-purple-500', label: 'Admin' },
  supervisor: { icon: UserCog, className: 'bg-blue-500/10 text-blue-500', label: 'Supervisor' },
  team_leader: { icon: UserCheck, className: 'bg-emerald-500/10 text-emerald-500', label: 'Team Leader' },
  field_agent: { icon: User, className: 'bg-primary/10 text-primary', label: 'Field Worker' },
}

const statusConfig: Record<string, { className: string; icon: React.ElementType; label: string }> = {
  active: { className: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2, label: 'Active' },
  online: { className: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2, label: 'Online' },
  inactive: { className: 'bg-muted text-muted-foreground', icon: AlertTriangle, label: 'Inactive' },
  suspended: { className: 'bg-destructive/10 text-destructive', icon: XCircle, label: 'Suspended' },
}

const validTabs = ['all', 'supervisors', 'leaders', 'workers'] as const

function normalizeTab(value: string | null): (typeof validTabs)[number] {
  return validTabs.includes(value as (typeof validTabs)[number]) ? (value as (typeof validTabs)[number]) : 'all'
}

function UsersPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [allUsers, setAllUsers] = useState<PlatformUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<(typeof validTabs)[number]>(() => normalizeTab(searchParams.get('tab')))

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const response = await http.get<{ data: { users: PlatformUser[] } }>('/users')
        setAllUsers(response.data.users)
        setError(null)
      } catch (err: any) {
        console.error('Failed to fetch users:', err)
        setError('Failed to load user list from database.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    const success = await userService.deleteUser(id);
    if (success) {
      setAllUsers(prev => prev.filter(u => u.id !== id));
    } else {
      alert('Failed to delete user');
    }
  }

  useEffect(() => {
    setActiveTab(normalizeTab(searchParams.get('tab')))
  }, [searchParams])

  const filtered = allUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  const byRole = (role: string) => allUsers.filter(u => u.role === role)
  const counts = {
    all: allUsers.length,
    supervisors: byRole('supervisor').length,
    leaders: byRole('team_leader').length,
    workers: byRole('field_agent').length,
    suspended: allUsers.filter(u => u.status === 'suspended').length,
  }

  const updateTab = (tab: string) => {
    const nextTab = normalizeTab(tab)
    setActiveTab(nextTab)

    const params = new URLSearchParams(searchParams.toString())
    if (nextTab === 'all') {
      params.delete('tab')
    } else {
      params.set('tab', nextTab)
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(nextUrl, { scroll: false })
  }

  const UserTable = ({ users }: { users: typeof allUsers }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Project / Team</TableHead>
          <TableHead>Last Active</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Verified</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const rc = roleConfig[user.role] || roleConfig.field_agent
          const sc = statusConfig[user.status] || statusConfig.active
          const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
          
          return (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={rc.className}>
                  <rc.icon className="h-3 w-3 mr-1" />
                  {rc.label}
                </Badge>
              </TableCell>
              <TableCell><span className="text-sm text-muted-foreground">Global Registry</span></TableCell>
              <TableCell><span className="text-sm text-muted-foreground">{user.last_seen ? new Date(user.last_seen).toLocaleDateString() : 'Never'}</span></TableCell>
              <TableCell><span className="text-sm text-muted-foreground">Live Data</span></TableCell>
              <TableCell>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={sc.className}>
                  <sc.icon className="h-3 w-3 mr-1" />
                  {sc.label}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Profile</DropdownMenuItem>
                    <DropdownMenuItem><Shield className="mr-2 h-4 w-4" /> Investigate</DropdownMenuItem>
                    <DropdownMenuItem><Key className="mr-2 h-4 w-4" /> Reset Password</DropdownMenuItem>
                    <DropdownMenuItem><LogOut className="mr-2 h-4 w-4" /> Force Logout</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user.status === 'active' ? (
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
                        <Ban className="mr-2 h-4 w-4" /> Suspend Account
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem className="text-emerald-500 focus:text-emerald-500">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Reactivate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )

  return (
    <>
      <DashboardHeader title="Global Users" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Global Users</h1>
              <p className="text-muted-foreground">All platform users across every role and project</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export Users
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Total Users', value: counts.all, color: 'text-primary', bg: 'bg-primary/10', icon: Users },
              { label: 'Supervisors', value: counts.supervisors, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: UserCog },
              { label: 'Team Leaders', value: counts.leaders, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: UserCheck },
              { label: 'Field Workers', value: counts.workers, color: 'text-primary', bg: 'bg-primary/10', icon: User },
              { label: 'Suspended', value: counts.suspended, color: 'text-destructive', bg: 'bg-destructive/10', icon: Ban },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', s.bg)}>
                      <s.icon className={cn('h-5 w-5', s.color)} />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="team_leader">Team Leader</SelectItem>
                <SelectItem value="field_agent">Field Worker</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Fetching users from MySQL database...</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
              <XCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={updateTab}>
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="supervisors">Supervisors ({counts.supervisors})</TabsTrigger>
              <TabsTrigger value="leaders">Team Leaders ({counts.leaders})</TabsTrigger>
              <TabsTrigger value="workers">Field Workers ({counts.workers})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card><CardContent className="p-0"><UserTable users={filtered} /></CardContent></Card>
            </TabsContent>
            <TabsContent value="supervisors">
              <Card><CardContent className="p-0"><UserTable users={byRole('supervisor')} /></CardContent></Card>
            </TabsContent>
            <TabsContent value="leaders">
              <Card><CardContent className="p-0"><UserTable users={byRole('team_leader')} /></CardContent></Card>
            </TabsContent>
            <TabsContent value="workers">
              <Card><CardContent className="p-0"><UserTable users={byRole('field_agent')} /></CardContent></Card>
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </>
  )
}

export default function UsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersPageContent />
    </Suspense>
  )
}

