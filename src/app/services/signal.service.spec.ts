import { TestBed } from '@angular/core/testing';
import { SignalService } from './signal.service';
import { Signal } from '../models/signal.model';

describe('SignalService', () => {
  let service: SignalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignalService);
  });

  it('filters signals by source and status', () => {
    let results: Signal[] = [];

    service.getSignals({ source: 'github', status: 'unread' }).subscribe(signals => {
      results = signals;
    });

    expect(results.length).toBe(2);
    expect(results.every(signal => signal.sourceType === 'github')).toBeTrue();
    expect(results.every(signal => signal.status === 'unread')).toBeTrue();
  });

  it('marks a signal as read', () => {
    service.markAsRead('slack-101').subscribe();

    let updatedSignal: Signal | undefined;
    service.getSignals({ source: 'slack', status: 'read' }).subscribe(signals => {
      updatedSignal = signals.find(signal => signal.id === 'slack-101');
    });

    expect(updatedSignal?.status).toBe('read');
  });

  it('archives a signal', () => {
    service.archive('github-101').subscribe();

    let activeSignals: Signal[] = [];
    service.getSignals({ source: 'github', status: 'unread' }).subscribe(signals => {
      activeSignals = signals;
    });

    expect(activeSignals.some(signal => signal.id === 'github-101')).toBeFalse();
  });
});
