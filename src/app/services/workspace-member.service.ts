import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import {
  Invitation,
  InvitationRole,
  InvitationValidation,
  WorkspaceMember,
  WorkspaceRole,
} from '../models/workspace-member.model';
import { toError } from './http-error';

interface WorkspaceMemberResponse {
  user_id: number;
  email: string;
  role: WorkspaceRole;
  joined_at: string;
}

interface InvitationResponse {
  id: number;
  email: string;
  token?: string;
  role: InvitationRole;
  expires_at: string;
  created_at: string;
}

interface InvitationValidationResponse {
  valid: boolean;
  workspace: {
    id: number;
    name: string;
  };
  invited_by?: {
    email: string;
  };
  role: InvitationRole;
}

interface AcceptInvitationResponse {
  workspace_id: number;
  role: WorkspaceRole;
}

@Injectable({
  providedIn: 'root',
})
export class WorkspaceMemberService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  getMembers(workspaceId: string): Observable<WorkspaceMember[]> {
    return this.http.get<WorkspaceMemberResponse[]>(`${this.apiUrl}/workspaces/${workspaceId}/members`).pipe(
      map((members) => members.map((member) => this.mapMember(member))),
      catchError((error) => throwError(() => toError(error, 'Unable to load workspace members.'))),
    );
  }

  inviteMember(workspaceId: string, email: string, role: InvitationRole): Observable<Invitation> {
    return this.http
      .post<InvitationResponse>(`${this.apiUrl}/workspaces/${workspaceId}/invitations`, { email, role })
      .pipe(
        map((invitation) => this.mapInvitation(invitation)),
        catchError((error) => throwError(() => toError(error, 'Unable to create invitation.'))),
      );
  }

  updateRole(workspaceId: string, userId: number, role: WorkspaceRole): Observable<WorkspaceMember> {
    return this.http
      .patch<WorkspaceMemberResponse>(`${this.apiUrl}/workspaces/${workspaceId}/members/${userId}`, { role })
      .pipe(
        map((member) => this.mapMember(member)),
        catchError((error) => throwError(() => toError(error, 'Unable to update member role.'))),
      );
  }

  removeMember(workspaceId: string, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/workspaces/${workspaceId}/members/${userId}`).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to remove member.'))),
    );
  }

  getPendingInvitations(workspaceId: string): Observable<Invitation[]> {
    return this.http.get<InvitationResponse[]>(`${this.apiUrl}/workspaces/${workspaceId}/invitations`).pipe(
      map((invitations) => invitations.map((invitation) => this.mapInvitation(invitation))),
      catchError((error) => throwError(() => toError(error, 'Unable to load invitations.'))),
    );
  }

  cancelInvitation(workspaceId: string, invitationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/workspaces/${workspaceId}/invitations/${invitationId}`).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to cancel invitation.'))),
    );
  }

  validateInvitation(token: string): Observable<InvitationValidation> {
    return this.http.get<InvitationValidationResponse>(`${this.apiUrl}/invitations/${token}`).pipe(
      map((response) => ({
        valid: response.valid,
        workspace: {
          id: String(response.workspace.id),
          name: response.workspace.name,
        },
        invitedBy: {
          email: response.invited_by?.email ?? '',
        },
        role: response.role,
      })),
      catchError((error) => throwError(() => toError(error, 'Unable to validate invitation.'))),
    );
  }

  acceptInvitation(token: string): Observable<{ workspaceId: string; role: WorkspaceRole }> {
    return this.http.post<AcceptInvitationResponse>(`${this.apiUrl}/invitations/${token}/accept`, {}).pipe(
      map((response) => ({
        workspaceId: String(response.workspace_id),
        role: response.role,
      })),
      catchError((error) => throwError(() => toError(error, 'Unable to accept invitation.'))),
    );
  }

  private mapMember(member: WorkspaceMemberResponse): WorkspaceMember {
    return {
      userId: member.user_id,
      email: member.email,
      role: member.role,
      joinedAt: new Date(member.joined_at),
    };
  }

  private mapInvitation(invitation: InvitationResponse): Invitation {
    return {
      id: String(invitation.id),
      email: invitation.email,
      role: invitation.role,
      token: invitation.token ?? '',
      expiresAt: new Date(invitation.expires_at),
      createdAt: new Date(invitation.created_at),
    };
  }
}
