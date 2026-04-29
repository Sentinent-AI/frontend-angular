import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { WorkspaceService } from '../../services/workspace';
import { Workspace } from '../../models/workspace';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private workspaceService = inject(WorkspaceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  workspaces: Workspace[] = [];
  githubBanner = '';
  slackBanner = '';
  pendingDeleteWorkspace: Workspace | null = null;
  isDeletingWorkspace = false;
  deleteWorkspaceError = '';
  deleteWorkspaceSuccess = '';
  private deleteNoticeTimeoutId?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.workspaceService.getWorkspaces().subscribe({
      next: ws => {
        this.workspaces = ws;
        this.cdr.detectChanges();
      },
      error: () => {}
    });

    this.route.queryParamMap.subscribe(params => {
      const githubStatus = params.get('github');
      const slackStatus = params.get('slack');
      this.githubBanner = githubStatus === 'connected'
        ? 'GitHub connected successfully. Review repository access in your workspace integrations.'
        : githubStatus === 'error'
          ? 'GitHub connection failed. Please try the OAuth flow again.'
          : '';
      this.slackBanner = slackStatus === 'connected'
        ? 'Slack connected successfully. Choose the channels you want Sentinent to monitor.'
        : slackStatus === 'error'
          ? 'Slack connection failed. Please try the OAuth flow again.'
          : '';
    });
  }

  ngOnDestroy(): void {
    if (this.deleteNoticeTimeoutId !== undefined) {
      clearTimeout(this.deleteNoticeTimeoutId);
      this.deleteNoticeTimeoutId = undefined;
    }
  }

  requestDeleteWorkspace(workspace: Workspace): void {
    if (this.isDeletingWorkspace) {
      return;
    }
    this.pendingDeleteWorkspace = workspace;
    this.deleteWorkspaceError = '';
  }

  cancelDeleteWorkspace(): void {
    if (this.isDeletingWorkspace) {
      return;
    }
    this.pendingDeleteWorkspace = null;
    this.deleteWorkspaceError = '';
  }

  confirmDeleteWorkspace(): void {
    const workspace = this.pendingDeleteWorkspace;
    if (!workspace || this.isDeletingWorkspace) {
      return;
    }

    this.isDeletingWorkspace = true;
    this.deleteWorkspaceError = '';

    this.workspaceService.deleteWorkspace(workspace.id).subscribe({
      next: (deleted) => {
        if (!deleted) {
          this.isDeletingWorkspace = false;
          this.deleteWorkspaceError = 'Unable to delete workspace. Please try again.';
          return;
        }

        this.workspaces = this.workspaces.filter(ws => ws.id !== workspace.id);
        this.pendingDeleteWorkspace = null;
        this.isDeletingWorkspace = false;
        this.showDeleteSuccess(`Workspace "${workspace.name}" deleted.`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isDeletingWorkspace = false;
        this.deleteWorkspaceError = 'Unable to delete workspace. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isWorkspacePendingDelete(workspace: Workspace): boolean {
    return this.pendingDeleteWorkspace?.id === workspace.id;
  }

  private showDeleteSuccess(message: string): void {
    this.deleteWorkspaceSuccess = message;
    if (this.deleteNoticeTimeoutId !== undefined) {
      clearTimeout(this.deleteNoticeTimeoutId);
    }
    this.deleteNoticeTimeoutId = setTimeout(() => {
      this.deleteWorkspaceSuccess = '';
    }, 2600);
  }
}
