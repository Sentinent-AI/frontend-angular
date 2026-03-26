import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { Workspace } from '../models/workspace';
import { toError } from './http-error';

interface WorkspaceResponse {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  created_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/workspaces';

  getWorkspaces(): Observable<Workspace[]> {
    return this.http.get<WorkspaceResponse[]>(this.apiUrl).pipe(
      map((workspaces) => workspaces.map((workspace) => this.mapWorkspace(workspace))),
    );
  }

  getWorkspace(id: string): Observable<Workspace | undefined> {
    return this.http.get<WorkspaceResponse>(`${this.apiUrl}/${id}`).pipe(
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
        map((workspace) => this.mapWorkspace(workspace)),
        catchError((error) => throwError(() => toError(error, 'Unable to create workspace.'))),
      );
  }

  updateWorkspace(id: string, name: string, description: string): Observable<Workspace | undefined> {
    return this.http
      .patch<WorkspaceResponse>(`${this.apiUrl}/${id}`, { name, description })
      .pipe(
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
      map(() => true),
      catchError((error) => throwError(() => toError(error, 'Unable to delete workspace.'))),
    );
  }

  private mapWorkspace(workspace: WorkspaceResponse): Workspace {
    return {
      id: String(workspace.id),
      name: workspace.name,
      description: workspace.description ?? '',
      createdDate: new Date(workspace.created_at),
      ownerId: String(workspace.owner_id),
    };
  }
}
