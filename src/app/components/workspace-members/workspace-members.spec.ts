import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { WorkspaceMembersComponent } from './workspace-members';
import { WorkspaceMemberService } from '../../services/workspace-member.service';

describe('WorkspaceMembersComponent', () => {
  let component: WorkspaceMembersComponent;
  let fixture: ComponentFixture<WorkspaceMembersComponent>;
  let mockWorkspaceMemberService: jasmine.SpyObj<WorkspaceMemberService>;

  beforeEach(async () => {
    mockWorkspaceMemberService = jasmine.createSpyObj<WorkspaceMemberService>('WorkspaceMemberService', [
      'getMembers',
      'inviteMember',
      'updateRole',
      'removeMember',
      'getAllInvitations',
      'cancelInvitation',
      'resendInvitation'
    ]);

    mockWorkspaceMemberService.getMembers.and.returnValue(of([
      { userId: 1, email: 'owner@example.com', role: 'owner', joinedAt: new Date('2026-03-01T00:00:00Z') }
    ]));
    mockWorkspaceMemberService.getAllInvitations.and.returnValue(of([
      {
        id: 'invite-1',
        email: 'newhire@example.com',
        role: 'member',
        token: 'token-1',
        expiresAt: new Date('2026-04-01T00:00:00Z'),
        createdAt: new Date('2026-03-24T00:00:00Z'),
        acceptedAt: null
      },
      {
        id: 'invite-accepted',
        email: 'joined@example.com',
        role: 'viewer',
        token: 'token-accepted',
        expiresAt: new Date('2026-04-01T00:00:00Z'),
        createdAt: new Date('2026-03-20T00:00:00Z'),
        acceptedAt: new Date('2026-03-25T00:00:00Z')
      }
    ]));
    mockWorkspaceMemberService.inviteMember.and.returnValue(of({
      id: 'invite-2',
      email: 'invitee@example.com',
      role: 'viewer',
      token: 'token-2',
      expiresAt: new Date('2026-04-03T00:00:00Z'),
      createdAt: new Date('2026-03-24T00:00:00Z'),
      acceptedAt: null
    }));
    mockWorkspaceMemberService.updateRole.and.returnValue(of({
      userId: 2,
      email: 'member@example.com',
      role: 'viewer',
      joinedAt: new Date('2026-03-21T00:00:00Z')
    }));
    mockWorkspaceMemberService.removeMember.and.returnValue(of(void 0));
    mockWorkspaceMemberService.cancelInvitation.and.returnValue(of(void 0));
    mockWorkspaceMemberService.resendInvitation.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [WorkspaceMembersComponent],
      providers: [
        { provide: WorkspaceMemberService, useValue: mockWorkspaceMemberService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '1' })
            },
            pathFromRoot: [{
              snapshot: {
                paramMap: convertToParamMap({ id: '1' })
              }
            }]
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkspaceMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render members and invitations', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('owner@example.com');
    expect(compiled.textContent).toContain('newhire@example.com');
    expect(compiled.textContent).toContain('joined@example.com');
    expect(component.pendingInvitations.length).toBe(1);
    expect(component.acceptedInvitations.length).toBe(1);
  });

  it('should create invitation, reset the form, and reload invitations', () => {
    component.inviteEmail = 'invitee@example.com';
    component.inviteRole = 'viewer';
    mockWorkspaceMemberService.getAllInvitations.calls.reset();

    component.inviteMember();
    fixture.detectChanges();

    expect(mockWorkspaceMemberService.inviteMember).toHaveBeenCalledWith('1', 'invitee@example.com', 'viewer');
    expect(component.inviteSuccess).toBe('Invitation sent to invitee@example.com.');
    expect(component.inviteEmail).toBe('');
    expect(component.inviteRole).toBe('member');
    expect(component.isSubmittingInvite).toBeFalse();
    expect(mockWorkspaceMemberService.getAllInvitations).toHaveBeenCalledWith('1');
  });

  it('should show invitation errors', () => {
    mockWorkspaceMemberService.inviteMember.and.returnValue(throwError(() => new Error('Only workspace owners can invite members')));
    component.inviteEmail = 'invitee@example.com';

    component.inviteMember();
    fixture.detectChanges();

    expect(component.inviteError).toContain('Only workspace owners');
  });

  it('should resend an invitation and show row-level feedback', fakeAsync(() => {
    const invitation = component.pendingInvitations[0];

    component.resendInvitation(invitation);
    fixture.detectChanges();

    expect(mockWorkspaceMemberService.resendInvitation).toHaveBeenCalledWith('token-1');
    expect(component.getResendState('invite-1').success).toBe('Invitation resent to newhire@example.com.');

    tick(4000);

    expect(component.getResendState('invite-1').success).toBe('');
  }));

  it('should show row-level resend errors', () => {
    const invitation = component.pendingInvitations[0];
    mockWorkspaceMemberService.resendInvitation.and.returnValue(
      throwError(() => new Error('Unable to resend invitation.'))
    );

    component.resendInvitation(invitation);

    expect(component.getResendState('invite-1').error).toBe('Unable to resend invitation.');
  });
});
