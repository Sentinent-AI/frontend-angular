import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IntegrationService } from '../../services/integration.service';
import { GitHubRepo, SyncStatus } from '../../models/github-integration.model';

@Component({
  selector: 'app-workspace-integrations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './workspace-integrations.html',
  styleUrl: './workspace-integrations.css'
})
export class WorkspaceIntegrationsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly integrationService = inject(IntegrationService);

  workspaceId = '';
  repos: GitHubRepo[] = [];
  selectedRepoIds: number[] = [];
  isConnected = false;
  accountName = '';
  accountHandle = '';
  lastSyncAt?: Date;
  syncStatus?: SyncStatus;
  feedbackMessage = '';
  errorMessage = '';
  isSaving = false;
  isSyncing = false;

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadRepos();
  }

  connectGitHub(): void {
    this.errorMessage = '';
    this.feedbackMessage = 'Starting GitHub connection...';
    this.integrationService.getGitHubAuthUrl().subscribe(() => {
      this.integrationService.connectGitHub().subscribe(() => {
        this.feedbackMessage = 'GitHub account connected. Select the repositories you want Sentinent to monitor.';
        this.loadRepos();
      });
    });
  }

  disconnectGitHub(): void {
    this.integrationService.disconnectGitHub().subscribe(() => {
      this.syncStatus = undefined;
      this.feedbackMessage = 'GitHub integration disconnected.';
      this.loadRepos();
    });
  }

  toggleRepo(repoId: number, checked: boolean): void {
    this.selectedRepoIds = checked
      ? [...this.selectedRepoIds, repoId]
      : this.selectedRepoIds.filter(id => id !== repoId);
  }

  onRepoToggle(repoId: number, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.toggleRepo(repoId, input?.checked ?? false);
  }

  saveRepoSelection(): void {
    this.isSaving = true;
    this.errorMessage = '';
    this.integrationService.updateGitHubRepos(this.selectedRepoIds).subscribe({
      next: () => {
        this.isSaving = false;
        this.feedbackMessage = 'Repository selection saved.';
        this.loadRepos();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Could not save repository selection.';
      }
    });
  }

  syncNow(): void {
    this.isSyncing = true;
    this.errorMessage = '';
    this.integrationService.syncGitHub().subscribe({
      next: ({ syncId }) => {
        this.integrationService.getSyncStatus(syncId).subscribe(status => {
          this.syncStatus = status;
          this.isSyncing = false;
          this.lastSyncAt = status.completedAt;
          this.feedbackMessage = status.status === 'completed'
            ? `Sync completed. ${status.itemsSynced ?? 0} items refreshed.`
            : 'GitHub sync failed.';
        });
      },
      error: (error: Error) => {
        this.isSyncing = false;
        this.errorMessage = error.message;
      }
    });
  }

  isRepoSelected(repoId: number): boolean {
    return this.selectedRepoIds.includes(repoId);
  }

  private loadRepos(): void {
    this.integrationService.getGitHubRepos().subscribe(response => {
      this.isConnected = response.connected;
      this.repos = response.repos;
      this.selectedRepoIds = response.repos.filter(repo => repo.isConnected).map(repo => repo.id);
      this.accountName = response.accountName ?? '';
      this.accountHandle = response.accountHandle ?? '';
      this.lastSyncAt = response.lastSyncAt;
    });
  }
}
