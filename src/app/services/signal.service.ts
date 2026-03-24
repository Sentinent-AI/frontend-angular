import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Signal, SignalFilters } from '../models/signal.model';

@Injectable({
  providedIn: 'root'
})
export class SignalService {
  private signals: Signal[] = [
    {
      id: 'github-101',
      sourceType: 'github',
      sourceId: 'Sentinent-AI/frontend-angular',
      externalId: '42',
      title: 'Refine invitation acceptance flow',
      content: 'The accept invitation screen should redirect users back to the intended workspace after login.',
      author: '@neethi',
      status: 'unread',
      receivedAt: new Date('2026-03-23T09:00:00Z'),
      url: 'https://github.com/Sentinent-AI/frontend-angular/issues/42',
      metadata: {
        type: 'issue',
        number: 42,
        repository: 'Sentinent-AI/frontend-angular',
        state: 'open',
        labels: ['frontend', 'ux'],
        assignees: ['@neethi'],
        createdAt: new Date('2026-03-22T20:00:00Z'),
        updatedAt: new Date('2026-03-23T09:00:00Z')
      }
    },
    {
      id: 'github-102',
      sourceType: 'github',
      sourceId: 'Sentinent-AI/Sentinent',
      externalId: '14',
      title: 'Story: GitHub Integration (US-6)',
      content: 'Build OAuth connection, repository selection, and GitHub signal filtering in the dashboard.',
      author: '@yashrastogi',
      status: 'read',
      receivedAt: new Date('2026-03-23T11:15:00Z'),
      url: 'https://github.com/Sentinent-AI/Sentinent/issues/14',
      metadata: {
        type: 'issue',
        number: 14,
        repository: 'Sentinent-AI/Sentinent',
        state: 'open',
        labels: ['user-story'],
        assignees: ['@me'],
        createdAt: new Date('2026-03-23T01:20:00Z'),
        updatedAt: new Date('2026-03-23T11:15:00Z')
      }
    },
    {
      id: 'github-103',
      sourceType: 'github',
      sourceId: 'Sentinent-AI/backend-go',
      externalId: '31',
      title: 'Add GitHub sync status endpoint',
      content: 'Expose last run progress so the frontend can show whether a manual sync completed successfully.',
      author: '@backend-bot',
      status: 'unread',
      receivedAt: new Date('2026-03-23T12:05:00Z'),
      url: 'https://github.com/Sentinent-AI/backend-go/pull/31',
      metadata: {
        type: 'pull_request',
        number: 31,
        repository: 'Sentinent-AI/backend-go',
        state: 'open',
        labels: ['backend', 'integrations'],
        assignees: ['@neethi', '@backend-bot'],
        createdAt: new Date('2026-03-23T10:00:00Z'),
        updatedAt: new Date('2026-03-23T12:05:00Z')
      }
    }
  ];

  getSignals(filters: SignalFilters): Observable<Signal[]> {
    return of(
      this.signals.filter(signal => {
        const sourceMatch = filters.source === 'all' || signal.sourceType === filters.source;
        const statusMatch = filters.status === 'all' || signal.status === filters.status;
        return sourceMatch && statusMatch;
      })
    );
  }

  markAsRead(signalId: string): Observable<void> {
    this.signals = this.signals.map(signal =>
      signal.id === signalId ? { ...signal, status: 'read' } : signal
    );

    return of(void 0);
  }

  archive(signalId: string): Observable<void> {
    this.signals = this.signals.map(signal =>
      signal.id === signalId ? { ...signal, status: 'archived' } : signal
    );

    return of(void 0);
  }
}
