'use client'

import { use } from 'react'
import Link from 'next/link'
import {
  Users, MapPin, ClipboardList, TrendingUp, CheckCircle2,
  Clock, AlertTriangle, ArrowUpRight, ArrowRight,
  TrendingDown, Layers, Map as MapIcon, Shield, Loader2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { http } from '@/lib/api/httpClient'
import { statusConfig } from '@/lib/api/projectService'
import { auditService } from '@/lib/api/auditService'
import { teamService } from '@/lib/api/teamService'

interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'draft' | 'archived'
  progress: number
  location: string
  target_submissions: number
  total_submissions: number
  start_date: string
  deadline: string
  created_at: string
  teamCount?: number
  zoneCount?: number
}

export default function ProjectDashboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [projRes, teamsData, logsData] = await Promise.all([
          http.get<{ data: { project: Project } }>(`/projects/${projectId}`),
          teamService.getByProject(projectId),
          auditService.getAll(5)
        ])
        setProject(projRes.data.project)
        setTeams(teamsData)
        setLogs(logsData.map(l => auditService.transformForFrontend(l)))
        setError(null)
      } catch (err: any) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load project details.')
      } finally {
        setIsLoading(false)
      }
    }
    if (projectId) fetchData()
  }, [projectId])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Loading project mission control...</p>
        </div>
      </div>
    )
  }

  if (!project || error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{error || 'Project not found'}</h2>
          <p className="text-muted-foreground mt-2">The project you are looking for does not exist or you do not have access.</p>
          <Button asChild className="mt-4">
            <Link href="/supervisor/projects">Back to Workspace</Link>
          </Button>
        </div>
      </div>
    )
  }

  const base = `/supervisor/projects/${projectId}`
  const projectStatus = statusConfig[project.status] || statusConfig.draft

  return (
    <>
      <DashboardHeader
        title={project.name}
        rootCrumb={{ label: 'Supervisor', href: '/supervisor/projects' }}
        breadcrumbs={[{ label: 'My Projects', href: '/supervisor/projects' }, { label: project.name }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* Project Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-primary/5 border border-primary/10 p-6 md:p-8">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={cn('gap-1', projectStatus.className)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', projectStatus.dot)} />
                    {projectStatus.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {project.location}
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{project.name}</h1>
                <p className="text-muted-foreground max-w-2xl">{project.description}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button asChild size="lg" className="gap-2">
                  <Link href={`${base}/map`}>
                    <MapIcon className="h-4 w-4" /> Live Operation Map
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="gap-2">
                  <Link href={`${base}/settings`}>
                    Dashboard Settings
                  </Link>
                </Button>
              </div>
            </div>
            {/* Aesthetic background element */}
            <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          </div>

          {/* Quick Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Submissions', value: project.total_submissions || 0, trend: '+12%', icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Target Submissions', value: project.target_submissions || 0, trend: 'Stable', icon: Users, color: 'text-chart-2', bg: 'bg-chart-2/10' },
              { label: 'Zones Covered', value: project.zoneCount || 0, trend: 'N/A', icon: Layers, color: 'text-chart-3', bg: 'bg-chart-3/10' },
              { label: 'Project Progress', value: `${project.progress || 0}%`, trend: 'Active', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl shrink-0', s.bg)}>
                    <s.icon className={cn('h-6 w-6', s.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <span className={cn('text-[10px] px-1 rounded-sm font-medium', s.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground')}>
                        {s.trend}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Progress & Target Section */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Overall Progress</CardTitle>
                  <CardDescription>Submission targets and completion timeline</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{project.progress}% Complete</span>
                    <span className="text-muted-foreground">{project.total_submissions} / {project.target_submissions} Submissions</span>
                  </div>
                  <Progress value={project.progress} className="h-3" />
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Start Date</p>
                    <p className="font-medium">{new Date(project.start_date).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Project Deadline</p>
                    <p className="font-medium">{new Date(project.deadline).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Estimated Finish</p>
                    <p className="font-medium text-emerald-500">Jun 15, 2026</p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/30 p-4 flex items-start gap-4">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-background border shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">On Track for Completion</p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Based on current submission rates across all 5 teams, the project is tracking 2 weeks ahead of the deadline.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Performance Mini-List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Team Performance</CardTitle>
                <CardDescription>Active field teams progress</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <div className="space-y-1">
                  {teams.length > 0 ? teams.map((team) => (
                    <div key={team.id} className="flex flex-col gap-2 p-3 px-6 hover:bg-muted/50 transition-colors cursor-pointer border-y border-transparent hover:border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{team.name}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-xs font-mono">{team.member_count} members</span>
                      </div>
                      <Progress value={Math.floor(Math.random() * 40) + 60} className="h-1" />
                    </div>
                  )) : (
                    <div className="p-8 text-center text-muted-foreground text-sm italic">
                      No teams assigned to this project yet.
                    </div>
                  )}
                </div>
                <div className="px-6 pt-4">
                  <Button variant="ghost" size="sm" className="w-full text-xs gap-1" asChild>
                    <Link href={`${base}/teams`}>
                      View Detailed Team Analytics <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed & Alerts */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Live Operation Logs</CardTitle>
                  <CardDescription>Real-time updates from the field</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`${base}/audit`}>View All Logs</Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {logs.length > 0 ? logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                      <CheckCircle2 className={cn('h-4 w-4', log.severity === 'high' ? 'text-rose-500' : 'text-primary')} />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm font-medium">
                        {log.user}
                      </p>
                      <p className="text-sm text-foreground/80">{log.action}: {log.details}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )) : (
                  <div className="p-8 text-center text-muted-foreground text-sm italic">
                    No operations recorded yet.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Critical Alerts */}
              <Card className="border-amber-500/50 bg-amber-500/5 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" /> Operational Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold">Low Connectivity Zones</p>
                    <p className="text-[10px] text-muted-foreground">Team Gamma reporting delayed uploads in Central Zone.</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold">Deadline Risk</p>
                    <p className="text-[10px] text-muted-foreground">Team Delta current rate is 15% below target.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Resource Contacts */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">Project Shield Leaders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'Sarah Johnson', role: 'Team Leader', initial: 'SJ' },
                    { name: 'James Kariuki', role: 'Team Leader', initial: 'JK' },
                  ].map((leader) => (
                    <div key={leader.name} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                        {leader.initial}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{leader.name}</p>
                        <p className="text-[10px] text-muted-foreground">{leader.role}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="ml-auto h-7 w-7">
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full text-[10px] h-8" asChild>
                    <Link href={`${base}/users`}>Manage All Project Members</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
