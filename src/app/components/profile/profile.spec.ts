import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NEVER, of } from 'rxjs';
import { ProfileComponent } from './profile';
import { UserProfileService } from '../../services/user-profile.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let mockUserProfileService: jasmine.SpyObj<UserProfileService>;

  beforeEach(async () => {
    mockUserProfileService = jasmine.createSpyObj<UserProfileService>('UserProfileService', ['getProfile', 'updateProfile']);
    mockUserProfileService.getProfile.and.returnValue(of({
      fullName: 'Avery Johnson',
      email: 'avery@example.com',
      jobTitle: 'Product Manager',
      organization: 'Sentinent Ops',
      timezone: 'America/New_York',
      bio: 'Keeps workstreams aligned.',
      roleLabel: 'Workspace Owner',
    }));
    mockUserProfileService.updateProfile.and.returnValue(of({
      fullName: 'Avery Johnson',
      email: 'avery@example.com',
      jobTitle: 'Director of Product',
      organization: 'Sentinent Ops',
      timezone: 'America/New_York',
      bio: 'Keeps workstreams aligned.',
      roleLabel: 'Workspace Owner',
    }));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, RouterTestingModule],
      providers: [{ provide: UserProfileService, useValue: mockUserProfileService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the user profile details', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Avery Johnson');
    expect(compiled.textContent).toContain('avery@example.com');
    expect(compiled.textContent).toContain('Workspace Owner');
  });

  it('saves edited profile details', () => {
    component.startEditing();
    component.draft.jobTitle = 'Director of Product';
    component.saveProfile();

    expect(mockUserProfileService.updateProfile).toHaveBeenCalled();
    expect(component.successMessage).toContain('updated');
    expect(component.isEditing).toBeFalse();
  });

  it('stops loading and shows an error when profile loading hangs', fakeAsync(() => {
    mockUserProfileService.getProfile.and.returnValue(NEVER);

    component.profile = undefined;
    component.retryLoadingProfile();
    tick(8001);
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toContain('taking longer than expected');
  }));

  it('shows meaningful fallback values when optional profile fields are empty', () => {
    mockUserProfileService.getProfile.and.returnValue(of({
      fullName: '',
      email: 'demo.user@example.com',
      jobTitle: '',
      organization: '',
      timezone: '',
      bio: '',
      roleLabel: '',
    }));

    component.retryLoadingProfile();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Demo User');
    expect(compiled.textContent).toContain('Role not set');
    expect(compiled.textContent).toContain('Organization not set');
    expect(compiled.textContent).toContain('Timezone not set');
  });
});
