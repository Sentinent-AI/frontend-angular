import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, throwError, timeout } from 'rxjs';
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
  accepted_at: string | null;
}

interface InvitationValidationResponse {
  valid: boolean;
  email: string;
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
      map((members) => members.map((m) => this.mapMember(m))),
      catchError((error) => throwError(() => toError(error, 'Unable to load workspace members.'))),
    );
  }

  inviteMember(workspaceId: string, email: string, role: InvitationRole): Observable<Invitation> {
    return this.http
      .post<InvitationResponse>(`${this.apiUrl}/workspaces/${workspaceId}/invitations`, { email, role })
      .pipe(
        timeout(20000),
        map((inv) => this.mapInvitation(inv)),
        catchError((error) => throwError(() => toError(error, 'Unable to create invitation.'))),
      );
  }

  updateRole(workspaceId: string, userId: number, role: WorkspaceRole): Observable<WorkspaceMember> {
    return this.http
      .patch<WorkspaceMemberResponse>(`${this.apiUrl}/workspaces/${workspaceId}/members/${userId}`, { role })
      .pipe(
        map((m) => this.mapMember(m)),
        catchError((error) => throwError(() => toError(error, 'Unable to update member role.'))),
      );
  }

  removeMember(workspaceId: string, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/workspaces/${workspaceId}/members/${userId}`).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to remove member.'))),
    );
  }

  getAllInvitations(workspaceId: string): Observable<Invitation[]> {
    return this.http.get<InvitationResponse[]>(`${this.apiUrl}/workspaces/${workspaceId}/invitations`).pipe(
      map((invitations) => invitations.map((inv) => this.mapInvitation(inv))),
      catchError((error) => throwError(() => toError(error, 'Unable to load invitations.'))),
    );
  }

  /** @deprecated Use getAllInvitations */
  getPendingInvitations(workspaceId: string): Observable<Invitation[]> {
    return this.getAllInvitations(workspaceId);
  }

  cancelInvitation(workspaceId: string, invitationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/workspaces/${workspaceId}/invitations/${invitationId}`).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to cancel invitation.'))),
    );
  }

  resendInvitation(token: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/invitations/${token}/resend`, {}).pipe(
      timeout(15000),
      catchError((error) => throwError(() => toError(error, 'Unable to resend invitation.'))),
    );
  }

  validateInvitation(token: string): Observable<InvitationValidation> {
    return this.http.get<InvitationValidationResponse>(`${this.apiUrl}/invitations/${token}`).pipe(
      map((response) => ({
        valid: response.valid,
        email: response.email,
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

  private mapInvitation(inv: InvitationResponse): Invitation {
    return {
      id: String(inv.id),
      email: inv.email,
      role: inv.role,
      token: inv.token ?? '',
      expiresAt: new Date(inv.expires_at),
      createdAt: new Date(inv.created_at),
      acceptedAt: inv.accepted_at ? new Date(inv.accepted_at) : null,
    };
  }
}
