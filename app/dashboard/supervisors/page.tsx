'use client'

import { useState } from 'react'
import { UserCog, Search, MoreHorizontal, CheckCircle2, AlertTriangle, XCircle, Shield, Activity, FolderKanban, Users, Eye, Ban, RefreshCw } from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

const supervisors = [
  { id: 'sup-001', name: 'Grace Wanjiku', email: 'grace.w@fieldsync.io', projects: 3, teams: 12, activeUsers: 48, lastActive: '2m ago', status: 'active', joined: 'Jan 2026', initials: 'GW' },
  { id: 'sup-002', name: 'Ahmed Omar', email: 'ahmed.o@fieldsync.io', projects: 2, teams: 8, activeUsers: 31, lastActive: '15m ago', status: 'active', joined: 'Feb 2026', initials: 'AO' },
  { id: 'sup-003', name: 'Esther Namutebi', email: 'esther.n@fieldsync.io', projects: 1, teams: 5, activeUsers: 20, lastActive: '1h ago', status: 'active', joined: 'Feb 2026', initials: 'EN' },
  { id: 'sup-004', name: 'Junior Lespikius', email: 'junior.l@fieldsync.io', projects: 4, teams: 18, activeUsers: 74, lastActive: 'Just now', status: 'active', joined: 'Mar 2026', initials: 'JL' },
  { id: 'sup-005', name: 'Marie Uwase', email: 'marie.u@fieldsync.io', projects: 1, teams: 4, activeUsers: 16, lastActive: '3h ago', status: 'active', joined: 'Mar 2026', initials: 'MU' },
  { id: 'sup-006', name: 'Kwame Asante', email: 'kwame.a@fieldsync.io', projects: 0, teams: 0, activeUsers: 0, lastActive: '4 days ago', status: 'suspended', joined: 'Jan 2026', initials: 'KA' },
  { id: 'sup-007', name: 'Lydia Nakato', email: 'lydia.n@fieldsync.io', projects: 2, teams: 7, activeUsers: 28, lastActive: '45m ago', status: 'active', joined: 'Feb 2026', initials: 'LN' },
]

const statusMap: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2 },
  suspended: { label: 'Suspended', className: 'bg-destructive/10 text-destructive', icon: XCircle },
  inactive: { label: 'Inactive', className: 'bg-muted text-muted-foreground', icon: AlertTriangle },
}

export default function SupervisorsPage() {
  const [search, setSearch] = useState('')

  const filtered = supervisors.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  const active = supervisors.filter(s => s.status === 'active').length
  const totalProjects = supervisors.reduce((a, s) => a + s.projects, 0)
  const totalUsers = supervisors.reduce((a, s) => a + s.activeUsers, 0)

  return (
    <>
      <DashboardHeader title="Supervisors" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Supervisor Management</h1>
            <p className="text-muted-foreground">
              View, monitor, and moderate platform supervisors. Supervisors self-register and own their projects.
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Supervisors', value: supervisors.length, icon: UserCog, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Active Now', value: active, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Total Projects', value: totalProjects, icon: FolderKanban, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Total Field Users', value: totalUsers, icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', s.bg)}>
                      <s.icon className={cn('h-6 w-6', s.color)} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <CardTitle>All Supervisors</CardTitle>
                <CardDescription>Read-only view with moderation controls</CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search supervisors..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Teams</TableHead>
                    <TableHead>Active Users</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((sup) => {
                    const s = statusMap[sup.status]
                    return (
                      <TableRow key={sup.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {sup.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{sup.name}</p>
                              <p className="text-xs text-muted-foreground">{sup.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{sup.projects}</TableCell>
                        <TableCell>{sup.teams}</TableCell>
                        <TableCell>
                          {sup.activeUsers > 0 ? (
                            <Badge variant="secondary">{sup.activeUsers}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell><span className="text-sm text-muted-foreground">{sup.lastActive}</span></TableCell>
                        <TableCell><span className="text-sm text-muted-foreground">{sup.joined}</span></TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={s.className}>
                            <s.icon className="h-3 w-3 mr-1" />
                            {s.label}
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
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" /> View Activity
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FolderKanban className="mr-2 h-4 w-4" /> View Projects
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Shield className="mr-2 h-4 w-4" /> Investigate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {sup.status === 'active' ? (
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                  <Ban className="mr-2 h-4 w-4" /> Suspend Account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-emerald-500 focus:text-emerald-500">
                                  <RefreshCw className="mr-2 h-4 w-4" /> Reactivate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Note */}
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Admin Note:</span> Supervisors self-register and manage their own projects, teams, and zones. The admin does not create or assign supervisors — only monitors and moderates their accounts when necessary.
            </p>
          </div>

        </div>
      </main>
    </>
  )
}

