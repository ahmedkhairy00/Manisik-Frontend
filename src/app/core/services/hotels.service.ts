import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Hotel, HotelSearchParams, Room } from '../../interfaces';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root',
})
export class HotelsService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);
  private readonly apiUrl = environment.apiUrl;
  private readonly apiUrlForImages = environment.apiUrlForImages;

  // Cache TTL: 3 minutes for hotel listings
  private readonly HOTELS_TTL = 3 * 60 * 1000;

  /**
   * Get hotels with caching support
   * Cache key includes city and sort params for proper invalidation
   */
  getHotels(params?: HotelSearchParams): Observable<Hotel[]> {
    const cacheKey = `hotels:${params?.city || 'all'}:${params?.sortBy || 'default'}`;

    // Cache key includes city and sort params for proper invalidation

    return this.cacheService.getOrFetch(
      cacheKey,
      () => this.fetchHotels(params),
      this.HOTELS_TTL
    );
  }

  /**
   * Internal method to fetch hotels from API
   */
  private fetchHotels(params?: HotelSearchParams): Observable<Hotel[]> {
    let httpParams = new HttpParams();

    if (params?.city) {
      httpParams = httpParams.set('city', params.city);
    }

    if (params?.sortBy) {
      httpParams = httpParams.set('filter', params.sortBy);
    }

    return this.http
      .get<ApiResponse<Hotel[]>>(`${this.apiUrl}/Hotel/GetAllFiltered`, {
        params: httpParams,
      })
      .pipe(map((res) => res.data || []));
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
    return this.getHotelById(hotelId).pipe(
      map((hotel) => (hotel?.rooms || []) as Room[])
    );
  }

  getRoomById(hotelId: string, roomId: string): Observable<Room> {
    return this.http.get<Room>(
      `${this.apiUrl}/Hotel/${hotelId}/rooms/${roomId}`
    );
  }

  deleteHotel(id: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(
      `${this.apiUrl}/Hotel/DeleteHotel/${id}`,
      { withCredentials: true }
    ).pipe(
      tap(() => this.cacheService.invalidate('hotels'))
    );
  }

  /**
   * Create a new hotel with rooms
   * @param hotelData - Hotel data including rooms
   * @param image - Optional hotel image file
   */
  createHotel(hotelData: any, image?: File): Observable<ApiResponse<Hotel>> {
    const formData = new FormData();

    // Append hotel basic fields
    formData.append('Name', hotelData.name);
    formData.append('City', hotelData.city);
    formData.append('Address', hotelData.address);
    formData.append('StarRating', hotelData.starRating.toString());
    formData.append('DistanceToHaram', hotelData.distanceToHaram.toString());
    formData.append('Description', hotelData.description);

    // Append image if provided
    if (image) {
      formData.append('image', image, image.name);
    }

    // Append rooms as JSON array
    if (hotelData.rooms && hotelData.rooms.length > 0) {
      hotelData.rooms.forEach((room: any, index: number) => {
        formData.append(`Rooms[${index}].RoomType`, room.roomType);
        formData.append(`Rooms[${index}].Capacity`, room.capacity.toString());
        formData.append(`Rooms[${index}].PricePerNight`, room.pricePerNight.toString());
        formData.append(`Rooms[${index}].TotalRooms`, room.totalRooms.toString());
        formData.append(`Rooms[${index}].AvailableRooms`, room.availableRooms.toString());
        formData.append(`Rooms[${index}].IsActive`, room.isActive.toString());
      });
    }

    return this.http.post<ApiResponse<Hotel>>(
      `${this.apiUrl}/Hotel/CreateHotel`,
      formData,
      { withCredentials: true }
    ).pipe(
      tap(() => this.cacheService.invalidate('hotels'))
    );
  }

  /**
   * Update an existing hotel
   * @param id - Hotel ID
   * @param hotelData - Updated hotel data including rooms
   * @param image - Optional new hotel image file
   */
  updateHotel(
    id: number,
    hotelData: any,
    image?: File
  ): Observable<ApiResponse<Hotel>> {
    const formData = new FormData();

    // Append hotel basic fields
    formData.append('Name', hotelData.name);
    formData.append('City', hotelData.city);
    formData.append('Address', hotelData.address);
    formData.append('StarRating', hotelData.starRating.toString());
    formData.append('DistanceToHaram', hotelData.distanceToHaram.toString());
    formData.append('Description', hotelData.description);

    // Append image if provided
    if (image) {
      formData.append('image', image, image.name);
    }

    // Append rooms as JSON array
    if (hotelData.rooms && hotelData.rooms.length > 0) {
      hotelData.rooms.forEach((room: any, index: number) => {
        formData.append(`Rooms[${index}].RoomType`, room.roomType);
        formData.append(`Rooms[${index}].Capacity`, room.capacity.toString());
        formData.append(`Rooms[${index}].PricePerNight`, room.pricePerNight.toString());
        formData.append(`Rooms[${index}].TotalRooms`, room.totalRooms.toString());
        formData.append(`Rooms[${index}].AvailableRooms`, room.availableRooms.toString());
        formData.append(`Rooms[${index}].IsActive`, room.isActive.toString());
      });
    }

    return this.http.put<ApiResponse<Hotel>>(
      `${this.apiUrl}/Hotel/UpdateHotel/${id}`,
      formData,
      { withCredentials: true }
    ).pipe(
      tap(() => this.cacheService.invalidate('hotels'))
    );
  }

  /**
   * Get hotels created by the current user (HotelManager)
   */
  getMyHotels(): Observable<Hotel[]> {
    return this.http
      .get<ApiResponse<Hotel[]>>(`${this.apiUrl}/Hotel/GetMyHotels`, {
        withCredentials: true,
      })
      .pipe(map((res) => res.data || []));
  }
}