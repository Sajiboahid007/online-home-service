import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';
import { SeedDataService } from './seed-data.service';
import { ThemeService } from './theme.service';

describe('AuthService Google SSO', () => {
  let service: AuthService;
  let router: Router;
  let mockFirebaseService: {
    db: null;
    auth: { currentUser: any };
    signInWithGooglePopup: ReturnType<typeof vi.fn>;
    signInWithGoogleRedirect: ReturnType<typeof vi.fn>;
    getGoogleRedirectResult: ReturnType<typeof vi.fn>;
    signOutFirebase: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    mockFirebaseService = {
      db: null,
      auth: { currentUser: null },
      signInWithGooglePopup: vi.fn(),
      signInWithGoogleRedirect: vi.fn().mockResolvedValue(undefined),
      getGoogleRedirectResult: vi.fn().mockResolvedValue(null),
      signOutFirebase: vi.fn().mockResolvedValue(undefined),
      onAuthStateChange: vi.fn().mockReturnValue(() => {})
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        SeedDataService,
        ThemeService,
        { provide: FirebaseService, useValue: mockFirebaseService },
        AuthService
      ]
    });

    service = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('creates and signs in a new customer when signInWithGoogleSSO succeeds from login', async () => {
    mockFirebaseService.signInWithGooglePopup.mockResolvedValue({
      user: {
        uid: 'google_uid_123',
        displayName: 'Rahim Google',
        email: 'rahim@example.com',
        photoURL: 'https://example.com/avatar.png',
        phoneNumber: '+8801712345678'
      }
    });

    const result = await service.signInWithGoogleSSO({
      intent: 'login',
      autoCreateCustomer: true
    });

    expect(result.status).toBe('signed_in');
    expect(result.isNewUser).toBe(true);
    expect(result.route).toBe('/customer');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.uid).toBe('google_uid_123');
    expect(service.currentUser()?.authProvider).toBe('google');
    expect(service.currentUser()?.googleLinked).toBe(true);
    expect(service.currentUser()?.phone).toBe('01712345678');
    expect(service.currentUser()?.areaId).toBeUndefined();
    expect(service.currentUser()?.savedAddresses).toBeUndefined();
    expect(service.currentUser()?.emergencyContact).toBeUndefined();
  });

  it('returns needs_registration and sets pendingGoogleProfile when autoCreateCustomer is false', async () => {
    mockFirebaseService.signInWithGooglePopup.mockResolvedValue({
      user: {
        uid: 'google_new_456',
        displayName: 'Karim SSO',
        email: 'karim@example.com',
        photoURL: 'https://example.com/karim.png',
        phoneNumber: null
      }
    });

    const result = await service.signInWithGoogleSSO({
      intent: 'register_customer',
      autoCreateCustomer: false
    });

    expect(result.status).toBe('needs_registration');
    expect(service.isAuthenticated()).toBe(false);
    expect(service.pendingGoogleProfile()).toEqual({
      uid: 'google_new_456',
      name: 'Karim SSO',
      email: 'karim@example.com',
      photoURL: 'https://example.com/karim.png',
      phone: ''
    });
  });

  it('falls back to Google redirect flow when popup is blocked', async () => {
    mockFirebaseService.signInWithGooglePopup.mockRejectedValue({
      code: 'auth/popup-blocked'
    });

    const result = await service.signInWithGoogleSSO({
      intent: 'login',
      autoCreateCustomer: true,
      returnUrl: '/customer/bookings'
    });

    expect(result.status).toBe('redirecting');
    expect(mockFirebaseService.signInWithGoogleRedirect).toHaveBeenCalledTimes(1);
    const savedIntent = JSON.parse(sessionStorage.getItem('kajkhoj_sso_intent') || '{}');
    expect(savedIntent.intent).toBe('login');
    expect(savedIntent.returnUrl).toBe('/customer/bookings');
  });

  it('returns cancelled when user closes the Google popup', async () => {
    mockFirebaseService.signInWithGooglePopup.mockRejectedValue({
      code: 'auth/popup-closed-by-user'
    });

    const result = await service.signInWithGoogleSSO({ intent: 'login' });

    expect(result.status).toBe('cancelled');
    expect(result.error).toBeTruthy();
    expect(service.isSsoLoading()).toBe(false);
  });

  it('signs out of Firebase and clears local session on logout', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    service.setUser({
      uid: 'google_uid_123',
      role: 'customer',
      name: 'Rahim',
      phone: '01712345678',
      status: 'active',
      createdAt: new Date().toISOString()
    });

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('kajkhoj_user')).toBeNull();
    expect(mockFirebaseService.signOutFirebase).toHaveBeenCalledTimes(1);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
