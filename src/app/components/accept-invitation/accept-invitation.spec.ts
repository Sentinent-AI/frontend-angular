import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AcceptInvitationComponent } from './accept-invitation';
import { AuthService } from '../../services/auth';
import { WorkspaceMemberService } from '../../services/workspace-member.service';

describe('AcceptInvitationComponent', () => {
  let component: AcceptInvitationComponent;
  let fixture: ComponentFixture<AcceptInvitationComponent>;
  let mockWorkspaceMemberService: jasmine.SpyObj<WorkspaceMemberService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    mockWorkspaceMemberService = jasmine.createSpyObj<WorkspaceMemberService>('WorkspaceMemberService', [
      'validateInvitation',
      'acceptInvitation'
    ]);
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn']);

    mockWorkspaceMemberService.validateInvitation.and.returnValue(of({
      valid: true,
      workspace: { id: '1', name: 'Engineering' },
      invitedBy: { email: 'owner@example.com' },
      role: 'member'
    }));
    mockWorkspaceMemberService.acceptInvitation.and.returnValue(of({ workspaceId: '1', role: 'member' }));
    mockAuthService.isLoggedIn.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [AcceptInvitationComponent, RouterTestingModule],
      providers: [
        { provide: WorkspaceMemberService, useValue: mockWorkspaceMemberService },
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ token: 'token-1' })
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AcceptInvitationComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should render invitation details', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Join Engineering');
    expect(compiled.textContent).toContain('owner@example.com');
  });

  it('should accept invitation when authenticated', () => {
    component.joinWorkspace();

    expect(mockWorkspaceMemberService.acceptInvitation).toHaveBeenCalledWith('token-1');
  });

  it('should redirect to login when not authenticated', () => {
    spyOn(router, 'navigate');
    mockAuthService.isLoggedIn.and.returnValue(of(false));

    component.joinWorkspace();

    expect(router.navigate).toHaveBeenCalled();
  });
});
