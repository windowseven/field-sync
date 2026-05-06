'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import {
  FolderOpen, Save, AlertTriangle, Pause, Archive,
  Trash2, Play, Settings2, Globe, Clock, Users, Loader2,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { projectService, type ApiProject } from '@/lib/api/projectService'
import { useParams, useRouter } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'

export default function ProjectSettingsPage() {
  const { projectId } = useParams() as { projectId: string }
  const router = useRouter()
  const [project, setProject] = useState<ApiProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    start_date: '',
    deadline: '',
    target_submissions: 0
  })

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const data = await projectService.getById(projectId)
      if (data) {
        setProject(data)
        setFormData({
          name: data.name || '',
          description: data.description || '',
          location: data.location || '',
          start_date: data.start_date ? data.start_date.split('T')[0] : '',
          deadline: data.deadline ? data.deadline.split('T')[0] : '',
          target_submissions: data.target_submissions || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
      toast({ title: 'Error', description: 'Failed to load project details.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      setIsSaving(true)
      await projectService.update(projectId, formData)
      toast({ title: 'Success', description: 'Project settings updated successfully.' })
      fetchProject()
    } catch (error) {
      console.error('Update failed:', error)
      toast({ title: 'Update Failed', description: 'Could not save changes. Please try again.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (status: ApiProject['status']) => {
    try {
      setIsSaving(true)
      await projectService.updateStatus(projectId, status)
      toast({ title: 'Status Updated', description: `Project set to ${status}.` })
      fetchProject()
    } catch (error) {
      toast({ title: 'Action Failed', description: 'Could not update project status.', variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you absolutely sure you want to delete this project? This action is irreversible.')) return
    try {
      setIsSaving(true)
      await projectService.delete(projectId)
      toast({ title: 'Project Deleted', description: 'The project has been permanently removed.' })
      router.push('/supervisor/projects')
    } catch (error) {
      toast({ title: 'Deletion Failed', description: 'Could not delete project.', variant: 'destructive' })
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
      </div>
    )
  }

  const projectName = project?.name ?? 'Project Settings'
  const base = `/supervisor/projects/${projectId}`

  return (
    <>
      <DashboardHeader
        title="Project Settings"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor/projects' }}
        breadcrumbs={[
          { label: 'My Projects', href: '/supervisor/projects' },
          { label: projectName, href: base },
          { label: 'Project Settings' },
        ]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-6">

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Project Settings</h1>
            <p className="text-muted-foreground">Configure settings for <span className="font-medium text-foreground">{projectName}</span></p>
          </div>

          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general"><Settings2 className="h-4 w-4 mr-1.5 hidden sm:inline" />General</TabsTrigger>
              <TabsTrigger value="collection"><Globe className="h-4 w-4 mr-1.5 hidden sm:inline" />Collection</TabsTrigger>
              <TabsTrigger value="danger"><AlertTriangle className="h-4 w-4 mr-1.5 hidden sm:inline" />Danger Zone</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Project Information</CardTitle>
                  <CardDescription>Update the core details of this project</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input 
                      id="name"
                      value={formData.name} 
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Description</Label>
                    <Textarea 
                      id="desc"
                      rows={3} 
                      value={formData.description}
                      onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loc">Location</Label>
                    <Input 
                      id="loc"
                      value={formData.location}
                      onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="start">Start Date</Label>
                      <Input 
                        id="start"
                        type="date" 
                        value={formData.start_date}
                        onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end">End Date / Deadline</Label>
                      <Input 
                        id="end"
                        type="date" 
                        value={formData.deadline}
                        onChange={e => setFormData(p => ({ ...p, deadline: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal">Target Submissions</Label>
                    <Input 
                      id="goal"
                      type="number"
                      value={formData.target_submissions}
                      onChange={e => setFormData(p => ({ ...p, target_submissions: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <Button onClick={handleUpdate} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Collection Tab */}
            <TabsContent value="collection">
              <Card>
                <CardHeader>
                  <CardTitle>Data Collection Settings</CardTitle>
                  <CardDescription>Configure how field data is collected and submitted</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 text-muted-foreground">
                  <div className="space-y-2">
                    <Label className="text-foreground">Default Submission Mode</Label>
                    <Select defaultValue="individual">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual — each agent submits separately</SelectItem>
                        <SelectItem value="group">Group — team submits as a unit</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs">Default mode applied to new forms unless overridden per form.</p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    {[
                      { label: 'Require GPS on form submission', desc: 'Agents must have active GPS to submit forms', default: true },
                      { label: 'Allow offline submissions', desc: 'Submissions are queued and uploaded when back online', default: true },
                      { label: 'Enable zone boundary enforcement', desc: 'Agents cannot submit forms outside their assigned zone', default: false },
                      { label: 'Require photo evidence', desc: 'Agents must attach at least one photo per submission', default: false },
                      { label: 'Real-time sync alerts', desc: 'Notify supervisor when submissions arrive in real time', default: true },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.label}</p>
                          <p className="text-xs">{s.desc}</p>
                        </div>
                        <Switch defaultChecked={s.default} />
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full sm:w-auto">
                    <Save className="h-4 w-4 mr-2" /> Save Collection Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Danger Zone Tab */}
            <TabsContent value="danger">
              <div className="space-y-4">
                <Card className="border-amber-500/30">
                  <CardHeader>
                    <CardTitle className="text-amber-500 flex items-center gap-2">
                      <Pause className="h-5 w-5" /> Project Management
                    </CardTitle>
                    <CardDescription>Control the active state of this project in the field.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    {project?.status === 'active' ? (
                      <Button onClick={() => handleStatusChange('paused')} variant="outline" className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10">
                        <Pause className="h-4 w-4 mr-2" /> Pause Field Activity
                      </Button>
                    ) : (
                      <Button onClick={() => handleStatusChange('active')} variant="outline" className="text-primary border-primary/30 hover:bg-primary/10">
                        <Play className="h-4 w-4 mr-2" /> Resume Field Activity
                      </Button>
                    )}
                    
                    <Button onClick={() => handleStatusChange('archived')} variant="outline" className="text-muted-foreground" disabled={project?.status === 'archived'}>
                      <Archive className="h-4 w-4 mr-2" /> {project?.status === 'archived' ? 'Project Archived' : 'Archive Project'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-destructive/30">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <Trash2 className="h-5 w-5" /> Critical Action
                    </CardTitle>
                    <CardDescription>Permanently delete this project and all associated data including teams, zones, forms, submissions, and audit logs. This action cannot be undone.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleDelete} variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete This Project
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

        </div>
      </main>
    </>
  )
}
