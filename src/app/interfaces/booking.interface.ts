import { User } from './user.interface';
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

export enum TripType {
  Umrah = 0,
  Hajj = 1,
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

// Backwards-compatible aliases used by some services
export type InternationalTransportBooking = TransportBooking;
export type GroundTransportBooking = TransportBooking;

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
  type: TripType;
  travelStartDate: string;
  travelEndDate?: string;
  numberOfTravelers: number;
  makkahHotel?: any; // Should be HotelBookingDto but using any for now to match component usage or define proper type
  madinahHotel?: any;
  internationalTransport?: any;
  groundTransport?: any;
  travelers?: any[];
  totalPrice?: number;
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
