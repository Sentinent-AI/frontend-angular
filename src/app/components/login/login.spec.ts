import { DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Session } from '@supabase/supabase-js';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../../services/auth';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let router: Router;
  let document: Document;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'signup', 'resetPassword']);

    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem');
    spyOn(window, 'matchMedia').and.returnValue({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    });

    await TestBed.configureTestingModule({
      imports: [Login, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    document = TestBed.inject(DOCUMENT);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('initializes in login mode by default', () => {
    expect(component.activeTab).toBe('login');
    expect(component.isLoginVisible).toBeTrue();
  });

  it('switches to the register tab and navigates', () => {
    spyOn(router, 'navigate');

    component.switchTab('register');

    expect(component.activeTab).toBe('register');
    expect(router.navigate).toHaveBeenCalledWith(['/signup']);
  });

  it('toggles the theme and stores the selection', () => {
    component.toggleTheme();

    expect(component.isDarkMode).toBeTrue();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('shows an error when login credentials are missing', () => {
    component.loginEmail = ' ';
    component.loginPassword = '';

    component.handleLogin();

    expect(component.loginError).toBe('Invalid credentials');
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('rejects login when the email format is invalid', () => {
    component.loginEmail = 'invalid-email';
    component.loginPassword = 'secret';

    component.handleLogin();

    expect(component.loginError).toBe('Enter a valid email address');
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it('shows a success message and redirects after login', fakeAsync(() => {
    spyOn(router, 'navigate');
    const session = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      expires_at: 9999999999,
      token_type: 'bearer',
      user: {
        id: 'user-1',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-03-25T00:00:00.000Z'
      }
    } as Session;
    mockAuthService.login.and.returnValue(of(session));
    component.loginEmail = 'user@example.com';
    component.loginPassword = 'secret';

    component.handleLogin();
    tick(1200);

    expect(mockAuthService.login).toHaveBeenCalledWith('user@example.com', 'secret');
    expect(component.showSuccess).toBeTrue();
    expect(component.successTitle).toBe('Welcome back');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('maps a 401 login response to invalid credentials', () => {
    mockAuthService.login.and.returnValue(
      throwError(() => new Error('Invalid login credentials'))
    );
    component.loginEmail = 'user@example.com';
    component.loginPassword = 'wrong';

    component.handleLogin();

    expect(component.loginError).toBe('Invalid credentials');
    expect(component.isLoginSubmitting).toBeFalse();
  });

  it('prevents register submission when fields are missing', () => {
    component.regEmail = '';
    component.regPassword = '';

    component.handleRegister();

    expect(component.registerError).toBe('Invalid credentials');
    expect(mockAuthService.signup).not.toHaveBeenCalled();
  });

  it('rejects registration when the email format is invalid', () => {
    component.activeTab = 'register';
    component.regEmail = 'invalid-email';
    component.regPassword = 'secret';

    component.handleRegister();

    expect(component.registerError).toBe('Enter a valid email address');
    expect(mockAuthService.signup).not.toHaveBeenCalled();
  });

  it('disables registration when the email format is invalid', () => {
    component.regEmail = 'invalid-email';
    component.regPassword = 'secret';

    expect(component.isRegisterDisabled).toBeTrue();
  });

  it('shows a duplicate email message when signup returns a conflict', () => {
    mockAuthService.signup.and.returnValue(
      throwError(() => new Error('User already registered'))
    );
    component.activeTab = 'register';
    component.regEmail = 'user@example.com';
    component.regPassword = 'secret';

    component.handleRegister();

    expect(component.registerError).toBe('Email already exists');
    expect(component.activeTab).toBe('register');
  });

  it('returns to login after a successful registration', fakeAsync(() => {
    spyOn(router, 'navigate');
    mockAuthService.signup.and.returnValue(of(void 0));
    component.activeTab = 'register';
    component.regEmail = 'new@example.com';
    component.regPassword = 'secret';

    component.handleRegister();
    tick(1500);

    expect(component.loginEmail).toBe('new@example.com');
    expect(component.activeTab).toBe('login');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('rejects forgot-password submission when the email format is invalid', () => {
    component.showForgotPassword();
    component.forgotEmail = 'invalid-email';

    component.handleForgot();

    expect(component.forgotError).toBe('Enter a valid email address');
    expect(component.isForgotSubmitting).toBeFalse();
  });

  it('shows a success message after a password reset request', () => {
    mockAuthService.resetPassword.and.returnValue(of(void 0));
    component.showForgotPassword();
    component.forgotEmail = 'user@example.com';

    component.handleForgot();

    expect(mockAuthService.resetPassword).toHaveBeenCalledWith('user@example.com');
    expect(component.showSuccess).toBeTrue();
    expect(component.successTitle).toBe('Check your email');
  });

  it('shows an error when the password reset request fails', () => {
    mockAuthService.resetPassword.and.returnValue(throwError(() => new Error('Reset failed')));
    component.showForgotPassword();
    component.forgotEmail = 'user@example.com';

    component.handleForgot();

    expect(component.forgotError).toBe('Unable to send reset link. Please try again.');
    expect(component.isForgotSubmitting).toBeFalse();
  });
});
