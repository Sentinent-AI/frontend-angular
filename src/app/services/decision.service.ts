import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Decision } from '../models/decision.model';
import { toError } from './http-error';

interface DecisionResponse {
  id: number;
  workspace_id: number;
  user_id: number;
  title: string;
  description?: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED';
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class DecisionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/workspaces';

  getDecisions(workspaceId: string): Observable<Decision[]> {
    return this.http.get<DecisionResponse[]>(`${this.apiUrl}/${workspaceId}/decisions`).pipe(
      map((decisions) => decisions.map((decision) => this.mapDecision(decision))),
      catchError((error) => throwError(() => toError(error, 'Unable to load decisions.'))),
    );
  }

  getDecision(workspaceId: string, id: string): Observable<Decision | undefined> {
    return this.http.get<DecisionResponse>(`${this.apiUrl}/${workspaceId}/decisions/${id}`).pipe(
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
        map((created) => this.mapDecision(created)),
        catchError((error) => throwError(() => toError(error, 'Unable to create decision.'))),
      );
  }

  updateDecision(workspaceId: string, id: string, updates: Partial<Decision>): Observable<Decision | undefined> {
    return this.http
      .patch<DecisionResponse>(`${this.apiUrl}/${workspaceId}/decisions/${id}`, this.toPayload(updates))
      .pipe(
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
    return {
      id: String(decision.id),
      workspaceId: String(decision.workspace_id),
      userId: String(decision.user_id),
      title: decision.title,
      description: decision.description ?? '',
      status: decision.status,
      dueDate: decision.due_date ? new Date(decision.due_date) : undefined,
      createdAt: new Date(decision.created_at),
      updatedAt: new Date(decision.updated_at),
      isDeleted: false,
    };
  }
}
