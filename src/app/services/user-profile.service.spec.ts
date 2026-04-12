import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UserProfileService } from './user-profile.service';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads the current user profile from the backend', () => {
    let profileName = '';

    service.getProfile().subscribe((profile) => {
      profileName = profile.fullName;
    });

    const request = httpMock.expectOne('/api/profile');
    expect(request.request.method).toBe('GET');
    request.flush({
      full_name: 'Avery Johnson',
      email: 'avery@example.com',
      job_title: 'Product Manager',
      organization: 'Sentinent Ops',
      timezone: 'America/New_York',
      bio: 'Keeps workstreams aligned.',
      role_label: 'Workspace Owner',
    });

    expect(profileName).toBe('Avery Johnson');
  });

  it('updates the profile through the backend API', () => {
    let updatedRole = '';

    service.updateProfile({
      fullName: 'Alex Rivera',
      jobTitle: 'Engineering Lead',
      organization: 'Platform',
      timezone: 'America/New_York',
      bio: 'Coordinates engineering work across multiple integrations.',
      roleLabel: 'Technical Lead',
    }).subscribe((profile) => {
      updatedRole = profile.roleLabel;
    });

    const request = httpMock.expectOne('/api/profile');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body.full_name).toBe('Alex Rivera');
    request.flush({
      full_name: 'Alex Rivera',
      email: 'alex@example.com',
      job_title: 'Engineering Lead',
      organization: 'Platform',
      timezone: 'America/New_York',
      bio: 'Coordinates engineering work across multiple integrations.',
      role_label: 'Technical Lead',
    });

    expect(updatedRole).toBe('Technical Lead');
  });

  it('maps camelCase profile payloads and defaults missing fields', () => {
    let profileSnapshot = '';

    service.getProfile().subscribe((profile) => {
      profileSnapshot = `${profile.fullName}|${profile.jobTitle}|${profile.roleLabel}|${profile.bio}`;
    });

    const request = httpMock.expectOne('/api/profile');
    expect(request.request.method).toBe('GET');
    request.flush({
      fullName: 'Jamie Rivera',
      email: 'jamie@example.com',
      jobTitle: 'Delivery Lead',
      organization: 'Sentinent Ops',
      timezone: 'America/Chicago',
      roleLabel: 'Maintainer',
    });

    expect(profileSnapshot).toBe('Jamie Rivera|Delivery Lead|Maintainer|');
  });
});
