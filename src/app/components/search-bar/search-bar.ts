import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { Decision } from '../../models/decision.model';
import { Signal } from '../../models/signal.model';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { SearchService, SearchResult } from '../../services/search.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css']
})
export class SearchBarComponent implements OnInit, OnDestroy {
  query: string = '';
  sourceFilter: string = 'all';
  results: SearchResult[] = [];
  showResults: boolean = false;
  recentSearches: string[] = [];
  isSearching: boolean = false;

  private searchSubject = new Subject<{q: string, f: string}>();
  private searchSubscription?: Subscription;

  @ViewChild('searchInput') searchInput!: ElementRef;

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.showResults = false;
    }
  }

  constructor(
    private searchService: SearchService,
    private router: Router,
    private elRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.recentSearches = this.searchService.getRecentSearches();

    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(150),
      distinctUntilChanged((prev, curr) => prev.q === curr.q && prev.f === curr.f),
      switchMap(({q, f}) => {
        return this.searchService.search(q, f);
      })
    ).subscribe({
      next: (results) => {
        this.results = results;
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Search error:', err);
        this.isSearching = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  onSearchChange(): void {
    if (this.query.trim().length < 2) {
      this.results = [];
      this.isSearching = false;
      this.showResults = true;
    } else {
      this.isSearching = true;
      this.showResults = true;
      // Do not clear this.results here to provide a smoother dynamic feel while typing
    }
    this.searchSubject.next({ q: this.query, f: this.sourceFilter });
  }

  onFilterChange(filter: string): void {
    this.sourceFilter = filter;
    this.onSearchChange();
  }

  selectResult(result: SearchResult): void {
    this.searchService.addRecentSearch(this.query);
    this.recentSearches = this.searchService.getRecentSearches();
    this.showResults = false;
    this.query = '';

    if (result.type === 'signal') {
      const element = document.getElementById('signal-' + result.id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('search-highlight');
        setTimeout(() => element.classList.remove('search-highlight'), 3000);
      }
    } else if (result.type === 'decision') {
      const decision = result.original as Decision;
      this.router.navigate(['/workspaces', decision.workspaceId, 'decisions']);
      // After navigation, we might also want to scroll to it, but that requires more coordination.
      // For now, jumping to the list is a good start.
    }
  }

  useRecentSearch(search: string): void {
    this.query = search;
    this.onSearchChange();
  }

  clearRecent(): void {
    this.searchService.clearRecentSearches();
    this.recentSearches = [];
  }

  highlightMatch(text: string): string {
    if (!this.query || !text) return text;
    const regex = new RegExp(`(${this.query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
}
