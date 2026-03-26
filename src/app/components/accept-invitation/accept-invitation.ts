import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InvitationValidation } from '../../models/workspace-member.model';
import { AuthService } from '../../services/auth';
import { WorkspaceMemberService } from '../../services/workspace-member.service';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './accept-invitation.html',
  styleUrl: './accept-invitation.css'
})
export class AcceptInvitationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly workspaceMemberService = inject(WorkspaceMemberService);

  token = '';
  invitation?: InvitationValidation;
  error = '';
  success = '';
  isSubmitting = false;

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.workspaceMemberService.validateInvitation(this.token).subscribe({
      next: invitation => {
        this.invitation = invitation;
      },
      error: (error: Error) => {
        this.error = error.message;
      }
    });
  }

  joinWorkspace(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { redirectTo: `/invitations/${this.token}` } });
      return;
    }

    this.isSubmitting = true;
    this.workspaceMemberService.acceptInvitation(this.token).subscribe({
      next: response => {
        this.isSubmitting = false;
        this.success = `You joined the workspace as ${response.role}. Redirecting now.`;
        setTimeout(() => {
          this.router.navigate(['/workspaces', response.workspaceId, 'decisions']);
        }, 900);
      },
      error: (error: Error) => {
        this.isSubmitting = false;
        this.error = error.message;
      }
    });
  }
}
