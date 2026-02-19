import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
  activeTab: 'login' | 'register' = 'login';

  loginEmail = '';
  loginPassword = '';
  rememberMe = true;
  loginError = '';
  registerError = '';

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
      error: (err: HttpErrorResponse) => {
        const backendMessage = typeof err.error === 'string' ? err.error.toLowerCase() : '';
        if (err.status === 401 || backendMessage.includes('invalid credentials')) {
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
      error: (err: HttpErrorResponse) => {
        this.activeTab = 'register';
        this.showForgot = false;
        this.showSuccess = false;

        const backendMessage = typeof err.error === 'string' ? err.error.toLowerCase() : '';
        if (err.status === 409 || backendMessage.includes('already exists')) {
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
    this.isForgotSubmitting = true;
    setTimeout(() => {
      this.isForgotSubmitting = false;
      this.showSuccessMessage('Check your email', 'We sent a password reset link.');
    }, 1200);
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
    return !this.regEmail.trim() || !this.regPassword;
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
    this.clearGlobalError();
  }

  private syncView(): void {
    this.cdr.detectChanges();
  }

}
