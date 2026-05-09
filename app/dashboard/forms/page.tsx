'use client'

import { Suspense, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  FileSearch, Plus, Search, MoreHorizontal, Eye, Copy, Pencil,
  Trash2, Download, CheckCircle2, Clock, Globe, Lock, FileText, Loader2, XCircle,
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
import { http } from '@/lib/api/httpClient'

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  fields: number;
  steps: number;
  usedBy: number;
  category: string;
}

function parseFormSchema(schema: any): { fields: number; steps: number } {
  try {
    const parsed = typeof schema === 'string' ? JSON.parse(schema) : schema;
    if (Array.isArray(parsed)) {
      const steps = parsed.length;
      const fields = parsed.reduce((acc: number, step: any) => {
        return acc + (Array.isArray(step.fields) ? step.fields.length : 0);
      }, 0);
      return { fields, steps };
    }
  } catch {}
  return { fields: 0, steps: 0 };
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function FormsPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(searchParams.get('create') === '1')
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => {
    const fetchForms = async () => {
      setIsLoading(true);
      try {
        const res = await http.get<{ status: string; data: { forms: any[] } }>('/forms');
        const mapped: FormTemplate[] = res.data.forms.map((f: any) => {
          const { fields, steps } = parseFormSchema(f.form_schema);
          return {
            id: f.id,
            title: f.title,
            description: f.description || '',
            status: f.status || 'draft',
            created_at: f.created_at,
            fields,
            steps,
            usedBy: 0,
            category: 'Form',
          };
        });
        setTemplates(mapped);
        setError(null);
      } catch {
        setError('Failed to load form templates');
      } finally {
        setIsLoading(false);
      }
    };
    fetchForms();
  }, [])

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
    t.title.toLowerCase().includes(search.toLowerCase())
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
                    <Label>Description</Label>
                    <Textarea placeholder="Describe what this form collects..." rows={3} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="resize-none" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => updateCreateOpen(false)}>Cancel</Button>
                  <Button onClick={() => updateCreateOpen(false)} disabled={!newName}>
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

          {/* Loading & Error */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading form templates...</p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3">
              <XCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          {/* Search */}
          {!isLoading && !error && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates by name..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          )}

          {/* Templates Grid */}
          {!isLoading && !error && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => (
              <Card key={t.id} className="hover:border-primary/40 transition-colors group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="secondary" className={t.status === 'published' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}>
                          {t.status === 'published' ? <Globe className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                          {t.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{t.title}</CardTitle>
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
                    <span>Created {formatDate(t.created_at)}</span>
                    <span>From database</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
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

