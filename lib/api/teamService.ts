import { http } from './httpClient';
import { ApiUser } from './userService';

export interface ApiTeamMember extends ApiUser {
  team_id?: string;
  team_project_id?: string;
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  location_updated_at?: string | null;
}

export interface ApiTeamStats {
  totalMembers: number;
  activeMembers: number;
  pendingTasks: number;
  completedTasks: number;
}

export interface ApiZoneBreach {
  member_id: string;
  member_name: string;
  lat: number;
  lng: number;
  status: string;
}

export interface ApiZoneInside {
  member_id: string;
  member_name: string;
  zone_id: string;
  zone_name: string;
}

export interface ApiZoneBreachResponse {
  breaches: ApiZoneBreach[];
  inside: ApiZoneInside[];
  totalMembers: number;
  inZoneCount: number;
  outOfZoneCount: number;
}

export interface ApiMyTeamInfo {
  team: {
    id: string
    name: string
    project_id: string
    leader_id?: string | null
  }
  members: Array<
    ApiUser & {
      is_team_leader?: boolean
      team_id?: string
      lat?: number | null
      lng?: number | null
      accuracy?: number | null
      location_updated_at?: string | null
    }
  >
}

export const teamService = {
  async getMembers(): Promise<ApiTeamMember[]> {
    const response = await http.get<any>('/team/members');
    return response?.data?.members ?? response?.data?.data?.members ?? [];
  },

  async getMyTeamMembers(): Promise<ApiMyTeamInfo | null> {
    const response = await http.get<any>('/team/my/members');
    return response?.data?.team || response?.data?.members ? response.data : response?.data?.data ?? null;
  },

  async getStats(): Promise<ApiTeamStats> {
    const response = await http.get<any>('/team/stats');
    return response?.data ?? { totalMembers: 0, activeMembers: 0, pendingTasks: 0, completedTasks: 0 };
  },

  async getZoneBreaches(): Promise<ApiZoneBreachResponse | null> {
    const response = await http.get<any>('/team/zone-breaches');
    return response?.data ?? response?.data?.data ?? null;
  },

  async getByProject(projectId: string): Promise<any[]> {
    const response = await http.get<any>(`/projects/${projectId}/teams`);
    return response?.data?.teams ?? response?.data?.data?.teams ?? [];
  },

  transformForFrontend(member: ApiTeamMember) {
    return {
      id: member.id,
      name: member.name,
      firstName: member.first_name,
      email: member.email,
      role: member.role,
      avatarUrl: member.avatar ?? '/placeholder-user.jpg',
      status: member.status ?? 'offline',
      teamId: member.team_id,
    };
  },
};
