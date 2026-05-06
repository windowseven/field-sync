'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  FileSearch, Plus, Search, MoreHorizontal, Eye, Copy, Pencil,
  Trash2, Download, CheckCircle2, Clock, Globe, Lock, FileText,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const templates = [
  {
    id: 'tpl-001', name: 'Household Survey', category: 'Census', fields: 18, steps: 4,
    description: 'Comprehensive household data collection including demographics, income, and utilities.',
    usedBy: 5, status: 'published', access: 'global', created: 'Jan 2026', updatedAt: '2 days ago',
  },
  {
    id: 'tpl-002', name: 'Evangelism Visit Record', category: 'Outreach', fields: 12, steps: 3,
    description: 'Records household spiritual status, interest level, and follow-up notes.',
    usedBy: 3, status: 'published', access: 'global', created: 'Feb 2026', updatedAt: '1 week ago',
  },
  {
    id: 'tpl-003', name: 'Health Screening Form', category: 'Healthcare', fields: 22, steps: 5,
    description: 'Basic health indicators, chronic conditions, and referral assessment.',
    usedBy: 2, status: 'published', access: 'global', created: 'Feb 2026', updatedAt: '3 days ago',
  },
  {
    id: 'tpl-004', name: 'Business Enumeration', category: 'Economic', fields: 15, steps: 3,
    description: 'Captures business type, employees, revenue range, and registration status.',
    usedBy: 1, status: 'published', access: 'global', created: 'Mar 2026', updatedAt: '5 days ago',
  },
  {
    id: 'tpl-005', name: 'Infrastructure Assessment', category: 'Urban Planning', fields: 20, steps: 4,
    description: 'Road conditions, utilities access, waste management, and public facilities.',
    usedBy: 0, status: 'draft', access: 'global', created: 'Apr 2026', updatedAt: 'Today',
  },
  {
    id: 'tpl-006', name: 'Youth Program Registration', category: 'Community', fields: 10, steps: 2,
    description: 'Youth participant details, parent consent, and program preferences.',
    usedBy: 2, status: 'published', access: 'global', created: 'Mar 2026', updatedAt: '4 days ago',
  },
]

const categoryColors: Record<string, string> = {
  Census: 'bg-blue-500/10 text-blue-500',
  Outreach: 'bg-primary/10 text-primary',
  Healthcare: 'bg-emerald-500/10 text-emerald-500',
  Economic: 'bg-amber-500/10 text-amber-500',
  'Urban Planning': 'bg-purple-500/10 text-purple-500',
  Community: 'bg-pink-500/10 text-pink-500',
}

function FormsPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(searchParams.get('create') === '1')
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => {
    setCreateOpen(searchParams.get('create') === '1')
  }, [searchParams])

  const updateCreateOpen = (open: boolean) => {
    setCreateOpen(open)

    const params = new URLSearchParams(searchParams.toString())
    if (open) {
      params.set('create', '1')
    } else {
      params.delete('create')
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(nextUrl, { scroll: false })
  }

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  )

  const published = templates.filter(t => t.status === 'published').length
  const totalUsage = templates.reduce((a, t) => a + t.usedBy, 0)

  return (
    <>
      <DashboardHeader title="Global Form Templates" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Global Form Templates</h1>
              <p className="text-muted-foreground">
                System-wide reusable templates that Supervisors can adopt into their projects
              </p>
            </div>
            <Dialog open={createOpen} onOpenChange={updateCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Create Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Global Template</DialogTitle>
                  <DialogDescription>
                    This template will be available to all Supervisors across the platform.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Template Name</Label>
                    <Input placeholder="e.g. Household Survey" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(categoryColors).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description</Label>
                    <Textarea placeholder="Describe what this form collects..." rows={3} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="resize-none" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => updateCreateOpen(false)}>Cancel</Button>
                  <Button onClick={() => updateCreateOpen(false)} disabled={!newName || !newCategory}>
                    Create as Draft
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Templates', value: templates.length, icon: FileSearch, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Published', value: published, icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Drafts', value: templates.length - published, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Total Usage', value: totalUsage, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
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

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates by name or category..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Templates Grid */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => (
              <Card key={t.id} className="hover:border-primary/40 transition-colors group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="secondary" className={categoryColors[t.category] ?? 'bg-muted text-muted-foreground'}>
                          {t.category}
                        </Badge>
                        <Badge variant="secondary" className={t.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}>
                          {t.status === 'published' ? <Globe className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                          {t.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{t.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> Preview</DropdownMenuItem>
                        <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" /> Edit Template</DropdownMenuItem>
                        <DropdownMenuItem><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem><Download className="mr-2 h-4 w-4" /> Export JSON</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{t.description}</p>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: 'Fields', value: t.fields },
                      { label: 'Steps', value: t.steps },
                      { label: 'Used by', value: t.usedBy },
                    ].map((m) => (
                      <div key={m.label} className="text-center rounded-md bg-muted/50 p-1.5">
                        <p className="text-base font-bold">{m.value}</p>
                        <p className="text-[10px] text-muted-foreground">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                    <span>Created {t.created}</span>
                    <span>Updated {t.updatedAt}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileSearch className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No templates found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search</p>
            </div>
          )}

          {/* Note */}
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <Lock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Admin Note:</span> These are system-wide reusable templates. Supervisors can browse and adopt them into their own projects. Operational form building (steps, fields, validation) is done by Supervisors within their projects — not here.
            </p>
          </div>

        </div>
      </main>
    </>
  )
}

export default function FormsPage() {
  return (
    <Suspense fallback={null}>
      <FormsPageContent />
    </Suspense>
  )
}

