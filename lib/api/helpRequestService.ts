import { http } from './httpClient'

export type HelpRequestType = 'help' | 'meeting' | 'assistance'
export type HelpRequestStatus = 'pending' | 'accepted' | 'rejected'
export type HelpRequestResponse = 'accepted' | 'rejected' | 'escalated'

export interface ApiHelpRequest {
  id: string
  user_id: string
  user_name?: string
  type: HelpRequestType
  message: string
  status: HelpRequestStatus
  response_from?: string | null
  response_at?: string | null
  response_note?: string | null
  created_at: string
}

export const helpRequestService = {
  async getMine(): Promise<ApiHelpRequest[]> {
    const res = await http.get<any>('/help-requests')
    return res?.data?.helpRequests ?? res?.data?.data?.helpRequests ?? []
  },

  async getPending(): Promise<ApiHelpRequest[]> {
    const res = await http.get<any>('/help-requests/pending')
    return res?.data?.helpRequests ?? res?.data?.data?.helpRequests ?? []
  },

  async create(type: HelpRequestType, message: string): Promise<ApiHelpRequest> {
    const res = await http.post<any>('/help-requests', { type, message })
    return res?.data?.helpRequest ?? res?.data?.data?.helpRequest
  },

  async respond(id: string, response: HelpRequestResponse, note?: string): Promise<any> {
    const res = await http.patch<any>(`/help-requests/${id}/respond`, { response, note })
    return res?.data ?? res?.data?.data
  },
}

