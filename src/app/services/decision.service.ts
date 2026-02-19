import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Decision } from '../models/decision.model';

@Injectable({
    providedIn: 'root'
})
export class DecisionService {
    private decisions: Decision[] = [];
    private decisionsSubject = new BehaviorSubject<Decision[]>([]);

    constructor() {
        // Initialize with some mock data
        this.decisions = [
            {
                id: '1',
                title: 'Choose Frontend Framework',
                description: 'Decide between Angular and React',
                status: 'CLOSED',
                workspaceId: 'ws-1',
                userId: 'user-1',
                createdAt: new Date('2023-10-25'),
                updatedAt: new Date('2023-10-26'),
                isDeleted: false
            },
            {
                id: '2',
                title: 'Database Selection',
                description: 'Evaluate SQLite vs PostgreSQL for local dev',
                status: 'OPEN',
                workspaceId: 'ws-1',
                userId: 'user-1',
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false
            }
        ];
        this.decisionsSubject.next(this.decisions);
    }

    getDecisions(workspaceId: string): Observable<Decision[]> {
        return this.decisionsSubject.asObservable().pipe(
            map(decisions => decisions.filter(d => d.workspaceId === workspaceId && !d.isDeleted))
        );
    }

    getDecision(id: string): Observable<Decision | undefined> {
        return this.decisionsSubject.asObservable().pipe(
            map(decisions => decisions.find(d => d.id === id))
        );
    }

    createDecision(decision: Partial<Decision>): Observable<Decision> {
        const newDecision: Decision = {
            id: Math.random().toString(36).substring(2, 9),
            title: decision.title!,
            description: decision.description,
            status: decision.status || 'DRAFT',
            workspaceId: decision.workspaceId || 'ws-1', // Default to ws-1 for now
            userId: 'user-1', // Mock user
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false
        };

        this.decisions.push(newDecision);
        this.decisionsSubject.next(this.decisions);
        return of(newDecision);
    }

    updateDecision(id: string, updates: Partial<Decision>): Observable<Decision | undefined> {
        const index = this.decisions.findIndex(d => d.id === id);
        if (index !== -1) {
            this.decisions[index] = {
                ...this.decisions[index],
                ...updates,
                updatedAt: new Date()
            };
            this.decisionsSubject.next(this.decisions);
            return of(this.decisions[index]);
        }
        return of(undefined);
    }

    deleteDecision(id: string): Observable<void> {
        const index = this.decisions.findIndex(d => d.id === id);
        if (index !== -1) {
            this.decisions[index].isDeleted = true;
            this.decisionsSubject.next(this.decisions);
        }
        return of(void 0);
    }
}
