import { Booking } from './../../interfaces/booking.interface';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, HotelBooking } from 'src/app/interfaces';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BookingHotelService {
  private readonly apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  bookHotel(dto: HotelBooking): Observable<ApiResponse<HotelBooking>> {
    return this.http.post<ApiResponse<HotelBooking>>(
      `${this.apiUrl}/HotelBooking/BookHotel`,
      dto
    );
  }
}
