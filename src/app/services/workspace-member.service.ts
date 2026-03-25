import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Invitation, InvitationRole, InvitationValidation, WorkspaceMember, WorkspaceRole } from '../models/workspace-member.model';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceMemberService {
  private membersByWorkspace: Record<string, WorkspaceMember[]> = {
    '1': [
      { userId: 1, email: 'owner@example.com', role: 'owner', joinedAt: new Date('2026-03-01T00:00:00Z') },
      { userId: 2, email: 'member@example.com', role: 'member', joinedAt: new Date('2026-03-20T00:00:00Z') },
      { userId: 3, email: 'viewer@example.com', role: 'viewer', joinedAt: new Date('2026-03-21T00:00:00Z') }
    ]
  };

  private invitationsByWorkspace: Record<string, Invitation[]> = {
    '1': [
      {
        id: 'invite-1',
        email: 'newhire@example.com',
        role: 'member',
        token: 'invite_token_member',
        expiresAt: new Date('2026-04-01T00:00:00Z'),
        createdAt: new Date('2026-03-23T00:00:00Z')
      },
      {
        id: 'invite-2',
        email: 'observer@example.com',
        role: 'viewer',
        token: 'invite_token_viewer',
        expiresAt: new Date('2026-04-03T00:00:00Z'),
        createdAt: new Date('2026-03-24T00:00:00Z')
      }
    ]
  };

  private currentUserEmail = 'owner@example.com';

  getMembers(workspaceId: string): Observable<WorkspaceMember[]> {
    return of([...(this.membersByWorkspace[workspaceId] ?? [])]);
  }

  inviteMember(workspaceId: string, email: string, role: InvitationRole): Observable<Invitation> {
    const existingMember = (this.membersByWorkspace[workspaceId] ?? []).find(member => member.email.toLowerCase() === email.toLowerCase());
    const existingInvitation = (this.invitationsByWorkspace[workspaceId] ?? []).find(invitation => invitation.email.toLowerCase() === email.toLowerCase());

    if (existingMember || existingInvitation) {
      return throwError(() => new Error('User is already a member or has pending invitation'));
    }

    const invitation: Invitation = {
      id: `invite-${Date.now()}`,
      email,
      role,
      token: `token-${Date.now()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };

    this.invitationsByWorkspace[workspaceId] = [...(this.invitationsByWorkspace[workspaceId] ?? []), invitation];
    return of(invitation);
  }

  updateRole(workspaceId: string, userId: number, role: WorkspaceRole): Observable<WorkspaceMember> {
    const members = this.membersByWorkspace[workspaceId] ?? [];
    const targetMember = members.find(member => member.userId === userId);

    if (!targetMember) {
      return throwError(() => new Error('Member not found'));
    }

    if (targetMember.role === 'owner') {
      return throwError(() => new Error("Cannot modify owner's role"));
    }

    const updatedMember = { ...targetMember, role };
    this.membersByWorkspace[workspaceId] = members.map(member => member.userId === userId ? updatedMember : member);
    return of(updatedMember);
  }

  removeMember(workspaceId: string, userId: number): Observable<void> {
    const members = this.membersByWorkspace[workspaceId] ?? [];
    const targetMember = members.find(member => member.userId === userId);

    if (targetMember?.role === 'owner') {
      return throwError(() => new Error('Cannot remove workspace owner'));
    }

    this.membersByWorkspace[workspaceId] = members.filter(member => member.userId !== userId);
    return of(void 0);
  }

  getPendingInvitations(workspaceId: string): Observable<Invitation[]> {
    return of([...(this.invitationsByWorkspace[workspaceId] ?? [])]);
  }

  cancelInvitation(workspaceId: string, invitationId: string): Observable<void> {
    this.invitationsByWorkspace[workspaceId] = (this.invitationsByWorkspace[workspaceId] ?? []).filter(invitation => invitation.id !== invitationId);
    return of(void 0);
  }

  validateInvitation(token: string): Observable<InvitationValidation> {
    const invitation = this.findInvitationByToken(token);

    if (!invitation) {
      return throwError(() => new Error('Invitation expired or invalid'));
    }

    return of({
      valid: true,
      workspace: {
        id: '1',
        name: 'Engineering'
      },
      invitedBy: {
        email: 'owner@example.com'
      },
      role: invitation.role
    });
  }

  acceptInvitation(token: string): Observable<{ workspaceId: string; role: WorkspaceRole }> {
    const invitation = this.findInvitationByToken(token);

    if (!invitation) {
      return throwError(() => new Error('Invitation expired or invalid'));
    }

    const workspaceId = '1';
    const members = this.membersByWorkspace[workspaceId] ?? [];

    if (members.some(member => member.email.toLowerCase() === this.currentUserEmail.toLowerCase())) {
      return throwError(() => new Error('You are already a member of this workspace'));
    }

    const nextUserId = members.reduce((highest, member) => Math.max(highest, member.userId), 0) + 1;
    const memberRole: WorkspaceRole = invitation.role === 'viewer' ? 'viewer' : 'member';

    this.membersByWorkspace[workspaceId] = [
      ...members,
      {
        userId: nextUserId,
        email: this.currentUserEmail,
        role: memberRole,
        joinedAt: new Date()
      }
    ];

    this.invitationsByWorkspace[workspaceId] = (this.invitationsByWorkspace[workspaceId] ?? []).filter(item => item.token !== token);

    return of({ workspaceId, role: memberRole });
  }

  private findInvitationByToken(token: string): Invitation | undefined {
    return Object.values(this.invitationsByWorkspace).flat().find(invitation => invitation.token === token);
  }
}
