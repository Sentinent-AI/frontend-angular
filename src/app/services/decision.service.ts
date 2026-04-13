import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of, throwError, timeout } from 'rxjs';
import { Decision } from '../models/decision.model';
import { toError } from './http-error';

interface DecisionResponse {
  id?: number | string;
  workspace_id?: number | string;
  workspaceId?: number | string;
  user_id?: number | string;
  userId?: number | string;
  title?: string;
  description?: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  due_date?: string | null;
  dueDate?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DecisionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/workspaces';

  getDecisions(workspaceId: string): Observable<Decision[]> {
    return this.http.get<DecisionResponse[]>(`${this.apiUrl}/${workspaceId}/decisions`).pipe(
      timeout(5000),
      map((decisions) => decisions.map((decision) => this.mapDecision(decision))),
      catchError((error) => throwError(() => toError(error, 'Unable to load decisions.'))),
    );
  }

  getDecision(workspaceId: string, id: string): Observable<Decision | undefined> {
    return this.http.get<DecisionResponse>(`${this.apiUrl}/${workspaceId}/decisions/${id}`).pipe(
      timeout(5000),
      map((decision) => this.mapDecision(decision)),
      catchError((error) => {
        if (error.status === 404) {
          return of(undefined);
        }
        return throwError(() => toError(error, 'Unable to load decision.'));
      }),
    );
  }

  createDecision(decision: Partial<Decision>): Observable<Decision> {
    if (!decision.workspaceId) {
      throw new Error('workspaceId is required to create a decision');
    }

    return this.http
      .post<DecisionResponse>(`${this.apiUrl}/${decision.workspaceId}/decisions`, this.toPayload(decision))
      .pipe(
        timeout(5000),
        map((created) => this.mapDecision(created)),
        catchError((error) => throwError(() => toError(error, 'Unable to create decision.'))),
      );
  }

  updateDecision(workspaceId: string, id: string, updates: Partial<Decision>): Observable<Decision | undefined> {
    return this.http
      .patch<DecisionResponse>(`${this.apiUrl}/${workspaceId}/decisions/${id}`, this.toPayload(updates))
      .pipe(
        timeout(5000),
        map((decision) => this.mapDecision(decision)),
        catchError((error) => {
          if (error.status === 404) {
            return of(undefined);
          }
          return throwError(() => toError(error, 'Unable to update decision.'));
        }),
      );
  }

  deleteDecision(workspaceId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${workspaceId}/decisions/${id}`).pipe(
      timeout(5000),
      catchError((error) => throwError(() => toError(error, 'Unable to delete decision.'))),
    );
  }

  private toPayload(decision: Partial<Decision>) {
    return {
      title: decision.title,
      description: decision.description ?? '',
      status: decision.status ?? 'DRAFT',
      due_date: decision.dueDate ? new Date(decision.dueDate).toISOString() : null,
    };
  }

  private mapDecision(decision: DecisionResponse): Decision {
    const dueDateRaw = decision.due_date ?? decision.dueDate;
    const createdAtRaw = decision.created_at ?? decision.createdAt ?? '';
    const updatedAtRaw = decision.updated_at ?? decision.updatedAt ?? '';
    const workspaceId = decision.workspace_id ?? decision.workspaceId ?? '';
    const userId = decision.user_id ?? decision.userId ?? '';
    const status = decision.status ?? 'DRAFT';

    return {
      id: String(decision.id ?? ''),
      workspaceId: String(workspaceId),
      userId: String(userId),
      title: decision.title ?? '',
      description: decision.description ?? '',
      status,
      dueDate: dueDateRaw ? this.toDate(dueDateRaw) : undefined,
      createdAt: this.toDate(createdAtRaw),
      updatedAt: this.toDate(updatedAtRaw),
      isDeleted: false,
    };
  }

  private toDate(value: string): Date {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
  }
}
