import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Invitation, InvitationRole, WorkspaceMember, WorkspaceRole } from '../../models/workspace-member.model';
import { WorkspaceMemberService } from '../../services/workspace-member.service';

interface ResendState {
  loading: boolean;
  success: string;
  error: string;
}

@Component({
  selector: 'app-workspace-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workspace-members.html',
  styleUrl: './workspace-members.css'
})
export class WorkspaceMembersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly workspaceMemberService = inject(WorkspaceMemberService);
  private readonly cdr = inject(ChangeDetectorRef);

  workspaceId = '';
  members: WorkspaceMember[] = [];
  pendingInvitations: Invitation[] = [];
  acceptedInvitations: Invitation[] = [];

  inviteEmail = '';
  inviteRole: InvitationRole = 'member';
  inviteSuccess = '';
  inviteError = '';
  actionError = '';

  isSubmittingInvite = false;

  // Per-row resend state keyed by invitation id
  resendStates: Record<string, ResendState> = {};

  readonly availableRoles: WorkspaceRole[] = ['owner', 'member', 'viewer'];

  ngOnInit(): void {
    this.workspaceId = this.getWorkspaceIdFromRoute() ?? '';
    this.loadMembers();
    this.loadInvitations();
  }

  private getWorkspaceIdFromRoute(): string | null {
    for (const route of this.route.pathFromRoot) {
      const id = route.snapshot.paramMap.get('id');
      if (id) return id;
    }
    return null;
  }

  inviteMember(): void {
    const trimmedEmail = this.inviteEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      this.inviteError = 'Email is required.';
      return;
    }
    this.isSubmittingInvite = true;
    this.inviteError = '';
    this.inviteSuccess = '';

    this.workspaceMemberService.inviteMember(this.workspaceId, trimmedEmail, this.inviteRole).subscribe({
      next: invitation => {
        try {
          this.inviteSuccess = `Invitation sent to ${invitation.email}.`;
          this.inviteEmail = '';
          this.inviteRole = 'member';
          this.loadInvitations();
        } finally {
          this.isSubmittingInvite = false;
          this.cdr.detectChanges();
        }
      },
      error: (error: Error) => {
        this.isSubmittingInvite = false;
        this.inviteError = error.message;
        this.cdr.detectChanges();
      }
    });
  }

  resendInvitation(invitation: Invitation): void {
    this.resendStates[invitation.id] = { loading: true, success: '', error: '' };
    this.cdr.detectChanges();

    this.workspaceMemberService.resendInvitation(invitation.token).subscribe({
      next: () => {
        this.resendStates[invitation.id] = {
          loading: false,
          success: `Invitation resent to ${invitation.email}.`,
          error: ''
        };
        this.cdr.detectChanges();
        // Auto-clear after 4s
        setTimeout(() => {
          this.resendStates[invitation.id] = { loading: false, success: '', error: '' };
          this.cdr.detectChanges();
        }, 4000);
      },
      error: (error: Error) => {
        this.resendStates[invitation.id] = {
          loading: false,
          success: '',
          error: error.message || 'Failed to resend invitation.'
        };
        this.cdr.detectChanges();
      }
    });
  }

  getResendState(id: string): ResendState {
    return this.resendStates[id] ?? { loading: false, success: '', error: '' };
  }

  updateMemberRole(member: WorkspaceMember, role: string): void {
    if (role === member.role) return;
    this.actionError = '';
    this.workspaceMemberService.updateRole(this.workspaceId, member.userId, role as WorkspaceRole).subscribe({
      next: () => this.loadMembers(),
      error: (error: Error) => {
        this.actionError = error.message;
        this.loadMembers();
      }
    });
  }

  removeMember(member: WorkspaceMember): void {
    if (!window.confirm(`Remove ${member.email} from the workspace?`)) return;
    this.actionError = '';
    this.workspaceMemberService.removeMember(this.workspaceId, member.userId).subscribe({
      next: () => this.loadMembers(),
      error: (error: Error) => { this.actionError = error.message; }
    });
  }

  cancelInvitation(invitation: Invitation): void {
    this.workspaceMemberService.cancelInvitation(this.workspaceId, invitation.id).subscribe({
      next: () => this.loadInvitations(),
      error: (error: Error) => { this.actionError = error.message; }
    });
  }

  trackMember(_: number, member: WorkspaceMember): number { return member.userId; }
  trackInvitation(_: number, invitation: Invitation): string { return invitation.id; }

  private loadMembers(): void {
    this.workspaceMemberService.getMembers(this.workspaceId).subscribe({
      next: members => {
        this.members = members;
        this.cdr.detectChanges();
      },
      error: () => { this.cdr.detectChanges(); }
    });
  }

  private loadInvitations(): void {
    this.workspaceMemberService.getAllInvitations(this.workspaceId).subscribe({
      next: invitations => {
        this.pendingInvitations = invitations.filter(i => !i.acceptedAt);
        this.acceptedInvitations = invitations.filter(i => !!i.acceptedAt);
        this.cdr.detectChanges();
      },
      error: () => { this.cdr.detectChanges(); }
    });
  }
}
