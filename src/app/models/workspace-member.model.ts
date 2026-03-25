export type WorkspaceRole = 'owner' | 'member' | 'viewer';
export type InvitationRole = 'member' | 'viewer';

export interface WorkspaceMember {
  userId: number;
  email: string;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface Invitation {
  id: string;
  email: string;
  role: InvitationRole;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface InvitationValidation {
  valid: boolean;
  workspace: {
    id: string;
    name: string;
  };
  invitedBy: {
    email: string;
  };
  role: InvitationRole;
}
