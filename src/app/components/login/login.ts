import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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

  regName = '';
  regEmail = '';
  regPassword = '';
  regTerms = false;
  regEmailHasPersonalDomain = false;

  forgotEmail = '';
  ssoDomain = '';

  showForgot = false;
  showSSO = false;
  showSuccess = false;
  successTitle = 'Check your email';
  successText = 'We sent you a verification link.';

  isDarkMode = false;
  isOAuthLoading = false;
  isLoginSubmitting = false;
  isRegisterSubmitting = false;
  isForgotSubmitting = false;
  isSSOSubmitting = false;

  passwordStrength = 0;
  passwordHint = 'Use 8+ characters with mixed case, numbers, and symbols';
  passwordStrengthClass = 'weak';

  private readonly personalDomains = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com']);

  private authService = inject(AuthService);
  private router = inject(Router);
  private document = inject(DOCUMENT);

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
    this.showSSO = false;
    this.showSuccess = false;
    this.loginError = '';
    this.router.navigate([tab === 'login' ? '/login' : '/signup']);
  }

  showForgotPassword(): void {
    this.showForgot = true;
    this.showSSO = false;
    this.showSuccess = false;
  }

  showSSOForm(): void {
    this.showForgot = false;
    this.showSSO = true;
    this.showSuccess = false;
  }

  backToLogin(): void {
    this.switchTab('login');
  }

  handleOAuth(provider: 'google'): void {
    this.isOAuthLoading = true;
    setTimeout(() => {
      this.isOAuthLoading = false;
      this.showSuccessMessage('Connected!', `Redirecting to ${provider}...`);
    }, 1200);
  }

  handleLogin(): void {
    this.loginError = '';
    this.isLoginSubmitting = true;

    this.authService.login(this.loginEmail.trim(), this.loginPassword).subscribe({
      next: () => {
        this.showSuccessMessage('Welcome back', 'Redirecting to your Decision Ledger...');
        setTimeout(() => this.router.navigate(['/dashboard']), 1200);
      },
      error: () => {
        this.loginError = 'Invalid credentials.';
        this.isLoginSubmitting = false;
      }
    });
  }

  handleRegister(): void {
    this.isRegisterSubmitting = true;
    this.loginError = '';

    this.authService.signup(this.regEmail.trim(), this.regPassword).subscribe({
      next: () => {
        this.showSuccessMessage('Account created!', 'Please check your email to verify your account.');
        this.isRegisterSubmitting = false;
      },
      error: () => {
        this.loginError = 'Registration failed. Email might already be taken.';
        this.isRegisterSubmitting = false;
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

  handleSSO(): void {
    this.isSSOSubmitting = true;
    const domain = this.ssoDomain.trim();
    setTimeout(() => {
      this.isSSOSubmitting = false;
      this.showSuccessMessage('Redirecting...', `Connecting to ${domain}.sentinent.io identity provider.`);
    }, 1200);
  }

  checkPasswordStrength(password: string): void {
    let score = 0;

    if (password.length > 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    this.passwordStrength = (score / 4) * 100;

    if (score < 2) {
      this.passwordStrengthClass = 'weak';
      this.passwordHint = 'Weak password';
      return;
    }
    if (score < 4) {
      this.passwordStrengthClass = 'good';
      this.passwordHint = 'Good, but could be stronger';
      return;
    }

    this.passwordStrengthClass = 'strong';
    this.passwordHint = 'Strong password';
  }

  validateEnterpriseEmail(): void {
    const domain = this.regEmail.split('@')[1]?.toLowerCase();
    this.regEmailHasPersonalDomain = !!domain && this.personalDomains.has(domain);
  }

  private showSuccessMessage(title: string, text: string): void {
    this.showForgot = false;
    this.showSSO = false;
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
    return !this.regName.trim() || !this.regEmail.trim() || !this.regPassword || !this.regTerms || this.regEmailHasPersonalDomain;
  }

  get isAuthFormVisible(): boolean {
    return !this.showForgot && !this.showSSO && !this.showSuccess;
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
    this.clearGlobalError();
    this.validateEnterpriseEmail();
  }

  onRegisterPasswordInput(): void {
    this.clearGlobalError();
    this.checkPasswordStrength(this.regPassword);
  }

  onRegisterNameInput(): void {
    this.clearGlobalError();
  }

  onRegisterTermsChange(): void {
    this.clearGlobalError();
  }

  onForgotEmailInput(): void {
    this.clearGlobalError();
  }

  onSSODomainInput(): void {
    this.clearGlobalError();
  }
}
