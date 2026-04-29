import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, switchMap, timeout } from 'rxjs';
import { InvitationValidation } from '../../models/workspace-member.model';
import { AuthService } from '../../services/auth';
import { WorkspaceMemberService } from '../../services/workspace-member.service';

export type PageState =
  | 'loading'
  | 'auth-choice'
  | 'sign-in'
  | 'sign-up'
  | 'wrong-email'
  | 'join'
  | 'success'
  | 'error';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './accept-invitation.html',
  styleUrl: './accept-invitation.css'
})
export class AcceptInvitationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly workspaceMemberService = inject(WorkspaceMemberService);
  private readonly cdr = inject(ChangeDetectorRef);

  token = '';
  invitation?: InvitationValidation;

  state: PageState = 'loading';
  errorMessage = '';
  successMessage = '';

  // Sign-in form
  signInEmail = '';
  signInPassword = '';
  signInError = '';
  isSigningIn = false;

  // Sign-up form
  signUpFullName = '';
  signUpEmail = '';
  signUpPassword = '';
  signUpError = '';
  isSigningUp = false;

  // Join state
  isJoining = false;
  wrongEmailLoggedAs = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.workspaceMemberService.validateInvitation(this.token).subscribe({
      next: invitation => {
        this.invitation = invitation;
        this.determineState();
        this.cdr.detectChanges();
      },
      error: (error: Error) => {
        this.errorMessage = error.message || 'This invitation is invalid or has expired.';
        this.state = 'error';
        this.cdr.detectChanges();
      }
    });
  }

  private determineState(): void {
    if (!this.authService.isLoggedIn()) {
      // Pre-fill both forms with the invited email
      this.signInEmail = this.invitation?.email ?? '';
      this.signUpEmail = this.invitation?.email ?? '';
      this.state = 'auth-choice';
      return;
    }

    const currentEmail = this.authService.getCurrentUserEmail();
    const invitedEmail = this.invitation?.email ?? '';

    if (invitedEmail && currentEmail && currentEmail.toLowerCase() !== invitedEmail.toLowerCase()) {
      this.wrongEmailLoggedAs = currentEmail;
      this.state = 'wrong-email';
      return;
    }

    this.state = 'join';
  }

  showSignIn(): void {
    this.signInError = '';
    this.state = 'sign-in';
  }

  showSignUp(): void {
    this.signUpError = '';
    this.state = 'sign-up';
  }

  backToChoice(): void {
    this.state = 'auth-choice';
  }

  handleSignIn(): void {
    this.signInError = '';
    if (!this.signInEmail.trim() || !this.signInPassword.trim()) {
      this.signInError = 'Please enter your email and password.';
      return;
    }
    this.isSigningIn = true;
    this.authService.login(this.signInEmail.trim(), this.signInPassword).pipe(
      timeout(10000),
      finalize(() => { this.isSigningIn = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: () => {
        const currentEmail = this.authService.getCurrentUserEmail();
        const invitedEmail = this.invitation?.email ?? '';
        if (invitedEmail && currentEmail && currentEmail.toLowerCase() !== invitedEmail.toLowerCase()) {
          this.wrongEmailLoggedAs = currentEmail;
          this.state = 'wrong-email';
          this.cdr.detectChanges();
          return;
        }
        this.doAcceptInvitation();
      },
      error: () => {
        this.signInError = 'Invalid email or password. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  handleSignUp(): void {
    this.signUpError = '';
    if (!this.signUpFullName.trim() || !this.signUpEmail.trim() || !this.signUpPassword.trim()) {
      this.signUpError = 'Please fill in all required fields.';
      return;
    }
    if (this.signUpPassword.length < 8) {
      this.signUpError = 'Password must be at least 8 characters.';
      return;
    }
    const invitedEmail = this.invitation?.email ?? '';
    if (invitedEmail && this.signUpEmail.trim().toLowerCase() !== invitedEmail.toLowerCase()) {
      this.signUpError = `This invitation is for ${invitedEmail}. Please sign up with that email address.`;
      return;
    }

    this.isSigningUp = true;
    this.authService.signup(this.signUpEmail.trim(), this.signUpPassword, {
      fullName: this.signUpFullName.trim()
    }).pipe(
      timeout(10000),
      switchMap(() =>
        this.authService.login(this.signUpEmail.trim(), this.signUpPassword).pipe(timeout(10000))
      ),
      finalize(() => { this.isSigningUp = false; this.cdr.detectChanges(); })
    ).subscribe({
      next: () => {
        this.doAcceptInvitation();
      },
      error: (err: any) => {
        const msg = typeof err?.error === 'string' ? err.error.trim() : '';
        if (msg.toLowerCase().includes('already exists') || err?.status === 409) {
          this.signUpError = 'An account with this email already exists. Please sign in instead.';
        } else {
          this.signUpError = msg || 'Registration failed. Please try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  joinWorkspace(): void {
    this.doAcceptInvitation();
  }

  private doAcceptInvitation(): void {
    this.isJoining = true;
    this.state = 'join';
    this.cdr.detectChanges();
    this.workspaceMemberService.acceptInvitation(this.token).subscribe({
      next: response => {
        this.isJoining = false;
        this.successMessage = `You joined the workspace as ${response.role}.`;
        this.state = 'success';
        this.cdr.detectChanges();
        setTimeout(() => {
          this.router.navigate(['/workspaces', response.workspaceId, 'decisions']);
        }, 1200);
      },
      error: (error: Error) => {
        this.isJoining = false;
        this.errorMessage = error.message;
        this.state = 'error';
        this.cdr.detectChanges();
      }
    });
  }

  get invitedEmail(): string {
    return this.invitation?.email ?? '';
  }
}
