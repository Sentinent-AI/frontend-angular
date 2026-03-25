import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Signal, SignalFilters } from '../models/signal.model';

@Injectable({
  providedIn: 'root'
})
export class SignalService {
  private signals: Signal[] = [
    {
      id: 'slack-101',
      sourceType: 'slack',
      sourceId: 'C123456',
      externalId: '1735200123.0001',
      title: 'Message from #general',
      content: 'Heads up: the deployment window starts at 5 PM Eastern. Please confirm your checklist items.',
      author: '@sam.ops',
      status: 'unread',
      receivedAt: new Date('2026-03-24T09:10:00Z'),
      url: 'https://sentinent.slack.com/archives/C123456/p17352001230001',
      metadata: {
        channel: 'general',
        channelId: 'C123456',
        timestamp: '1735200123.0001',
        user: 'U123456'
      }
    },
    {
      id: 'slack-102',
      sourceType: 'slack',
      sourceId: 'C456789',
      externalId: '1735201123.0002',
      title: 'Message from #engineering',
      content: 'Can someone review the API rate-limit handling before we push the Slack integration branch?',
      author: '@jordan.dev',
      status: 'read',
      receivedAt: new Date('2026-03-24T10:05:00Z'),
      url: 'https://sentinent.slack.com/archives/C456789/p17352011230002',
      metadata: {
        channel: 'engineering',
        channelId: 'C456789',
        timestamp: '1735201123.0002',
        user: 'U456789'
      }
    },
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
