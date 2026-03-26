import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Signal, SignalFilters, SignalMetadata } from '../models/signal.model';
import { toError } from './http-error';

interface SignalResponse {
  id: number;
  workspace_id?: number;
  source_type: 'slack' | 'github';
  source_id: string;
  external_id?: string;
  title: string;
  content?: string;
  author?: string;
  url?: string;
  status: 'unread' | 'read' | 'archived';
  source_metadata?: {
    type?: 'issue' | 'pull_request';
    number?: number;
    repository?: string;
    state?: 'open' | 'closed';
    labels?: string[];
  };
  received_at?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SignalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/signals';

  getSignals(filters: SignalFilters): Observable<Signal[]> {
    let params = new HttpParams();

    if (filters.source !== 'all') {
      params = params.set('source_type', filters.source);
    }

    if (filters.status !== 'all') {
      params = params.set('status', filters.status);
    }

    return this.http.get<SignalResponse[]>(this.apiUrl, { params }).pipe(
      map((signals) => signals.map((signal) => this.mapSignal(signal))),
      catchError((error) => throwError(() => toError(error, 'Unable to load signals.'))),
    );
  }

  markAsRead(signalId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${signalId}/read`, {}).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to mark signal as read.'))),
    );
  }

  archive(signalId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${signalId}/archive`, {}).pipe(
      catchError((error) => throwError(() => toError(error, 'Unable to archive signal.'))),
    );
  }

  private mapSignal(signal: SignalResponse): Signal {
    return {
      id: String(signal.id),
      sourceType: signal.source_type,
      sourceId: signal.source_id,
      externalId: signal.external_id ?? '',
      title: signal.title,
      content: signal.content ?? '',
      author: signal.author ?? '',
      status: signal.status,
      receivedAt: signal.received_at ? new Date(signal.received_at) : new Date(),
      url: signal.url,
      metadata: this.mapMetadata(signal),
    };
  }

  private mapMetadata(signal: SignalResponse): SignalMetadata {
    if (signal.source_type === 'slack') {
      const [channelId, timestamp] = signal.source_id.split(':');
      return {
        channel: channelId,
        channelId,
        timestamp: signal.external_id ?? timestamp,
      };
    }

    return {
      ...(signal.source_metadata ?? {}),
    };
  }
}
