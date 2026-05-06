'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Plus, Search, FolderOpen, Users, Layers, ClipboardList,
  TrendingUp, Clock, ArrowRight, MoreHorizontal, Play,
  Pause, Archive, Copy, Filter, Loader2
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { http } from '@/lib/api/httpClient'

const statusConfig: Record<string, any> = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-500', dot: 'bg-emerald-500' },
  paused: { label: 'Paused', className: 'bg-amber-500/10 text-amber-500', dot: 'bg-amber-500' },
  draft: { label: 'Draft', className: 'bg-muted/60 text-muted-foreground', dot: 'bg-muted-foreground' },
  archived: { label: 'Archived', className: 'bg-gray-500/10 text-gray-500', dot: 'bg-gray-500' },
}

export type ProjectStatus = 'active' | 'paused' | 'draft' | 'archived'

export default function SupervisorWorkspacePage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const res: any = await http.get('/projects')
      if (res.status === 'success') {
        setProjects(res.data.projects)
      }
    } catch (error) {
      console.error('[Supervisor] Fetch failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const activeCount = projects.filter((p) => p.status === 'active').length
  const totalMembers = projects.reduce((acc, p) => acc + (p.memberCount || 0), 0)
  const totalSubmissions = projects.reduce((acc, p) => acc + (p.total_submissions || 0), 0)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <DashboardHeader
        title="My Projects"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor/projects' }}
        breadcrumbs={[{ label: 'My Projects' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Supervisor Workspace</h1>
              <p className="text-muted-foreground">Manage all your field operation projects from one place</p>
            </div>
            <Button asChild>
              <Link href="/supervisor/projects/new">
                <Plus className="h-4 w-4 mr-2" /> Create Project
              </Link>
            </Button>
          </div>

          {/* Workspace Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Active Projects', value: activeCount, icon: FolderOpen, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Total Members', value: totalMembers, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Total Submissions', value: totalSubmissions.toLocaleString(), icon: ClipboardList, color: 'text-chart-2', bg: 'bg-chart-2/10' },
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
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-44">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Cards */}
          {filtered.length === 0 ? (
            <EmptyState hasSearch={!!search} />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((project) => {
                const cfg = statusConfig[project.status]
                return (
                  <Card key={project.id} className="flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0 bg-primary/10')}>
                            <FolderOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-base leading-tight truncate">{project.name}</CardTitle>
                            <CardDescription className="text-xs">{project.location}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="secondary" className={cn('gap-1', cfg.className)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                            {cfg.label}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/supervisor/projects/${project.id}`}>
                                  <FolderOpen className="mr-2 h-4 w-4" /> Open Project
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="mr-2 h-4 w-4" /> Duplicate Setup
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {project.status === 'active' ? (
                                <DropdownMenuItem>
                                  <Pause className="mr-2 h-4 w-4" /> Pause Project
                                </DropdownMenuItem>
                              ) : project.status === 'paused' ? (
                                <DropdownMenuItem>
                                  <Play className="mr-2 h-4 w-4" /> Resume Project
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem className="text-destructive">
                                <Archive className="mr-2 h-4 w-4" /> Archive Project
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-4">
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{project.description}</p>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {[
                          { label: 'Teams', value: project.teamCount, icon: Users },
                          { label: 'Members', value: project.memberCount, icon: Users },
                          { label: 'Zones', value: project.zoneCount, icon: Layers },
                        ].map((s) => (
                          <div key={s.label} className="rounded-md bg-muted/50 px-2 py-2">
                            <p className="text-sm font-bold">{s.value}</p>
                            <p className="text-[10px] text-muted-foreground">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Progress */}
                      {project.status !== 'draft' && (
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Overall Progress</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-1.5" />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {project.totalSubmissions} / {project.targetSubmissions} submissions
                          </p>
                        </div>
                      )}

                      {/* Dates & Activity */}
                      <div className="space-y-1 border-t border-border pt-3">
                        {project.status !== 'draft' && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Timeline</span>
                            <span>{project.startDate} → {project.deadline}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Last activity
                          </span>
                          <span className="text-muted-foreground">{project.lastOpened}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{project.lastActivity}</p>
                      </div>

                      {/* Open Button */}
                      <Button asChild className="w-full" variant={project.status === 'draft' ? 'outline' : 'default'}>
                        <Link href={`/supervisor/projects/${project.id}`}>
                          {project.status === 'draft' ? 'Open Draft' : 'Open Project'}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

        </div>
      </main>
    </>
  )
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <FolderOpen className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-semibold mb-2">
        {hasSearch ? 'No projects match your search' : 'No projects yet'}
      </h2>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        {hasSearch
          ? 'Try adjusting your search or filters to find what you\'re looking for.'
          : 'Create your first project to start managing field operations, teams, and data collection.'}
      </p>
      {!hasSearch && (
        <Button asChild>
          <Link href="/supervisor/projects/new">
            <Plus className="h-4 w-4 mr-2" /> Create Your First Project
          </Link>
        </Button>
      )}
    </div>
  )
}

