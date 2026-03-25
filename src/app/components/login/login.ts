import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  activeTab: 'login' | 'register' = 'login';

  loginEmail = '';
  loginPassword = '';
  rememberMe = true;
  loginError = '';
  registerError = '';
  forgotError = '';

  regEmail = '';
  regPassword = '';

  forgotEmail = '';

  showForgot = false;
  showSuccess = false;
  successTitle = 'Check your email';
  successText = 'We sent you a verification link.';

  isDarkMode = false;
  isLoginSubmitting = false;
  isRegisterSubmitting = false;
  isForgotSubmitting = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.activeTab = this.router.url.startsWith('/signup') ? 'register' : 'login';
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.isDarkMode = storedTheme === 'dark' || (!storedTheme && prefersDark);
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.showForgot = false;
    this.showSuccess = false;
    this.loginError = '';
    this.registerError = '';
    this.router.navigate([tab === 'login' ? '/login' : '/signup']);
  }

  showForgotPassword(): void {
    this.showForgot = true;
    this.showSuccess = false;
    this.forgotError = '';
  }

  backToLogin(): void {
    this.switchTab('login');
  }

  handleLogin(): void {
    this.loginError = '';
    if (!this.loginEmail.trim() || !this.loginPassword.trim()) {
      this.loginError = 'Invalid credentials';
      return;
    }
    if (!this.isValidEmail(this.loginEmail)) {
      this.loginError = 'Enter a valid email address';
      return;
    }
    this.isLoginSubmitting = true;

    this.authService.login(this.loginEmail.trim(), this.loginPassword).pipe(
      timeout(8000),
      finalize(() => {
        this.isLoginSubmitting = false;
        this.syncView();
      })
    ).subscribe({
      next: () => {
        this.showSuccessMessage('Welcome back', 'Redirecting to your Decision Ledger...');
        this.syncView();
        setTimeout(() => this.router.navigate(['/dashboard']), 1200);
      },
      error: (err: unknown) => {
        const errorMessage = this.getErrorMessage(err);
        if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid credentials')) {
          this.loginError = 'Invalid credentials';
          this.syncView();
          return;
        }
        this.loginError = 'Sign in failed. Please try again.';
        this.syncView();
      }
    });
  }

  handleRegister(): void {
    if (!this.regEmail.trim() || !this.regPassword.trim()) {
      this.registerError = 'Invalid credentials';
      return;
    }
    if (!this.isValidEmail(this.regEmail)) {
      this.registerError = 'Enter a valid email address';
      return;
    }
    this.isRegisterSubmitting = true;
    this.registerError = '';

    this.authService.signup(this.regEmail.trim(), this.regPassword).pipe(
      timeout(8000),
      finalize(() => {
        this.isRegisterSubmitting = false;
        this.syncView();
      })
    ).subscribe({
      next: () => {
        this.regPassword = '';
        this.loginEmail = this.regEmail.trim();
        this.showForgot = false;
        this.loginError = '';
        this.registerError = '';
        this.showSuccessMessage(
          'Account is successfully created',
          'You will be redirected to login page shortly.'
        );
        this.syncView();
        setTimeout(() => {
          this.activeTab = 'login';
          this.showSuccess = false;
          this.router.navigate(['/login']);
          this.syncView();
        }, 1500);
      },
      error: (err: unknown) => {
        this.activeTab = 'register';
        this.showForgot = false;
        this.showSuccess = false;

        const errorMessage = this.getErrorMessage(err);
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          this.registerError = 'Email already exists';
          this.syncView();
          return;
        }
        this.registerError = 'Registration failed. Please try again.';
        this.syncView();
      }
    });
  }

  handleForgot(): void {
    this.forgotError = '';
    if (!this.isValidEmail(this.forgotEmail)) {
      this.forgotError = 'Enter a valid email address';
      return;
    }
    this.isForgotSubmitting = true;

    this.authService.resetPassword(this.forgotEmail.trim()).pipe(
      timeout(8000),
      finalize(() => {
        this.isForgotSubmitting = false;
        this.syncView();
      })
    ).subscribe({
      next: () => {
        this.showSuccessMessage('Check your email', 'We sent a password reset link.');
        this.syncView();
      },
      error: () => {
        this.forgotError = 'Unable to send reset link. Please try again.';
        this.syncView();
      }
    });
  }

  private showSuccessMessage(title: string, text: string): void {
    this.showForgot = false;
    this.showSuccess = true;
    this.successTitle = title;
    this.successText = text;
  }

  private applyTheme(): void {
    const root = this.document.documentElement;
    if (this.isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  get isRegisterDisabled(): boolean {
    return !this.regEmail.trim() || !this.regPassword || !this.isValidEmail(this.regEmail);
  }

  get isAuthFormVisible(): boolean {
    return !this.showForgot && !this.showSuccess;
  }

  get isLoginVisible(): boolean {
    return this.isAuthFormVisible && this.activeTab === 'login';
  }

  get isRegisterVisible(): boolean {
    return this.isAuthFormVisible && this.activeTab === 'register';
  }

  get hasGlobalError(): boolean {
    return !!this.loginError;
  }

  clearGlobalError(): void {
    this.loginError = '';
  }

  onLoginEmailInput(): void {
    this.clearGlobalError();
  }

  onLoginPasswordInput(): void {
    this.clearGlobalError();
  }

  onRegisterEmailInput(): void {
    this.registerError = '';
  }

  onRegisterPasswordInput(): void {
    this.registerError = '';
  }

  onForgotEmailInput(): void {
    this.forgotError = '';
  }

  private isValidEmail(email: string): boolean {
    return this.emailPattern.test(email.trim());
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message.toLowerCase();
    }

    return '';
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }

}
