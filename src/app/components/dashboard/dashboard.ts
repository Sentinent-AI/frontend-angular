import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkspaceService } from '../../services/workspace';
import { Workspace } from '../../models/workspace';
import { CommonModule } from '@angular/common';
import { Signal, SignalFilters } from '../../models/signal.model';
import { SignalService } from '../../services/signal.service';
import { SignalBoardComponent } from '../signal-board/signal-board';
import { SearchBarComponent } from '../search-bar/search-bar';
import { AppNavComponent } from '../app-nav/app-nav';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SignalBoardComponent, SearchBarComponent, AppNavComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  private workspaceService = inject(WorkspaceService);
  private signalService = inject(SignalService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  workspaces: Workspace[] = [];
  signals: Signal[] = [];
  unreadByWorkspace: Record<number, number> = {};
  filters: SignalFilters = { source: 'all', status: 'all' };
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

    this.loadSignals();
  }

  ngOnDestroy(): void {
    if (this.deleteNoticeTimeoutId !== undefined) {
      clearTimeout(this.deleteNoticeTimeoutId);
      this.deleteNoticeTimeoutId = undefined;
    }
  }

  requestDeleteWorkspace(workspace: Workspace): void {
    if (this.isDeletingWorkspace) return;
    this.pendingDeleteWorkspace = workspace;
    this.deleteWorkspaceError = '';
  }

  cancelDeleteWorkspace(): void {
    if (this.isDeletingWorkspace) return;
    this.pendingDeleteWorkspace = null;
    this.deleteWorkspaceError = '';
  }

  confirmDeleteWorkspace(): void {
    const workspace = this.pendingDeleteWorkspace;
    if (!workspace || this.isDeletingWorkspace) return;

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

  setSourceFilter(source: SignalFilters['source']): void {
    this.filters = { ...this.filters, source };
    this.loadSignals();
  }

  setStatusFilter(status: SignalFilters['status']): void {
    this.filters = { ...this.filters, status };
    this.loadSignals();
  }

  markSignalAsRead(signalId: string): void {
    this.signalService.markAsRead(signalId).subscribe(() => this.loadSignals());
  }

  archiveSignal(signalId: string): void {
    this.signalService.archive(signalId).subscribe(() => this.loadSignals());
  }

  isWorkspacePendingDelete(workspace: Workspace): boolean {
    return this.pendingDeleteWorkspace?.id === workspace.id;
  }

  unreadCountFor(workspaceId: number): number {
    return this.unreadByWorkspace[workspaceId] ?? 0;
  }

  private loadSignals(): void {
    this.signalService.getSignals(this.filters).subscribe(signals => {
      this.signals = signals;
      this.unreadByWorkspace = signals.reduce<Record<number, number>>((acc, s) => {
        if (s.status === 'unread' && s.workspaceId != null) {
          acc[s.workspaceId] = (acc[s.workspaceId] ?? 0) + 1;
        }
        return acc;
      }, {});
      this.cdr.detectChanges();
    });
  }

  private showDeleteSuccess(message: string): void {
    this.deleteWorkspaceSuccess = message;
    if (this.deleteNoticeTimeoutId !== undefined) clearTimeout(this.deleteNoticeTimeoutId);
    this.deleteNoticeTimeoutId = setTimeout(() => {
      this.deleteWorkspaceSuccess = '';
    }, 2600);
  }
}
