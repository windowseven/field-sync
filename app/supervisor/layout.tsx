'use client';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SupervisorSidebar } from '@/components/features/supervisor/supervisor-sidebar'
import { QuickTopbar } from '@/components/shared/layout/quick-topbar'
import { useAuth } from '@/lib/auth/AuthContext'
import { Loader2 } from 'lucide-react'

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?reason=unauthenticated')
    } else if (!isLoading && isAuthenticated && user?.role !== 'supervisor' && user?.role !== 'admin') {
      router.replace('/unauthorized')
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading || !mounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <SidebarProvider>
      <SupervisorSidebar />
      <SidebarInset className="flex flex-col">
        <QuickTopbar />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

