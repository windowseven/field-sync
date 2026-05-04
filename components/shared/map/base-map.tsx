'use client'

import { useMemo, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polygon, Polyline, useMap } from 'react-leaflet'
import { Icon, DivIcon } from 'leaflet'
import { BaseMapProps } from './types'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon issue in Leaflet + Next.js
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const defaultCenter = { lat: -1.2921, lng: 36.8219 }

const statusColors: Record<string, string> = {
  online: '#10b981',
  idle: '#f59e0b',
  offline: '#6b7280',
}

const zoneColorMap: Record<string, string> = {
  'bg-chart-1': '#3b82f6',
  'bg-chart-2': '#10b981',
  'bg-chart-3': '#f59e0b',
  'bg-chart-4': '#8b5cf6',
  'bg-chart-5': '#ec4899',
  'bg-chart-6': '#06b6d4',
}

function getZoneColor(color: string): string {
  return zoneColorMap[color] || '#3b82f6'
}

function createUserIcon(color: string) {
  return new DivIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export function BaseMap({
  center,
  zoom = 13,
  users = [],
  zones = [],
  routes = [],
  showUsers = true,
  showZones = true,
  showCoverage = false,
  showLabels = true,
  onUserClick,
  onZoneClick,
}: BaseMapProps) {
  const resolvedCenter = useMemo((): [number, number] => {
    if (center) return center
    const allPoints = [
      ...users.map((u) => [u.lat, u.lng] as [number, number]),
      ...zones.flatMap((z) => z.boundaries ?? []).map(([lat, lng]) => [lat, lng] as [number, number]),
    ]
    if (allPoints.length === 0) return [defaultCenter.lat, defaultCenter.lng]
    const avgLat = allPoints.reduce((sum, p) => sum + p[0], 0) / allPoints.length
    const avgLng = allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length
    return [avgLat, avgLng]
  }, [center, users, zones])

  return (
    <MapContainer
      center={resolvedCenter}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <MapController center={resolvedCenter} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Zone Polygons */}
      {showZones && zones.map((zone) => {
        if (!zone.boundaries || zone.boundaries.length < 3) return null
        const color = getZoneColor(zone.color)
        return (
          <Polygon
            key={zone.id}
            positions={zone.boundaries}
            pathOptions={{
              color,
              weight: 2.5,
              fillColor: color,
              fillOpacity: 0.15,
            }}
            eventHandlers={{
              click: () => onZoneClick?.(zone),
            }}
          />
        )
      })}

      {/* Routes (GPS path history) */}
      {routes.map((route) => (
        route.points.length >= 2 && (
          <Polyline
            key={route.id}
            positions={route.points}
            pathOptions={{
              color: route.color || '#3b82f6',
              weight: route.weight || 3,
              opacity: 0.8,
            }}
          />
        )
      ))}

      {/* User Markers */}
      {showUsers && users.map((user) => {
        const color = statusColors[user.status || 'offline'] || statusColors['offline']
        return (
          <Marker
            key={user.user_id}
            position={[user.lat, user.lng]}
            icon={createUserIcon(color)}
            eventHandlers={{
              click: () => onUserClick?.(user),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-medium">{user.name || user.email || user.user_id}</p>
                {user.status && <p className="text-xs text-muted-foreground capitalize">{user.status}</p>}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
