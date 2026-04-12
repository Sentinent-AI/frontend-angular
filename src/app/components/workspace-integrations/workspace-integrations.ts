import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IntegrationService } from '../../services/integration.service';
import { GitHubRepo, SyncStatus } from '../../models/github-integration.model';
import { SlackChannel } from '../../models/slack-integration.model';
import { AtlassianResource, JiraSyncStatus } from '../../models/jira-integration.model';

@Component({
  selector: 'app-workspace-integrations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './workspace-integrations.html',
  styleUrl: './workspace-integrations.css'
})
export class WorkspaceIntegrationsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly integrationService = inject(IntegrationService);

  workspaceId = '';
  slackChannels: SlackChannel[] = [];
  selectedSlackChannelIds: string[] = [];
  isSlackConnected = false;
  slackWorkspaceName = '';
  slackWorkspaceUrl = '';
  slackLastSyncAt?: Date;
  slackFeedbackMessage = '';
  slackErrorMessage = '';
  isSlackSaving = false;

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
    this.workspaceId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadAllIntegrations();
    window.addEventListener('focus', this.onWindowFocus);
  }

  ngOnDestroy(): void {
    window.removeEventListener('focus', this.onWindowFocus);
  }

  private onWindowFocus = (): void => {
    // If we have an active feedback message, let's refresh to see if connection succeeded in background
    if (this.slackFeedbackMessage === 'Starting Slack connection...' || 
        this.githubFeedbackMessage === 'Starting GitHub connection...' || 
        this.jiraFeedbackMessage === 'Starting Jira connection...') {
      this.slackFeedbackMessage = '';
      this.githubFeedbackMessage = '';
      this.jiraFeedbackMessage = '';
      this.loadAllIntegrations();
    }
  };

  private loadAllIntegrations(): void {
    this.loadSlackChannels();
    this.loadRepos();
    this.loadJira();
  }

  connectSlack(): void {
    this.slackErrorMessage = '';
    this.slackFeedbackMessage = 'Starting Slack connection...';
    this.integrationService.connectSlack(this.workspaceId).subscribe({
      error: (error: Error) => {
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
    this.integrationService.connectGitHub().subscribe({
      error: (error: Error) => {
        this.githubErrorMessage = error.message;
        this.githubFeedbackMessage = '';
      }
    });
  }

  disconnectGitHub(): void {
    this.integrationService.disconnectGitHub().subscribe(() => {
      this.githubSyncStatus = undefined;
      this.githubFeedbackMessage = 'GitHub integration disconnected.';
      this.loadRepos();
    });
  }

  connectJira(): void {
    this.jiraErrorMessage = '';
    this.jiraFeedbackMessage = 'Starting Jira connection...';
    this.integrationService.connectJira(this.workspaceId).subscribe({
      error: (error: Error) => {
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
    this.integrationService.updateSlackChannels(this.workspaceId, this.selectedSlackChannelIds).subscribe({
      next: () => {
        this.isSlackSaving = false;
        this.slackFeedbackMessage = 'Slack channel selection saved.';
        this.loadSlackChannels();
      },
      error: () => {
        this.isSlackSaving = false;
        this.slackErrorMessage = 'Could not save Slack channel selection.';
      }
    });
  }

  saveRepoSelection(): void {
    this.isGitHubSaving = true;
    this.githubErrorMessage = '';
    this.integrationService.updateGitHubRepos(this.selectedRepoIds).subscribe({
      next: () => {
        this.isGitHubSaving = false;
        this.githubFeedbackMessage = 'Repository selection saved.';
        this.loadRepos();
      },
      error: () => {
        this.isGitHubSaving = false;
        this.githubErrorMessage = 'Could not save repository selection.';
      }
    });
  }

  syncNow(): void {
    this.isSyncing = true;
    this.githubErrorMessage = '';
    this.integrationService.syncGitHub().subscribe({
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
    this.integrationService.getGitHubRepos().subscribe(response => {
      this.isGitHubConnected = response.connected;
      this.repos = response.repos;
      this.selectedRepoIds = response.repos.filter(repo => repo.isConnected).map(repo => repo.id);
      this.accountName = response.accountName ?? '';
      this.accountHandle = response.accountHandle ?? '';
      this.githubLastSyncAt = response.lastSyncAt;
    });
  }

  private loadJira(): void {
    this.integrationService.getJiraProjects(this.workspaceId).subscribe(response => {
      this.isJiraConnected = response.connected;
      this.jiraResources = response.resources;
      this.jiraLastSyncAt = response.lastSyncAt;
    });
  }
}
