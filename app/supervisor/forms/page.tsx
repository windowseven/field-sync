'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { formService } from '@/lib/api/formService'
import { taskService } from '@/lib/api/taskService'
import {
  Plus, ClipboardList, CheckCircle2, Clock, AlertCircle, Eye,
  MoreHorizontal, Calendar, Users, FileText, Filter, Search,
  ListTodo, ChevronRight,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Form {
  id: string
  name: string
  fields: number
  assignedTo: string
  zone: string
  submissions: number
  target: number
  status: 'active' | 'paused' | 'completed'
  mode: 'individual' | 'group'
  createdAt: string
}

interface Task {
  id: string
  title: string
  description: string
  assignedTo: string
  type: 'team' | 'individual'
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  deadline: string
  createdAt: string
}

const formStatusConfig = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-500' },
  paused: { label: 'Paused', className: 'bg-amber-500/10 text-amber-500' },
  completed: { label: 'Completed', className: 'bg-primary/10 text-primary' },
}

const taskStatusConfig = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground', icon: Clock },
  in_progress: { label: 'In Progress', className: 'bg-primary/10 text-primary', icon: ClipboardList },
  completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle2 },
  overdue: { label: 'Overdue', className: 'bg-destructive/10 text-destructive', icon: AlertCircle },
}

const priorityConfig = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-amber-500/10 text-amber-500',
  low: 'bg-muted text-muted-foreground',
}

export default function SupervisorFormsPage() {
  const [search, setSearch] = useState('')
  const [taskOpen, setTaskOpen] = useState(false)
  const [forms, setForms] = useState<Form[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [formsData, tasksData] = await Promise.all([
          formService.getAll(),
          taskService.getAll(),
        ])
        setForms(formsData.map((f: any) => ({
          id: f.id,
          name: f.title,
          fields: Array.isArray(f.form_schema) ? f.form_schema.length : 0,
          assignedTo: f.creator || 'All Teams',
          zone: f.zone_name || 'All Zones',
          submissions: f.submissions_count || 0,
          target: f.target_count || 100,
          status: f.status === 'published' ? 'active' : 'draft',
          mode: 'individual',
          createdAt: new Date(f.created_at).toLocaleDateString(),
        })))
        setTasks(tasksData.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          assignedTo: t.assigned_to || '',
          type: t.mode === 'group' ? 'team' : 'individual',
          priority: t.priority || 'medium',
          status: t.status === 'in-progress' ? 'in_progress' : t.status,
          deadline: t.deadline ? new Date(t.deadline).toLocaleDateString() : '',
          createdAt: new Date(t.created_at).toLocaleDateString(),
        })))
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const totalSubmissions = forms.reduce((a, f) => a + f.submissions, 0)
  const totalTarget = forms.reduce((a, f) => a + f.target, 0)
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length
  const overdueTasks = tasks.filter(t => t.status === 'overdue').length

  return (
    <>
      <DashboardHeader
        title="Forms & Tasks"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor' }}
        breadcrumbs={[{ label: 'Project Overview', href: '/supervisor' }, { label: 'Forms & Tasks' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Forms & Tasks</h1>
              <p className="text-muted-foreground">Manage data collection forms and assign field tasks</p>
            </div>
            <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Assign Task</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign New Task</DialogTitle>
                  <DialogDescription>Create and assign a task to a team or individual.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Task Title</Label>
                    <Input placeholder="e.g. Complete Zone B survey" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="What needs to be done?" rows={3} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Assign To</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alpha">Team Alpha</SelectItem>
                          <SelectItem value="beta">Team Beta</SelectItem>
                          <SelectItem value="gamma">Team Gamma</SelectItem>
                          <SelectItem value="sarah">Sarah Johnson</SelectItem>
                          <SelectItem value="james">James Kariuki</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Deadline</Label>
                    <Input type="date" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setTaskOpen(false)}>Cancel</Button>
                  <Button onClick={() => setTaskOpen(false)}>Assign Task</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Forms', value: forms.length, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Submissions', value: `${totalSubmissions}/${totalTarget}`, icon: ClipboardList, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Active Tasks', value: pendingTasks, icon: ListTodo, color: 'text-chart-2', bg: 'bg-chart-2/10' },
              { label: 'Overdue Tasks', value: overdueTasks, icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
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

          <Tabs defaultValue="forms">
            <TabsList>
              <TabsTrigger value="forms">Forms ({forms.length})</TabsTrigger>
              <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            </TabsList>

            {/* Forms Tab */}
            <TabsContent value="forms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Project Forms</CardTitle>
                  <CardDescription>Data collection forms assigned to this project</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Form</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forms.map(form => (
                        <TableRow key={form.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{form.name}</p>
                              <p className="text-xs text-muted-foreground">{form.fields} fields · {form.zone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              {form.assignedTo}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">{form.mode}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="w-28 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{form.submissions}/{form.target}</span>
                                <span>{Math.round(form.submissions / form.target * 100)}%</span>
                              </div>
                              <Progress value={form.submissions / form.target * 100} className="h-1.5" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={formStatusConfig[form.status].className}>
                              {formStatusConfig[form.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{form.createdAt}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View Submissions</DropdownMenuItem>
                                <DropdownMenuItem><Users className="mr-2 h-4 w-4" /> Reassign</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>{form.status === 'active' ? 'Pause Form' : 'Resume Form'}</DropdownMenuItem>
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

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="space-y-3">
              {tasks.map(task => {
                const cfg = taskStatusConfig[task.status]
                const StatusIcon = cfg.icon
                return (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={cn('flex h-9 w-9 items-center justify-center rounded-full shrink-0', cfg.className)}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm">{task.title}</p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant="secondary" className={cn('text-[10px] px-1.5', priorityConfig[task.priority])}>
                                {task.priority}
                              </Badge>
                              <Badge variant="secondary" className={cn('text-[10px] px-1.5', cfg.className)}>
                                {cfg.label}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> {task.assignedTo}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Due: {task.deadline}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                            <DropdownMenuItem>Edit Task</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Delete Task</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </>
  )
}

