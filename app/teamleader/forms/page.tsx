"use client"
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FileText, CheckCircle, Download, Eye, Edit3, Loader2, Users, User } from 'lucide-react'
import useSWR from 'swr'
import { fetcher } from '@/lib/api/swr-fetcher'
import { formService } from '@/lib/api/formService'
import { teamService } from '@/lib/api/teamService'
import { toast } from 'sonner'

type FormRow = {
  id: string
  title: string
  submittedBy: string
  initials: string
  status: 'submitted' | 'pending-review' | 'draft'
  timestamp: string
  zone: string
}

const statusConfig = {
  submitted: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  'pending-review': 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  draft: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
} as const

export default function FormsPage() {
  const { data: projectsData } = useSWR('/projects', fetcher)
  const activeProjectId = projectsData?.projects?.[0]?.id || projectsData?.[0]?.id
  const { data: formsFromApi, isLoading: formsLoading } = useSWR(
    activeProjectId ? activeProjectId : null,
    () => formService.getByProject(activeProjectId)
  )
  const { data: teamData } = useSWR('/team/my/members', fetcher)
  const [selectedForm, setSelectedForm] = useState<FormRow | null>(null)
  const [filter, setFilter] = useState<'all' | 'submitted' | 'pending-review' | 'draft'>('all')
  const [fillingMode, setFillingMode] = useState<'individual' | 'group'>('individual')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [modeDialogOpen, setModeDialogOpen] = useState(false)

  const forms: FormRow[] = (formsFromApi || []).map((form: any) => {
    const transformed = formService.transformForFrontend(form)
    return {
      id: form.id,
      title: form.title || 'Untitled Form',
      submittedBy: transformed.creator,
      initials: String(transformed.creator || 'U')
        .split(' ')
        .map((part: string) => part[0] || '')
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      status:
        form.status === 'published'
          ? 'submitted'
          : form.status === 'pending'
            ? 'pending-review'
            : 'draft',
      timestamp: form.created_at
        ? new Date(form.created_at).toLocaleString()
        : '—',
      zone: '—',
    }
  })

  const filtered = filter === 'all' ? forms : forms.filter((f) => f.status === filter)
  const pendingCount = forms.filter((f) => f.status === 'pending-review').length
  const draftCount = forms.filter((f) => f.status === 'draft').length
  const teamMembers = teamData?.data?.members ?? teamData?.members ?? []

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleModeSubmit = () => {
    if (fillingMode === 'group' && selectedMembers.length === 0) {
      toast.error('Select at least one member for group mode')
      return
    }
    toast.success(`Form mode set to ${fillingMode}${fillingMode === 'group' ? ` (${selectedMembers.length} members)` : ''}`)
    setModeDialogOpen(false)
    setSelectedMembers([])
  }

  if (formsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading submissions...</span>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Form Submissions</h1>
          <p className="text-muted-foreground">Track form progress and review submissions</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{forms.length} Total</Badge>
          <Badge className="bg-orange-500">{pendingCount} Pending</Badge>
          <Badge variant="outline">{draftCount} Drafts</Badge>
          <Button size="sm" variant="outline" onClick={() => setModeDialogOpen(true)}>
            {fillingMode === 'individual' ? <User className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
            {fillingMode === 'individual' ? 'Individual' : 'Group'} Mode
          </Button>
        </div>
      </div>

      {/* Mode indicator */}
      <Card className="border-primary/10">
        <CardContent className="py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {fillingMode === 'individual' ? (
              <User className="h-5 w-5 text-primary" />
            ) : (
              <Users className="h-5 w-5 text-primary" />
            )}
            <div>
              <p className="text-sm font-semibold capitalize">{fillingMode} Mode</p>
              <p className="text-xs text-muted-foreground">
                {fillingMode === 'individual'
                  ? 'Each member fills forms independently'
                  : `Group mode: ${selectedMembers.length || teamMembers.length} members collaborate`
                }
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setModeDialogOpen(true)}>Change</Button>
        </CardContent>
      </Card>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'submitted', 'pending-review', 'draft'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Submissions
          </CardTitle>
          <CardDescription>Latest form activity from your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((form) => (
                  <TableRow key={form.id} className="hover:bg-accent/50 cursor-pointer" onClick={() => setSelectedForm(form)}>
                    <TableCell className="font-medium">
                      <div className="font-semibold">{form.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{form.initials}</span>
                        </div>
                        <span>{form.submittedBy}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', statusConfig[form.status])}>
                        {form.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>{form.zone}</TableCell>
                    <TableCell className="text-sm">{form.timestamp}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedForm(form)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Submission Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{forms.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Total Forms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-emerald-600 font-bold">
              {forms.filter((f) => f.status === 'submitted').length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-emerald-600 uppercase font-semibold tracking-wide">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-orange-500 font-bold">{pendingCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-orange-500 uppercase font-semibold tracking-wide">Pending Review</p>
          </CardContent>
        </Card>
      </div>

      {/* Form Detail Dialog */}
      <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedForm?.title}</DialogTitle>
          </DialogHeader>
          {selectedForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Submitted By</p>
                  <p className="font-medium">{selectedForm.submittedBy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Zone</p>
                  <p className="font-medium">{selectedForm.zone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedForm.timestamp}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={cn('text-xs mt-1', statusConfig[selectedForm.status])}>
                    {selectedForm.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mode Dialog */}
      <Dialog open={modeDialogOpen} onOpenChange={setModeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Form Filling Mode</DialogTitle>
            <DialogDescription>Choose how team members fill out forms</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Assignment Mode</Label>
              <Select value={fillingMode} onValueChange={(v) => setFillingMode(v as 'individual' | 'group')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual" className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Individual — Each member fills independently
                    </div>
                  </SelectItem>
                  <SelectItem value="group">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Group — Team collaborates on shared forms
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {fillingMode === 'group' && teamMembers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Select Members</Label>
                <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2">
                  {teamMembers.map((m: any) => (
                    <label key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(m.id)}
                        onChange={() => toggleMember(m.id)}
                        className="h-4 w-4 rounded border-primary"
                      />
                      <span>{m.name}</span>
                      {m.is_team_leader && <Badge variant="outline" className="text-[10px] ml-auto">Leader</Badge>}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleModeSubmit}>Apply Mode</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

