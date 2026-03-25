import { TestBed } from '@angular/core/testing';
import { WorkspaceMemberService } from './workspace-member.service';
import { Invitation, WorkspaceMember } from '../models/workspace-member.model';

describe('WorkspaceMemberService', () => {
  let service: WorkspaceMemberService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkspaceMemberService);
  });

  it('returns members for a workspace', () => {
    let members: WorkspaceMember[] = [];

    service.getMembers('1').subscribe(result => {
      members = result;
    });

    expect(members.length).toBe(3);
    expect(members.map(member => member.email)).toContain('owner@example.com');
  });

  it('creates an invitation for a new member', () => {
    let invitation: Invitation | undefined;

    service.inviteMember('1', 'designer@example.com', 'viewer').subscribe(result => {
      invitation = result;
    });

    expect(invitation?.email).toBe('designer@example.com');

    let invitations: Invitation[] = [];
    service.getPendingInvitations('1').subscribe(result => {
      invitations = result;
    });

    expect(invitations.some(item => item.email === 'designer@example.com')).toBeTrue();
  });

  it('rejects duplicate invitations or existing members', () => {
    let errorMessage = '';

    service.inviteMember('1', 'owner@example.com', 'member').subscribe({
      next: () => fail('expected duplicate invite to fail'),
      error: error => {
        errorMessage = error.message;
      }
    });

    expect(errorMessage).toContain('already a member');
  });

  it('updates the role for a non-owner member', () => {
    let updatedRole = '';

    service.updateRole('1', 2, 'viewer').subscribe(result => {
      updatedRole = result.role;
    });

    expect(updatedRole).toBe('viewer');
  });

  it('rejects owner role changes', () => {
    let errorMessage = '';

    service.updateRole('1', 1, 'member').subscribe({
      next: () => fail('expected owner update to fail'),
      error: error => {
        errorMessage = error.message;
      }
    });

    expect(errorMessage).toContain("owner's role");
  });

  it('removes a non-owner member', () => {
    let members: WorkspaceMember[] = [];

    service.removeMember('1', 3).subscribe();
    service.getMembers('1').subscribe(result => {
      members = result;
    });

    expect(members.some(member => member.userId === 3)).toBeFalse();
  });

  it('rejects owner removal', () => {
    let errorMessage = '';

    service.removeMember('1', 1).subscribe({
      next: () => fail('expected owner removal to fail'),
      error: error => {
        errorMessage = error.message;
      }
    });

    expect(errorMessage).toContain('Cannot remove workspace owner');
  });

  it('validates an invitation token', () => {
    let role = '';

    service.validateInvitation('invite_token_member').subscribe(result => {
      role = result.role;
    });

    expect(role).toBe('member');
  });

  it('accepts a valid invitation for a new user', () => {
    let acceptedWorkspaceId = '';

    (service as any).currentUserEmail = 'newuser@example.com';

    service.acceptInvitation('invite_token_viewer').subscribe(result => {
      acceptedWorkspaceId = result.workspaceId;
    });

    expect(acceptedWorkspaceId).toBe('1');

    let members: WorkspaceMember[] = [];
    service.getMembers('1').subscribe(result => {
      members = result;
    });

    expect(members.some(member => member.email === 'newuser@example.com' && member.role === 'viewer')).toBeTrue();
  });
});
