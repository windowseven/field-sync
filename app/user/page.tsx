'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function UserPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/user/home')
  }, [router])

  return null
}


