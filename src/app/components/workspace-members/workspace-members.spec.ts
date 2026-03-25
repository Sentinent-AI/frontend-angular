import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      'getPendingInvitations',
      'cancelInvitation'
    ]);

    mockWorkspaceMemberService.getMembers.and.returnValue(of([
      { userId: 1, email: 'owner@example.com', role: 'owner', joinedAt: new Date('2026-03-01T00:00:00Z') }
    ]));
    mockWorkspaceMemberService.getPendingInvitations.and.returnValue(of([
      {
        id: 'invite-1',
        email: 'newhire@example.com',
        role: 'member',
        token: 'token-1',
        expiresAt: new Date('2026-04-01T00:00:00Z'),
        createdAt: new Date('2026-03-24T00:00:00Z')
      }
    ]));
    mockWorkspaceMemberService.inviteMember.and.returnValue(of({
      id: 'invite-2',
      email: 'invitee@example.com',
      role: 'viewer',
      token: 'token-2',
      expiresAt: new Date('2026-04-03T00:00:00Z'),
      createdAt: new Date('2026-03-24T00:00:00Z')
    }));
    mockWorkspaceMemberService.updateRole.and.returnValue(of({
      userId: 2,
      email: 'member@example.com',
      role: 'viewer',
      joinedAt: new Date('2026-03-21T00:00:00Z')
    }));
    mockWorkspaceMemberService.removeMember.and.returnValue(of(void 0));
    mockWorkspaceMemberService.cancelInvitation.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [WorkspaceMembersComponent],
      providers: [
        { provide: WorkspaceMemberService, useValue: mockWorkspaceMemberService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '1' })
            }
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
  });

  it('should create invitation and show generated link', () => {
    component.inviteEmail = 'invitee@example.com';
    component.inviteRole = 'viewer';

    component.inviteMember();
    fixture.detectChanges();

    expect(mockWorkspaceMemberService.inviteMember).toHaveBeenCalled();
    expect(component.invitationLink).toContain('/invitations/token-2');
  });

  it('should show invitation errors', () => {
    mockWorkspaceMemberService.inviteMember.and.returnValue(throwError(() => new Error('Only workspace owners can invite members')));
    component.inviteEmail = 'invitee@example.com';

    component.inviteMember();
    fixture.detectChanges();

    expect(component.inviteError).toContain('Only workspace owners');
  });
});
