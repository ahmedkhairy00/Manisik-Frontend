import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TransportOption, TransportSearchParams } from '../../interfaces';

@Injectable({
  providedIn: 'root'
})
export class TransportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getTransportOptions(params?: TransportSearchParams): Observable<TransportOption[]> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<TransportOption[]>(`${this.apiUrl}/transport`, { params: httpParams });
  }
 searchByRoute(departure: string, arrival: string): Observable<TransportOption[]> {
  const params = new HttpParams()
    .set('departureAirport', departure)
    .set('arrivalAirport', arrival);

  return this.http.get<TransportOption[]>(
    `${this.apiUrl}/InternationalTransport/SearchByRoute`,
    { params }
  );
}
  getTransportOptionById(id: string): Observable<TransportOption> {
    return this.http.get<TransportOption>(`${this.apiUrl}/transport/${id}`);
  }
}

