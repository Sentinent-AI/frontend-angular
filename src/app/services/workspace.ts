import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Workspace } from '../models/workspace';

@Injectable({
    providedIn: 'root'
})
export class WorkspaceService {
    private mockWorkspaces: Workspace[] = [
        {
            id: '1',
            name: 'Engineering',
            description: 'Engineering team workspace',
            createdDate: new Date(),
            ownerId: 'user1'
        },
        {
            id: '2',
            name: 'Product',
            description: 'Product team workspace',
            createdDate: new Date(),
            ownerId: 'user1'
        },
        {
            id: '3',
            name: 'Marketing',
            description: 'Marketing team workspace',
            createdDate: new Date(),
            ownerId: 'user1'
        }
    ];

    getWorkspaces(): Observable<Workspace[]> {
        return of(this.mockWorkspaces);
    }

    getWorkspace(id: string): Observable<Workspace | undefined> {
        return of(this.mockWorkspaces.find(w => w.id === id));
    }

    createWorkspace(name: string, description: string): Observable<Workspace> {
        const newWorkspace: Workspace = {
            id: Math.random().toString(36).substring(7),
            name,
            description,
            createdDate: new Date(),
            ownerId: 'user1' // Mock owner
        };
        this.mockWorkspaces.push(newWorkspace);
        return of(newWorkspace);
    }

    updateWorkspace(id: string, name: string, description: string): Observable<Workspace | undefined> {
        const workspace = this.mockWorkspaces.find(w => w.id === id);
        if (!workspace) {
            return of(undefined);
        }

        workspace.name = name;
        workspace.description = description;
        return of(workspace);
    }

    deleteWorkspace(id: string): Observable<boolean> {
        const initialLength = this.mockWorkspaces.length;
        this.mockWorkspaces = this.mockWorkspaces.filter(w => w.id !== id);
        return of(this.mockWorkspaces.length < initialLength);
    }
}
