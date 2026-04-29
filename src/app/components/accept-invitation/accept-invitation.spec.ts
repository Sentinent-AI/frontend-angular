import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AcceptInvitationComponent } from './accept-invitation';
import { AuthService } from '../../services/auth';
import { WorkspaceMemberService } from '../../services/workspace-member.service';
import { InvitationValidation } from '../../models/workspace-member.model';

describe('AcceptInvitationComponent', () => {
  let component: AcceptInvitationComponent;
  let fixture: ComponentFixture<AcceptInvitationComponent>;
  let mockWorkspaceMemberService: jasmine.SpyObj<WorkspaceMemberService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockWorkspaceMemberService = jasmine.createSpyObj<WorkspaceMemberService>('WorkspaceMemberService', [
      'validateInvitation',
      'acceptInvitation'
    ]);
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', [
      'isLoggedIn',
      'getCurrentUserEmail',
      'login',
      'signup'
    ]);

    const invitation: InvitationValidation = {
      valid: true,
      email: 'invitee@example.com',
      workspace: { id: '1', name: 'Engineering' },
      invitedBy: { email: 'owner@example.com' },
      role: 'member'
    };

    mockWorkspaceMemberService.validateInvitation.and.returnValue(of(invitation));
    mockWorkspaceMemberService.acceptInvitation.and.returnValue(of({ workspaceId: '1', role: 'member' }));
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.getCurrentUserEmail.and.returnValue('invitee@example.com');
    mockAuthService.login.and.returnValue(of({ token: 'jwt-token' }));
    mockAuthService.signup.and.returnValue(of(void 0));

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

  it('should show inline auth choices and prefill the invited email when not authenticated', () => {
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockWorkspaceMemberService.acceptInvitation.calls.reset();

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.state).toBe('auth-choice');
    expect(component.signInEmail).toBe('invitee@example.com');
    expect(component.signUpEmail).toBe('invitee@example.com');
    expect(mockWorkspaceMemberService.acceptInvitation).not.toHaveBeenCalled();
  });

  it('should auto-accept after successful inline sign in', () => {
    component.state = 'sign-in';
    component.signInEmail = 'invitee@example.com';
    component.signInPassword = 'correct-password';

    component.handleSignIn();

    expect(mockAuthService.login).toHaveBeenCalledWith('invitee@example.com', 'correct-password');
    expect(mockWorkspaceMemberService.acceptInvitation).toHaveBeenCalledWith('token-1');
  });

  it('should block accepting when the signed-in email does not match the invitation', () => {
    mockAuthService.getCurrentUserEmail.and.returnValue('other@example.com');
    mockWorkspaceMemberService.acceptInvitation.calls.reset();

    component.ngOnInit();

    expect(component.state).toBe('wrong-email');
    expect(component.wrongEmailLoggedAs).toBe('other@example.com');
    expect(mockWorkspaceMemberService.acceptInvitation).not.toHaveBeenCalled();
  });

  it('should sign up, log in, and auto-accept with the invited email', () => {
    component.state = 'sign-up';
    component.signUpFullName = 'Invitee User';
    component.signUpEmail = 'invitee@example.com';
    component.signUpPassword = 'long-password';

    component.handleSignUp();

    expect(mockAuthService.signup).toHaveBeenCalledWith('invitee@example.com', 'long-password', {
      fullName: 'Invitee User'
    });
    expect(mockAuthService.login).toHaveBeenCalledWith('invitee@example.com', 'long-password');
    expect(mockWorkspaceMemberService.acceptInvitation).toHaveBeenCalledWith('token-1');
  });

  it('should reject sign up with a different email than the invited address', () => {
    component.state = 'sign-up';
    component.signUpFullName = 'Invitee User';
    component.signUpEmail = 'wrong@example.com';
    component.signUpPassword = 'long-password';

    component.handleSignUp();

    expect(component.signUpError).toContain('invitee@example.com');
    expect(mockAuthService.signup).not.toHaveBeenCalled();
  });
});
