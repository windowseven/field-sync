'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle2, ChevronRight, ClipboardList,
  MapPin, Users, Info, Calendar, Rocket, Loader2,
} from 'lucide-react'
import { DashboardHeader } from '@/components/shared/layout/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { projectService } from '@/lib/api/projectService'

const steps = [
  { id: 1, name: 'Project Details', icon: Info },
  { id: 2, name: 'Location & Timeline', icon: Calendar },
  { id: 3, name: 'Team Setup', icon: Users },
  { id: 4, name: 'Review & Create', icon: Rocket },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    startDate: '',
    deadline: '',
    numTeams: '',
    submissionGoal: '',
  })

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => setCurrentStep((s) => Math.min(s + 1, steps.length))
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    try {
      const project = await projectService.create({
        name: formData.name,
        description: formData.description,
        location: formData.location,
        start_date: formData.startDate,
        deadline: formData.deadline,
        target_submissions: parseInt(formData.submissionGoal) || 0,
      })
      router.push(`/supervisor/projects/${project.id}`)
    } catch (err) {
      setError('Failed to create project. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DashboardHeader
        title="Create New Project"
        rootCrumb={{ label: 'Supervisor', href: '/supervisor/projects' }}
        breadcrumbs={[{ label: 'My Projects', href: '/supervisor/projects' }, { label: 'Create Project' }]}
      />
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">

          <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 text-muted-foreground">
            <Link href="/supervisor/projects">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to My Projects
            </Link>
          </Button>

          <div className="space-y-1 mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
            <p className="text-muted-foreground text-lg">Set up a new field operation project in 4 simple steps</p>
          </div>

          {/* Stepper */}
          <div className="relative mb-8">
            <div className="absolute top-5 left-0 w-full h-0.5 bg-muted" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
            <div className="relative flex justify-between">
              {steps.map((step) => {
                const isCompleted = currentStep > step.id
                const isActive = currentStep === step.id
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background transition-colors shadow-sm',
                        isCompleted ? 'bg-primary border-primary' : isActive ? 'border-primary' : 'border-muted text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
                      ) : (
                        <span className="text-sm font-bold">{step.id}</span>
                      )}
                    </div>
                    <span className={cn('text-[10px] mt-2 font-medium uppercase tracking-wider', isActive ? 'text-primary' : 'text-muted-foreground')}>
                      {step.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <Card className="shadow-lg border-primary/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {(() => {
                    const StepIcon = steps[currentStep - 1].icon
                    return <StepIcon className="h-5 w-5" />
                  })()}
                </div>
                <div>
                  <CardTitle>{steps[currentStep - 1].name}</CardTitle>
                  <CardDescription>Step {currentStep} of {steps.length}</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="pName">Project Name</Label>
                    <Input
                      id="pName"
                      placeholder="e.g. Urban Census 2026"
                      className="text-lg"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Give your project a descriptive and unique name.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pDesc">Description</Label>
                    <Textarea
                      id="pDesc"
                      placeholder="Describe the goals and scope of this operational project..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="pLoc">Deployment Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="pLoc"
                        placeholder="e.g. Nairobi, Kenya"
                        className="pl-9"
                        value={formData.location}
                        onChange={(e) => updateField('location', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pStart">Estimated Start Date</Label>
                      <Input
                        id="pStart"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => updateField('startDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pEnd">Estimated Deadline</Label>
                      <Input
                        id="pEnd"
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => updateField('deadline', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-start gap-3">
                        <Users className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Initial Team Configuration</p>
                          <p className="text-xs text-muted-foreground">You can add specific teams and members after the project is created.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pTeams">Planned Number of Teams</Label>
                      <Input
                        id="pTeams"
                        type="number"
                        placeholder="5"
                        min="1"
                        max="100"
                        value={formData.numTeams}
                        onChange={(e) => updateField('numTeams', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pTarget">Total Submission Goal</Label>
                      <Input
                        id="pTarget"
                        type="number"
                        placeholder="1000"
                        min="1"
                        value={formData.submissionGoal}
                        onChange={(e) => updateField('submissionGoal', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="rounded-xl border bg-muted/20 p-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Project Name</p>
                        <p className="font-medium text-lg">{formData.name || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Location</p>
                        <p className="font-medium text-lg">{formData.location || '—'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Timeline</p>
                        <p className="font-medium">
                          {formData.startDate && formData.deadline
                            ? `${new Date(formData.startDate).toLocaleDateString()} — ${new Date(formData.deadline).toLocaleDateString()}`
                            : '—'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Targets</p>
                        <p className="font-medium">{formData.numTeams || '0'} Teams · {formData.submissionGoal || '0'} Submissions</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Description</p>
                      <p className="text-sm text-foreground/80 leading-relaxed italic">
                        {formData.description || 'No description provided'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                {currentStep < steps.length ? (
                  <Button onClick={nextStep} className="gap-2">
                    Next Step <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="gap-2 bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Rocket className="h-4 w-4" />
                    )}
                    {isSubmitting ? 'Creating...' : 'Create Project Now'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-8">
            FieldSync Supervisor Workspace — Secure Mission Management
          </p>

        </div>
      </main>
    </>
  )
}

