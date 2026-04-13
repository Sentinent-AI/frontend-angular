import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of, throwError, timeout } from 'rxjs';
import { Workspace } from '../models/workspace';
import { toError } from './http-error';

interface WorkspaceResponse {
  id?: number | string;
  description?: string;
  owner_id?: number | string;
  ownerId?: number | string;
  created_at?: string;
  createdAt?: string;
  name?: string;
}

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/workspaces';

  getWorkspaces(): Observable<Workspace[]> {
    return this.http.get<WorkspaceResponse[]>(this.apiUrl).pipe(
      timeout(5000),
      map((workspaces) => workspaces.map((workspace) => this.mapWorkspace(workspace))),
      catchError((error) => throwError(() => toError(error, 'Unable to load workspaces.'))),
    );
  }

  getWorkspace(id: string): Observable<Workspace | undefined> {
    return this.http.get<WorkspaceResponse>(`${this.apiUrl}/${id}`).pipe(
      timeout(5000),
      map((workspace) => this.mapWorkspace(workspace)),
      catchError((error) => {
        if (error.status === 404) {
          return of(undefined);
        }
        return throwError(() => toError(error, 'Unable to load workspace.'));
      }),
    );
  }

  createWorkspace(name: string, description: string): Observable<Workspace> {
    return this.http
      .post<WorkspaceResponse>(this.apiUrl, { name, description })
      .pipe(
        timeout(5000),
        map((workspace) => this.mapWorkspace(workspace)),
        catchError((error) => throwError(() => toError(error, 'Unable to create workspace.'))),
      );
  }

  updateWorkspace(id: string, name: string, description: string): Observable<Workspace | undefined> {
    return this.http
      .patch<WorkspaceResponse>(`${this.apiUrl}/${id}`, { name, description })
      .pipe(
        timeout(5000),
        map((workspace) => this.mapWorkspace(workspace)),
        catchError((error) => {
          if (error.status === 404) {
            return of(undefined);
          }
          return throwError(() => toError(error, 'Unable to update workspace.'));
        }),
      );
  }

  deleteWorkspace(id: string): Observable<boolean> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      timeout(5000),
      map(() => true),
      catchError((error) => throwError(() => toError(error, 'Unable to delete workspace.'))),
    );
  }

  private mapWorkspace(workspace: WorkspaceResponse): Workspace {
    const id = workspace.id ?? '';
    const ownerId = workspace.owner_id ?? workspace.ownerId ?? '';
    const createdAtRaw = workspace.created_at ?? workspace.createdAt ?? '';

    return {
      id: String(id),
      name: workspace.name ?? '',
      description: workspace.description ?? '',
      createdDate: this.toDate(createdAtRaw),
      ownerId: String(ownerId),
    };
  }

  private toDate(value: string): Date {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
  }
}
