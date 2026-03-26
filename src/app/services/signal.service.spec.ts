import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SignalService } from './signal.service';

describe('SignalService', () => {
  let service: SignalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SignalService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SignalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps backend signals and applies request filters', () => {
    let results: Array<{ id: string; metadata: { number?: number } }> = [];

    service.getSignals({ source: 'github', status: 'unread' }).subscribe((signals) => {
      results = signals;
    });

    const request = httpMock.expectOne('/api/signals?source_type=github&status=unread');
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        id: 42,
        source_type: 'github',
        source_id: 'Sentinent-AI/frontend-angular#42',
        external_id: '42',
        title: 'Refine invitation flow',
        content: 'Update the redirect behaviour',
        author: '@neethi',
        status: 'unread',
        source_metadata: {
          type: 'issue',
          number: 42,
          repository: 'Sentinent-AI/frontend-angular',
        },
        received_at: '2026-03-24T10:00:00Z',
      },
    ]);

    expect(results.length).toBe(1);
    expect(results[0].id).toBe('42');
    expect(results[0].metadata.number).toBe(42);
  });

  it('marks a signal as read through the API', () => {
    service.markAsRead('12').subscribe();

    const request = httpMock.expectOne('/api/signals/12/read');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('archives a signal through the API', () => {
    service.archive('33').subscribe();

    const request = httpMock.expectOne('/api/signals/33/archive');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
