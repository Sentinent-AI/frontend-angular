import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { WorkspaceService } from '../../services/workspace';
import { Workspace } from '../../models/workspace';
import { CommonModule } from '@angular/common';
import { Signal, SignalFilters } from '../../models/signal.model';
import { SignalService } from '../../services/signal.service';
import { SignalBoardComponent } from '../signal-board/signal-board';
import { SearchBarComponent } from '../search-bar/search-bar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SignalBoardComponent, SearchBarComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private workspaceService = inject(WorkspaceService);
  private signalService = inject(SignalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  workspaces: Workspace[] = [];
  signals: Signal[] = [];
  filters: SignalFilters = { source: 'all', status: 'all' };
  githubBanner = '';
  slackBanner = '';

  ngOnInit() {
    this.workspaceService.getWorkspaces().subscribe(ws => {
      this.workspaces = ws;
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

  deleteWorkspace(workspace: Workspace) {
    const confirmed = window.confirm(`Delete workspace "${workspace.name}"?`);
    if (!confirmed) {
      return;
    }

    this.workspaceService.deleteWorkspace(workspace.id).subscribe(deleted => {
      if (!deleted) {
        return;
      }
      this.workspaces = this.workspaces.filter(ws => ws.id !== workspace.id);
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
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

  private loadSignals(): void {
    this.signalService.getSignals(this.filters).subscribe(signals => {
      this.signals = signals;
    });
  }
}
