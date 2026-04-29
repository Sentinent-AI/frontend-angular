import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Signal } from '../../models/signal.model';
import { IntegrationService } from '../../services/integration.service';

@Component({
  selector: 'app-signal-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signal-board.html',
  styleUrl: './signal-board.css'
})
export class SignalBoardComponent {
  @Input() signals: Signal[] = [];
  @Output() markAsRead = new EventEmitter<string>();
  @Output() archive = new EventEmitter<string>();

  private integrationService = inject(IntegrationService);
  private cdr = inject(ChangeDetectorRef);

  activeJiraTransitions: { [signalId: string]: any[] } = {};
  loadingTransitions: { [signalId: string]: boolean } = {};
  jiraComments: { [signalId: string]: string } = {};
  submittingComment: { [signalId: string]: boolean } = {};
  githubComments: { [signalId: string]: string } = {};
  submittingGitHubComment: { [signalId: string]: boolean } = {};
  toastMessage = '';

  trackBySignal(_: number, signal: Signal): string {
    return signal.id;
  }

  getTypeLabel(signal: Signal): string {
    if (signal.sourceType === 'slack') {
      return 'Slack Message';
    }
    if (signal.sourceType === 'jira') {
      return signal.metadata.issueType || 'Jira Issue';
    }

    return signal.metadata.type === 'pull_request' ? 'Pull Request' : 'Issue';
  }

  getSourceLabel(signal: Signal): string {
    if (signal.sourceType === 'slack') return 'Slack';
    if (signal.sourceType === 'jira') return 'JIRA';
    return 'GitHub';
  }

  getSourceClass(signal: Signal): string {
    if (signal.sourceType === 'slack') return 'slack';
    if (signal.sourceType === 'jira') return 'jira';
    return 'github';
  }

  getPrimaryContext(signal: Signal): string {
    if (signal.sourceType === 'slack') {
      return `#${this.getSlackChannel(signal)} in Slack`;
    }
    if (signal.sourceType === 'jira') {
      return `${signal.metadata.projectKey ?? signal.sourceId ?? 'JIRA'} in JIRA`;
    }

    return `${this.getTypeLabel(signal)} #${signal.metadata.number} in ${signal.metadata.repository}`;
  }

  getOpenLabel(signal: Signal): string {
    if (signal.sourceType === 'slack') return 'Open in Slack';
    if (signal.sourceType === 'jira') return 'Open in Jira';
    return 'Open in GitHub';
  }

  getSlackChannel(signal: Signal): string {
    return String(signal.metadata['channel'] ?? 'channel');
  }

  loadJiraTransitions(signal: Signal) {
    if (signal.sourceType !== 'jira' || this.activeJiraTransitions[signal.id]) return;
    
    const workspaceId = String(signal.workspaceId ?? '');
    const issueKey = signal.externalId;
    if (!workspaceId || !issueKey) return;

    this.loadingTransitions[signal.id] = true;
    this.integrationService.getJiraTransitions(workspaceId, issueKey).subscribe({
      next: (transitions) => {
        this.activeJiraTransitions[signal.id] = transitions;
        this.loadingTransitions[signal.id] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingTransitions[signal.id] = false;
        this.showToast('Failed to load Jira transitions');
      }
    });
  }

  onJiraTransitionChange(signal: Signal, event: Event) {
    const transitionId = (event.target as HTMLSelectElement).value;
    if (!transitionId) return;

    const workspaceId = String(signal.workspaceId ?? '');
    const issueKey = signal.externalId;
    
    this.integrationService.performJiraTransition(workspaceId, issueKey, transitionId).subscribe({
      next: () => {
        this.showToast('Status updated successfully');
        const transition = this.activeJiraTransitions[signal.id]?.find(t => t.id === transitionId);
        if (transition && signal.metadata) {
          signal.metadata['status'] = transition.to?.name || 'Updated';
        }
        delete this.activeJiraTransitions[signal.id];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast(err.message || 'Failed to update Jira status');
      }
    });
  }

  addJiraComment(signal: Signal) {
    const workspaceId = String(signal.workspaceId ?? '');
    const issueKey = signal.externalId;
    const comment = this.jiraComments[signal.id];
    
    if (!comment || !comment.trim()) return;

    this.submittingComment[signal.id] = true;
    this.integrationService.addJiraComment(workspaceId, issueKey, comment).subscribe({
      next: () => {
        this.showToast('Comment added successfully');
        this.jiraComments[signal.id] = '';
        this.submittingComment[signal.id] = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast('Failed to add comment');
        this.submittingComment[signal.id] = false;
        this.cdr.detectChanges();
      }
    });
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 4000);
  }

  addGitHubComment(signal: Signal) {
    const workspaceId = String(signal.workspaceId ?? '');
    const repo = signal.metadata.repository;
    const number = signal.metadata.number;
    const comment = this.githubComments[signal.id];

    if (!comment || !comment.trim() || !repo || !number) return;

    this.submittingGitHubComment[signal.id] = true;
    this.integrationService.addGitHubComment(workspaceId, repo, number, comment).subscribe({
      next: () => {
        this.showToast('Comment added to GitHub');
        this.githubComments[signal.id] = '';
        this.submittingGitHubComment[signal.id] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Failed to add GitHub comment');
        this.submittingGitHubComment[signal.id] = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleGitHubState(signal: Signal) {
    const workspaceId = String(signal.workspaceId ?? '');
    const repo = signal.metadata.repository;
    const number = signal.metadata.number;
    const currentState = signal.metadata.state;

    if (!repo || !number) return;

    const newState = currentState === 'open' ? 'closed' : 'open';

    this.integrationService.updateGitHubIssueState(workspaceId, repo, number, newState).subscribe({
      next: () => {
        this.showToast(`Issue ${newState === 'closed' ? 'closed' : 'reopened'}`);
        if (signal.metadata) {
          signal.metadata.state = newState;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Failed to update GitHub status');
      }
    });
  }

  slackReplies: { [signalId: string]: string } = {};
  submittingSlackReply: { [signalId: string]: boolean } = {};

  sendSlackReply(signal: Signal) {
    const workspaceId = String(signal.workspaceId ?? '');
    const channelId = String(signal.metadata['channel_id'] || signal.sourceId.split(':')[0]);
    const threadTs = String(signal.metadata['ts'] || signal.externalId);
    const text = this.slackReplies[signal.id];

    if (!text || !text.trim() || !channelId || !threadTs) return;

    this.submittingSlackReply[signal.id] = true;
    this.integrationService.replyToSlack(workspaceId, channelId, threadTs, text).subscribe({
      next: () => {
        this.showToast('Reply sent to Slack thread');
        this.slackReplies[signal.id] = '';
        this.submittingSlackReply[signal.id] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.showToast('Failed to send Slack reply');
        this.submittingSlackReply[signal.id] = false;
        this.cdr.detectChanges();
      }
    });
  }
}
