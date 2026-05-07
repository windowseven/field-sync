'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, CheckCircle2, AlertCircle, ArrowLeft, Eye, EyeOff, User, Lock } from 'lucide-react'
import { invitationService } from '@/lib/api/invitationService'
import { getApiBaseUrl } from '@/lib/config/endpoints'
import { validateName, validateEmail, validatePassword, validatePasswordMatch, checkPasswordStrength } from '@/lib/security/validation'
import { cn } from '@/lib/utils'

function StrengthBar({ password }: { password: string }) {
  if (!password) return null
  const { score, label, suggestions } = checkPasswordStrength(password)
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  const textColors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500']
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300', i < score ? colors[score] : 'bg-border')} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-medium', textColors[score])}>{label}</span>
        {suggestions[0] && <span className="text-xs text-muted-foreground truncate max-w-[180px]">{suggestions[0]}</span>}
      </div>
    </div>
  )
}

function fieldClass(value: string, error?: string) {
  if (!value) return 'h-10 text-sm pl-9'
  if (error) return 'h-10 text-sm pl-9 border-destructive/70 focus-visible:ring-destructive/30'
  return 'h-10 text-sm pl-9 border-primary/40 focus-visible:ring-primary/20'
}

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string

  const [isValidating, setIsValidating] = useState(true)
  const [inviteData, setInviteData] = useState<{
    role: string
    team: string
    email?: string
    expiresAt: string
    createdBy?: string
    remainingUses?: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false })

  const nameRef = useRef<HTMLInputElement>(null)

  const nameError = touched.name ? validateName(name) : null
  const emailError = touched.email ? validateEmail(email) : null
  const passwordError = touched.password ? validatePassword(password) : null
  const confirmError = touched.confirmPassword ? validatePasswordMatch(password, confirmPassword) : null
  const apiError = error

  useEffect(() => { nameRef.current?.focus() }, [])

  useEffect(() => {
    async function validate() {
      setIsValidating(true)
      setError(null)

      const linkResult = await invitationService.validateInviteCode(code)
      if (linkResult) {
        setInviteData(linkResult)
        setIsValidating(false)
        return
      }

      const emailResult = await invitationService.validateEmailInvite(code)
      if (emailResult) {
        setInviteData({
          role: emailResult.role,
          team: emailResult.team,
          email: emailResult.email,
          expiresAt: emailResult.expiresAt,
          createdBy: emailResult.createdBy,
        })
        setEmail(emailResult.email || '')
        setIsValidating(false)
        return
      }

      setError('This invitation is invalid, expired, or has already been used.')
      setIsValidating(false)
    }
    validate()
  }, [code])

  const isFormValid =
    !validateName(name) &&
    !validateEmail(email) &&
    !validatePassword(password) &&
    !validatePasswordMatch(password, confirmPassword)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ name: true, email: true, password: true, confirmPassword: true })
    if (!isFormValid || !inviteData) return

    setIsProcessing(true)
    setError(null)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 15000)

    try {
      const isEmailInvite = !!inviteData.email
      const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          name: name.trim(),
          first_name: name.trim().split(' ')[0],
          email: email.trim().toLowerCase(),
          password,
          inviteCode: isEmailInvite ? undefined : code,
          inviteToken: isEmailInvite ? code : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Registration failed')

      setSuccess(true)
      setTimeout(() => {
        router.push(`/verify-otp?context=registration&email=${encodeURIComponent(email.trim().toLowerCase())}`)
      }, 800)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('The server took too long to respond. Please try again.')
      } else {
        setError(err instanceof Error ? err.message : 'Registration failed')
      }
    } finally {
      window.clearTimeout(timeoutId)
      setIsProcessing(false)
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Validating invitation...</span>
        </div>
      </div>
    )
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card rounded-lg border p-7">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Invalid Invitation</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Link href="/login">
            <button className="w-full h-10 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card rounded-lg border p-7">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Welcome to FieldSync!</h2>
            <p className="text-sm text-muted-foreground">Your account has been created. Redirecting to verification...</p>
          </div>
        </div>
      </div>
    )
  }

  const roleLabel = inviteData?.role.replace('_', ' ') ?? 'field agent'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card rounded-lg border p-7">
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Mail className="w-4 h-4 text-primary" />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Accept invitation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            You've been invited to join as <span className="font-semibold text-foreground">{roleLabel}</span>
            {inviteData?.team && <> on team <span className="font-semibold text-foreground">&ldquo;{inviteData.team}&rdquo;</span></>}
          </p>
          {inviteData?.createdBy && <p className="text-xs text-muted-foreground mt-1">Invited by {inviteData.createdBy}</p>}
        </div>

        {apiError && (
          <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="join-name" className="text-xs font-medium text-foreground/80">Full name <span className="text-destructive">*</span></label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                id="join-name"
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                placeholder="Jane Doe"
                className={cn('w-full rounded-md border bg-transparent px-3 py-2 outline-none transition-all', fieldClass(name, nameError ?? undefined))}
                disabled={isProcessing || success}
              />
            </div>
            {nameError && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3 flex-shrink-0" />{nameError}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="join-email" className="text-xs font-medium text-foreground/80">Email address <span className="text-destructive">*</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                id="join-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="jane@fieldsync.com"
                readOnly={!!inviteData?.email}
                className={cn('w-full rounded-md border bg-transparent px-3 py-2 outline-none transition-all', fieldClass(email, emailError ?? undefined), inviteData?.email && 'opacity-70 cursor-not-allowed')}
                disabled={isProcessing || success}
              />
            </div>
            {emailError && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3 flex-shrink-0" />{emailError}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="join-password" className="text-xs font-medium text-foreground/80">Password <span className="text-destructive">*</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                id="join-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                placeholder="Min. 8 characters"
                className={cn('w-full rounded-md border bg-transparent px-3 py-2 pr-10 outline-none transition-all', fieldClass(password, passwordError ?? undefined))}
                disabled={isProcessing || success}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <StrengthBar password={password} />
            {password && (
              <div className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-1.5 mt-1">
                {[
                  { label: 'At least 8 characters', met: password.length >= 8 },
                  { label: 'At least 1 capital letter (A–Z)', met: /[A-Z]/.test(password) },
                  { label: 'At least 1 small letter (a–z)', met: /[a-z]/.test(password) },
                  { label: 'At least 1 digit (0–9)', met: /[0-9]/.test(password) },
                  { label: 'At least 1 symbol', met: /[^A-Za-z0-9]/.test(password) },
                ].map(({ label, met }) => (
                  <div key={label} className="flex items-center gap-2">
                    {met ? <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/40 flex-shrink-0" />}
                    <span className={cn('text-xs', met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>{label}</span>
                  </div>
                ))}
              </div>
            )}
            {passwordError && touched.password && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3 flex-shrink-0" />{passwordError}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="join-confirm-password" className="text-xs font-medium text-foreground/80">Confirm password <span className="text-destructive">*</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                id="join-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                placeholder="Re-enter your password"
                className={cn('w-full rounded-md border bg-transparent px-3 py-2 pr-10 outline-none transition-all', fieldClass(confirmPassword, confirmError ?? undefined), confirmPassword && !confirmError ? 'border-primary/40 focus-visible:ring-primary/20' : '')}
                disabled={isProcessing || success}
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showConfirm ? 'Hide password' : 'Show password'} tabIndex={-1}>
                {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {confirmError && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3 flex-shrink-0" />{confirmError}</p>}
            {confirmPassword && !confirmError && <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3 flex-shrink-0" />Passwords match</p>}
          </div>

          <button
            type="submit"
            disabled={isProcessing || success}
            className="w-full h-10 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
          >
            {isProcessing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Creating account…</> : success ? <><CheckCircle2 className="w-3.5 h-3.5" />Account created!</> : <>Create account</>}
          </button>

          <p className="text-center text-xs text-muted-foreground pt-4 border-t">
            Already have an account? <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
