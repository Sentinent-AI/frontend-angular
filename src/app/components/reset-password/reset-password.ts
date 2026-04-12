import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPasswordComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  token = '';
  email = '';
  password = '';
  confirmPassword = '';
  errorMessage = '';
  successMessage = '';
  isLoading = true;
  isSubmitting = false;
  isTokenValid = false;

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!this.token) {
      this.errorMessage = 'Reset link is invalid.';
      this.isLoading = false;
      return;
    }

    this.authService.validatePasswordResetToken(this.token).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (response) => {
        this.isTokenValid = response.valid;
        this.email = response.email;
      },
      error: (error: Error) => {
        this.errorMessage = error.message || 'Reset link is invalid or expired.';
      }
    });
  }

  submit(): void {
    this.errorMessage = '';

    if (this.password.trim().length < 8) {
      this.errorMessage = 'Password must be at least 8 characters.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isSubmitting = true;
    this.authService.resetPassword(this.token, this.password).pipe(
      finalize(() => {
        this.isSubmitting = false;
      })
    ).subscribe({
      next: () => {
        this.successMessage = 'Password updated successfully. Redirecting to sign in...';
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (error: Error) => {
        this.errorMessage = error.message || 'Could not reset your password.';
      }
    });
  }
}
