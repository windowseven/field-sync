'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText, Clock, CheckCircle2, Circle, Edit3,
  ChevronRight, AlertCircle, Loader2,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formService, type ApiForm } from '@/lib/api/formService'

const statusConfig: Record<string, { label: string; icon: typeof FileText; color: string; bg: string; borderColor: string }> = {
  draft: { label: 'Not Started', icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted/60', borderColor: '' },
  'in-progress': { label: 'In Progress', icon: Edit3, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  submitted: { label: 'Submitted', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
}

export default function UserFormsPage() {
  const [forms, setForms] = useState<ApiForm[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      setLoading(true)
      const data = await formService.getAll()
      setForms(data)
    } catch (error) {
      console.error('Failed to fetch forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const pending = forms.filter((f) => f.status === 'draft')
  const submitted = forms.filter((f) => f.status === 'published')

  if (loading) {
    return (
      <>
        <DashboardHeader
          title="Forms"
          rootCrumb={{ label: 'Field', href: '/user/home' }}
          breadcrumbs={[{ label: 'Forms' }]}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-7xl flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <DashboardHeader
        title="Forms"
        rootCrumb={{ label: 'Field', href: '/user/home' }}
        breadcrumbs={[{ label: 'Forms' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Summary */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/60">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pending.length}</p>
                  <p className="text-xs text-muted-foreground">Not Started</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-500">{submitted.length}</p>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{forms.length}</p>
                  <p className="text-xs text-muted-foreground">Total Forms</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Forms */}
          {pending.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Forms to Complete
                </CardTitle>
                <CardDescription>Forms assigned to you that need submission</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {pending.map((form) => {
                    const schema = typeof form.form_schema === 'string' ? JSON.parse(form.form_schema) : form.form_schema
                    const totalSteps = schema?.steps?.length || 1

                    return (
                      <div
                        key={form.id}
                        className="flex flex-col gap-3 rounded-lg border p-4 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60 shrink-0">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight">{form.title}</p>
                            {form.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                {form.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{totalSteps} step{totalSteps !== 1 ? 's' : ''}</span>
                        </div>

                        {totalSteps > 1 && (
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">Step 1 of {totalSteps}</span>
                            </div>
                            <Progress value={0} className="h-1.5" />
                          </div>
                        )}

                        <Button asChild size="sm" className="gap-2 w-full">
                          <Link href={`/user/forms/${form.id}`}>
                            <Edit3 className="h-3.5 w-3.5" />
                            Start Form
                          </Link>
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submitted Forms */}
          {submitted.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Submitted
                </CardTitle>
                <CardDescription>Forms you have already submitted</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {submitted.map((form) => (
                    <div
                      key={form.id}
                      className="flex items-center gap-3 rounded-lg border p-3 opacity-80"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{form.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(form.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        Submitted
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {forms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-lg">No forms assigned</p>
              <p className="text-sm text-muted-foreground mt-1">Forms will appear here when assigned by your team leader</p>
            </div>
          )}

        </div>
      </main>
    </>
  )
}
