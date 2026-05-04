'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { tokenManager } from '@/lib/auth/tokenManager'

type GeolocationState = {
  lat: number | null
  lng: number | null
  accuracy: number | null
  error: string | null
  isWatching: boolean
}

export function useGeolocation(intervalMs = 5000) {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    error: null,
    isWatching: false,
  })
  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation not supported' }))
      return
    }

    setState((s) => ({ ...s, error: null, isWatching: true }))

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          error: null,
          isWatching: true,
        })
      },
      (err) => {
        setState((s) => ({ ...s, error: err.message, isWatching: true }))
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )
  }, [])

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setState((s) => ({ ...s, isWatching: false }))
  }, [])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return { ...state, startWatching, stopWatching }
}

export function useWsLocationBroadcast(lat: number | null, lng: number | null, accuracy: number | null, enabled: boolean) {
  const wsRef = useRef<WebSocket | null>(null)
  const lastSentRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(() => {
    if (!enabled || lat == null || lng == null) return

    const token = tokenManager.getToken()
    if (!token) return

    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/ws?token=${token}`
    const ws = new WebSocket(url)

    ws.onopen = () => {
      wsRef.current = ws
    }

    ws.onclose = () => {
      wsRef.current = null
      reconnectTimerRef.current = setTimeout(connect, 5000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [enabled, lat, lng])

  useEffect(() => {
    if (!enabled || lat == null || lng == null || !wsRef.current) return

    const now = Date.now()
    if (now - lastSentRef.current < 3000) return

    lastSentRef.current = now

    try {
      wsRef.current.send(
        JSON.stringify({
          type: 'location:update',
          data: { lat, lng, accuracy, ts: now },
        })
      )
    } catch {
      // ignore
    }
  }, [lat, lng, accuracy, enabled])

  useEffect(() => {
    if (enabled) {
      connect()
    } else {
      wsRef.current?.close()
      wsRef.current = null
    }
    return () => {
      wsRef.current?.close()
      wsRef.current = null
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
    }
  }, [enabled, connect])
}
