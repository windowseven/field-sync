export type LatLng = [number, number]

export type MapUser = {
  user_id: string
  name?: string
  email?: string
  role: string
  team?: string
  status?: string
  lat: number
  lng: number
  accuracy?: number
  updated_at?: string
}

export type MapZone = {
  id: string
  name: string
  description?: string
  color: string
  team?: string
  status?: string
  coverage?: number
  boundaries?: [number, number][]
}

export type MapLayer = {
  id: string
  label: string
  enabled: boolean
}

export type MapRoute = {
  id: string
  color?: string
  weight?: number
  points: [number, number][]
}

export type BaseMapProps = {
  center?: LatLng
  zoom?: number
  users?: MapUser[]
  zones?: MapZone[]
  routes?: MapRoute[]
  showUsers?: boolean
  showZones?: boolean
  showCoverage?: boolean
  showLabels?: boolean
  height?: string
  className?: string
  onUserClick?: (user: MapUser) => void
  onZoneClick?: (zone: MapZone) => void
}
