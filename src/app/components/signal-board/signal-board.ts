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

    return signal.metadata.type === 'pull_request' ? 'Pull Request' : 'Issue';
  }

  getSourceLabel(signal: Signal): string {
    return signal.sourceType === 'slack' ? 'Slack' : 'GitHub';
  }

  getSourceClass(signal: Signal): string {
    return signal.sourceType === 'slack' ? 'slack' : 'github';
  }

  getPrimaryContext(signal: Signal): string {
    if (signal.sourceType === 'slack') {
      return `#${this.getSlackChannel(signal)} in Slack`;
    }

    return `${this.getTypeLabel(signal)} #${signal.metadata.number} in ${signal.metadata.repository}`;
  }

  getOpenLabel(signal: Signal): string {
    return signal.sourceType === 'slack' ? 'Open in Slack' : 'Open in GitHub';
  }

  getSlackChannel(signal: Signal): string {
    return String(signal.metadata['channel'] ?? 'channel');
  }
}
