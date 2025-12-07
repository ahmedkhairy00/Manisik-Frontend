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


    
  getAllInternationalTransports(): Observable<{ success: boolean; message: string; data: any[] }> {
    return this.http.get<{ success: boolean; message: string; data: any[] }>(`${this.apiUrl}/InternationalTransport/GetAllTransports`);
  }

  getAllGroundTransports(): Observable<{ success: boolean; message: string; data: any[] }> {
    return this.http.get<{ success: boolean; message: string; data: any[] }>(`${this.apiUrl}/GroundTransport/GetAllGroundTransports`);
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

  getInternationalById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/InternationalTransport/GetTransportById/${id}`);
  }

  getGroundById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GroundTransport/GetGroundTransportById/${id}`);
  }
}

