'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { http } from '@/lib/api/httpClient'
import { Loader2, FolderKanban, Search, MoreHorizontal, CheckCircle2, AlertTriangle, XCircle, Users, MapPin, FileText, Eye, Ban, Trash2, Pause, Activity } from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2 },
  frozen: { label: 'Frozen', className: 'bg-blue-500/10 text-blue-500', icon: Pause },
  disabled: { label: 'Disabled', className: 'bg-destructive/10 text-destructive', icon: XCircle },
  draft: { label: 'Draft', className: 'bg-muted-foreground/10 text-muted-foreground', icon: FolderKanban },
}

const activityColors: Record<string, string> = {
  High: 'text-emerald-500',
  Medium: 'text-amber-500',
  Low: 'text-muted-foreground',
  None: 'text-muted-foreground',
}

const validStatuses = ['all', 'active', 'frozen', 'disabled', 'draft'] as const

function normalizeStatus(value: string | null): (typeof validStatuses)[number] {
  return validStatuses.includes(value as (typeof validStatuses)[number]) ? (value as (typeof validStatuses)[number]) : 'all'
}

interface Project {
  id: string
  name: string
  description: string
  status: string
  progress: number
  location: string
  target_submissions: number
  total_submissions: number
  start_date: string
  deadline: string
  created_at?: string
  // Aggregated fields for UI compatibility
  supervisor?: string
  teams?: number
  zones?: number
  members?: number
}

function ProjectsPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<(typeof validStatuses)[number]>(() => normalizeStatus(searchParams.get('status')))

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true)
      try {
        const response = await http.get<{ data: { projects: Project[] } }>('/projects')
        setProjects(response.data.projects)
        setError(null)
      } catch (err: any) {
        console.error('Failed to fetch projects:', err)
        setError('Failed to load projects. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchProjects()
  }, [])

  useEffect(() => {
    setStatusFilter(normalizeStatus(searchParams.get('status')))
  }, [searchParams])

  const updateStatusFilter = (status: string) => {
    const nextStatus = normalizeStatus(status)
    setStatusFilter(nextStatus)

    const params = new URLSearchParams(searchParams.toString())
    if (nextStatus === 'all') {
      params.delete('status')
    } else {
      params.set('status', nextStatus)
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(nextUrl, { scroll: false })
  }

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                       (p.description || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const activeCount = projects.filter(p => p.status === 'active').length
  const totalSubmissions = projects.reduce((a, p) => a + (p.total_submissions || 0), 0)
  const totalTargetSubmissions = projects.reduce((a, p) => a + (p.target_submissions || 0), 0)

  return (
    <>
      <DashboardHeader title="Projects Overview" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Projects Overview</h1>
            <p className="text-muted-foreground">
              Read-only visibility into all platform projects. Use controls to freeze, disable, or delete in extreme cases.
            </p>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Projects', value: projects.length, icon: FolderKanban, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Active Projects', value: activeCount, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Target Submissions', value: totalTargetSubmissions.toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Real Submissions', value: totalSubmissions.toLocaleString(), icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by project name..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={updateStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading projects from database...</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
              <XCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          {/* Project Cards Grid */}
          {!isLoading && !error && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((project) => {
                const sc = statusConfig[project.status] || statusConfig.draft
                const progress = project.target_submissions > 0 
                  ? Math.round((project.total_submissions / project.target_submissions) * 100) 
                  : 0

                return (
                  <Card key={project.id} className={cn('hover:border-primary/40 transition-colors', project.status === 'frozen' && 'opacity-75')}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base leading-tight">{project.name}</CardTitle>
                          <CardDescription className="mt-1 truncate">{project.location || 'No location set'}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="secondary" className={sc.className}>
                            <sc.icon className="h-3 w-3 mr-1" />
                            {sc.label}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {project.status === 'active' ? (
                                <DropdownMenuItem className="text-amber-500 focus:text-amber-500">
                                  <Pause className="mr-2 h-4 w-4" /> Freeze Project
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem>
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Unfreeze Project
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Project
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="rounded-lg bg-muted/50 p-2 text-center">
                          <p className="text-lg font-bold">{project.total_submissions || 0}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Submissions</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-2 text-center">
                          <p className="text-lg font-bold">{progress}%</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Progress</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          <span>Target: {project.target_submissions || 0}</span>
                          <span>{project.total_submissions || 0} Synced</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.location?.split(',')[0] || 'Global'}
                        </span>
                        <span>
                          Created: {new Date(project.start_date || project.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FolderKanban className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No projects found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter</p>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Admin Note:</span> Projects are created and managed exclusively by Supervisors. Admin can only view, freeze, disable, or delete projects as a moderation/emergency measure.
            </p>
          </div>

        </div>
      </main>
    </>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsPageContent />
    </Suspense>
  )
}

