import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WorkspaceMemberService } from './workspace-member.service';

describe('WorkspaceMemberService', () => {
  let service: WorkspaceMemberService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WorkspaceMemberService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(WorkspaceMemberService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps workspace members from the backend response', () => {
    let members: Array<{ userId: number; joinedAt: Date }> = [];

    service.getMembers('1').subscribe((result) => {
      members = result;
    });

    const request = httpMock.expectOne('/api/workspaces/1/members');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        user_id: 2,
        email: 'member@example.com',
        role: 'member',
        joined_at: '2026-03-20T00:00:00Z',
      },
    ]);

    expect(members.length).toBe(1);
    expect(members[0].userId).toBe(2);
    expect(members[0].joinedAt instanceof Date).toBeTrue();
  });

  it('creates an invitation and maps acceptedAt as null for pending invites', () => {
    let invitationToken = '';
    let acceptedAt: Date | null = new Date();

    service.inviteMember('1', 'designer@example.com', 'viewer').subscribe((result) => {
      invitationToken = result.token;
      acceptedAt = result.acceptedAt;
    });

    const request = httpMock.expectOne('/api/workspaces/1/invitations');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'designer@example.com',
      role: 'viewer',
    });
    request.flush({
      id: 7,
      email: 'designer@example.com',
      token: 'invite-token',
      role: 'viewer',
      expires_at: '2026-04-01T00:00:00Z',
      created_at: '2026-03-24T00:00:00Z',
      accepted_at: null,
    });

    expect(invitationToken).toBe('invite-token');
    expect(acceptedAt).toBeNull();
  });

  it('loads all invitations and maps accepted timestamps', () => {
    let acceptedAt: unknown = null;

    service.getAllInvitations('1').subscribe((result) => {
      acceptedAt = result[0].acceptedAt;
    });

    const request = httpMock.expectOne('/api/workspaces/1/invitations');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 8,
        email: 'joined@example.com',
        token: 'accepted-token',
        role: 'member',
        expires_at: '2026-04-01T00:00:00Z',
        created_at: '2026-03-24T00:00:00Z',
        accepted_at: '2026-03-25T00:00:00Z',
      },
    ]);

    expect(acceptedAt instanceof Date).toBeTrue();
  });

  it('resends invitations by token', () => {
    let completed = false;

    service.resendInvitation('invite-token').subscribe(() => {
      completed = true;
    });

    const request = httpMock.expectOne('/api/invitations/invite-token/resend');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({});

    expect(completed).toBeTrue();
  });

  it('maps invitation validation into the frontend shape', () => {
    let invitedBy = '';
    let invitedEmail = '';

    service.validateInvitation('invite-token').subscribe((result) => {
      invitedBy = result.invitedBy.email;
      invitedEmail = result.email;
    });

    const request = httpMock.expectOne('/api/invitations/invite-token');
    expect(request.request.method).toBe('GET');
    request.flush({
      valid: true,
      email: 'invitee@example.com',
      workspace: {
        id: 1,
        name: 'Engineering',
      },
      invited_by: {
        email: 'owner@example.com',
      },
      role: 'member',
    });

    expect(invitedBy).toBe('owner@example.com');
    expect(invitedEmail).toBe('invitee@example.com');
  });

  it('maps accepted invitations back to the workspace route id', () => {
    let workspaceId = '';

    service.acceptInvitation('invite-token').subscribe((result) => {
      workspaceId = result.workspaceId;
    });

    const request = httpMock.expectOne('/api/invitations/invite-token/accept');
    expect(request.request.method).toBe('POST');
    request.flush({
      workspace_id: 12,
      role: 'viewer',
    });

    expect(workspaceId).toBe('12');
  });
});
