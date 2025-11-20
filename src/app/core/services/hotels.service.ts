import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Hotel, HotelSearchParams, Room } from '../../interfaces';

@Injectable({
  providedIn: 'root',
})
export class HotelsService {
  /**
   * HotelsService
   * - Responsible for interacting with backend hotel endpoints used across the app.
   * - getHotels: fetches a filtered list (city, filter) and is used by HotelComponent.
   * - getHotelById: fetches a single hotel (used by HotelDetailsComponent).
   * - getImageUrl: helper that resolves image URLs (absolute or via configured image base URL).
   */
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly apiUrlForImages = environment.apiUrlForImages;
  getHotels(params?: HotelSearchParams): Observable<Hotel[]> {
    let httpParams = new HttpParams();

    if (params?.city) {
      httpParams = httpParams.set('city', params.city);
    }

    if (params?.sortBy) {
      let filterValue = '';
      switch (params.sortBy) {
        case 'pricelowtohigh':
          filterValue = 'pricelowtohigh';
          break;
        case 'pricehightolow':
          filterValue = 'pricehightolow';
          break;
        case 'distance':
          filterValue = 'distance';
          break;
        case 'rating':
          filterValue = 'rating';
        //break;
      }
      httpParams = httpParams.set('filter', filterValue);
    }

    return this.http
      .get<ApiResponse<Hotel[]>>(`${this.apiUrl}/Hotel/getallFiltered`, {
        params: httpParams,
      })
      .pipe(
        map((res) => res.data || []) // extract the array from data
      );
  }
  getImageUrl(hotel: Hotel): string {
    return hotel.imageUrl.startsWith('http')
      ? hotel.imageUrl
      : `${this.apiUrlForImages}${hotel.imageUrl}`;
  }

  getHotelById(id: number | string): Observable<Hotel> {
    return this.http
      .get<ApiResponse<Hotel>>(`${this.apiUrl}/Hotel/GetHotelById/${id}`)
      .pipe(map((res) => res.data as Hotel));
  }

  getRooms(hotelId: string): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/Hotel/GetHotelsByAllRooms/`);
  }

  getRoomById(hotelId: string, roomId: string): Observable<Room> {
    return this.http.get<Room>(
      `${this.apiUrl}/Hotel/${hotelId}/rooms/${roomId}`
    );
  }
}
