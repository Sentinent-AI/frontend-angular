import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Invitation, InvitationRole, WorkspaceMember, WorkspaceRole } from '../../models/workspace-member.model';
import { WorkspaceMemberService } from '../../services/workspace-member.service';

@Component({
  selector: 'app-workspace-members',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './workspace-members.html',
  styleUrl: './workspace-members.css'
})
export class WorkspaceMembersComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly workspaceMemberService = inject(WorkspaceMemberService);

  workspaceId = '';
  members: WorkspaceMember[] = [];
  invitations: Invitation[] = [];
  inviteEmail = '';
  inviteRole: InvitationRole = 'member';
  inviteSuccess = '';
  inviteError = '';
  actionError = '';
  invitationLink = '';
  isSubmittingInvite = false;

  readonly availableRoles: WorkspaceRole[] = ['owner', 'member', 'viewer'];

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadMembers();
    this.loadInvitations();
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
        this.isSubmittingInvite = false;
        this.inviteSuccess = `Invitation created for ${invitation.email}.`;
        this.invitationLink = `/invitations/${invitation.token}`;
        this.inviteEmail = '';
        this.inviteRole = 'member';
        this.loadInvitations();
      },
      error: (error: Error) => {
        this.isSubmittingInvite = false;
        this.inviteError = error.message;
      }
    });
  }

  updateMemberRole(member: WorkspaceMember, role: string): void {
    if (role === member.role) {
      return;
    }

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
    if (!window.confirm(`Remove ${member.email} from the workspace?`)) {
      return;
    }

    this.actionError = '';
    this.workspaceMemberService.removeMember(this.workspaceId, member.userId).subscribe({
      next: () => this.loadMembers(),
      error: (error: Error) => {
        this.actionError = error.message;
      }
    });
  }

  cancelInvitation(invitation: Invitation): void {
    this.workspaceMemberService.cancelInvitation(this.workspaceId, invitation.id).subscribe(() => {
      this.loadInvitations();
    });
  }

  resendInvitation(invitation: Invitation): void {
    this.inviteSuccess = `Resend link copied for ${invitation.email}.`;
    this.invitationLink = `/invitations/${invitation.token}`;
  }

  trackMember(_: number, member: WorkspaceMember): number {
    return member.userId;
  }

  trackInvitation(_: number, invitation: Invitation): string {
    return invitation.id;
  }

  private loadMembers(): void {
    this.workspaceMemberService.getMembers(this.workspaceId).subscribe(members => {
      this.members = members;
    });
  }

  private loadInvitations(): void {
    this.workspaceMemberService.getPendingInvitations(this.workspaceId).subscribe(invitations => {
      this.invitations = invitations;
    });
  }
}
