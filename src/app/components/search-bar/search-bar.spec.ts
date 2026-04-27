import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchBarComponent } from './search-bar';
import { SearchService } from '../../services/search.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('SearchBarComponent', () => {
  let component: SearchBarComponent;
  let fixture: ComponentFixture<SearchBarComponent>;
  let mockSearchService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockSearchService = {
      getRecentSearches: jasmine.createSpy('getRecentSearches').and.returnValue([]),
      search: jasmine.createSpy('search').and.returnValue(of([])),
      addRecentSearch: jasmine.createSpy('addRecentSearch'),
      clearRecentSearches: jasmine.createSpy('clearRecentSearches')
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      imports: [SearchBarComponent, NoopAnimationsModule],
      providers: [
        { provide: SearchService, useValue: mockSearchService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('highlightMatch', () => {
    it('should wrap matches in <mark> tags', () => {
      component.query = 'test';
      const result = component.highlightMatch('This is a test string');
      expect(result).toBe('This is a <mark>test</mark> string');
    });

    it('should be case insensitive', () => {
      component.query = 'TEST';
      const result = component.highlightMatch('This is a test string');
      expect(result).toBe('This is a <mark>test</mark> string');
    });

    it('should return original text if no query', () => {
      component.query = '';
      const result = component.highlightMatch('Some text');
      expect(result).toBe('Some text');
    });

    it('should escape HTML in the input text', () => {
      component.query = 'test';
      const maliciousInput = 'Normal text <img src=x onerror=alert(1)> test';
      const result = component.highlightMatch(maliciousInput);
      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;img');
      expect(result).toBe('Normal text &lt;img src=x onerror=alert(1)&gt; <mark>test</mark>');
    });

    it('should handle regex special characters in query', () => {
        component.query = '(';
        const result = component.highlightMatch('Some text with (');
        expect(result).toBe('Some text with <mark>(</mark>');
    });

    it('should handle HTML special characters in query', () => {
      component.query = '<';
      const result = component.highlightMatch('Match < this');
      expect(result).toBe('Match <mark>&lt;</mark> this');
    });
  });
});
