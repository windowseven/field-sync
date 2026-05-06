import { http } from './httpClient'

export type IssueType = 'safety' | 'equipment' | 'environmental' | 'access' | 'other'
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IssueStatus = 'active' | 'redirected' | 'paused' | 'resumed' | 'resolved'
export type IssueResponse = 'redirect' | 'pause' | 'resume' | 'resolve'

export interface ApiFieldIssue {
  id: string
  team_id: string
  reported_by: string
  reported_by_name?: string
  reported_by_email?: string
  type: IssueType
  title: string
  description?: string
  severity: IssueSeverity
  affected_zone_id?: string | null
  zone_name?: string | null
  status: IssueStatus
  response_note?: string | null
  redirect_zone_id?: string | null
  resolved_by?: string | null
  resolved_at?: string | null
  created_at: string
}

export const fieldIssueService = {
  async getAll(status?: string): Promise<ApiFieldIssue[]> {
    const query = status ? `?status=${status}` : ''
    const res = await http.get<any>(`/team/issues${query}`)
    return res?.data?.issues ?? res?.data?.data?.issues ?? []
  },

  async getActive(): Promise<ApiFieldIssue[]> {
    const res = await http.get<any>('/team/issues/active')
    return res?.data?.activeIssues ?? res?.data?.data?.activeIssues ?? []
  },

  async create(type: IssueType, title: string, description?: string, severity?: IssueSeverity, zoneId?: string): Promise<ApiFieldIssue> {
    const res = await http.post<any>('/team/issues', { type, title, description, severity, affected_zone_id: zoneId })
    return res?.data?.issue ?? res?.data?.data?.issue
  },

  async respond(id: string, action: IssueResponse, note?: string, redirectZoneId?: string): Promise<any> {
    const res = await http.patch<any>(`/team/issues/${id}/respond`, { action, note, redirect_zone_id: redirectZoneId })
    return res?.data ?? res?.data?.data
  },
}
