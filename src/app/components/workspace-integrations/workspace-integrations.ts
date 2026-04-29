import { CommonModule } from '@angular/common';
import { Component, Input, NgZone, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { IntegrationService } from '../../services/integration.service';
import { GitHubRepo, SyncStatus } from '../../models/github-integration.model';
import { SlackChannel } from '../../models/slack-integration.model';
import { AtlassianResource, JiraSyncStatus } from '../../models/jira-integration.model';

@Component({
  selector: 'app-workspace-integrations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace-integrations.html',
  styleUrl: './workspace-integrations.css'
})
export class WorkspaceIntegrationsComponent implements OnInit, OnChanges, OnDestroy {
  /** When provided (e.g. embedded in profile), this takes precedence over the route param. */
  @Input() inputWorkspaceId?: string;

  private readonly route = inject(ActivatedRoute);
  private readonly integrationService = inject(IntegrationService);
  private readonly ngZone = inject(NgZone);

  workspaceId = '';
  slackChannels: SlackChannel[] = [];
  selectedSlackChannelIds: string[] = [];
  isSlackConnected = false;
  slackWorkspaceName = '';
  slackWorkspaceUrl = '';
  slackLastSyncAt?: Date;
  slackSyncStatus?: SyncStatus;
  slackFeedbackMessage = '';
  slackErrorMessage = '';
  isSlackSaving = false;
  isSlackSyncing = false;

  repos: GitHubRepo[] = [];
  selectedRepoIds: number[] = [];
  isGitHubConnected = false;
  accountName = '';
  accountHandle = '';
  githubLastSyncAt?: Date;
  githubSyncStatus?: SyncStatus;
  githubFeedbackMessage = '';
  githubErrorMessage = '';
  isGitHubSaving = false;
  isSyncing = false;

  isJiraConnected = false;
  jiraResources: AtlassianResource[] = [];
  jiraLastSyncAt?: Date;
  jiraSyncStatus?: JiraSyncStatus;
  jiraFeedbackMessage = '';
  jiraErrorMessage = '';
  isJiraSyncing = false;

  ngOnInit(): void {
    this.workspaceId = this.inputWorkspaceId ?? this.getWorkspaceIdFromRoute() ?? '';
    this.loadAllIntegrations();
    window.addEventListener('focus', this.onWindowFocus);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inputWorkspaceId'] && !changes['inputWorkspaceId'].firstChange) {
      this.workspaceId = this.inputWorkspaceId ?? '';
      this.loadAllIntegrations();
    }
  }

  private getWorkspaceIdFromRoute(): string | null {
    const path = this.route.pathFromRoot || [];
    for (const route of path) {
      const id = route.snapshot.paramMap.get('id');
      if (id) {
        return id;
      }
    }
    return null;
  }

  ngOnDestroy(): void {
    window.removeEventListener('focus', this.onWindowFocus);
  }

  private onWindowFocus = (): void => {
    // window events fire outside Angular's zone, so we must re-enter the zone
    // to trigger change detection immediately (clears the "Starting..." banner
    // and shows the newly-connected integration without needing a button click).
    this.ngZone.run(() => {
      this.slackFeedbackMessage = this.slackFeedbackMessage === 'Starting Slack connection...' ? '' : this.slackFeedbackMessage;
      this.githubFeedbackMessage = this.githubFeedbackMessage === 'Starting GitHub connection...' ? '' : this.githubFeedbackMessage;
      this.jiraFeedbackMessage = this.jiraFeedbackMessage === 'Starting Jira connection...' ? '' : this.jiraFeedbackMessage;
      this.loadAllIntegrations();
    });
  };

  private loadAllIntegrations(): void {
    this.loadSlackChannels();
    this.loadRepos();
    this.loadJira();
  }

  connectSlack(): void {
    this.slackErrorMessage = '';
    this.slackFeedbackMessage = 'Starting Slack connection...';
    // Open the window synchronously (in the same click event) to avoid popup blockers,
    // then navigate it to the auth URL once the API returns it.
    const authWindow = window.open('', '_blank');
    this.integrationService.getSlackAuthUrl(this.workspaceId).subscribe({
      next: ({ authUrl }) => {
        if (authWindow) {
          authWindow.location.href = authUrl;
        } else {
          window.location.href = authUrl;
        }
      },
      error: (error: Error) => {
        authWindow?.close();
        this.slackErrorMessage = error.message;
        this.slackFeedbackMessage = '';
      }
    });
  }

  disconnectSlack(): void {
    this.integrationService.disconnectSlack(this.workspaceId).subscribe(() => {
      this.slackFeedbackMessage = 'Slack integration disconnected.';
      this.loadSlackChannels();
    });
  }

  connectGitHub(): void {
    this.githubErrorMessage = '';
    this.githubFeedbackMessage = 'Starting GitHub connection...';
    const authWindow = window.open('', '_blank');
    this.integrationService.getGitHubAuthUrl(this.workspaceId).subscribe({
      next: ({ authUrl }) => {
        if (authWindow) {
          authWindow.location.href = authUrl;
        } else {
          window.location.href = authUrl;
        }
      },
      error: (error: Error) => {
        authWindow?.close();
        this.githubErrorMessage = error.message;
        this.githubFeedbackMessage = '';
      }
    });
  }

  disconnectGitHub(): void {
    this.integrationService.disconnectGitHub(this.workspaceId).subscribe(() => {
      this.githubSyncStatus = undefined;
      this.githubFeedbackMessage = 'GitHub integration disconnected.';
      this.loadRepos();
    });
  }

  connectJira(): void {
    this.jiraErrorMessage = '';
    this.jiraFeedbackMessage = 'Starting Jira connection...';
    const authWindow = window.open('', '_blank');
    this.integrationService.getJiraAuthUrl(this.workspaceId).subscribe({
      next: ({ authUrl }) => {
        if (authWindow) {
          authWindow.location.href = authUrl;
        } else {
          window.location.href = authUrl;
        }
      },
      error: (error: Error) => {
        authWindow?.close();
        this.jiraErrorMessage = error.message;
        this.jiraFeedbackMessage = '';
      }
    });
  }

  disconnectJira(): void {
    this.integrationService.disconnectJira(this.workspaceId).subscribe({
      next: () => {
        this.jiraSyncStatus = undefined;
        this.jiraFeedbackMessage = 'Jira integration disconnected.';
        this.loadJira();
      },
      error: (error: Error) => {
        this.jiraErrorMessage = error.message;
      }
    });
  }

  toggleSlackChannel(channelId: string, checked: boolean): void {
    this.selectedSlackChannelIds = checked
      ? [...this.selectedSlackChannelIds, channelId]
      : this.selectedSlackChannelIds.filter(id => id !== channelId);
  }

  onSlackChannelToggle(channelId: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.toggleSlackChannel(channelId, input?.checked ?? false);
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

  saveSlackChannelSelection(): void {
    this.isSlackSaving = true;
    this.slackErrorMessage = '';
    this.integrationService.updateSlackChannels(this.workspaceId, this.selectedSlackChannelIds).pipe(
      finalize(() => { this.isSlackSaving = false; })
    ).subscribe({
      next: () => {
        this.slackFeedbackMessage = 'Slack channel selection saved.';
        this.loadSlackChannels();
        this.syncSlackNow();
      },
      error: () => {
        this.slackErrorMessage = 'Could not save Slack channel selection.';
      }
    });
  }

  syncSlackNow(): void {
    this.isSlackSyncing = true;
    this.slackErrorMessage = '';
    this.integrationService.syncSlack(this.workspaceId).subscribe({
      next: (status) => {
        this.slackSyncStatus = status;
        this.isSlackSyncing = false;
        this.slackFeedbackMessage = status.status === 'in_progress'
          ? 'Slack sync started. Messages will refresh shortly.'
          : 'Slack sync could not be started.';
        this.loadSlackChannels();
      },
      error: (error: Error) => {
        this.isSlackSyncing = false;
        this.slackErrorMessage = error.message;
      }
    });
  }

  saveRepoSelection(): void {
    this.isGitHubSaving = true;
    this.githubErrorMessage = '';
    this.integrationService.updateGitHubRepos(this.workspaceId, this.selectedRepoIds).pipe(
      finalize(() => { this.isGitHubSaving = false; })
    ).subscribe({
      next: () => {
        this.githubFeedbackMessage = 'Repository selection saved.';
        this.loadRepos();
      },
      error: () => {
        this.githubErrorMessage = 'Could not save repository selection.';
      }
    });
  }

  syncNow(): void {
    this.isSyncing = true;
    this.githubErrorMessage = '';
    this.integrationService.syncGitHub(this.workspaceId).subscribe({
      next: (status) => {
        this.githubSyncStatus = status;
        this.isSyncing = false;
        this.githubFeedbackMessage = status.status === 'in_progress'
          ? 'GitHub sync started. Signals will refresh shortly.'
          : 'GitHub sync could not be started.';
        this.loadRepos();
      },
      error: (error: Error) => {
        this.isSyncing = false;
        this.githubErrorMessage = error.message;
      }
    });
  }

  syncJiraNow(): void {
    this.isJiraSyncing = true;
    this.jiraErrorMessage = '';
    this.integrationService.syncJira(this.workspaceId).subscribe({
      next: (status) => {
        this.jiraSyncStatus = status;
        this.isJiraSyncing = false;
        this.jiraFeedbackMessage = status.status === 'in_progress'
          ? 'Jira sync started. Signals will refresh shortly.'
          : 'Jira sync could not be started.';
        this.loadJira();
      },
      error: (error: Error) => {
        this.isJiraSyncing = false;
        this.jiraErrorMessage = error.message;
      }
    });
  }

  isSlackChannelSelected(channelId: string): boolean {
    return this.selectedSlackChannelIds.includes(channelId);
  }

  isRepoSelected(repoId: number): boolean {
    return this.selectedRepoIds.includes(repoId);
  }

  private loadSlackChannels(): void {
    this.integrationService.getSlackChannels(this.workspaceId).subscribe(response => {
      this.isSlackConnected = response.connected;
      this.slackChannels = response.channels;
      this.selectedSlackChannelIds = response.channels.filter(channel => channel.isConnected).map(channel => channel.id);
      this.slackWorkspaceName = response.workspaceName ?? '';
      this.slackWorkspaceUrl = response.workspaceUrl ?? '';
      this.slackLastSyncAt = response.lastSyncAt;
    });
  }

  private loadRepos(): void {
    this.integrationService.getGitHubRepos(this.workspaceId).subscribe(response => {
      this.isGitHubConnected = response.connected;
      this.repos = response.repos;
      this.selectedRepoIds = response.repos.filter(repo => repo.isConnected).map(repo => repo.id);
      this.accountName = response.accountName ?? '';
      this.accountHandle = response.accountHandle ?? '';
      this.githubLastSyncAt = response.lastSyncAt;
    });
  }

  private loadJira(): void {
    console.log('[WorkspaceIntegrations] loadJira() called, workspaceId:', this.workspaceId);
    // First, check connection status from the DB record (source of truth).
    // This prevents transient Jira API failures from flipping the UI to "disconnected".
    this.integrationService.getJiraStatus(this.workspaceId).subscribe({
      next: (status) => {
        console.log('[WorkspaceIntegrations] getJiraStatus returned:', status);
        this.isJiraConnected = status.connected;
        this.jiraLastSyncAt = status.lastSyncAt;

        // Only attempt to load projects if the integration record exists.
        if (status.connected) {
          this.loadJiraProjects();
        } else {
          this.jiraResources = [];
        }
      },
      error: (err) => {
        console.error('[WorkspaceIntegrations] getJiraStatus error:', err);
        // On error checking status, don't change connection state
        // (preserve whatever it was before — "don't disconnect on error").
      }
    });
  }

  private loadJiraProjects(): void {
    this.integrationService.getJiraProjects(this.workspaceId).subscribe({
      next: (response) => {
        // Projects loaded successfully; update resource list.
        // Connection status is already set by loadJira(), so we don't touch isJiraConnected here.
        this.jiraResources = response.resources ?? [];
        if (response.lastSyncAt) {
          this.jiraLastSyncAt = response.lastSyncAt;
        }
      },
      error: () => {
        // Project fetch failed (e.g., expired token) but integration still exists.
        // Keep isJiraConnected = true; just show empty resources.
        this.jiraResources = [];
        this.jiraErrorMessage = 'Could not load Jira projects. The connection may need to be refreshed.';
      }
    });
  }
}
