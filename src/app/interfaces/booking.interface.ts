import { User } from './user.interface';
import { Hotel, Room } from './hotel.interface';
import { TransportOption } from './transport.interface';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum BookingType {
  HOTEL = 'hotel',
  TRANSPORT = 'transport',
  PACKAGE = 'package',
}

export interface HotelBooking {
  hotelId: number;
  hotelName?: string;
  roomId: number;
  roomType?: string;
  city: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  numberOfNights?: number;
  pricePerNight?: number;
  totalPrice?: number;
}

// export interface HotelBooking {
//   id: string;
//   userId: string;
//   hotelId: string;
//   roomId: string;
//   checkIn: string;
//   checkOut: string;
//   guests: number;
//   totalPrice: number;
//   status: BookingStatus;
//   hotel?: Hotel;
//   room?: Room;
//   user?: User;
//   createdAt: string;
//   updatedAt: string;
// }

export interface TransportBooking {
  id: string;
  userId: string;
  transportOptionId: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  totalPrice: number;
  status: BookingStatus;
  transportOption?: TransportOption;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  type: BookingType;
  hotelBooking?: HotelBooking;
  transportBooking?: TransportBooking;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  type: BookingType;
  hotelBooking?: {
    hotelId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  };
  transportBooking?: {
    transportOptionId: string;
    departureDate: string;
    returnDate?: string;
    passengers: number;
  };
}
