import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LoginDto, RegisterDto, AuthResponseDto, UserDto, ApiResponse } from 'src/app/models/api';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = environment.apiUrl;
  // Keep internal user shape tolerant to accommodate existing app `User` interface
  private readonly currentUserSubject = new BehaviorSubject<any | null>(null);
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Service initialization
  }

  // Merged from remote/local: Helper methods
  getToken(): string | null {
    return this.getCookie('token');
  }

  // Helper to read cookie (missing in file, adding safe implementation or relying on httpOnly)
  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  }


  /**
   * Login with email and password
   * Backend sets httpOnly secure cookie with token
   * Remember Me determines cookie expiry (1 day vs 7 days)
   */
  login(credentials: LoginDto, rememberMe: boolean = false): Observable<ApiResponse<AuthResponseDto>> {
    return this.http.post<ApiResponse<AuthResponseDto>>(
      `${this.apiUrl}/Auth/Login`,
      { ...credentials, rememberMe },
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response?.data?.user) {
          this.currentUserSubject.next(response.data.user as UserDto);
        }
        // Persist token for Authorization header fallback
        if (response?.data?.token) {
          try { localStorage.setItem('auth_token', response.data.token); } catch (e) { }
        }
      })
    );
  }

  /**
   * Register new user
   */
  register(data: RegisterDto, rememberMe: boolean = false): Observable<ApiResponse<AuthResponseDto>> {
    return this.http.post<ApiResponse<AuthResponseDto>>(
      `${this.apiUrl}/Auth/Register`,
      { ...data, rememberMe },
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response?.data?.user) {
          this.currentUserSubject.next(response.data.user as UserDto);
        }
        if (response?.data?.token) {
          try { localStorage.setItem('auth_token', response.data.token); } catch (e) { }
        }
      })
    );
  }

  /**
   * Logout - clears httpOnly cookie on backend
   */
  logout(): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/Auth/Logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        try { localStorage.removeItem('auth_token'); } catch (e) { }
        this.router.navigate(['/login']);
      }),
      catchError(() => {
        // Even if backend fails, clear local state
        this.currentUserSubject.next(null);
        try { localStorage.removeItem('auth_token'); } catch (e) { }
        this.router.navigate(['/login']);
        return of(null);
      })
    );
  }

  /**
   * Check authentication status by calling /Auth/Me
   * This verifies the httpOnly cookie is valid
   * Called on app init and after page refresh
   */
  checkAuth(): Observable<UserDto | null> {
    return this.http.get<ApiResponse<UserDto>>(
      `${this.apiUrl}/Auth/Me`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        if (response?.success && response.data) {
          return response.data;
        }
        return null;
      }),
      tap(user => {
        this.currentUserSubject.next(user);
        if (user) {
          this.syncPendingBookings();
        }
      }),
      catchError(() => {
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }

  /**
   * Get currently authenticated user
   */
  getCurrentUser(): Observable<any> {
    return this.http.get<ApiResponse<UserDto>>(
      `${this.apiUrl}/Auth/Me`,
      { withCredentials: true }
    ).pipe(
      map(response => response.data as any)
    );
  }

  /**
   * Check if user is authenticated
   * Based on BehaviorSubject state (populated by checkAuth)
   */
  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Get current user value (synchronous)
   */
  getCurrentUserValue(): any | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get current user role
   */
  getRole(): any | null {
    const user = this.getCurrentUserValue();
    // backward compatible: prefer `role` if present, otherwise use first `roles` entry
    return user?.role ?? (user?.roles && user.roles[0]) ?? null;
  }

  // ============ Admin User Management ============

  getUsers(): Observable<UserDto[]> {
    return this.http.get<ApiResponse<UserDto[]>>(
      `${this.apiUrl}/Auth/Users`,
      { withCredentials: true }
    ).pipe(
      map(r => r.data || [])
    );
  }

  getUsersByRole(roleName: string): Observable<UserDto[]> {
    return this.http.get<ApiResponse<UserDto[]>>(
      `${this.apiUrl}/Auth/UsersByRole/${encodeURIComponent(roleName)}`,
      { withCredentials: true }
    ).pipe(
      map(r => r.data || [])
    );
  }

  assignRole(userId: string, role: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/Auth/AssignRole`,
      { userId, role },
      { withCredentials: true }
    );
  }

  removeRole(userId: string, role: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/Auth/RemoveRole`,
      { userId, role },
      { withCredentials: true }
    );
  }

  // ============ Booking Helpers ============

  getMyBookings(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/Auth/MyBookings`,
      { withCredentials: true }
    ).pipe(
      map(r => r.data || [])
    );
  }

  /**
   * Expose token for Authorization header fallback
   */
  /*
  getToken(): string | null {
    try { return localStorage.getItem('auth_token'); } catch (e) { return null; }
  }
  */

  // Per-user booking draft helpers (still OK to use localStorage for this)
  getBookingData(): any {
    try {
      const user = this.getCurrentUserValue();
      const key = user?.id ? `user_booking_data_${user.id}` : 'user_booking_data_anonymous';
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  saveBookingData(data: any): void {
    try {
      const user = this.getCurrentUserValue();
      const key = user?.id ? `user_booking_data_${user.id}` : 'user_booking_data_anonymous';
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // ignore storage errors
    }
  }

  removeBookingData(keysToRemove: string[]): void {
    try {
      const data = this.getBookingData() || {};
      keysToRemove.forEach(key => {
        delete data[key];
      });
      // specific check: if only bookingId remains, or data is empty, maybe clear it? 
      // primarily just save the modified object back
      this.saveBookingData(data);
    } catch (e) {

    }
  }

  clearUserBookingData(): void {
    try {
      const user = this.getCurrentUserValue();
      const userId = user?.id || 'anonymous';
      
      // Clear main booking data (single source of truth)
      const mainKey = user?.id ? `user_booking_data_${user.id}` : 'user_booking_data_anonymous';
      localStorage.removeItem(mainKey);
      
      // Clear legacy fragmented keys (for backward compatibility cleanup)
      localStorage.removeItem(`makkah_hotel_booking_draft_${userId}`);
      localStorage.removeItem(`madinah_hotel_booking_draft_${userId}`);
      localStorage.removeItem(`hotel_booking_draft_${userId}`);
      localStorage.removeItem(`ground_booking_draft_${userId}`);
      localStorage.removeItem(`transport_booking_draft_${userId}`);
      
      // Clear cached bookings list
      localStorage.removeItem(`user_bookings_${userId}`);
      
      // Clear completed bookings tracking (server handles status now)
      localStorage.removeItem('completed_bookings');
      

    } catch (e) {

    }
  }

  updateCurrentUser(user: any): void {
    this.currentUserSubject.next(user);
  }

  // ============ Pending Booking Sync ============
  
  /**
   * Syncs pending booking data from server to localStorage
   * Called on login/checkAuth to ensure UI state matches database
   */
  private syncPendingBookings(): void {
    // We use direct HTTP calls here to avoid circular dependency with BookingsService
    const pendingGround$ = this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/GroundTransportBooking/MyPendingGroundBookings`, 
      { withCredentials: true }
    );
    
    const pendingTransport$ = this.http.get<ApiResponse<any[]>>(
      `${this.apiUrl}/InternationalTransportBooking/MyPendingTransportBookings`, 
      { withCredentials: true }
    );

    // Use forkJoin to run both in parallel
    import('rxjs').then(({ forkJoin, catchError, of: rxOf }) => {
      forkJoin({
        ground: pendingGround$.pipe(catchError(() => rxOf({ data: [] }))),
        transport: pendingTransport$.pipe(catchError(() => rxOf({ data: [] })))
      }).subscribe(({ ground, transport }) => {
        try {
          const groundData = ground?.data || [];
          const transportData = transport?.data || [];
          
          if (groundData.length > 0 || transportData.length > 0) {
            const current = this.getBookingData() || {};
            
            // Sync ground
            if (groundData.length > 0) {
              const latest = groundData[groundData.length - 1];
              current.groundData = latest;
              if (latest.bookingId) current.bookingId = latest.bookingId;
            }
            
            // Sync transport
            if (transportData.length > 0) {
              const latest = transportData[transportData.length - 1];
              current.transportData = latest;
              if (latest.bookingId) current.bookingId = latest.bookingId;
            }
            
            this.saveBookingData(current);
          }
        } catch (e) {

        }
      });
    });
  }

  // ============ CLEANUP ON INIT ============
  // Remove any legacy localStorage items from old auth implementation
  static cleanupLegacyAuth(): void {
    try {
      localStorage.removeItem('auth_remember');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('token');
      // Clear any cookies set by JavaScript (should be replaced by backend httpOnly cookies)
      document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Strict;';
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Run cleanup when service is first imported
AuthService.cleanupLegacyAuth();
