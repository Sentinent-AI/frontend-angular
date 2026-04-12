import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ResetPasswordComponent } from './reset-password';
import { AuthService } from '../../services/auth';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', [
      'validatePasswordResetToken',
      'resetPassword',
    ]);

    mockAuthService.validatePasswordResetToken.and.returnValue(of({
      valid: true,
      email: 'user@example.com',
    }));
    mockAuthService.resetPassword.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ token: 'reset-token' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('validates the reset token on init', () => {
    expect(mockAuthService.validatePasswordResetToken).toHaveBeenCalledWith('reset-token');
    expect(component.isTokenValid).toBeTrue();
    expect(component.email).toBe('user@example.com');
  });

  it('shows an error when passwords do not match', () => {
    component.password = 'password123';
    component.confirmPassword = 'password321';

    component.submit();

    expect(component.errorMessage).toBe('Passwords do not match.');
    expect(mockAuthService.resetPassword).not.toHaveBeenCalled();
  });

  it('submits a new password and redirects to login', fakeAsync(() => {
    spyOn(router, 'navigate');
    component.password = 'password123';
    component.confirmPassword = 'password123';

    component.submit();
    tick(1200);

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith('reset-token', 'password123');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('shows an error when the reset token is invalid', async () => {
    mockAuthService.validatePasswordResetToken.and.returnValue(
      throwError(() => new Error('Reset link is invalid or expired.')),
    );

    const invalidFixture = TestBed.createComponent(ResetPasswordComponent);
    invalidFixture.detectChanges();
    await invalidFixture.whenStable();

    expect(invalidFixture.componentInstance.errorMessage).toContain('invalid');
  });
});
