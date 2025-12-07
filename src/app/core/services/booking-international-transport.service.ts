import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from 'src/app/interfaces/apiResponse.interface';
import { BookingInternationalTransport } from 'src/app/interfaces/booking-international-transport';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingInternationalTransportService {

   private readonly http = inject(HttpClient);
   private readonly apiUrl = environment.apiUrl;
  constructor() { }
  bookTransport(dto: BookingInternationalTransport): Observable<ApiResponse<BookingInternationalTransport>> {

   // return this.http.post(`${this.apiUrl}/BookingInternationalTransport/BookInteranationalTransport`, dto, { responseType: 'text'});
   return this.http.post<ApiResponse<BookingInternationalTransport>>(
     `${this.apiUrl}/BookingInternationalTransport/BookInteranationalTransport`,
     dto
   );
  }
}
