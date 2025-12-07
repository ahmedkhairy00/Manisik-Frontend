import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, of, concat } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookingDto, ApiResponse } from 'src/app/models/api';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BookingsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;

  constructor() {
    // Pending bookings sync is now handled by BookingPackageComponent
    // using AuthService.saveBookingData() for single source of truth
  }

  // Compatibility: returns list of bookings (uses /Booking/AllBookings)
  getBookings(): Observable<any[]> {
    return this.http
      .get<ApiResponse<BookingDto[]>>(`${this.apiUrl}/Booking/AllBookings`, { withCredentials: true })
      .pipe(map(res => (res?.data || []) as any[]));
  }

  // Returns current user's bookings and cache them in localStorage per-user
  getMyBookings(): Observable<any[]> {
    return this.http
      .get<ApiResponse<BookingDto[]>>(`${this.apiUrl}/Booking/MyBookings`, { withCredentials: true })
      .pipe(
        map(res => (res?.data || []) as any[]),
        tap(bookings => {
          try {
            const user = this.auth.getCurrentUserValue();
            const key = user && (user as any).id ? `user_bookings_${(user as any).id}` : 'user_bookings_anonymous';
            localStorage.setItem(key, JSON.stringify(bookings));
          } catch (e) {
            // ignore storage errors
          }
        })
      );
  }

  /**
   * Returns cached bookings immediately (if present) then fetches from network and emits updated value.
   */
  getMyBookingsWithCache(): Observable<any[]> {
    const user = this.auth.getCurrentUserValue();
    const key = user && user.id ? `user_bookings_${user.id}` : 'user_bookings_anonymous';

    let cached: BookingDto[] | null = null;
    try {
      const raw = localStorage.getItem(key);
      if (raw) cached = JSON.parse(raw) as BookingDto[];
    } catch (e) {
      cached = null;
    }

    const http$ = this.http
      .get<ApiResponse<BookingDto[]>>(`${this.apiUrl}/Booking/MyBookings`, { withCredentials: true })
      .pipe(
        map(res => (res?.data || []) as any[]),
        tap(bookings => {
          try {
            localStorage.setItem(key, JSON.stringify(bookings));
          } catch (e) {}
        })
      );

    if (cached && Array.isArray(cached) && cached.length > 0) {
      return concat(of(cached), http$);
    }

    return http$;
  }

  // New: fetch pending hotel bookings for current user (server-side draft pieces)
  getMyPendingHotelBookings(): Observable<any[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/HotelBooking/MyPendingHotelBookings`, { withCredentials: true })
      .pipe(map(res => res?.data || []));
  }

  // New: fetch pending ground transport bookings for current user
  getMyPendingGroundBookings(): Observable<any[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/GroundTransportBooking/MyPendingGroundBookings`, { withCredentials: true })
      .pipe(map(res => res?.data || []));
  }

  // New: fetch pending international transport bookings for current user
  getMyPendingTransportBookings(): Observable<any[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.apiUrl}/InternationalTransportBooking/MyPendingTransportBookings`, { withCredentials: true })
      .pipe(map(res => res?.data || []));
  }

  // Save pending hotel booking (create or update draft on server)
  savePendingHotelBooking(payload: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/HotelBooking/SavePending`, payload, { withCredentials: true }).pipe(map(r => r?.data));
  }

  // Save pending ground transport booking
  savePendingGroundBooking(payload: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/GroundTransportBooking/SavePending`, payload, { withCredentials: true }).pipe(map(r => r?.data));
  }

  // Save pending international transport booking
  savePendingTransportBooking(payload: any): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/InternationalTransportBooking/SavePending`, payload, { withCredentials: true }).pipe(map(r => r?.data));
  }

  // Helper: accept either id or an object and extract candidate id properties
  private extractPendingId(payload: any): string | number | null {
    if (payload === null || payload === undefined) return null;
    if (typeof payload === 'number' || typeof payload === 'string') return payload;

    const candidates = [
      'bookingHotelId', 'bookingHotelID', 'BookingHotelId', 'bookinghotelid', 'bookinghotel', 'id', 'bookingId',
      'bookingInternationalTransportId', 'bookingGroundTransportId', 'bookingInternationalTransportID', 'bookingGroundTransportID'
    ];

    for (const prop of candidates) {
      // direct match
      if (payload[prop] !== undefined && payload[prop] !== null) return payload[prop];
      // case-insensitive match
      const key = Object.keys(payload).find(k => k.toLowerCase() === prop.toLowerCase());
      if (key) return payload[key];
    }

    return null;
  }

  // Delete pending hotel booking draft for user
  deletePendingHotelBooking(payload: any): Observable<any> {
    const id = this.extractPendingId(payload);
    if (!id) {
      console.warn('deletePendingHotelBooking: invalid id or payload', payload);
      return of(null);
    }

    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/HotelBooking/DeletePendingHotelBooking/${id}`, { withCredentials: true }).pipe(map(r => r?.data));
  }

  // Delete pending ground transport booking draft for user
  deletePendingGroundBooking(payload: any): Observable<any> {
    const id = this.extractPendingId(payload);
    if (!id) {
      console.warn('deletePendingGroundBooking: invalid id or payload', payload);
      return of(null);
    }

    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/GroundTransportBooking/DeletePendingGroundBooking/${id}`, { withCredentials: true }).pipe(map(r => r?.data));
  }

  // Delete pending international transport booking draft for user
  deletePendingTransportBooking(payload: any): Observable<any> {
    const id = this.extractPendingId(payload);
    if (!id) {
      console.warn('deletePendingTransportBooking: invalid id or payload', payload);
      return of(null);
    }

    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/InternationalTransportBooking/DeletePendingInternationalBooking/${id}`, { withCredentials: true }).pipe(map(r => r?.data));
  }

  // Alias for clarity
  getAllBookings(): Observable<BookingDto[]> {
    return this.getBookings();
  }

  // Uses GetBooking endpoint
  getBookingById(id: string): Observable<any> {
    return this.http
      .get<ApiResponse<BookingDto>>(`${this.apiUrl}/Booking/GetBooking/${id}`, { withCredentials: true })
      .pipe(map(res => res.data as any));
  }

  // Uses BookingId endpoint (if needed by backend)
  getBookingByBookingId(id: string): Observable<any> {
    return this.http
      .get<ApiResponse<BookingDto>>(`${this.apiUrl}/Booking/BookingId/${id}`, { withCredentials: true })
      .pipe(map(res => res.data as any));
  }

  // Search bookings by status (optional query param)
  searchByStatus(status?: string): Observable<BookingDto[]> {
    const url = status
      ? `${this.apiUrl}/Booking/SearchByStatus?status=${encodeURIComponent(status)}`
      : `${this.apiUrl}/Booking/SearchByStatus`;

    return this.http
      .get<ApiResponse<BookingDto[]>>(url, { withCredentials: true })
      .pipe(map(res => res?.data || []));
  }

  // Create booking
  createBooking(booking: any): Observable<any> {
    return this.http
      .post<ApiResponse<BookingDto>>(`${this.apiUrl}/Booking/CreateBooking`, booking, { withCredentials: true })
      .pipe(map(res => res as any));
  }

  // Update booking status
  updateStatus(id: string, status: string): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http
      .put<ApiResponse<BookingDto>>(`${this.apiUrl}/Booking/UpdateStatus/${id}`, JSON.stringify(status), { headers, withCredentials: true })
      .pipe(map(res => res.data as any));
  }

  // Update payment status
  updatePaymentStatus(id: string, paymentStatus: string): Observable<any> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http
      .put<ApiResponse<BookingDto>>(`${this.apiUrl}/Booking/UpdatePaymentStatus/${id}`, JSON.stringify(paymentStatus), { headers, withCredentials: true })
      .pipe(map(res => res.data as any));
  }

  // Cancel booking (DELETE)
  cancelBooking(id: string): Observable<any> {
    return this.http
      .delete<ApiResponse<any>>(`${this.apiUrl}/Booking/CancelBooking/${id}`, { withCredentials: true })
      .pipe(map(res => res.data));
  }
}

