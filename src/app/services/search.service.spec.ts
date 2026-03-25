import { TestBed } from '@angular/core/testing';
import { SearchService } from './search.service';
import { SignalService } from './signal.service';
import { DecisionService } from './decision.service';
import { of } from 'rxjs';
import { Signal } from '../models/signal.model';
import { Decision } from '../models/decision.model';

describe('SearchService', () => {
  let service: SearchService;
  let mockSignalService: any;
  let mockDecisionService: any;

  beforeEach(() => {
    mockSignalService = {
      getSignals: jasmine.createSpy('getSignals').and.returnValue(of([]))
    };

    mockDecisionService = {
      getDecisions: jasmine.createSpy('getDecisions').and.returnValue(of([]))
    };

    TestBed.configureTestingModule({
      providers: [
        SearchService,
        { provide: SignalService, useValue: mockSignalService },
        { provide: DecisionService, useValue: mockDecisionService }
      ]
    });

    service = TestBed.inject(SearchService);
    
    // Clear local storage for recent searches testing
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('search', () => {
    const mockSignals: Signal[] = [
      {
        id: '1',
        title: 'Fix login bug',
        content: 'Users cannot log in via SSO',
        sourceType: 'github',
        sourceId: 'src-1',
        externalId: 'ext-1',
        author: 'UserA',
        receivedAt: new Date('2023-01-01T10:00:00Z'),
        status: 'unread',
        metadata: {}
      },
      {
        id: '2',
        title: 'Deployment issue',
        content: 'Server is down on production',
        sourceType: 'slack',
        sourceId: 'src-2',
        externalId: 'ext-2',
        author: 'UserB',
        receivedAt: new Date('2023-01-02T10:00:00Z'),
        status: 'unread',
        metadata: {}
      }
    ];

    const mockDecisions: Decision[] = [
      {
        id: '1',
        title: 'Use OAuth2 for SSO',
        description: 'Decided to use OAuth2 to fix login bug',
        createdAt: new Date('2023-01-03T10:00:00Z'),
        updatedAt: new Date('2023-01-03T10:00:00Z'),
        workspaceId: 'ws-1',
        status: 'CLOSED',
        userId: 'user-1',
        isDeleted: false
      }
    ];

    beforeEach(() => {
      mockSignalService.getSignals.and.returnValue(of(mockSignals));
      mockDecisionService.getDecisions.and.returnValue(of(mockDecisions));
    });

    it('should return empty array if query is less than 2 characters', (done) => {
      service.search('a').subscribe(results => {
        expect(results.length).toBe(0);
        expect(mockSignalService.getSignals).not.toHaveBeenCalled();
        expect(mockDecisionService.getDecisions).not.toHaveBeenCalled();
        done();
      });
    });

    it('should find results across signals and decisions with matching text', (done) => {
      service.search('login').subscribe(results => {
        expect(results.length).toBe(2);
        // Should sort by date descending (Decision is 01-03, Signal is 01-01)
        expect(results[0].type).toBe('decision');
        expect(results[0].title).toBe('Use OAuth2 for SSO');
        expect(results[1].type).toBe('signal');
        expect(results[1].title).toBe('Fix login bug');
        done();
      });
    });

    it('should filter by slack source', (done) => {
      service.search('issue', 'slack').subscribe(results => {
        expect(results.length).toBe(1);
        expect(results[0].type).toBe('signal');
        expect(results[0].source).toBe('slack');
        expect(results[0].title).toBe('Deployment issue');
        done();
      });
    });

    it('should filter by github source', (done) => {
      service.search('login', 'github').subscribe(results => {
        expect(results.length).toBe(1);
        expect(results[0].type).toBe('signal');
        expect(results[0].source).toBe('github');
        done();
      });
    });

    it('should filter by decision source', (done) => {
      service.search('oauth', 'decision').subscribe(results => {
        expect(results.length).toBe(1);
        expect(results[0].type).toBe('decision');
        expect(results[0].title).toBe('Use OAuth2 for SSO');
        done();
      });
    });
  });

  describe('Recent Searches', () => {
    it('should add valid searches to localStorage and move them to front', () => {
      service.addRecentSearch('first');
      service.addRecentSearch('second');
      service.addRecentSearch('third');
      
      let recent = service.getRecentSearches();
      expect(recent).toEqual(['third', 'second', 'first']);
      
      // Adding duplicate should move it to front
      service.addRecentSearch('first');
      recent = service.getRecentSearches();
      expect(recent).toEqual(['first', 'third', 'second']);
    });

    it('should not add queries less than 2 characters', () => {
      service.addRecentSearch('a');
      expect(service.getRecentSearches().length).toBe(0);
    });

    it('should limit recent searches to maximum 5', () => {
      service.addRecentSearch('q1');
      service.addRecentSearch('q2');
      service.addRecentSearch('q3');
      service.addRecentSearch('q4');
      service.addRecentSearch('q5');
      service.addRecentSearch('q6'); // Should push out q1
      
      const recent = service.getRecentSearches();
      expect(recent.length).toBe(5);
      expect(recent[0]).toBe('q6');
      expect(recent.includes('q1')).toBeFalse();
    });

    it('should clear recent searches', () => {
      service.addRecentSearch('query');
      expect(service.getRecentSearches().length).toBe(1);
      
      service.clearRecentSearches();
      expect(service.getRecentSearches().length).toBe(0);
    });
  });
});
