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
    return signal.metadata.type === 'pull_request' ? 'Pull Request' : 'Issue';
  }
}
