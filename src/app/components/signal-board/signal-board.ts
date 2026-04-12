import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Signal } from '../../models/signal.model';

@Component({
  selector: 'app-signal-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './signal-board.html',
  styleUrl: './signal-board.css'
})
export class SignalBoardComponent {
  @Input() signals: Signal[] = [];
  @Output() markAsRead = new EventEmitter<string>();
  @Output() archive = new EventEmitter<string>();

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
    if (signal.sourceType === 'jira') return 'Jira';
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
      return `${signal.metadata.projectKey} in Jira`;
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
}
