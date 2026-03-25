import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth';

describe('authGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['isLoggedIn']);
    mockRouter = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('returns true when the user is logged in', async () => {
    mockAuthService.isLoggedIn.and.returnValue(of(true));

    await TestBed.runInInjectionContext(async () => {
      const result = await firstValueFrom(
        authGuard({} as never, {} as never) as Observable<boolean>
      );

      expect(result).toBeTrue();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  it('redirects to login when the user is not logged in', async () => {
    mockAuthService.isLoggedIn.and.returnValue(of(false));

    await TestBed.runInInjectionContext(async () => {
      const result = await firstValueFrom(
        authGuard({} as never, {} as never) as Observable<boolean>
      );

      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
