'use client'

import * as React from 'react'
import {
  Plus, FileText, ClipboardList, CheckSquare,
  Search, MoreHorizontal, Eye, Pencil, Trash2,
  Table as TableIcon, Layout, Settings, Play,
  Clock, CheckCircle2, AlertTriangle, Filter,
  TrendingUp, Users,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProjectForm {
  id: string
  title: string
  description: string
  version: string
  status: 'published' | 'draft' | 'archived'
  submissions: number
  target: number
  lastActivity: string
  creator: string
}

import { formService } from '@/lib/api/formService'
import { useParams } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

export default function FormsAndTasksPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const [formsData, setFormsData] = React.useState<ProjectForm[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [activeTab, setActiveTab] = React.useState('published')

  React.useEffect(() => {
    const fetchForms = async () => {
      try {
        setIsLoading(true)
        const data = await formService.getByProject(projectId)
        const transformed = data.map(formService.transformForFrontend) as ProjectForm[]
        setFormsData(transformed)
      } catch (error) {
        console.error('Failed to fetch project forms:', error)
        toast({
          title: 'Error',
          description: 'Failed to load project forms. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    if (projectId) fetchForms()
  }, [projectId])

  const filteredForms = formsData.filter(f => {
    const matchSearch = String(f.title || '').toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'all') return matchSearch
    return matchSearch && f.status === activeTab
  })

  const statusConfig = {
    published: { label: 'Published', className: 'bg-emerald-500/10 text-emerald-500', dot: 'bg-emerald-500' },
    draft: { label: 'Draft', className: 'bg-amber-500/10 text-amber-500', dot: 'bg-amber-500' },
    archived: { label: 'Archived', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  } as const

  return (
    <>
      <DashboardHeader
        title="Forms & Tasks"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor/projects' }}
        breadcrumbs={[{ label: 'My Projects', href: '/supervisor/projects' }, { label: 'Forms & Tasks' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Forms & Field Tasks</h1>
              <p className="text-muted-foreground">Design data collection forms and assign operational tasks</p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="gap-2">
                <a href="/supervisor/projects/proj-nairobi-2026/analytics">
                  <TrendingUp className="h-4 w-4" /> Form Analytics
                </a>
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create New Form
              </Button>
            </div>
          </div>

          {/* Form Stats Bar */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Active Forms', value: formsData.filter(f => f.status === 'published').length, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Team Assignments', value: 'Live Updates', icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Total Submissions', value: formsData.reduce((acc, f) => acc + (f.submissions || 0), 0), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg shrink-0', s.bg)}>
                    <s.icon className={cn('h-5 w-5', s.color)} />
                  </div>
                  <div>
                    <p className="text-lg font-bold leading-none mb-1">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="published" onValueChange={setActiveTab}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4 mt-8">
              <TabsList className="bg-muted/50 border h-10">
                <TabsTrigger value="published" className="text-xs font-semibold">Active Forms</TabsTrigger>
                <TabsTrigger value="draft" className="text-xs font-semibold">Drafts</TabsTrigger>
                <TabsTrigger value="archived" className="text-xs font-semibold">Archived</TabsTrigger>
              </TabsList>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter forms..."
                  className="pl-9 h-10 bg-muted/20"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value={activeTab} className="pt-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Clock className="h-10 w-10 animate-spin text-primary opacity-20 mb-4" />
                  <p className="text-muted-foreground font-medium">Synchronizing forms from database...</p>
                </div>
              ) : filteredForms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl border-muted">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold">No forms found</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mt-1">
                    Try adjusting your search or switch to another tab to find what you're looking for.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredForms.map((form) => {
                    const statusKey: keyof typeof statusConfig =
                      form.status in statusConfig ? form.status : 'draft'
                    const cfg = statusConfig[statusKey]
                    return (
                      <Card key={form.id} className="hover:shadow-md transition-shadow group border-primary/5">
                        <CardHeader className="pb-3 px-6 pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base leading-tight truncate group-hover:text-primary transition-colors">
                                  {form.title}
                                </CardTitle>
                                <Badge variant="secondary" className={cfg.className}>
                                  <span className={cn('h-1.5 w-1.5 rounded-full mr-1.5', cfg.dot)} />
                                  {cfg.label}
                                </Badge>
                              </div>
                              <CardDescription className="text-xs line-clamp-1">{form.description}</CardDescription>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Submissions</DropdownMenuItem>
                                <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit Form Structure</DropdownMenuItem>
                                <DropdownMenuItem><CheckSquare className="mr-2 h-4 w-4" /> Assign Task</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem><Play className="mr-2 h-4 w-4" /> Publish as New Version</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Archive Form</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="px-6 pb-6">
                          <div className="flex flex-col gap-4">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 gap-4 border-y border-muted/60 py-4">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Submissions</p>
                                <p className="text-lg font-bold">{form.submissions} <span className="text-xs text-muted-foreground font-normal">/ {form.target}</span></p>
                              </div>
                              <div className="space-y-1 text-right">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completion</p>
                                <p className="text-lg font-bold text-primary">{Math.round((form.submissions / form.target) * 100)}%</p>
                              </div>
                            </div>

                            {/* Status and Activity */}
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Badge variant="outline" className={cn('h-2 w-2 rounded-full p-0', cfg.dot)} />
                                <span className="font-medium">{cfg.label}</span>
                                <span className="text-muted-foreground/30">•</span>
                                <span>Last update {form.lastActivity}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground italic">
                                <span>by {form.creator}</span>
                              </div>
                            </div>

                            <Button variant="secondary" className="w-full text-xs h-9 gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              <Layout className="h-3.5 w-3.5" /> Manage This Form
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </>
  )
}
