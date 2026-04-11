import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IntegrationService } from '../../services/integration.service';
import { GitHubRepo, SyncStatus } from '../../models/github-integration.model';
import { GmailConnectionState } from '../../models/gmail-integration.model';
import { SlackChannel } from '../../models/slack-integration.model';

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

  isGmailConnected = false;
  gmailEmail = '';
  gmailName = '';
  gmailLastConnectedAt?: Date;
  gmailFeedbackMessage = '';
  gmailErrorMessage = '';

  ngOnInit(): void {
    this.workspaceId = this.route.snapshot.paramMap.get('id') ?? '';
    this.route.queryParamMap.subscribe(params => {
      const gmailStatus = params.get('gmail');
      this.gmailFeedbackMessage = gmailStatus === 'connected' ? 'Gmail connected successfully.' : '';
      this.gmailErrorMessage = gmailStatus === 'failed' ? 'Gmail connection failed. Please try again.' : '';
    });
    this.loadSlackChannels();
    this.loadRepos();
    this.loadGmailConnection();
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

  connectGmail(): void {
    this.gmailErrorMessage = '';
    this.gmailFeedbackMessage = 'Starting Gmail connection...';
    this.integrationService.connectGmail(this.workspaceId).subscribe({
      error: (error: Error) => {
        this.gmailErrorMessage = error.message;
        this.gmailFeedbackMessage = '';
      }
    });
  }

  disconnectGmail(): void {
    this.integrationService.disconnectGmail().subscribe(() => {
      this.gmailFeedbackMessage = 'Gmail integration disconnected.';
      this.gmailErrorMessage = '';
      this.loadGmailConnection();
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

  private loadGmailConnection(): void {
    this.integrationService.getGmailConnection().subscribe((response: GmailConnectionState) => {
      this.isGmailConnected = response.connected;
      this.gmailEmail = response.email ?? '';
      this.gmailName = response.name ?? '';
      this.gmailLastConnectedAt = response.lastConnectedAt;
    });
  }
}
