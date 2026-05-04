import { http } from './httpClient';

export interface ApiInviteLink {
  id: string;
  code: string;
  role: 'team_leader' | 'field_user';
  team: string;
  uses: number;
  max_uses: number;
  created_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'maxed';
}

export interface ApiPendingInvite {
  id: string;
  email: string;
  role: 'team_leader' | 'field_user';
  team: string;
  sent_at: string;
  status: 'pending' | 'accepted' | 'expired';
}

export interface CreateInviteLinkParams {
  role: 'team_leader' | 'field_user';
  team: string;
  maxUses: number;
  expiresInDays: number;
}

export interface SendEmailInviteParams {
  email: string;
  role: 'team_leader' | 'field_user';
  team: string;
}

export const invitationService = {
  async getInviteLinks(): Promise<ApiInviteLink[]> {
    const response = await http.get<any>('/invitations/links');
    return response?.data?.links ?? response?.data?.data?.links ?? [];
  },

  async getEmailInvites(): Promise<ApiPendingInvite[]> {
    const response = await http.get<any>('/invitations/emails');
    return response?.data?.invites ?? response?.data?.data?.invites ?? [];
  },

  async createInviteLink(params: CreateInviteLinkParams): Promise<ApiInviteLink> {
    const response = await http.post<any>('/invitations/links', {
      role: params.role,
      team_id: params.team,
      max_uses: params.maxUses,
      expires_in_days: params.expiresInDays,
    });
    return response?.data?.link ?? response?.data?.data?.link;
  },

  async sendEmailInvite(params: SendEmailInviteParams): Promise<ApiPendingInvite> {
    const response = await http.post<any>('/invitations/emails', {
      email: params.email,
      role: params.role,
      team_id: params.team,
    });
    return response?.data?.invite ?? response?.data?.data?.invite;
  },

  async resendEmailInvite(id: string): Promise<boolean> {
    try {
      await http.post<any>(`/invitations/emails/${id}/resend`);
      return true;
    } catch (err) {
      console.error('Failed to resend invite:', err);
      return false;
    }
  },

  async deleteInviteLink(id: string): Promise<boolean> {
    try {
      await http.delete(`/invitations/links/${id}`);
      return true;
    } catch (err) {
      console.error('Failed to delete invite link:', err);
      return false;
    }
  },

  async deleteEmailInvite(id: string): Promise<boolean> {
    try {
      await http.delete(`/invitations/emails/${id}`);
      return true;
    } catch (err) {
      console.error('Failed to delete email invite:', err);
      return false;
    }
  },

  async regenerateInviteLink(id: string): Promise<ApiInviteLink> {
    const response = await http.post<any>(`/invitations/links/${id}/regenerate`);
    return response?.data?.link ?? response?.data?.data?.link;
  },

  transformInviteLink(link: ApiInviteLink) {
    return {
      id: link.id,
      code: link.code,
      role: link.role,
      team: link.team,
      uses: link.uses,
      maxUses: link.max_uses,
      createdAt: link.created_at ? new Date(link.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      expiresAt: link.expires_at ? new Date(link.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
      status: link.status,
    };
  },

  transformEmailInvite(invite: ApiPendingInvite) {
    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      team: invite.team,
      sentAt: invite.sent_at ? getRelativeTime(invite.sent_at) : '',
      status: invite.status,
    };
  },
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}