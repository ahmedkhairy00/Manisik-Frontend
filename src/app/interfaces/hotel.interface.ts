export interface Hotel {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  starRating: number;
  imageUrl: string;
  rooms: Room[];
  distanceToHaram?: number;
  createdAt: string;
}

export interface Room {
  id: string;
  hotelId: string;
  roomType: string;
  capacity: number;
  pricePerNight: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface HotelSearchParams {
  city?: string;
  priceToLowOrHigh?: boolean;
  rating?: boolean;
  distance?: boolean;
  sortBy?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: any;
  timestamp?: string;
}
