import { Injectable } from '@angular/core';
import { Observable, combineLatest, forkJoin, map, of, switchMap } from 'rxjs';
import { SignalService } from './signal.service';
import { DecisionService } from './decision.service';
import { Signal } from '../models/signal.model';
import { Decision } from '../models/decision.model';
import { WorkspaceService } from './workspace';

export type SearchResultType = 'signal' | 'decision';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  content: string;
  source: string;
  date: Date;
  url?: string;
  original: Signal | Decision;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly RECENT_SEARCHES_KEY = 'sentinent_recent_searches';
  private readonly MAX_RECENT_SEARCHES = 5;

  constructor(
    private signalService: SignalService,
    private decisionService: DecisionService,
    private workspaceService: WorkspaceService
  ) {}

  search(query: string, sourceFilter: string = 'all'): Observable<SearchResult[]> {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return of([]);

    // Signal filtering
    const signals$ = this.signalService.getSignals({ source: 'all', status: 'all' }).pipe(
      map(signals => signals.filter(s => {
        const matchesQuery = (s.title + ' ' + s.content).toLowerCase().includes(q);
        const matchesSource = sourceFilter === 'all' || sourceFilter === s.sourceType;
        return matchesQuery && matchesSource;
      })),
      map(signals => signals.map(s => this.mapSignalToResult(s)))
    );

    // Decision filtering
    const decisions$ = this.workspaceService.getWorkspaces().pipe(
      switchMap(workspaces => {
        if (workspaces.length === 0) {
          return of([] as Decision[]);
        }

        return forkJoin(workspaces.map(workspace => this.decisionService.getDecisions(workspace.id))).pipe(
          map(decisionGroups => decisionGroups.flat())
        );
      }),
      map(decisions => decisions.filter(d => {
        const matchesQuery = (d.title + ' ' + (d.description || '')).toLowerCase().includes(q);
        const matchesSource = sourceFilter === 'all' || sourceFilter === 'decision';
        return matchesQuery && matchesSource;
      })),
      map(decisions => decisions.map(d => this.mapDecisionToResult(d)))
    );

    return combineLatest([signals$, decisions$]).pipe(
      map(([signals, decisions]) => {
        const combined = [...signals, ...decisions];
        // Sort by date descending
        return combined.sort((a, b) => b.date.getTime() - a.date.getTime());
      })
    );
  }

  private mapSignalToResult(s: Signal): SearchResult {
    return {
      id: s.id,
      type: 'signal',
      title: s.title,
      content: s.content,
      source: s.sourceType,
      date: s.receivedAt,
      url: s.url,
      original: s
    };
  }

  private mapDecisionToResult(d: Decision): SearchResult {
    return {
      id: d.id,
      type: 'decision',
      title: d.title,
      content: d.description || '',
      source: 'decision',
      date: d.createdAt,
      original: d
    };
  }

  getRecentSearches(): string[] {
    const stored = localStorage.getItem(this.RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  addRecentSearch(query: string): void {
    if (!query || query.trim().length < 2) return;
    
    let searches = this.getRecentSearches();
    // Remove if already exists (to move to top)
    searches = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
    // Add to front
    searches.unshift(query);
    // Limit size
    searches = searches.slice(0, this.MAX_RECENT_SEARCHES);
    
    localStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(searches));
  }

  clearRecentSearches(): void {
    localStorage.removeItem(this.RECENT_SEARCHES_KEY);
  }
}
