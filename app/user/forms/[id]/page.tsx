'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, FileText, Loader2, Info, Save, Trash2, RotateCcw, ClipboardList, MapPin, Compass
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { syncService } from '@/lib/api/syncService'
import { useAuth } from '@/lib/auth/AuthContext'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '@/lib/api/swr-fetcher'
import { db } from '@/lib/db/syncDatabase'

export default function FormDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const formId = params.id as string
  
  const { data: response, error } = useSWR(`/forms/${formId}`, fetcher)
  const { data: tasksResponse } = useSWR('/tasks', fetcher)
  const { data: sessionData } = useSWR('/users/session', fetcher)
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const rawForm = response?.form || response?.data?.form || response || null
  
  // Process form schema
  const form = rawForm ? {
    ...rawForm,
    steps: typeof rawForm.form_schema === 'string' 
      ? JSON.parse(rawForm.form_schema) 
      : (rawForm.form_schema || [])
  } : null

  const validateStep = (stepIndex: number): boolean => {
    const step = form.steps?.[stepIndex]
    if (!step || !step.fields) return true

    const newErrors: Record<string, string> = {}
    step.fields.forEach((field: any) => {
      const value = formData[field.id]
      if (field.required && (!value || value.toString().trim() === '')) {
        newErrors[field.id] = `${field.label} is required`
      }
      if (field.type === 'number' && value) {
        const num = Number(value)
        if (isNaN(num)) {
          newErrors[field.id] = 'Must be a valid number'
        }
        if (field.min !== undefined && num < field.min) {
          newErrors[field.id] = `Minimum value is ${field.min}`
        }
        if (field.max !== undefined && num > field.max) {
          newErrors[field.id] = `Maximum value is ${field.max}`
        }
      }
      if (field.type === 'text' && field.pattern && value) {
        const regex = new RegExp(field.pattern)
        if (!regex.test(value)) {
          newErrors[field.id] = field.patternMessage || 'Invalid format'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[fieldId]
      return next
    })
  }

  useEffect(() => {
    loadDraft()
  }, [formId])

  const loadDraft = async () => {
    try {
      const draft = await db.formDrafts.get(formId)
      if (draft) {
        setFormData(draft.formData)
        setCurrentStep(draft.currentStep)
        setHasDraft(true)
        setDraftSavedAt(draft.savedAt)
        toast.info('Draft restored', {
          description: `Saved on ${new Date(draft.savedAt).toLocaleString()}`
        })
      }
    } catch (err) {
      console.error('Failed to load draft', err)
    }
  }

  const saveDraft = async () => {
    if (!form) return
    setIsSaving(true)
    try {
      await db.formDrafts.put({
        formId,
        formData,
        currentStep,
        savedAt: new Date().toISOString()
      })
      setHasDraft(true)
      setDraftSavedAt(new Date().toISOString())
    } catch (err) {
      console.error('Failed to save draft', err)
      toast.error('Failed to save draft')
    } finally {
      setIsSaving(false)
    }
  }

  const clearDraft = async () => {
    try {
      await db.formDrafts.delete(formId)
      setHasDraft(false)
      setDraftSavedAt(null)
      toast.success('Draft cleared')
    } catch (err) {
      console.error('Failed to clear draft', err)
    }
  }

  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      const timer = setTimeout(() => {
        saveDraft()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [formData, currentStep])

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields')
      return
    }
    if (form?.steps && currentStep < form.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user || !form) return

    const allValid = form.steps.every((_: any, idx: number) => validateStep(idx))
    if (!allValid) {
      toast.error('Please fill in all required fields before submitting')
      return
    }

    setIsSubmitting(true)

    // Capture location
    let location = { lat: 0, lng: 0 }
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })
        location = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      } catch (err) {
        console.warn('Location capture failed, proceeding with 0,0')
      }
    }

    const submissionData = {
      form_id: formId,
      user_id: user.id,
      project_id: form.project_id,
      responses: formData,
      location: location
    }

    try {
      await syncService.enqueue('form_submission', `Submit: ${form.title}`, submissionData)
      await db.formDrafts.delete(formId)
      toast.success('Submission queued!', {
        description: 'Data will be synced as soon as a connection is stable.'
      })
      router.push('/user/forms')
    } catch (error) {
      toast.error('Failed to queue submission')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col h-[400px] items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive opacity-50" />
        <h2 className="text-xl font-bold">Failed to load form</h2>
        <Button variant="outline" onClick={() => router.push('/user/forms')}>Back to Forms</Button>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground font-medium">Downloading form structure...</span>
      </div>
    )
  }

  const currentStepData = form.steps?.[currentStep]
  const progressPercent = form.steps?.length ? ((currentStep + 1) / form.steps.length) * 100 : 0

  const linkedTask = tasksResponse?.data?.tasks?.find((t: any) => t.form_id === formId || t.linkedForm === formId)

  return (
    <>
      <DashboardHeader
        title={form.title}
        rootCrumb={{ label: 'Field', href: '/user/home' }}
        breadcrumbs={[
          { label: 'Forms gallery', href: '/user/forms' },
          { label: form.title },
        ]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="mx-auto max-w-2xl space-y-8">

          {/* Form Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter text-primary uppercase">{form.title}</h1>
                <p className="text-sm text-muted-foreground font-medium max-w-prose">{form.description}</p>
              </div>
              <div className="flex items-center gap-2">
                {hasDraft && (
                  <Badge variant="outline" className="h-6 font-bold uppercase tracking-widest border-amber-500/30 bg-amber-500/10 text-amber-600">
                    <Save className="h-3 w-3 mr-1" /> Draft
                  </Badge>
                )}
                {sessionData?.data?.session?.status === 'online' ? (
                  <Badge variant="outline" className="h-6 font-bold uppercase tracking-widest border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                    Session Active
                  </Badge>
                ) : sessionData?.data?.session?.status === 'idle' ? (
                  <Badge variant="outline" className="h-6 font-bold uppercase tracking-widest border-amber-500/30 bg-amber-500/10 text-amber-600">
                    Session Paused
                  </Badge>
                ) : (
                  <Badge variant="outline" className="h-6 font-bold uppercase tracking-widest border-muted-foreground/30 bg-muted/10 text-muted-foreground">
                    Not Started
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 py-2 border-y border-primary/5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground/80 uppercase">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                {form.deadline ? `Due: ${new Date(form.deadline).toLocaleDateString()}` : 'No Deadline'}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground/80 uppercase">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                {form.steps.length} Progression Steps
              </div>
              {hasDraft && draftSavedAt && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RotateCcw className="h-3 w-3 text-emerald-500" />
                  Saved {new Date(draftSavedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-primary/5 shadow-inner">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Progressive Verification</span>
              <span className="text-[10px] font-black text-primary uppercase tabular-nums">{Math.round(progressPercent)}% COMPLETE</span>
            </div>
            <Progress value={progressPercent} className="h-2.5 bg-background shadow-inner" />
          </div>

          {/* Linked Task Context */}
          {linkedTask && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                    <ClipboardList className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Linked Task</p>
                    <p className="text-sm font-semibold">{linkedTask.title}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      {linkedTask.zone_name && (
                        <span className="flex items-center gap-1">
                          <Compass className="h-3 w-3" /> {linkedTask.zone_name}
                        </span>
                      )}
                      {linkedTask.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {linkedTask.location}
                        </span>
                      )}
                      {linkedTask.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Due {new Date(linkedTask.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0 capitalize">
                    {linkedTask.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Step Content */}
          {currentStepData && (
            <Card className="border-primary/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <CardHeader className="bg-primary/[0.02] border-b border-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">{currentStepData.title}</CardTitle>
                    <CardDescription className="text-xs font-medium mt-1">{currentStepData.description}</CardDescription>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-sm">
                    {currentStep + 1}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                {currentStepData.fields?.map((field: any) => (
                  <div key={field.id} className="space-y-3 group">
                    <label className="text-sm font-bold uppercase tracking-tight flex items-center gap-2 group-hover:text-primary transition-colors">
                      {field.label}
                      {field.required && <span className="text-destructive text-lg leading-none">*</span>}
                    </label>

                    <div className="space-y-2">
                       {field.type === 'text' && (
                        <Input
                          placeholder={field.placeholder || "Enter text here..."}
                          value={formData[field.id] || ''}
                          className={cn(
                            "h-11 bg-muted/20 border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm",
                            errors[field.id] && "border-destructive focus:border-destructive focus:ring-destructive"
                          )}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        />
                      )}

                      {field.type === 'number' && (
                        <Input
                          type="number"
                          placeholder={field.placeholder || "0.00"}
                          value={formData[field.id] || ''}
                          className={cn(
                            "h-11 bg-muted/20 border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm",
                            errors[field.id] && "border-destructive focus:border-destructive focus:ring-destructive"
                          )}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        />
                      )}

                      {field.type === 'textarea' && (
                        <Textarea
                          placeholder={field.placeholder || "Provide detailed observations..."}
                          value={formData[field.id] || ''}
                          className={cn(
                            "min-h-[120px] bg-muted/20 border-primary/10 focus:border-primary focus:ring-1 focus:ring-primary shadow-sm",
                            errors[field.id] && "border-destructive focus:border-destructive focus:ring-destructive"
                          )}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        />
                      )}

                      {field.type === 'dropdown' && (
                        <Select value={formData[field.id] || ''} onValueChange={(v) => handleFieldChange(field.id, v)}>
                          <SelectTrigger className={cn(
                            "h-11 bg-muted/20 border-primary/10",
                            errors[field.id] && "border-destructive"
                          )}>
                            <SelectValue placeholder="Select from verified options..." />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option: any) => (
                              <SelectItem key={option} value={option} className="font-medium">
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {field.type === 'radio' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          {field.options?.map((option: any) => (
                            <label key={option} className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-95",
                              errors[field.id] && "border-destructive/50",
                              formData[field.id] === option 
                                ? "bg-primary/5 border-primary shadow-sm" 
                                : "bg-muted/10 border-transparent hover:border-primary/20"
                            )}>
                              <input
                                type="radio"
                                name={field.id}
                                value={option}
                                checked={formData[field.id] === option}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="w-5 h-5 accent-primary"
                              />
                              <span className="text-sm font-bold uppercase tracking-tight">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {errors[field.id] && (
                        <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors[field.id]}
                        </p>
                      )}
                    </div>
                    
                    {field.description && <p className="text-[10px] text-muted-foreground italic pl-1">{field.description}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Navigation Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between pb-8">
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="h-12 px-8 font-black uppercase tracking-widest border-primary/10 hover:bg-primary/5"
              >
                <ChevronLeft className="h-5 w-5 mr-2" /> Back
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={saveDraft}
                disabled={isSaving}
                className="h-12 px-4 text-xs gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
              {hasDraft && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDraft}
                  className="h-12 px-4 text-xs gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex gap-4">
              {currentStep === form.steps.length - 1 ? (
                <Button 
                  size="lg"
                  disabled={isSubmitting}
                  onClick={handleSubmit} 
                  className="h-12 px-10 font-black uppercase tracking-widest shadow-xl bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                  )}
                  Finalize & Sync
                </Button>
              ) : (
                <Button 
                  size="lg"
                  onClick={handleNext} 
                  className="h-12 px-10 font-black uppercase tracking-widest shadow-xl"
                >
                  Continue <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Meta Info */}
          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Info className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-1">Operational Data Security</h4>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Your entries are automatically saved as drafts and stored locally. You can return to this form anytime 
                to continue where you left off. Data will persist until submission is confirmed with the primary hub.
              </p>
            </div>
          </div>

        </div>
      </main>
    </>
  )
}